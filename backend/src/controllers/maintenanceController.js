const pool = require('../config/db');
const { auditLog } = require('../services/auditService');

// Get all maintenance logs
async function getAllMaintenance(req, res, next) {
  const { status, vehicle_id } = req.query;

  let sql = 'SELECT * FROM maintenance WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    sql += ' AND vehicle_id = ?';
    params.push(vehicle_id);
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

// Get single maintenance log
async function getMaintenanceById(req, res, next) {
  const { id } = req.params;

  try {
    const [logs] = await pool.execute('SELECT * FROM maintenance WHERE id = ?', [id]);
    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Maintenance record not found.' }
      });
    }

    res.status(200).json({
      success: true,
      data: logs[0]
    });
  } catch (error) {
    next(error);
  }
}

// Create maintenance record
async function createMaintenance(req, res, next) {
  const {
    vehicle_id, maintenance_type, description, vendor,
    cost, start_date, next_service_due, status
  } = req.body;

  const logStatus = status || 'Scheduled';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch vehicle status
    const [vehicles] = await connection.execute(
      'SELECT status FROM vehicles WHERE id = ?',
      [vehicle_id]
    );

    if (vehicles.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Vehicle not found.' } });
    }

    const vehicle = vehicles[0];

    if (vehicle.status === 'Retired') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Cannot schedule maintenance for a Retired vehicle.' } });
    }

    if (vehicle.status === 'On Trip') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Vehicle is currently On Trip and cannot enter maintenance.' } });
    }

    // 2. Insert maintenance log
    const sql = `
      INSERT INTO maintenance (vehicle_id, maintenance_type, description, vendor, cost, start_date, next_service_due, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(sql, [
      vehicle_id,
      maintenance_type || null,
      description || null,
      vendor || null,
      cost || null,
      start_date || null,
      next_service_due || null,
      logStatus
    ]);
    const newLogId = result.insertId;

    // 3. Update vehicle status if active ('Scheduled' or 'In Progress' is active maintenance)
    if (logStatus === 'Scheduled' || logStatus === 'In Progress') {
      await connection.execute(
        "UPDATE vehicles SET status = 'In Shop' WHERE id = ?",
        [vehicle_id]
      );
    }

    // Fetch new log
    const [logs] = await connection.execute('SELECT * FROM maintenance WHERE id = ?', [newLogId]);
    const newLog = logs[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'Maintenance', 'CREATE', newLogId, null, newLog);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully.',
      data: newLog
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Complete maintenance
async function completeMaintenance(req, res, next) {
  const { id } = req.params;
  const { completion_date, cost, next_service_due } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch maintenance details
    const [logs] = await connection.execute('SELECT * FROM maintenance WHERE id = ?', [id]);
    if (logs.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: { message: 'Maintenance record not found.' } });
    }
    const oldLog = logs[0];

    if (oldLog.status === 'Completed') {
      await connection.rollback();
      return res.status(400).json({ success: false, error: { message: 'Maintenance is already completed.' } });
    }

    // 2. Fetch vehicle status
    const [vehicles] = await connection.execute('SELECT status FROM vehicles WHERE id = ?', [oldLog.vehicle_id]);
    const vehicle = vehicles[0];

    // 3. Update vehicle status: restore to Available (unless retired)
    if (vehicle && vehicle.status !== 'Retired') {
      await connection.execute(
        "UPDATE vehicles SET status = 'Available' WHERE id = ?",
        [oldLog.vehicle_id]
      );
    }

    // 4. Update maintenance log
    const updates = [];
    const params = [];

    updates.push('status = ?');
    params.push('Completed');

    updates.push('completion_date = ?');
    params.push(completion_date || new Date().toISOString().split('T')[0]);

    if (cost !== undefined) {
      updates.push('cost = ?');
      params.push(cost);
    }

    if (next_service_due !== undefined) {
      updates.push('next_service_due = ?');
      params.push(next_service_due);
    }

    params.push(id);

    const sql = `UPDATE maintenance SET ${updates.join(', ')} WHERE id = ?`;
    await connection.execute(sql, params);

    // Fetch updated log
    const [newLogs] = await connection.execute('SELECT * FROM maintenance WHERE id = ?', [id]);
    const newLog = newLogs[0];

    // Audit Logging
    await auditLog(connection, req.user.id, 'Maintenance', 'UPDATE', id, oldLog, newLog);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Maintenance completed and vehicle restored.',
      data: newLog
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  completeMaintenance
};
