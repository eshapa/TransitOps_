import React from 'react';
import { FiBarChart2 } from 'react-icons/fi';

const Reports = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <div className="header-actions">
          <button className="btn-secondary-custom">Export CSV</button>
          <button className="btn-primary-custom"><FiBarChart2 /> Generate Report</button>
        </div>
      </div>
      <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FiBarChart2 style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
          <h2>Executive Business Intelligence</h2>
          <p>Advanced dashboards visualizing fleet utilization, ROI, and performance trends.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
