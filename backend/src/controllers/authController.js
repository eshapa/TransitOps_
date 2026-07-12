const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    // Select user and join with roles to get the role name
    const [users] = await pool.execute(`
      SELECT u.id, u.role_id, u.full_name, u.email, u.password_hash, u.status, r.name as roleName
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.' }
      });
    }

    const user = users[0];

    // Check status
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is inactive. Please contact administration.' }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password.' }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roleName: user.roleName
      },
      process.env.JWT_SECRET || 'transitops_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.roleName
      }
    });

  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  const { fullName, email, password, roleName } = req.body;

  try {
    // Map role names if they differ
    let targetRole = roleName || 'Driver';
    if (targetRole === 'Dispatcher') {
      targetRole = 'Driver';
    }

    // Check if user already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User with this email already exists.' }
      });
    }

    // Fetch role_id
    const [roles] = await pool.execute('SELECT id, name FROM roles WHERE name = ?', [targetRole]);
    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: `Role '${targetRole}' is invalid.` }
      });
    }
    const roleId = roles[0].id;
    const resolvedRoleName = roles[0].name;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUserId;

    // If role is Driver, insert both user & driver inside database transaction
    if (resolvedRoleName === 'Driver') {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [userResult] = await connection.execute(
          'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
          [roleId, fullName, email, hashedPassword, 'Active']
        );
        newUserId = userResult.insertId;

        // Generate a random license number for self-registration: "REG-xxxxxxx"
        const licenseNumber = `REG-${Math.floor(1000000 + Math.random() * 9000000)}`;
        await connection.execute(
          'INSERT INTO drivers (user_id, license_number, license_category, license_expiry, joining_date, status) VALUES (?, ?, ?, ?, ?, ?)',
          [newUserId, licenseNumber, 'Commercial', '2030-12-31', new Date().toISOString().split('T')[0], 'Available']
        );

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      // Create user only
      const [result] = await pool.execute(
        'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [roleId, fullName, email, hashedPassword, 'Active']
      );
      newUserId = result.insertId;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUserId,
        email: email,
        roleName: resolvedRoleName
      },
      process.env.JWT_SECRET || 'transitops_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUserId,
        fullName,
        email,
        role: resolvedRoleName
      }
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register
};

