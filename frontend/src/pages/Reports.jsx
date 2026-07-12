<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiBarChart2, FiDownload, FiTruck, FiActivity, FiDollarSign } from 'react-icons/fi';
import './TripManagement.css'; // Reuses styles
=======
import React from 'react';
import { FiDownload, FiFileText, FiTrendingUp, FiTrendingDown, FiCheckCircle } from 'react-icons/fi';
import { BiLeaf } from 'react-icons/bi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './Reports.css';

const revenueData = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 2000, expenses: 9800 },
  { name: 'Apr', revenue: 2780, expenses: 3908 },
  { name: 'May', revenue: 1890, expenses: 4800 },
  { name: 'Jun', revenue: 2390, expenses: 3800 },
  { name: 'Jul', revenue: 3490, expenses: 4300 },
];

const leaderboard = [
  { id: 'FLT-9821-X', type: 'Freightliner Cascadia', util: 98, rev: '$12,400', status: 'Optimal', trend: 'up' },
  { id: 'FLT-7740-Y', type: 'Peterbilt 579', util: 92, rev: '$10,150', status: 'Optimal', trend: 'up' },
  { id: 'FLT-4412-Z', type: 'Volvo VNL 860', util: 64, rev: '$6,800', status: 'Pending', trend: 'down' },
];
>>>>>>> 12846b3 (made maintance page and report)

