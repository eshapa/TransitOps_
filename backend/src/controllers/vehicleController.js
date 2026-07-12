const pool = require('../config/db');
const { auditLog } = require('../services/auditService');

// Get all vehicles with filtering and searching
async function getAllVehicles(req, res, next) {
  const { status, type, search } = req.query;
  
  let sql = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (type) {
    sql += ' AND vehicle_type = ?';
    params.push(type);
  }

  if (search) {
    sql += ' AND (registration_number LIKE ? OR vehicle_name LIKE ? OR manufacturer LIKE ? OR vehicle_model LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [vehicles] = await pool.execute(sql, params);
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
}

// Get single vehicle
async function getVehicleById(req, res, next) {
  const { id } = req.params;

  try {
    const [vehicles] = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Vehicle not found.' }
      });
    }

    res.status(200).json({
      success: true,
      data: vehicles[0]
    });
  } catch (error) {
    next(error);
  }
}

// Create new vehicle (Fleet Manager only)
async function createVehicle(req, res, next) {
  const fields = [
    'registration_number', 'vehicle_name', 'vehicle_model', 'vehicle_type',
    'manufacturer', 'manufacture_year', 'maximum_load_capacity', 'fuel_type',
    'current_odometer', 'purchase_date', 'acquisition_cost', 'insurance_expiry',
    'pollution_expiry', 'fitness_expiry', 'status'
  ];

  // Set default status if not provided
  if (!req.body.status) {
    req.body.status = 'Available';
  }

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO vehicles (${fields.join(', ')}) VALUES (${placeholders})`;
  const params = fields.map(field => req.body[field] !== undefined ? req.body[field] : null);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check duplicate registration_number
    const [existing] = await connection.execute(
      'SELECT id FROM vehicles WHERE registration_number = ?',
      [req.body.registration_number]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Vehicle with this registration number already exists.' }
      });
    }

    const [result] = await connection.execute(sql, params);
    const newVehicleId = result.insertId;

    // Get the newly inserted vehicle for audit log
    const [newVehicles] = await connection.execute('SELECT * FROM vehicles WHERE id = ?', [newVehicleId]);
    const newVehicle = newVehicles[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'Vehicles', 'CREATE', newVehicleId, null, newVehicle);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: newVehicle
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Update vehicle (Fleet Manager only)
async function updateVehicle(req, res, next) {
  const { id } = req.params;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if vehicle exists
    const [oldVehicles] = await connection.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (oldVehicles.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Vehicle not found.' }
      });
    }
    const oldVehicle = oldVehicles[0];

    // Check duplicate registration_number if it's being updated
    if (req.body.registration_number && req.body.registration_number !== oldVehicle.registration_number) {
      const [existing] = await connection.execute(
        'SELECT id FROM vehicles WHERE registration_number = ? AND id != ?',
        [req.body.registration_number, id]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: { message: 'Vehicle with this registration number already exists.' }
        });
      }
    }

    // Build update query dynamically
    const fieldsToUpdate = [];
    const params = [];
    for (const key in req.body) {
      if (req.body[key] !== undefined) {
        fieldsToUpdate.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }

    if (fieldsToUpdate.length > 0) {
      params.push(id);
      const sql = `UPDATE vehicles SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      await connection.execute(sql, params);
    }

    // Fetch updated vehicle
    const [newVehicles] = await connection.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    const newVehicle = newVehicles[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'Vehicles', 'UPDATE', id, oldVehicle, newVehicle);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: newVehicle
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Delete vehicle (Fleet Manager only)
async function deleteVehicle(req, res, next) {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if vehicle exists
    const [vehicles] = await connection.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Vehicle not found.' }
      });
    }
    const oldVehicle = vehicles[0];

    // Delete
    await connection.execute('DELETE FROM vehicles WHERE id = ?', [id]);

    // Audit log
    await auditLog(connection, req.user.id, 'Vehicles', 'DELETE', id, oldVehicle, null);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
