import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiX, FiCheck, FiPlay, FiTrash } from 'react-icons/fi';
import './TripManagement.css'; // Let's make sure it is styled cleanly or uses shared classes.

const TripManagement = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown/drawer states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [completeTripItem, setCompleteTripItem] = useState(null); // Trip to complete
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Form states
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    source_location: '',
    destination_location: '',
    cargo_weight: '',
    planned_distance: '',
    status: 'Draft',
    remarks: ''
  });

  // Complete Trip Form states
  const [completeData, setCompleteData] = useState({
    end_odometer: '',
    actual_distance: '',
    remarks: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tripsRes = await API.get('/trips');
      setTrips(tripsRes.data.data);

      // Also prefetch available vehicles and drivers for the Add Trip drawer
      const vehRes = await API.get('/vehicles');
      // Filter out retired vehicles
      setVehicles(vehRes.data.data.filter(v => v.status !== 'Retired'));

      const drvRes = await API.get('/drivers');
      // Filter out suspended drivers
      setDrivers(drvRes.data.data.filter(d => d.driver_status !== 'Suspended'));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load trip data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.vehicle_id || !formData.driver_id || !formData.cargo_weight) {
        setFormError('Required: Vehicle, Driver, and Cargo Weight.');
        return;
      }

      const payload = {
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        cargo_weight: parseFloat(formData.cargo_weight),
        planned_distance: formData.planned_distance ? parseFloat(formData.planned_distance) : null
      };

      await API.post('/trips', payload);
      setIsAddDrawerOpen(false);
      setFormData({
        vehicle_id: '',
        driver_id: '',
        source_location: '',
        destination_location: '',
        cargo_weight: '',
        planned_distance: '',
        status: 'Draft',
        remarks: ''
      });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to plan trip.');
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      await API.put(`/trips/${tripId}/dispatch`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to dispatch trip.');
    }
  };

  const handleCancel = async (tripId) => {
    const remarks = prompt('Enter reason for cancellation:');
    if (remarks === null) return; // cancelled prompt
    try {
      await API.put(`/trips/${tripId}/cancel`, { remarks });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel trip.');
    }
  };

  const openCompleteModal = (trip) => {
    setCompleteTripItem(trip);
    setCompleteData({
      end_odometer: trip.start_odometer ? (parseFloat(trip.start_odometer) + (parseFloat(trip.planned_distance) || 0)).toString() : '',
      actual_distance: trip.planned_distance || '',
      remarks: ''
    });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/trips/${completeTripItem.id}/complete`, {
        end_odometer: parseFloat(completeData.end_odometer),
        actual_distance: parseFloat(completeData.actual_distance),
        remarks: completeData.remarks
      });
      setIsCompleteModalOpen(false);
      setCompleteTripItem(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to complete trip.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Draft': return 'secondary';
      case 'Dispatched': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'danger';
      default: return 'primary';
    }
  };

  const canModify = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  return (
    <div className="trip-management" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Trip Management</h1>
        <div className="header-actions">
          {canModify && (
            <button className="btn-primary-custom" onClick={() => setIsAddDrawerOpen(true)}>
              <FiPlus /> Plan New Trip
            </button>
          )}
        </div>
      </div>

      <div className="glass-card registry-container" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && <div className="text-danger mb-3">{error}</div>}

        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="p-4 text-center">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="p-4 text-center text-muted-custom">No trips logged yet.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle ID</th>
                  <th>Driver ID</th>
                  <th>Route</th>
                  <th>Cargo Weight</th>
                  <th>Planned Dist.</th>
                  <th>Actual Dist.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id}>
                    <td className="text-primary-custom font-weight-bold">{trip.trip_number || `TRIP-${trip.id}`}</td>
                    <td>{trip.vehicle_id}</td>
                    <td>{trip.driver_id}</td>
                    <td>{trip.source_location || 'N/A'} &rarr; {trip.destination_location || 'N/A'}</td>
                    <td>{trip.cargo_weight} kg</td>
                    <td>{trip.planned_distance ? `${trip.planned_distance} km` : 'N/A'}</td>
                    <td>{trip.actual_distance ? `${trip.actual_distance} km` : 'N/A'}</td>
                    <td>
                      <span className={`badge-custom badge-${getStatusBadge(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {canModify && trip.status === 'Draft' && (
                          <button className="icon-btn success" title="Dispatch Trip" onClick={() => handleDispatch(trip.id)}>
                            <FiPlay style={{ color: '#2ecc71' }} />
                          </button>
                        )}
                        {canModify && trip.status === 'Dispatched' && (
                          <button className="icon-btn success" title="Complete Trip" onClick={() => openCompleteModal(trip)}>
                            <FiCheck style={{ color: '#2ecc71' }} />
                          </button>
                        )}
                        {canModify && (trip.status === 'Draft' || trip.status === 'Dispatched') && (
                          <button className="icon-btn danger" title="Cancel Trip" onClick={() => handleCancel(trip.id)}>
                            <FiTrash style={{ color: '#e74c3c' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out Drawer for planning trips */}
      <div className={`drawer-overlay ${isAddDrawerOpen ? 'open' : ''}`} onClick={() => setIsAddDrawerOpen(false)}>
        <div className={`drawer-panel ${isAddDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isAddDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>Plan New Trip</h2>
            <button className="icon-btn" onClick={() => setIsAddDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ASSIGN VEHICLE *</label>
                <select name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required className="auth-input">
                  <option value="">Select Available Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.manufacturer} {v.vehicle_name} ({v.status}) (Cap: {v.maximum_load_capacity}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ASSIGN DRIVER *</label>
                <select name="driver_id" value={formData.driver_id} onChange={handleInputChange} required className="auth-input">
                  <option value="">Select Available Driver</option>
                  {drivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.full_name} - {d.license_number} ({d.driver_status}) (Score: {d.safety_score})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SOURCE LOCATION</label>
                <input type="text" name="source_location" value={formData.source_location} onChange={handleInputChange} className="auth-input" placeholder="e.g. Gandhinagar Depot"/>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DESTINATION LOCATION</label>
                <input type="text" name="destination_location" value={formData.destination_location} onChange={handleInputChange} className="auth-input" placeholder="e.g. Ahmedabad Hub"/>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CARGO WEIGHT (KG) *</label>
                <input type="number" name="cargo_weight" value={formData.cargo_weight} onChange={handleInputChange} required className="auth-input" placeholder="e.g. 500"/>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PLANNED DISTANCE (KM)</label>
                <input type="number" name="planned_distance" value={formData.planned_distance} onChange={handleInputChange} className="auth-input" placeholder="e.g. 75"/>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INITIAL STATUS</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="auth-input">
                  <option value="Draft">Draft</option>
                  <option value="Dispatched">Dispatched</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>REMARKS</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="auth-input" rows="3" placeholder="Special delivery instructions..."></textarea>
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsAddDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Save Trip</button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal for completing a trip */}
      {isCompleteModalOpen && completeTripItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', background: '#121212', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Complete Trip: {completeTripItem.trip_number || `TRIP-${completeTripItem.id}`}</h3>
              <button className="icon-btn" onClick={() => setIsCompleteModalOpen(false)}><FiX /></button>
            </div>
            
            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>START ODOMETER: {completeTripItem.start_odometer} km</label>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>END ODOMETER (KM) *</label>
                <input 
                  type="number" 
                  value={completeData.end_odometer} 
                  onChange={(e) => setCompleteData(prev => ({ ...prev, end_odometer: e.target.value }))}
                  required 
                  className="auth-input"
                  placeholder={`Must be >= ${completeTripItem.start_odometer}`}
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ACTUAL DISTANCE COVERED (KM) *</label>
                <input 
                  type="number" 
                  value={completeData.actual_distance} 
                  onChange={(e) => setCompleteData(prev => ({ ...prev, actual_distance: e.target.value }))}
                  required 
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>REMARKS / DELIVERY NOTES</label>
                <textarea 
                  value={completeData.remarks} 
                  onChange={(e) => setCompleteData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="auth-input" 
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary-custom" onClick={() => setIsCompleteModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Complete Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
