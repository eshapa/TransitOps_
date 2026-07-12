const pool = require('../config/db');
const { auditLog } = require('../services/auditService');

// Get all trips
async function getAllTrips(req, res, next) {
  const { status, driver_id, vehicle_id } = req.query;

  let sql = 'SELECT * FROM trips WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (driver_id) {
    sql += ' AND driver_id = ?';
    params.push(driver_id);
  }
  if (vehicle_id) {
    sql += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [trips] = await pool.execute(sql, params);
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    next(error);
  }
}

// Get single trip
async function getTripById(req, res, next) {
  const { id } = req.params;

  try {
    const [trips] = await pool.execute('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Trip not found.' }
      });
    }

    res.status(200).json({
      success: true,
      data: trips[0]
    });
  } catch (error) {
    next(error);
  }
}

// Helper to validate trip rules
async function validateTripRules(connection, vehicleId, driverId, cargoWeight) {
  // 1. Fetch vehicle details
  const [vehicles] = await connection.execute(
    'SELECT status, maximum_load_capacity, current_odometer FROM vehicles WHERE id = ?',
    [vehicleId]
  );
  if (vehicles.length === 0) {
    return { valid: false, message: 'Vehicle not found.' };
  }
  const vehicle = vehicles[0];

  // Retired or In Shop vehicles must never appear in the dispatch selection
  if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
    return { valid: false, message: `Vehicle status is '${vehicle.status}'. Only 'Available' or 'On Trip' vehicles can be selected.` };
  }

  // Cargo Weight check
  if (parseFloat(cargoWeight) > parseFloat(vehicle.maximum_load_capacity)) {
    return { valid: false, message: `Cargo weight (${cargoWeight}) exceeds vehicle capacity (${vehicle.maximum_load_capacity}).` };
  }

  // 2. Fetch driver details
  const [drivers] = await connection.execute(
    `SELECT d.status, d.license_expiry, u.status as user_status
     FROM drivers d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = ?`,
    [driverId]
  );
  if (drivers.length === 0) {
    return { valid: false, message: 'Driver not found.' };
  }
  const driver = drivers[0];

  // Drivers with expired licenses or Suspended status cannot be assigned to trips
  if (driver.status === 'Suspended') {
    return { valid: false, message: 'Driver is Suspended and cannot be assigned to a trip.' };
  }

  const expiryDate = new Date(driver.license_expiry);
  if (expiryDate < new Date()) {
    return { valid: false, message: 'Driver license has expired.' };
  }

  return { valid: true, vehicle, driver };
}

