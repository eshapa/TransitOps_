const pool = require('../config/db');
const { auditLog } = require('../services/auditService');

// Get all fuel logs
async function getAllFuelLogs(req, res, next) {
  const { vehicle_id, trip_id } = req.query;
  let sql = 'SELECT * FROM fuel_logs WHERE 1=1';
  const params = [];

  if (vehicle_id) {
    sql += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (trip_id) {
    sql += ' AND trip_id = ?';
    params.push(trip_id);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [logs] = await pool.execute(sql, params);
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

// Log fuel fill-up
async function createFuelLog(req, res, next) {
  const {
    vehicle_id, trip_id, liters, price_per_liter,
    total_cost, odometer, fuel_station, filled_date
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check vehicle
    const [vehicles] = await connection.execute('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Vehicle not found.' } });
    }

    // 2. Fetch driver_id from current user if they are a Driver
    let driverId = null;
    if (req.user.roleName === 'Driver') {
      const [drivers] = await connection.execute('SELECT id FROM drivers WHERE user_id = ?', [req.user.id]);
      if (drivers.length > 0) {
        driverId = drivers[0].id;
      }
    }

    // Auto-calculate total cost if not provided
    const finalLiters = parseFloat(liters);
    const finalPrice = parseFloat(price_per_liter);
    const finalTotalCost = total_cost !== undefined 
      ? parseFloat(total_cost) 
      : parseFloat((finalLiters * finalPrice).toFixed(2));

    const finalFilledDate = filled_date || new Date().toISOString().split('T')[0];

    // 3. Insert fuel log
    const fuelSql = `
      INSERT INTO fuel_logs (vehicle_id, driver_id, trip_id, liters, price_per_liter, total_cost, odometer, fuel_station, filled_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [fuelResult] = await connection.execute(fuelSql, [
      vehicle_id,
      driverId,
      trip_id || null,
      finalLiters,
      finalPrice,
      finalTotalCost,
      odometer || null,
      fuel_station || null,
      finalFilledDate
    ]);
    const newFuelId = fuelResult.insertId;

    // 4. Automatically create corresponding entry in the unified expenses table
    const expenseSql = `
      INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, description, created_by)
      VALUES (?, ?, 'Fuel', ?, ?, ?, ?)
    `;
    const stationName = fuel_station || 'Unknown Station';
    const description = `Fuel Fill-up: ${finalLiters} liters @ ${finalPrice}/L at ${stationName}`;
    await connection.execute(expenseSql, [
      vehicle_id,
      trip_id || null,
      finalTotalCost,
      finalFilledDate,
      description,
      req.user.id
    ]);

    // Fetch the created fuel log
    const [newLogs] = await connection.execute('SELECT * FROM fuel_logs WHERE id = ?', [newFuelId]);
    const newLog = newLogs[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'FuelLogs', 'CREATE', newFuelId, null, newLog);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Fuel fill-up recorded successfully.',
      data: newLog
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Get all general expenses
async function getAllExpenses(req, res, next) {
  const { vehicle_id, trip_id, type } = req.query;
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (vehicle_id) {
    sql += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (trip_id) {
    sql += ' AND trip_id = ?';
    params.push(trip_id);
  }
  if (type) {
    sql += ' AND expense_type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [expenses] = await pool.execute(sql, params);
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
}

// Create general expense
async function createExpense(req, res, next) {
  const { vehicle_id, trip_id, expense_type, amount, expense_date, description } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify vehicle if provided
    if (vehicle_id) {
      const [vehicles] = await connection.execute('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
      if (vehicles.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: { message: 'Vehicle not found.' } });
      }
    }

    // Verify trip if provided
    if (trip_id) {
      const [trips] = await connection.execute('SELECT id FROM trips WHERE id = ?', [trip_id]);
      if (trips.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: { message: 'Trip not found.' } });
      }
    }

    const finalExpenseDate = expense_date || new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(sql, [
      vehicle_id || null,
      trip_id || null,
      expense_type,
      amount,
      finalExpenseDate,
      description || null,
      req.user.id
    ]);
    const newExpenseId = result.insertId;

    // Fetch created expense
    const [expenses] = await connection.execute('SELECT * FROM expenses WHERE id = ?', [newExpenseId]);
    const newExpense = expenses[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'Expenses', 'CREATE', newExpenseId, null, newExpense);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully.',
      data: newExpense
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// ─── Fuel Anomaly Detection Engine ───────────────────────────
async function getFuelAnomalies(req, res, next) {
  try {
    // 1. Fetch all fuel logs with vehicle info
    const [fuelLogs] = await pool.execute(`
      SELECT fl.*, 
             v.registration_number, v.vehicle_name, v.fuel_type, v.vehicle_type,
             v.current_odometer as vehicle_odometer
      FROM fuel_logs fl
      JOIN vehicles v ON fl.vehicle_id = v.id
      ORDER BY fl.filled_date DESC
    `);

    // 2. Fetch completed trips for km/L calculation
    const [trips] = await pool.execute(`
      SELECT id, vehicle_id, actual_distance, start_odometer, end_odometer
      FROM trips WHERE status = 'Completed' AND actual_distance > 0
    `);

    // 3. Compute fleet-wide average km/L (from completed trips vs fuel consumed)
    const vehicleFuelMap = {};
    for (const fl of fuelLogs) {
      if (!vehicleFuelMap[fl.vehicle_id]) {
        vehicleFuelMap[fl.vehicle_id] = { totalLiters: 0, totalKm: 0 };
      }
      vehicleFuelMap[fl.vehicle_id].totalLiters += parseFloat(fl.liters);
    }
    for (const trip of trips) {
      if (vehicleFuelMap[trip.vehicle_id]) {
        vehicleFuelMap[trip.vehicle_id].totalKm += parseFloat(trip.actual_distance);
      }
    }

    let fleetTotalKm = 0, fleetTotalLiters = 0;
    for (const vid of Object.keys(vehicleFuelMap)) {
      fleetTotalKm += vehicleFuelMap[vid].totalKm;
      fleetTotalLiters += vehicleFuelMap[vid].totalLiters;
    }
    const fleetAvgKmPerL = fleetTotalLiters > 0 ? (fleetTotalKm / fleetTotalLiters) : 5; // default 5 km/L

    // 4. Define anomaly thresholds
    const TANK_CAPACITY = {
      'Van': 60, 'Mini': 45, 'Truck': 200, 'Trailer': 400
    };
    const DEFAULT_TANK = 80;
    const LOW_KML_THRESHOLD = fleetAvgKmPerL * 0.4;   // 40% below fleet avg
    const HIGH_KML_THRESHOLD = fleetAvgKmPerL * 2.5;   // 250% above fleet avg
    const DUPLICATE_HOURS_WINDOW = 4;

    // 5. Run anomaly rules on each fuel log
    const anomalies = [];

    for (let i = 0; i < fuelLogs.length; i++) {
      const fl = fuelLogs[i];
      const liters = parseFloat(fl.liters);
      const logFlags = [];

      // Rule 1: Over-capacity refuel
      const tankMax = TANK_CAPACITY[fl.vehicle_type] || DEFAULT_TANK;
      if (liters > tankMax) {
        logFlags.push({
          severity: 'high',
          rule: 'Over-Capacity Refuel',
          detail: `Filled ${liters}L but ${fl.vehicle_type || 'vehicle'} tank max is ~${tankMax}L`
        });
      }

      // Rule 2: Abnormally low km/L (fuel theft indicator)
      const vehData = vehicleFuelMap[fl.vehicle_id];
      if (vehData && vehData.totalLiters > 0 && vehData.totalKm > 0) {
        const vehKmPerL = vehData.totalKm / vehData.totalLiters;
        if (vehKmPerL < LOW_KML_THRESHOLD && vehKmPerL > 0) {
          logFlags.push({
            severity: 'medium',
            rule: 'Low Fuel Efficiency',
            detail: `Vehicle avg ${vehKmPerL.toFixed(1)} km/L vs fleet avg ${fleetAvgKmPerL.toFixed(1)} km/L`
          });
        }
      }

      // Rule 3: Abnormally high km/L (fake odometer entry)
      if (vehData && vehData.totalLiters > 0 && vehData.totalKm > 0) {
        const vehKmPerL = vehData.totalKm / vehData.totalLiters;
        if (vehKmPerL > HIGH_KML_THRESHOLD) {
          logFlags.push({
            severity: 'medium',
            rule: 'Suspiciously High Efficiency',
            detail: `Vehicle avg ${vehKmPerL.toFixed(1)} km/L is abnormally high (fleet avg: ${fleetAvgKmPerL.toFixed(1)} km/L)`
          });
        }
      }

      // Rule 4: Duplicate fill-ups (same vehicle within N hours)
      for (let j = i + 1; j < fuelLogs.length; j++) {
        const other = fuelLogs[j];
        if (other.vehicle_id === fl.vehicle_id) {
          const timeDiffMs = Math.abs(new Date(fl.filled_date) - new Date(other.filled_date));
          const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          if (timeDiffHours < DUPLICATE_HOURS_WINDOW) {
            logFlags.push({
              severity: 'high',
              rule: 'Duplicate Fill-Up',
              detail: `Two fuel entries for same vehicle within ${DUPLICATE_HOURS_WINDOW} hours`
            });
            break;
          }
        }
      }

      // Rule 5: Fuel logged with no active trip
      if (!fl.trip_id) {
        const fillDate = new Date(fl.filled_date).toISOString().split('T')[0];
        const [activeTrips] = await pool.execute(`
          SELECT id FROM trips 
          WHERE vehicle_id = ? AND status IN ('Dispatched','Completed') 
          AND DATE(scheduled_start) <= ? 
          ORDER BY id DESC LIMIT 1
        `, [fl.vehicle_id, fillDate]);
        
        if (activeTrips.length === 0) {
          logFlags.push({
            severity: 'low',
            rule: 'No Active Trip',
            detail: `Fuel added on ${fillDate} but no dispatched/completed trip found for this vehicle`
          });
        }
      }

      // Rule 6: Price anomaly — unusually high or low price per liter
      const pricePerL = parseFloat(fl.price_per_liter);
      if (pricePerL > 3.0) {
        logFlags.push({
          severity: 'medium',
          rule: 'High Fuel Price',
          detail: `Price $${pricePerL.toFixed(2)}/L is unusually high`
        });
      } else if (pricePerL < 0.5 && pricePerL > 0) {
        logFlags.push({
          severity: 'low',
          rule: 'Low Fuel Price',
          detail: `Price $${pricePerL.toFixed(2)}/L is suspiciously low`
        });
      }

      if (logFlags.length > 0) {
        // Determine highest severity
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const maxSeverity = logFlags.reduce((max, f) => 
          severityOrder[f.severity] > severityOrder[max] ? f.severity : max, 'low');

        anomalies.push({
          fuel_log_id: fl.id,
          vehicle_id: fl.vehicle_id,
          registration_number: fl.registration_number,
          vehicle_name: fl.vehicle_name,
          liters: fl.liters,
          total_cost: fl.total_cost,
          filled_date: fl.filled_date,
          fuel_station: fl.fuel_station,
          severity: maxSeverity,
          flags: logFlags
        });
      }
    }

    // Sort: high severity first
    const severitySort = { high: 0, medium: 1, low: 2 };
    anomalies.sort((a, b) => severitySort[a.severity] - severitySort[b.severity]);

    res.status(200).json({
      success: true,
      fleetAvgKmPerL: parseFloat(fleetAvgKmPerL.toFixed(2)),
      totalAnomalies: anomalies.length,
      highRisk: anomalies.filter(a => a.severity === 'high').length,
      mediumRisk: anomalies.filter(a => a.severity === 'medium').length,
      lowRisk: anomalies.filter(a => a.severity === 'low').length,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFuelLogs,
  createFuelLog,
  getAllExpenses,
  createExpense,
  getFuelAnomalies
};
