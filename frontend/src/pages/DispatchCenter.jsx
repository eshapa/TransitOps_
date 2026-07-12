import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { FiNavigation, FiClock, FiPlus } from 'react-icons/fi';
import './DispatchCenter.css';

const DispatchCenter = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await API.get('/trips');
        setTrips(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load dispatches.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const activeDispatches = trips.filter(t => t.status === 'Dispatched');
  const pendingAssignments = trips.filter(t => t.status === 'Draft');

  return (
    <div className="dispatch-center">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 className="page-title">Dispatch Center</h1>
        <div className="header-actions">
          <button className="btn-primary-custom" onClick={() => navigate('/trips')}>
            <FiPlus /> Assign Dispatch
          </button>
        </div>
      </div>

      {error && <div className="text-danger mb-3">{error}</div>}

      <div className="dispatch-layout">
        <div className="glass-card map-container">
          <div className="map-placeholder">
            <div className="map-overlay">
              <span className="live-indicator"><span className="pulse"></span> Live Fleet Tracking</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
              alt="Map" 
              className="map-image" 
              style={{ filter: 'grayscale(100%) invert(90%) contrast(1.2)' }} 
            />
            
            {/* Dynamic Map Markers for Active Dispatches */}
            {activeDispatches.map((t, idx) => {
              const positions = [
                { top: '40%', left: '30%' },
                { top: '60%', left: '50%' },
                { top: '35%', left: '65%' },
                { top: '50%', left: '40%' }
              ];
              const pos = positions[idx % positions.length];
              return (
                <div className="map-marker" style={pos} key={t.id}>
                  <div className="marker-dot primary"></div>
                  <div className="marker-label">{t.trip_number || `TRP-${t.id}`}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dispatch-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card sidebar-section" style={{ maxHeight: '50%', overflowY: 'auto' }}>
            <h3 className="section-title">Active Dispatches ({activeDispatches.length})</h3>
            
            {loading ? (
              <div className="p-3 text-center">Loading...</div>
            ) : activeDispatches.length === 0 ? (
              <div className="p-3 text-center text-muted-custom">No active dispatches.</div>
            ) : (
              <div className="dispatch-list">
                {activeDispatches.map(t => (
                  <div className="dispatch-item" key={t.id}>
                    <div className="dispatch-header">
                      <span className="dispatch-id">{t.trip_number || `TRP-${t.id}`}</span>
                      <span className="badge-custom badge-primary">In Transit</span>
                    </div>
                    <div className="dispatch-route">
                      <div className="route-point">{t.source_location || 'Start'}</div>
                      <div className="route-line"></div>
                      <div className="route-point">{t.destination_location || 'End'}</div>
                    </div>
                    <div className="dispatch-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      <span><FiNavigation /> Vehicle ID: {t.vehicle_id}</span>
                      <span>Odo: {t.start_odometer} km</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
            <h3 className="section-title">Pending Assignments ({pendingAssignments.length})</h3>
            
            {loading ? (
              <div className="p-3 text-center">Loading...</div>
            ) : pendingAssignments.length === 0 ? (
              <div className="empty-state">
                <FiClock className="empty-icon" />
                <p>No pending dispatches right now.</p>
                <button className="btn-secondary-custom mt-2" onClick={() => navigate('/trips')}>Create New</button>
              </div>
            ) : (
              <div className="dispatch-list">
                {pendingAssignments.map(t => (
                  <div className="dispatch-item warning" key={t.id} style={{ borderLeft: '3px solid #f1c40f' }}>
                    <div className="dispatch-header">
                      <span className="dispatch-id">{t.trip_number || `TRP-${t.id}`}</span>
                      <span className="badge-custom badge-warning" style={{ background: 'rgba(241,196,15,0.2)', color: '#f1c40f' }}>Draft / Pending</span>
                    </div>
                    <div className="dispatch-route">
                      <div className="route-point">{t.source_location || 'Start'}</div>
                      <div className="route-line"></div>
                      <div className="route-point">{t.destination_location || 'End'}</div>
                    </div>
                    <div className="dispatch-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      <span>Vehicle: {t.vehicle_id}</span>
                      <span className="text-warning-custom">Awaiting Dispatch</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchCenter;
