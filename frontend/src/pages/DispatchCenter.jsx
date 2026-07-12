import React from 'react';
import { FiNavigation, FiClock, FiAlertTriangle } from 'react-icons/fi';
import './DispatchCenter.css';

const DispatchCenter = () => {
  return (
    <div className="dispatch-center">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Dispatch Center</h1>
        <div className="header-actions">
          <button className="btn-secondary-custom">Route Optimization</button>
          <button className="btn-primary-custom">Assign Dispatch</button>
        </div>
      </div>

      <div className="dispatch-layout">
        <div className="glass-card map-container">
          {/* Map Placeholder */}
          <div className="map-placeholder">
            <div className="map-overlay">
              <span className="live-indicator"><span className="pulse"></span> Live Fleet Tracking</span>
            </div>
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Map" className="map-image" style={{ filter: 'grayscale(100%) invert(90%) contrast(1.2)' }} />
            
            {/* Mock Map Markers */}
            <div className="map-marker" style={{ top: '40%', left: '30%' }}>
              <div className="marker-dot primary"></div>
              <div className="marker-label">TRP-1042</div>
            </div>
            <div className="map-marker" style={{ top: '60%', left: '50%' }}>
              <div className="marker-dot warning"></div>
              <div className="marker-label">TRP-1045</div>
            </div>
            <div className="map-marker" style={{ top: '35%', left: '65%' }}>
              <div className="marker-dot primary"></div>
              <div className="marker-label">TRP-1044</div>
            </div>
          </div>
        </div>

        <div className="dispatch-sidebar">
          <div className="glass-card sidebar-section">
            <h3 className="section-title">Active Dispatches</h3>
            <div className="dispatch-list">
              <div className="dispatch-item">
                <div className="dispatch-header">
                  <span className="dispatch-id">TRP-1042</span>
                  <span className="badge-custom badge-primary">In Transit</span>
                </div>
                <div className="dispatch-route">
                  <div className="route-point">Chicago, IL</div>
                  <div className="route-line"></div>
                  <div className="route-point">Dallas, TX</div>
                </div>
                <div className="dispatch-meta">
                  <span><FiNavigation /> VNL 860</span>
                  <span>ETA: 14:30</span>
                </div>
              </div>

              <div className="dispatch-item warning">
                <div className="dispatch-header">
                  <span className="dispatch-id">TRP-1045</span>
                  <span className="badge-custom badge-warning">Delayed</span>
                </div>
                <div className="dispatch-route">
                  <div className="route-point">Los Angeles, CA</div>
                  <div className="route-line"></div>
                  <div className="route-point">Phoenix, AZ</div>
                </div>
                <div className="dispatch-meta">
                  <span className="text-warning-custom"><FiAlertTriangle /> Heavy Traffic</span>
                  <span className="text-warning-custom">+45 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card sidebar-section" style={{ flex: 1 }}>
            <h3 className="section-title">Pending Assignments</h3>
            <div className="empty-state">
              <FiClock className="empty-icon" />
              <p>No pending dispatches right now.</p>
              <button className="btn-secondary-custom mt-2">Create New</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchCenter;