// Create trip
async function createTrip(req, res, next) {
  const {
    vehicle_id, driver_id, source_location, destination_location,
    cargo_weight, planned_distance, scheduled_start, remarks, status
  } = req.body;

  const tripStatus = status || 'Draft';
  const tripNumber = `TRIP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Run basic rules checks
    const checkResult = await validateTripRules(connection, vehicle_id, driver_id, cargo_weight);
    if (!checkResult.valid) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: checkResult.message } });
    }

    const { vehicle, driver } = checkResult;

    // 2. If status is Dispatched, enforce availability checks
    if (tripStatus === 'Dispatched') {
      if (vehicle.status === 'On Trip') {
        await connection.rollback();
        return res.status(400).json({ success: false, error: { message: 'Vehicle is already on another trip.' } });
      }
      if (driver.status === 'On Trip') {
        await connection.rollback();
        return res.status(400).json({ success: false, error: { message: 'Driver is already on another trip.' } });
      }

      // Update statuses
      await connection.execute("UPDATE vehicles SET status = 'On Trip' WHERE id = ?", [vehicle_id]);
      await connection.execute("UPDATE drivers SET status = 'On Trip' WHERE id = ?", [driver_id]);
    }

    // Insert trip
    const startOdometer = vehicle.current_odometer;
    const actualStart = tripStatus === 'Dispatched' ? new Date() : null;

    const sql = `
      INSERT INTO trips (
        trip_number, vehicle_id, driver_id, source_location, destination_location,
        cargo_weight, planned_distance, start_odometer, scheduled_start, 
        actual_start, status, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(sql, [
      tripNumber, vehicle_id, driver_id, source_location || null, destination_location || null,
      cargo_weight, planned_distance || null, startOdometer, scheduled_start || null,
      actualStart, tripStatus, remarks || null, req.user.id
    ]);

    const newTripId = result.insertId;

    // Fetch new trip
    const [newTrips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [newTripId]);
    const newTrip = newTrips[0];

    // Audit log
    await auditLog(connection, req.user.id, 'Trips', 'CREATE', newTripId, null, newTrip);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Trip created successfully.',
      data: newTrip
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Dispatch a Draft trip
async function dispatchTrip(req, res, next) {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch trip
    const [trips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Trip not found.' } });
    }
    const oldTrip = trips[0];

    if (oldTrip.status !== 'Draft') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: `Trip is already in '${oldTrip.status}' status.` } });
    }

    // 2. Validate rules
    const checkResult = await validateTripRules(connection, oldTrip.vehicle_id, oldTrip.driver_id, oldTrip.cargo_weight);
    if (!checkResult.valid) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: checkResult.message } });
    }

    const { vehicle, driver } = checkResult;

    // Check availability
    if (vehicle.status === 'On Trip') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Vehicle is currently assigned to another trip.' } });
    }
    if (driver.status === 'On Trip') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Driver is currently assigned to another trip.' } });
    }

    // Update statuses
    await connection.execute("UPDATE vehicles SET status = 'On Trip' WHERE id = ?", [oldTrip.vehicle_id]);
    await connection.execute("UPDATE drivers SET status = 'On Trip' WHERE id = ?", [oldTrip.driver_id]);

    // Dispatch trip
    const startOdometer = vehicle.current_odometer;
    const actualStart = new Date();
    await connection.execute(
      "UPDATE trips SET status = 'Dispatched', start_odometer = ?, actual_start = ? WHERE id = ?",
      [startOdometer, actualStart, id]
    );

    // Fetch updated trip
    const [newTrips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const newTrip = newTrips[0];

    // Audit log
    await auditLog(connection, req.user.id, 'Trips', 'UPDATE', id, oldTrip, newTrip);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Trip dispatched successfully.',
      data: newTrip
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Complete trip
async function completeTrip(req, res, next) {
  const { id } = req.params;
  const { end_odometer, actual_distance, remarks } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch trip
    const [trips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Trip not found.' } });
    }
    const oldTrip = trips[0];

    if (oldTrip.status !== 'Dispatched') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Only Dispatched trips can be completed.' } });
    }

    // Odometer verification
    if (parseFloat(end_odometer) < parseFloat(oldTrip.start_odometer)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: { message: `End odometer (${end_odometer}) cannot be less than start odometer (${oldTrip.start_odometer}).` }
      });
    }

    // Update vehicle: set Available and update odometer
    await connection.execute(
      "UPDATE vehicles SET status = 'Available', current_odometer = ? WHERE id = ?",
      [end_odometer, oldTrip.vehicle_id]
    );

    // Update driver: set Available and increment total_trips
    await connection.execute(
      "UPDATE drivers SET status = 'Available', total_trips = total_trips + 1 WHERE id = ?",
      [oldTrip.driver_id]
    );

    // Update trip
    const actualEnd = new Date();
    await connection.execute(
      "UPDATE trips SET status = 'Completed', end_odometer = ?, actual_distance = ?, actual_end = ?, remarks = ? WHERE id = ?",
      [end_odometer, actual_distance || null, actualEnd, remarks || oldTrip.remarks, id]
    );

    // Fetch updated trip
    const [newTrips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const newTrip = newTrips[0];

    // Audit log
    await auditLog(connection, req.user.id, 'Trips', 'UPDATE', id, oldTrip, newTrip);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Trip completed successfully.',
      data: newTrip
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Cancel trip
async function cancelTrip(req, res, next) {
  const { id } = req.params;
  const { remarks } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch trip
    const [trips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    if (trips.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Trip not found.' } });
    }
    const oldTrip = trips[0];

    if (oldTrip.status === 'Completed' || oldTrip.status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: `Trip is already ${oldTrip.status}.` } });
    }

    // If it was dispatched, restore vehicle and driver to Available
    if (oldTrip.status === 'Dispatched') {
      await connection.execute("UPDATE vehicles SET status = 'Available' WHERE id = ?", [oldTrip.vehicle_id]);
      await connection.execute("UPDATE drivers SET status = 'Available' WHERE id = ?", [oldTrip.driver_id]);
    }

    // Update trip status
    await connection.execute(
      "UPDATE trips SET status = 'Cancelled', remarks = ? WHERE id = ?",
      [remarks || oldTrip.remarks, id]
    );

    // Fetch updated trip
    const [newTrips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const newTrip = newTrips[0];

    // Audit log
    await auditLog(connection, req.user.id, 'Trips', 'UPDATE', id, oldTrip, newTrip);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Trip cancelled successfully.',
      data: newTrip
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
};
