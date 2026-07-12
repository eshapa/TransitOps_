import React from 'react';
import { FiList } from 'react-icons/fi';

const TripManagement = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Trip Management</h1>
        <div className="header-actions">
          <button className="btn-primary-custom"><FiList /> Plan New Trip</button>
        </div>
      </div>
      <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FiList style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
          <h2>Trip Workflow</h2>
          <p>This module provides a complete operational workflow for dispatch planning and execution.</p>
        </div>
      </div>
    </div>
  );
};

export default TripManagement;
