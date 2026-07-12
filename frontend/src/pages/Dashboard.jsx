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
  const [kpis, setKpis] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const kpisRes = await API.get('/reports/dashboard-kpis');
        setKpis(kpisRes.data.data);

        const tripsRes = await API.get('/trips');
        setTrips(tripsRes.data.data);

        const vehiclesRes = await API.get('/vehicles');
        setVehicles(vehiclesRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute status distributions for the Pie Chart
  const statusCounts = vehicles.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const statusDistribution = [
    { name: 'Available', value: statusCounts['Available'] || 0, color: '#2ecc71' },
    { name: 'On Trip', value: statusCounts['On Trip'] || 0, color: '#0066ff' },
    { name: 'In Shop', value: statusCounts['In Shop'] || 0, color: '#f1c40f' },
    { name: 'Retired', value: statusCounts['Retired'] || 0, color: '#e74c3c' }
  ].filter(item => item.value > 0); // Only show non-zero statuses

  // Mock Utilization Trend data (using real current utilization as the last data point)
  const realUtil = kpis ? parseFloat(kpis.fleetUtilizationPercent) : 0;
  const utilizationData = [
    { name: 'May', utilization: 65 },
    { name: 'Jun', utilization: 72 },
    { name: 'Jul', utilization: realUtil }
  ];

  const recentTrips = trips.slice(0, 5); // Take the top 5 latest trips

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
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard Analytics</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary-custom" onClick={() => navigate('/reports')}>View Reports</button>
          <button className="btn-primary-custom" onClick={() => navigate('/trips')}>New Dispatch</button>
        </div>
      </div>

      {error && <div className="text-danger mb-3 p-3 glass-card">{error}</div>}

      {loading ? (
        <div className="text-center p-4">Loading operational KPIs...</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Fleet Size</span>
                <button className="icon-btn" onClick={() => navigate('/vehicles')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{kpis?.totalVehicles || 0}</div>
              <div className="kpi-change text-success-custom">
                <FiTrendingUp />
                <span>Active Assets</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Active Dispatches</span>
                <button className="icon-btn" onClick={() => navigate('/dispatch')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{kpis?.activeVehicles || 0}</div>
              <div className="kpi-change text-primary-custom">
                <span>In-transit deliveries</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Available Drivers</span>
                <button className="icon-btn" onClick={() => navigate('/drivers')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{kpis?.driversOnDuty || 0}</div>
              <div className="kpi-change text-success-custom">
                <span>Ready for dispatch</span>
              </div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Fleet Utilization</span>
                <button className="icon-btn" onClick={() => navigate('/reports')}><FiMoreVertical /></button>
              </div>
              <div className="kpi-value">{kpis?.fleetUtilizationPercent || 0}%</div>
              <div className="kpi-change text-success-custom">
                <FiTrendingUp />
                <span>Optimized capacity</span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="glass-card chart-card">
              <h3 className="chart-title">Fleet Utilization Trend</h3>
              <div className="chart-container">
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
              <div className="chart-container">
                {statusDistribution.length === 0 ? (
                  <div className="text-center p-4 text-muted-custom">No vehicle records found.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
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

          <div className="glass-card recent-trips-card">
            <div className="card-header">
              <h3 className="card-title">Live Operational Activity</h3>
              <button className="btn-secondary-custom" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/trips')}>View All</button>
            </div>
            <div className="table-responsive">
              {recentTrips.length === 0 ? (
                <div className="p-3 text-center text-muted-custom">No recent trips to display.</div>
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
