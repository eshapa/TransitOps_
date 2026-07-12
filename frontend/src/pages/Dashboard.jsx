import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { kpiData, utilizationData, statusDistribution, recentTrips } from '../mockData/dashboardData';
import { FiTrendingUp, FiTrendingDown, FiMoreVertical } from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard Analytics</h1>
        <div className="header-actions">
          <button className="btn-secondary-custom">Export Report</button>
          <button className="btn-primary-custom">New Dispatch</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <div className="glass-card kpi-card" key={index}>
            <div className="kpi-header">
              <span className="kpi-title">{kpi.title}</span>
              <button className="icon-btn"><FiMoreVertical /></button>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-change text-${kpi.status}-custom`}>
              {kpi.change.startsWith('+') ? <FiTrendingUp /> : kpi.change.startsWith('-') ? <FiTrendingDown /> : null}
              <span>{kpi.change} from last month</span>
            </div>
          </div>
        ))}
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
          <h3 className="chart-title">Vehicle Status</h3>
          <div className="chart-container">
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
          </div>
        </div>
      </div>

      <div className="glass-card recent-trips-card">
        <div className="card-header">
          <h3 className="card-title">Live Operational Activity</h3>
          <button className="btn-secondary-custom" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>View All</button>
        </div>
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="text-primary-custom" style={{ fontWeight: 500 }}>{trip.id}</td>
                  <td>{trip.vehicle}</td>
                  <td>{trip.driver}</td>
                  <td>{trip.origin}</td>
                  <td>{trip.dest}</td>
                  <td>
                    <span className={`badge-custom badge-${trip.status === 'Completed' ? 'success' : trip.status === 'Delayed' ? 'danger' : trip.status === 'In Transit' ? 'primary' : 'warning'}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
