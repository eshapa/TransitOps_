import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiTrendingUp, FiMoreVertical } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Dynamic Lists State
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Filters State
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const tripsRes = await API.get('/trips');
        setTrips(tripsRes.data.data);

        const vehiclesRes = await API.get('/vehicles');
        setVehicles(vehiclesRes.data.data);

        const driversRes = await API.get('/drivers');
        setDrivers(driversRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // 1. Dynamic local filter logic for Region, Vehicle Type, and Status
  const filteredVehicles = vehicles.filter(v => {
    if (typeFilter && v.vehicle_type !== typeFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    
    if (regionFilter) {
      if (regionFilter === 'GJ') {
        return v.registration_number.toUpperCase().startsWith('GJ');
      } else if (regionFilter === 'MH') {
        // GJ starts with GJ, MH starts with MH or anything else in the demo
        return v.registration_number.toUpperCase().startsWith('MH') || !v.registration_number.toUpperCase().startsWith('GJ');
      }
    }
    return true;
  });

  const filteredTrips = trips.filter(t => {
    // Keep trips associated with vehicles that meet the active filters
    return filteredVehicles.some(v => v.id === t.vehicle_id);
  });

  const filteredDrivers = drivers.filter(d => {
    // Filter drivers dynamically based on status selections
    if (statusFilter) {
      if (statusFilter === 'Available' && d.driver_status !== 'Available') return false;
      if (statusFilter === 'On Trip' && d.driver_status !== 'On Trip') return false;
    }
    return true;
  });

  // 2. Compute 7 KPI counts dynamically from filtered lists
  const activeVehCount = filteredVehicles.filter(v => v.status !== 'Retired').length;
  const availVehCount = filteredVehicles.filter(v => v.status === 'Available').length;
  const maintVehCount = filteredVehicles.filter(v => v.status === 'In Shop').length;
  const activeTripsCount = filteredTrips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = filteredTrips.filter(t => t.status === 'Draft').length;
  const driversOnDutyCount = filteredDrivers.filter(d => d.driver_status === 'Available' || d.driver_status === 'On Trip').length;

  const onTripVehs = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilPercent = activeVehCount > 0 
    ? ((onTripVehs / activeVehCount) * 100).toFixed(1) 
    : '0.0';

  // Compute status distributions for the Pie Chart from filtered vehicles
  const statusCounts = filteredVehicles.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = [
    { name: 'Available', value: statusCounts['Available'] || 0, color: '#2ecc71' },
    { name: 'On Trip', value: statusCounts['On Trip'] || 0, color: '#0066ff' },
    { name: 'In Shop', value: statusCounts['In Shop'] || 0, color: '#e67e22' },
    { name: 'Retired', value: statusCounts['Retired'] || 0, color: '#ff7675' }
  ].filter(item => item.value > 0);

  // Utilization Trend data
  const utilizationData = [
    { name: 'May', utilization: 65 },
    { name: 'Jun', utilization: 72 },
    { name: 'Jul', utilization: parseFloat(fleetUtilPercent) }
  ];

  const recentTrips = filteredTrips.slice(0, 5);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Draft': return 'secondary';
      case 'Dispatched': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#121212', color: '#f8fafc' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Dashboard Analytics</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary-custom" onClick={() => navigate('/reports')}>View Reports</button>
          <button className="btn-primary-custom" onClick={() => navigate('/dispatch')}>New Dispatch</button>
        </div>
      </div>

      {error && <div className="text-danger mb-3 p-3 glass-card">{error}</div>}

      {/* Dashboard Filters Row Layout */}
      <div className="registry-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.85rem', color: '#a0aec0', fontWeight: '500' }}>Filters:</div>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
          style={{ padding: '0.4rem 0.8rem', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', cursor: 'pointer' }}
        >
          <option value="">Type: All</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Mini">Mini</option>
          <option value="Trailer">Trailer</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
          style={{ padding: '0.4rem 0.8rem', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', cursor: 'pointer' }}
        >
          <option value="">Status: All</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>

        <select 
          value={regionFilter} 
          onChange={(e) => setRegionFilter(e.target.value)}
          className="filter-select"
          style={{ padding: '0.4rem 0.8rem', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e2e8f0', cursor: 'pointer' }}
        >
          <option value="">Region: All</option>
          <option value="GJ">Gujarat (GJ Plates)</option>
          <option value="MH">Maharashtra (MH Plates)</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading operational KPIs...</div>
      ) : (
        <>
          {/* First KPI Row (4 metrics) */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Active Vehicles</span>
                <button className="icon-btn" onClick={() => navigate('/vehicles')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{activeVehCount}</div>
              <div className="kpi-change text-success-custom">
                <span>In-service assets</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Available Vehicles</span>
                <button className="icon-btn" onClick={() => navigate('/vehicles')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value" style={{ color: '#2ecc71' }}>{availVehCount}</div>
              <div className="kpi-change text-success-custom">
                <span>Ready for dispatch</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">In Maintenance</span>
                <button className="icon-btn" onClick={() => navigate('/maintenance')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value" style={{ color: '#e67e22' }}>{maintVehCount}</div>
              <div className="kpi-change text-primary-custom">
                <span>Currently in shop</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Fleet Utilization</span>
                <button className="icon-btn" onClick={() => navigate('/reports')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value" style={{ color: '#0066ff' }}>{fleetUtilPercent}%</div>
              <div className="kpi-change text-success-custom">
                <FiTrendingUp />
                <span>Active / Active size</span>
              </div>
            </div>
          </div>

          {/* Second KPI Row (3 metrics) */}
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Active Trips</span>
                <button className="icon-btn" onClick={() => navigate('/trips')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{activeTripsCount}</div>
              <div className="kpi-change text-success-custom">
                <span>Currently dispatched</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Pending Trips</span>
                <button className="icon-btn" onClick={() => navigate('/trips')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value" style={{ color: '#a0aec0' }}>{pendingTripsCount}</div>
              <div className="kpi-change text-primary-custom">
                <span>Draft / Pending status</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Drivers On Duty</span>
                <button className="icon-btn" onClick={() => navigate('/drivers')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{driversOnDutyCount}</div>
              <div className="kpi-change text-success-custom">
                <span>Available + On Trip</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card chart-card">
              <h3 className="chart-title">Fleet Utilization Trend</h3>
              <div className="chart-container" style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilizationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0066ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#a0aabf" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0aabf" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#15181e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#0066ff' }}
                    />
                    <Area type="monotone" dataKey="utilization" stroke="#0066ff" strokeWidth={3} fillOpacity={1} fill="url(#colorUtil)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card chart-card">
              <h3 className="chart-title">Vehicle Status Distribution</h3>
              <div className="chart-container" style={{ height: '220px' }}>
                {statusDistribution.length === 0 ? (
                  <div className="text-center p-4 text-muted-custom">No vehicles match current filters.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#15181e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recent Trips List */}
          <div className="glass-card recent-trips-card" style={{ padding: '1rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Live Operational Activity</h3>
              <button className="btn-secondary-custom" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/trips')}>View All</button>
            </div>
            <div className="table-responsive">
              {recentTrips.length === 0 ? (
                <div className="p-3 text-center text-muted-custom">No recent trips match the filters.</div>
              ) : (
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Cargo Weight</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="text-primary-custom" style={{ fontWeight: 500 }}>{trip.trip_number || `TRIP-${trip.id}`}</td>
                        <td>{trip.source_location || 'N/A'}</td>
                        <td>{trip.destination_location || 'N/A'}</td>
                        <td>{trip.cargo_weight} kg</td>
                        <td>
                          <span className={`badge-custom badge-${getStatusBadge(trip.status)}`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
