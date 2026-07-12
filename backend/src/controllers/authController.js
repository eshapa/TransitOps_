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

module.exports = {
  login
};
