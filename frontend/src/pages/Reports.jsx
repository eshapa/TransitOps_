import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiBarChart2, FiDownload, FiTruck, FiActivity, FiDollarSign } from 'react-icons/fi';
import './TripManagement.css'; // Reuses styles

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
    // Direct browser redirect or opening of endpoint triggers download
    const token = localStorage.getItem('transitops_token');
    if (!token) return;
    
    // We can fetch programmatically to download or use window.open
    // Using fetch and creating a blob is much cleaner because it includes the Authorization header!
    fetch('http://localhost:5000/api/reports/analytics/export-csv', {
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

  const overallAvgROI = analytics.length > 0 
    ? (analytics.reduce((sum, item) => sum + parseFloat(item.roi), 0) / analytics.length).toFixed(1)
    : '0.0';

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
        </div>
      </div>
    </div>
  );
};

export default Reports;
