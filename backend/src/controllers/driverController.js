const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { auditLog } = require('../services/auditService');

// Get all drivers (joined with users)
async function getAllDrivers(req, res, next) {
  const { status, category, search } = req.query;

  let sql = `
    SELECT d.id as driver_id, d.user_id, u.full_name, u.email, u.phone, u.status as user_status,
           d.license_number, d.license_category, d.license_expiry, d.safety_score, 
           d.joining_date, d.total_trips, d.status as driver_status, d.created_at
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND d.status = ?';
    params.push(status);
  }

  if (category) {
    sql += ' AND d.license_category = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR d.license_number LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  sql += ' ORDER BY d.created_at DESC';

  try {
    const [drivers] = await pool.execute(sql, params);
    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    next(error);
  }
}

// Get single driver by ID
async function getDriverById(req, res, next) {
  const { id } = req.params;

  try {
    const [drivers] = await pool.execute(`
      SELECT d.id as driver_id, d.user_id, u.full_name, u.email, u.phone, u.status as user_status,
             d.license_number, d.license_category, d.license_expiry, d.safety_score, 
             d.joining_date, d.total_trips, d.status as driver_status, d.created_at
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (drivers.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Driver not found.' }
      });
    }

    res.status(200).json({
      success: true,
      data: drivers[0]
    });
  } catch (error) {
    next(error);
  }
}

// Create driver (Safety Officer / Fleet Manager only)
async function createDriver(req, res, next) {
  const {
    full_name, email, password, phone,
    license_number, license_category, license_expiry,
    joining_date, status
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validate unique email
    const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'A user with this email already exists.' }
      });
    }

    // 2. Validate unique license number
    const [existingLicense] = await connection.execute('SELECT id FROM drivers WHERE license_number = ?', [license_number]);
    if (existingLicense.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: { message: 'Driver with this license number already exists.' }
      });
    }

    // 3. Find Driver role ID
    const [roles] = await connection.execute("SELECT id FROM roles WHERE name = 'Driver'");
    if (roles.length === 0) {
      await connection.rollback();
      return res.status(500).json({
        success: false,
        error: { message: "System role 'Driver' does not exist." }
      });
    }
    const driverRoleId = roles[0].id;

    // 4. Create User
    const rawPassword = password || 'password123';
    const hash = await bcrypt.hash(rawPassword, 10);
    const [userResult] = await connection.execute(`
      INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `, [driverRoleId, full_name, email, hash, phone || null]);
    const newUserId = userResult.insertId;

    // 5. Create Driver
    const driverStatus = status || 'Available';
    const [driverResult] = await connection.execute(`
      INSERT INTO drivers (user_id, license_number, license_category, license_expiry, joining_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      newUserId,
      license_number,
      license_category || null,
      license_expiry,
      joining_date || null,
      driverStatus
    ]);
    const newDriverId = driverResult.insertId;

    // 6. Fetch combined new data for audit logging and response
    const [newDrivers] = await connection.execute(`
      SELECT d.id as driver_id, d.user_id, u.full_name, u.email, u.phone, u.status as user_status,
             d.license_number, d.license_category, d.license_expiry, d.safety_score, 
             d.joining_date, d.total_trips, d.status as driver_status
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [newDriverId]);
    const newDriver = newDrivers[0];

    // Log action
    await auditLog(connection, req.user.id, 'Drivers', 'CREATE', newDriverId, null, newDriver);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Driver profile created successfully.',
      data: newDriver
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

// Update driver (Safety Officer / Fleet Manager only)
async function updateDriver(req, res, next) {
  const { id } = req.params;
  const {
    full_name, email, phone, user_status,
    license_number, license_category, license_expiry,
    safety_score, status
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch current driver state
    const [oldDrivers] = await connection.execute(`
      SELECT d.id as driver_id, d.user_id, u.full_name, u.email, u.phone, u.status as user_status,
             d.license_number, d.license_category, d.license_expiry, d.safety_score, 
             d.joining_date, d.total_trips, d.status as driver_status
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (oldDrivers.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: { message: 'Driver not found.' }
      });
    }
    const oldDriver = oldDrivers[0];
    const userId = oldDriver.user_id;

    // 2. Validate email uniqueness
    if (email && email !== oldDriver.email) {
      const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: { message: 'A user with this email already exists.' }
        });
      }
    }

    // 3. Validate license number uniqueness
    if (license_number && license_number !== oldDriver.license_number) {
      const [existingLicense] = await connection.execute('SELECT id FROM drivers WHERE license_number = ? AND id != ?', [license_number, id]);
      if (existingLicense.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: { message: 'Driver with this license number already exists.' }
        });
      }
    }

    // 4. Update Users Table
    const userUpdates = [];
    const userParams = [];
    if (full_name !== undefined) { userUpdates.push('full_name = ?'); userParams.push(full_name); }
    if (email !== undefined) { userUpdates.push('email = ?'); userParams.push(email); }
    if (phone !== undefined) { userUpdates.push('phone = ?'); userParams.push(phone); }
    if (user_status !== undefined) { userUpdates.push('status = ?'); userParams.push(user_status); }

    if (userUpdates.length > 0) {
      userParams.push(userId);
      await connection.execute(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
    }

    // 5. Update Drivers Table
    const driverUpdates = [];
    const driverParams = [];
    if (license_number !== undefined) { driverUpdates.push('license_number = ?'); driverParams.push(license_number); }
    if (license_category !== undefined) { driverUpdates.push('license_category = ?'); driverParams.push(license_category); }
    if (license_expiry !== undefined) { driverUpdates.push('license_expiry = ?'); driverParams.push(license_expiry); }
    if (safety_score !== undefined) { driverUpdates.push('safety_score = ?'); driverParams.push(safety_score); }
    if (status !== undefined) { driverUpdates.push('status = ?'); driverParams.push(status); }

    if (driverUpdates.length > 0) {
      driverParams.push(id);
      await connection.execute(`UPDATE drivers SET ${driverUpdates.join(', ')} WHERE id = ?`, driverParams);
    }

    // 6. Fetch combined updated state
    const [newDrivers] = await connection.execute(`
      SELECT d.id as driver_id, d.user_id, u.full_name, u.email, u.phone, u.status as user_status,
             d.license_number, d.license_category, d.license_expiry, d.safety_score, 
             d.joining_date, d.total_trips, d.status as driver_status
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);
    const newDriver = newDrivers[0];

    // Log action
    await auditLog(connection, req.user.id, 'Drivers', 'UPDATE', id, oldDriver, newDriver);

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully.',
      data: newDriver
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver
};