const Reports = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch dashboard KPIs for summary cards
      const kpisRes = await API.get('/reports/dashboard-kpis');
      setKpis(kpisRes.data.data);

      // 2. Fetch Aggregated Vehicle Analytics
      const analyticsRes = await API.get('/reports/analytics');
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load business reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    const token = localStorage.getItem('transitops_token');
    if (!token) return;
    
    fetch(`${API.defaults.baseURL}/reports/analytics/export-csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet_analytics_report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => alert('Failed to export CSV report: ' + err.message));
  };

  // Calculations for average KPIs based on fetched analytics
  const overallFuelEfficiency = analytics.length > 0 
    ? (analytics.reduce((sum, item) => sum + parseFloat(item.fuel_efficiency), 0) / analytics.length).toFixed(1)
    : '0.0';

  let overallAvgROI = analytics.length > 0 
    ? (analytics.reduce((sum, item) => sum + parseFloat(item.roi), 0) / analytics.length).toFixed(1)
    : '0.0';
  if (overallAvgROI === '-0.0') {
    overallAvgROI = '0.0';
  }

  const overallOperationalCost = analytics.reduce((sum, item) => sum + parseFloat(item.operational_cost), 0);

  // Sorting costliest vehicles
  const costliestVehicles = [...analytics]
    .sort((a, b) => b.operational_cost - a.operational_cost)
    .slice(0, 3);

  const maxOperationalCost = costliestVehicles.length > 0 
    ? Math.max(...costliestVehicles.map(v => v.operational_cost))
    : 1;

  const isAuthorized = user?.role === 'Fleet Manager' || user?.role === 'Financial Analyst';

  if (!isAuthorized) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <FiBarChart2 style={{ fontSize: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
        <h2 style={{ marginTop: '1rem' }}>Access Denied</h2>
        <p>Your current user role ({user?.role}) does not have permission to view Reports & Business Intelligence.</p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="reports-analytics" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title">Reports & Analytics</h1>
        <div className="header-actions">
          <button className="btn-secondary-custom" onClick={handleExportCSV}>
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="text-danger p-3 glass-card">{error}</div>}

      {/* Analytics summary KPIs */}
      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiActivity /> AVG FUEL EFFICIENCY
          </label>
          <h2 style={{ margin: '0.5rem 0 0 0', color: '#2ecc71' }}>{overallFuelEfficiency} km/L</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiTruck /> FLEET UTILIZATION
          </label>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>{kpis ? `${kpis.fleetUtilizationPercent}%` : 'N/A'}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiDollarSign /> OPERATIONAL COST
          </label>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>${overallOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FiBarChart2 /> VEHICLE AVG ROI
          </label>
          <h2 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-accent)' }}>{overallAvgROI}%</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Costliest vehicles bar list */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>Top Costliest Vehicles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {loading ? (
              <div className="text-center p-3">Loading...</div>
            ) : costliestVehicles.length === 0 ? (
              <div className="text-center p-3 text-muted-custom">No data logged.</div>
            ) : (
              costliestVehicles.map(v => {
                const percentage = Math.max(10, (v.operational_cost / maxOperationalCost) * 100);
                return (
                  <div key={v.vehicle_id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{v.manufacturer} {v.vehicle_name} ({v.registration_number})</span>
                      <span>${v.operational_cost.toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--primary-accent)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic ROI details info card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.8rem' }}>
          <h3>Formula Guidelines</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p><strong>Fuel Efficiency:</strong> Total completed distance divided by total liters filled.</p>
            <p><strong>Operational Cost:</strong> Unified sum of fuel logs, maintenance, and repairs.</p>
            <p><strong>Revenue:</strong> Completed trips distance multiplied by dynamic rate factors.</p>
            <p><strong>Vehicle ROI (%):</strong> Calculated as follows:</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '6px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--primary-accent)', margin: '0.4rem 0' }}>
              ROI = (Revenue - Operational Cost) / Acquisition Cost
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate table data */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem' }}>Fleet-Wide Asset Analytics</h3>
        <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center p-3">Loading analytics...</div>
          ) : analytics.length === 0 ? (
            <div className="text-center p-3 text-muted-custom">No vehicles found.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Plate / Reg</th>
                  <th>Make & Model</th>
                  <th>Acq. Cost</th>
                  <th>Distance</th>
                  <th>Fuel (L)</th>
                  <th>Fuel Efficiency</th>
                  <th>Oper. Cost</th>
                  <th>Est. Revenue</th>
                  <th>ROI (%)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map(item => (
                  <tr key={item.vehicle_id}>
                    <td className="text-primary-custom font-weight-bold">{item.registration_number}</td>
                    <td>{item.vehicle_name}</td>
                    <td>${item.acquisition_cost.toLocaleString()}</td>
                    <td>{item.total_distance_covered} km</td>
                    <td>{item.total_fuel_liters} L</td>
                    <td>{item.fuel_efficiency} km/L</td>
                    <td>${item.operational_cost.toLocaleString()}</td>
                    <td>${item.revenue.toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold', color: item.roi >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      {item.roi}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
=======
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-title-col">
          <h1>Executive Analytics</h1>
          <p>Performance monitoring for Q3 FY2024 • Updated 4m ago</p>
        </div>
        <div className="reports-actions">
          <button className="btn-outline-custom"><FiDownload /> CSV Export</button>
          <button className="btn-outline-custom"><FiFileText /> PDF Report</button>
          <button className="btn-outline-custom">Last 30 Days</button>
        </div>
      </div>

      <div className="kpi-cards-row">
        {/* Card 1 */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL FLEET ROI</span>
            <span className="kpi-trend trend-up"><FiTrendingUp /> 12.4%</span>
          </div>
          <h2 className="kpi-value">$2.48M</h2>
          <div className="kpi-progress-container">
            <div className="kpi-progress-bg">
              <div className="kpi-progress-fill" style={{ width: '78%' }}></div>
            </div>
            <p className="kpi-desc">78% of target revenue achieved</p>
          </div>
>>>>>>> 12846b3 (made maintance page and report)
        </div>

        {/* Card 2 */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">FLEET UTILIZATION</span>
            <span className="kpi-trend trend-up"><FiTrendingUp /> 5.2%</span>
          </div>
          <h2 className="kpi-value">94.2%</h2>
          <div className="kpi-progress-container">
            <div className="segmented-progress">
              <div className="segment filled"></div>
              <div className="segment filled"></div>
              <div className="segment filled"></div>
              <div className="segment filled"></div>
              <div className="segment empty"></div>
            </div>
            <p className="kpi-desc">412 active / 445 total units</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">AVG MAINTENANCE COST</span>
            <span className="kpi-trend trend-down"><FiTrendingDown /> 2.1%</span>
          </div>
          <h2 className="kpi-value">$1,142</h2>
          <div className="kpi-details">
            <p className="kpi-subval">Efficiency Score: <strong>8.4/10</strong></p>
            <p className="kpi-desc">Per vehicle per month</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL CARBON OFFSET</span>
            <BiLeaf className="icon-green" />
          </div>
          <h2 className="kpi-value">14.2t</h2>
          <div className="kpi-details">
            <p className="kpi-subval text-green"><FiCheckCircle /> Tier 1 Compliance</p>
            <p className="kpi-desc">Emission savings vs 2023</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-main glass-panel">
          <div className="chart-header">
            <div>
              <h3>Revenue vs Expenses</h3>
              <p>Comparative operating margin overview</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot color-revenue"></span> Revenue</span>
              <span className="legend-item"><span className="legend-dot color-expenses"></span> Expenses</span>
            </div>
          </div>
          <div className="chart-area" style={{ height: '300px' }}>
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a0aabf'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#15181e', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#a5b4fc" fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#34d399" fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-side glass-panel">
          <div className="chart-header">
            <div>
              <h3>Operational Health</h3>
              <p>Real-time risk distribution</p>
            </div>
          </div>
          <div className="radar-placeholder">
            <div className="radar-bg">
              <div className="radar-circle circle-1"></div>
              <div className="radar-circle circle-2"></div>
              <div className="radar-circle circle-3"></div>
              
              <div className="radar-point point-1"></div>
              <div className="radar-point point-2"></div>
              <div className="radar-point point-3"></div>
            </div>
          </div>
          <div className="radar-footer">
            <div className="status-box">
              <span className="status-label">Maintenance</span>
              <span className="status-val text-green">Optimal</span>
            </div>
            <div className="status-box">
              <span className="status-label">Staffing</span>
              <span className="status-val text-red">Critical</span>
            </div>
          </div>
        </div>
      </div>

      <div className="leaderboard-section glass-panel">
        <div className="leaderboard-header">
          <h3>Asset Performance Leaderboard</h3>
          <a href="#" className="link-action">View All Assets</a>
        </div>
        
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Type</th>
              <th>Utilization</th>
              <th>Revenue Gen.</th>
              <th>Maintenance Status</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, idx) => (
              <tr key={idx}>
                <td className="font-mono text-muted">{item.id}</td>
                <td>{item.type}</td>
                <td>
                  <div className="util-cell">
                    <strong>{item.util}%</strong>
                    <div className="util-bar-bg">
                      <div className="util-bar-fill bg-green" style={{ width: `${item.util}%` }}></div>
                    </div>
                  </div>
                </td>
                <td><strong>{item.rev}</strong></td>
                <td>
                  <div className="status-indicator-cell">
                    <span className={`dot-${item.status === 'Optimal' ? 'green' : 'red'}`}></span>
                    {item.status}
                  </div>
                </td>
                <td>
                  {item.trend === 'up' 
                    ? <FiTrendingUp className="text-green" /> 
                    : <FiTrendingDown className="text-red" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
