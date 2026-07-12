const pool = require('../config/db');

async function auditLog(connection, userId, moduleName, action, recordId, oldValue, newValue) {
  const conn = connection || pool;
  const sql = `
    INSERT INTO audit_logs (user_id, module_name, action, record_id, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const oldJson = oldValue ? JSON.stringify(oldValue) : null;
  const newJson = newValue ? JSON.stringify(newValue) : null;

  try {
    await conn.execute(sql, [
      userId || null,
      moduleName,
      action,
      recordId || null,
      oldJson,
      newJson
    ]);
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // In critical secure systems, we might propagate this error, 
    // but typically we don't want to fail the whole business transaction if audit logging fails 
    // unless strict compliance is required.
    // Here we'll throw it so transactions can rollback if logging fails.
    throw error;
  }
}

module.exports = {
  auditLog
};
