const pool = require('../config/db');
require('dotenv').config();

// Get Dashboard KPIs
async function getDashboardKPIs(req, res, next) {
  const { type } = req.query;

  let vehicleFilter = '1=1';
  const params = [];
  if (type) {
    vehicleFilter += ' AND vehicle_type = ?';
    params.push(type);
  }

  try {
    // 1. Fetch counts from vehicles
    const [vehicles] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN status = 'On Trip' THEN 1 ELSE 0 END) as activeVehicles,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as availableVehicles,
        SUM(CASE WHEN status = 'In Shop' THEN 1 ELSE 0 END) as maintenanceVehicles,
        COUNT(CASE WHEN status != 'Retired' THEN 1 END) as totalActiveVehicles
      FROM vehicles
      WHERE ${vehicleFilter}
    `, params);

    const active = parseInt(vehicles[0].activeVehicles || 0);
    const available = parseInt(vehicles[0].availableVehicles || 0);
    const inShop = parseInt(vehicles[0].maintenanceVehicles || 0);
    const total = parseInt(vehicles[0].totalActiveVehicles || 0);

    const fleetUtilization = total > 0 ? parseFloat(((active / total) * 100).toFixed(2)) : 0;

    // 2. Fetch counts from trips
    const [trips] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN status = 'Dispatched' THEN 1 ELSE 0 END) as activeTrips,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as pendingTrips
      FROM trips
    `);

    // 3. Fetch counts from drivers
    const [drivers] = await pool.execute(`
      SELECT COUNT(*) as driversOnDuty
      FROM drivers
      WHERE status = 'On Trip'
    `);

    res.status(200).json({
      success: true,
      data: {
        activeVehicles: active,
        availableVehicles: available,
        vehiclesInMaintenance: inShop,
        activeTrips: parseInt(trips[0].activeTrips || 0),
        pendingTrips: parseInt(trips[0].pendingTrips || 0),
        driversOnDuty: parseInt(drivers[0].driversOnDuty || 0),
        fleetUtilizationPercent: fleetUtilization
      }
    });

  } catch (error) {
    next(error);
  }
}

// Generate Fleet Analytics Data helper
async function generateAnalyticsData() {
  const revenuePerUnit = parseFloat(process.env.REVENUE_PER_UNIT_DISTANCE || '2.50');

  // Query to aggregate fuel, maintenance, trips, and ROI per vehicle
  // We use LEFT JOINs to ensure all active vehicles are listed even if they don't have trips/fuel/maintenance logs yet.
  const sql = `
    SELECT 
      v.id as vehicle_id,
      v.registration_number,
      v.vehicle_name,
      v.vehicle_type,
      v.acquisition_cost,
      COALESCE(SUM(DISTINCT t.actual_distance), 0) as total_distance,
      COALESCE(SUM(DISTINCT fl.liters), 0) as total_fuel_liters,
      COALESCE(SUM(DISTINCT fl.total_cost), 0) as total_fuel_cost,
      COALESCE((
        SELECT SUM(cost) 
        FROM maintenance 
        WHERE vehicle_id = v.id AND status = 'Completed'
      ), 0) as total_maintenance_cost
    FROM vehicles v
    LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
    LEFT JOIN fuel_logs fl ON v.id = fl.vehicle_id
    WHERE v.status != 'Retired'
    GROUP BY v.id
  `;

  const [rows] = await pool.execute(sql);

  return rows.map(row => {
    const acquisitionCost = parseFloat(row.acquisition_cost || 0);
    const totalDistance = parseFloat(row.total_distance);
    const totalFuelLiters = parseFloat(row.total_fuel_liters);
    const fuelCost = parseFloat(row.total_fuel_cost);
    const maintenanceCost = parseFloat(row.total_maintenance_cost);

    // Fuel Efficiency (Distance / Fuel)
    const fuelEfficiency = totalFuelLiters > 0 
      ? parseFloat((totalDistance / totalFuelLiters).toFixed(2)) 
      : 0;

    // Operational Cost (Fuel + Maintenance)
    const operationalCost = parseFloat((fuelCost + maintenanceCost).toFixed(2));

    // Revenue
    const revenue = parseFloat((totalDistance * revenuePerUnit).toFixed(2));

    // ROI = (Revenue - Operational Cost) / Acquisition Cost
    let roi = 0;
    if (acquisitionCost > 0) {
      roi = parseFloat(((revenue - operationalCost) / acquisitionCost).toFixed(4));
    }

    return {
      vehicle_id: row.vehicle_id,
      registration_number: row.registration_number,
      vehicle_name: row.vehicle_name,
      vehicle_type: row.vehicle_type,
      acquisition_cost: acquisitionCost,
      total_distance_covered: totalDistance,
      total_fuel_liters: totalFuelLiters,
      fuel_efficiency: fuelEfficiency,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      operational_cost: operationalCost,
      revenue,
      roi: parseFloat((roi * 100).toFixed(2)) // ROI expressed in percentage
    };
  });
}

// Get Reports & Analytics JSON
async function getReportsAnalytics(req, res, next) {
  try {
    const data = await generateAnalyticsData();
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
}

// Export Analytics to CSV
async function exportAnalyticsCSV(req, res, next) {
  try {
    const data = await generateAnalyticsData();

    // Build CSV Headers
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Vehicle Name',
      'Vehicle Type',
      'Acquisition Cost ($)',
      'Total Distance Covered (km)',
      'Total Fuel consumed (L)',
      'Fuel Efficiency (km/L)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Total Operational Cost ($)',
      'Revenue ($)',
      'ROI (%)'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const row = [
        item.vehicle_id,
        `"${item.registration_number}"`,
        `"${item.vehicle_name || ''}"`,
        `"${item.vehicle_type || ''}"`,
        item.acquisition_cost.toFixed(2),
        item.total_distance_covered.toFixed(2),
        item.total_fuel_liters.toFixed(2),
        item.fuel_efficiency.toFixed(2),
        item.fuel_cost.toFixed(2),
        item.maintenance_cost.toFixed(2),
        item.operational_cost.toFixed(2),
        item.revenue.toFixed(2),
        `${item.roi.toFixed(2)}%`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet_analytics_report.csv');
    res.status(200).send(csvString);

  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardKPIs,
  getReportsAnalytics,
  exportAnalyticsCSV
};
