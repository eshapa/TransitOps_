const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const rolesSQL = `
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const usersSQL = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    status ENUM('Active','Inactive') DEFAULT 'Active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY(role_id) REFERENCES roles(id)
);
`;

const driversSQL = `
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(20),
    license_expiry DATE NOT NULL,
    safety_score DECIMAL(5,2) DEFAULT 100,
    joining_date DATE,
    total_trips INT DEFAULT 0,
    status ENUM('Available','On Trip','Off Duty','Suspended') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
`;

const vehiclesSQL = `
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    vehicle_name VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_type VARCHAR(50),
    manufacturer VARCHAR(100),
    manufacture_year YEAR,
    maximum_load_capacity DECIMAL(10,2),
    fuel_type ENUM('Petrol','Diesel','Electric','CNG'),
    current_odometer DECIMAL(10,2) DEFAULT 0,
    purchase_date DATE,
    acquisition_cost DECIMAL(12,2),
    insurance_expiry DATE,
    pollution_expiry DATE,
    fitness_expiry DATE,
    status ENUM('Available','On Trip','In Shop','Retired') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const tripsSQL = `
CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_number VARCHAR(30) UNIQUE,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    source_location VARCHAR(255),
    destination_location VARCHAR(255),
    cargo_weight DECIMAL(10,2),
    planned_distance DECIMAL(10,2),
    actual_distance DECIMAL(10,2),
    start_odometer DECIMAL(10,2),
    end_odometer DECIMAL(10,2),
    scheduled_start DATETIME,
    actual_start DATETIME,
    actual_end DATETIME,
    status ENUM('Draft','Dispatched','Completed','Cancelled') DEFAULT 'Draft',
    remarks TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
);
`;

const maintenanceSQL = `
CREATE TABLE IF NOT EXISTS maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    maintenance_type VARCHAR(100),
    description TEXT,
    vendor VARCHAR(100),
    cost DECIMAL(10,2),
    start_date DATE,
    completion_date DATE,
    next_service_due DATE,
    status ENUM('Scheduled','In Progress','Completed') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);
`;

const fuelLogsSQL = `
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT,
    trip_id INT,
    liters DECIMAL(10,2),
    price_per_liter DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    odometer DECIMAL(10,2),
    fuel_station VARCHAR(100),
    filled_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id),
    FOREIGN KEY(trip_id) REFERENCES trips(id)
);
`;

const expensesSQL = `
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    trip_id INT,
    expense_type ENUM('Fuel','Maintenance','Toll','Insurance','Repair','Other'),
    amount DECIMAL(10,2),
    expense_date DATE,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(trip_id) REFERENCES trips(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
);
`;

const vehicleDocumentsSQL = `
CREATE TABLE IF NOT EXISTS vehicle_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    document_name VARCHAR(100),
    document_type VARCHAR(100),
    document_url VARCHAR(255),
    expiry_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);
`;

const notificationsSQL = `
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
`;

const auditLogsSQL = `
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_name VARCHAR(100),
    action VARCHAR(100),
    record_id INT,
    old_value JSON,
    new_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
`;

async function seed() {
  let connection;
  try {
    console.log('Connecting to TiDB/MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined
    });

    console.log('Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'transitops'}\`;`);
    await connection.query(`USE \`${process.env.DB_NAME || 'transitops'}\`;`);

    console.log('Creating tables...');
    await connection.query(rolesSQL);
    await connection.query(usersSQL);
    await connection.query(driversSQL);
    await connection.query(vehiclesSQL);
    await connection.query(tripsSQL);
    await connection.query(maintenanceSQL);
    await connection.query(fuelLogsSQL);
    await connection.query(expensesSQL);
    await connection.query(vehicleDocumentsSQL);
    await connection.query(notificationsSQL);
    await connection.query(auditLogsSQL);

    console.log('Creating indexes (if not exist)...');
    try { await connection.query('CREATE INDEX idx_vehicle_status ON vehicles(status);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_driver_status ON drivers(status);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_trip_status ON trips(status);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_trip_vehicle ON trips(vehicle_id);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_trip_driver ON trips(driver_id);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_expense_vehicle ON expenses(vehicle_id);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);'); } catch (e) {}
    try { await connection.query('CREATE INDEX idx_maintenance_vehicle ON maintenance(vehicle_id);'); } catch (e) {}

    console.log('Seeding roles...');
    const [roles] = await connection.query('SELECT * FROM roles');
    if (roles.length === 0) {
      await connection.query(`
        INSERT INTO roles (name, description) VALUES
        ('Fleet Manager', 'Manages vehicles and fleet'),
        ('Driver', 'Driver role'),
        ('Safety Officer', 'Monitors driver compliance'),
        ('Financial Analyst', 'Expense and analytics');
      `);
      console.log('Roles seeded.');
    } else {
      console.log('Roles already seeded.');
    }

    console.log('Seeding default users...');
    const [existingUsers] = await connection.query('SELECT * FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      // Get role IDs
      const [dbRoles] = await connection.query('SELECT id, name FROM roles');
      const roleMap = {};
      dbRoles.forEach(r => { roleMap[r.name] = r.id; });

      const hash = await bcrypt.hash('password123', 10);

      // Insert Fleet Manager
      await connection.query(
        'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [roleMap['Fleet Manager'], 'Alice Fleet Manager', 'manager@transitops.com', hash, 'Active']
      );

      // Insert Safety Officer
      await connection.query(
        'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [roleMap['Safety Officer'], 'Bob Safety Officer', 'safety@transitops.com', hash, 'Active']
      );

      // Insert Financial Analyst
      await connection.query(
        'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [roleMap['Financial Analyst'], 'Charlie Financial Analyst', 'analyst@transitops.com', hash, 'Active']
      );

      // Insert Driver (needs user + driver record)
      const [driverUserResult] = await connection.query(
        'INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [roleMap['Driver'], 'David Driver', 'driver@transitops.com', hash, 'Active']
      );
      const driverUserId = driverUserResult.insertId;

      await connection.query(
        'INSERT INTO drivers (user_id, license_number, license_category, license_expiry, joining_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [driverUserId, 'DL-99998888', 'Heavy Commercial', '2030-12-31', '2026-01-01', 'Available']
      );

      console.log('Users seeded.');
    } else {
      console.log('Users already exist, skipping seeding.');
    }

    console.log('Database schema and seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
