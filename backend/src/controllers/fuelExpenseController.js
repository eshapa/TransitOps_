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

module.exports = {
  getAllFuelLogs,
  createFuelLog,
  getAllExpenses,
  createExpense
};
