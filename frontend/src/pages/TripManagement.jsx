import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiX, FiCheck, FiPlay, FiTrash } from 'react-icons/fi';
import './TripManagement.css';

const TripManagement = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown/drawer states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  
  // Complete Trip modal state
  const [completeTripItem, setCompleteTripItem] = useState(null); 
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeData, setCompleteData] = useState({
    end_odometer: '',
    actual_distance: '',
    remarks: ''
  });

  // Dispatch override modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTripItem, setDispatchTripItem] = useState(null);
  const [dispatchVehId, setDispatchVehId] = useState('');
  const [dispatchDrvId, setDispatchDrvId] = useState('');
  const [dispatchError, setDispatchError] = useState('');

  // Form states for planning a trip
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tripsRes = await API.get('/trips');
      setTrips(tripsRes.data.data);

      const vehRes = await API.get('/vehicles');
      setVehicles(vehRes.data.data.filter(v => v.status !== 'Retired'));

      const drvRes = await API.get('/drivers');
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
      
      // Reset form and close drawer
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
      setIsAddDrawerOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to plan trip.');
    }
  };

  const openDispatchModal = (trip) => {
    setDispatchTripItem(trip);
    setDispatchVehId(trip.vehicle_id.toString());
    setDispatchDrvId(trip.driver_id.toString());
    setDispatchError('');
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchError('');

    try {
      await API.put(`/trips/${dispatchTripItem.id}/dispatch`, {
        vehicle_id: parseInt(dispatchVehId),
        driver_id: parseInt(dispatchDrvId)
      });
      setIsDispatchModalOpen(false);
      setDispatchTripItem(null);
      fetchData();
    } catch (err) {
      setDispatchError(err.response?.data?.error?.message || 'Failed to dispatch trip.');
    }
  };

  const handleCancel = async (tripId) => {
    const remarks = prompt('Enter reason for cancellation:');
    if (remarks === null) return;
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

  // Roles verification
  const isFleetManager = user?.role === 'Fleet Manager';
  const isDriver = user?.role === 'Driver';
  const canModify = isFleetManager || isDriver;

  // Dynamically filter add form options based on status selection (Draft vs Dispatched)
  const addFormVehicles = formData.status === 'Dispatched'
    ? vehicles.filter(v => v.status === 'Available')
    : vehicles;

  const addFormDrivers = formData.status === 'Dispatched'
    ? drivers.filter(d => d.driver_status === 'Available')
    : drivers;

  return (
    <div className="trip-management" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', backgroundColor: '#121212', color: '#f8fafc' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Trip Management</h1>
        {canModify && (
          <button className="btn-primary-custom" onClick={() => setIsAddDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiPlus /> Plan New Trip
          </button>
        )}
      </div>

      {error && <div className="text-danger mb-3 p-3 glass-card">{error}</div>}

      <div className="glass-card table-container" style={{ flex: 1, padding: '1.5rem', background: 'rgba(20, 20, 20, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="text-center p-4">Loading trips list...</div>
          ) : trips.length === 0 ? (
            <div className="text-center p-4 text-muted-custom">No trips scheduled.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Cargo Weight</th>
                  <th>Planned Dist.</th>
                  <th>Actual Dist.</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => {
                  const veh = vehicles.find(v => v.id === trip.vehicle_id);
                  const drv = drivers.find(d => d.driver_id === trip.driver_id);
                  return (
                    <tr key={trip.id}>
                      <td className="text-primary-custom font-weight-bold">{trip.trip_number || `TRIP-${trip.id}`}</td>
                      <td>{veh ? veh.registration_number : `ID: ${trip.vehicle_id}`}</td>
                      <td>{drv ? drv.full_name : `ID: ${trip.driver_id}`}</td>
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
                            <button className="icon-btn success" title="Dispatch Trip" onClick={() => openDispatchModal(trip)}>
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
                  );
                })}
              </tbody>
            </table>
          )}>
      </div>

      {/* Add Trip Drawer */}
      <div className={`drawer-overlay ${isAddDrawerOpen ? 'open' : ''}`} onClick={() => setIsAddDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, opacity: isAddDrawerOpen ? 1 : 0, pointerEvents: isAddDrawerOpen ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        <div className="drawer-panel" style={{ position: 'fixed', top: 0, right: isAddDrawerOpen ? '0' : '-500px', width: '500px', height: '100vh', background: '#151515', borderLeft: '1px solid var(--glass-border)', boxShadow: '-5px 0 25px rgba(0,0,0,0.6)', zIndex: 1001, transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div className="drawer-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Plan New Trip</h2>
            <button className="icon-btn" onClick={() => setIsAddDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 65px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3" style={{ fontSize: '0.85rem' }}>{formError}</div>}

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INITIAL STATUS</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="auth-input">
                  <option value="Draft">Draft (Assign busy/idle assets)</option>
                  <option value="Dispatched">Dispatched (Only available assets)</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VEHICLE *</label>
                <select name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required className="auth-input">
                  <option value="">Select Vehicle</option>
                  {addFormVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.vehicle_name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DRIVER *</label>
                <select name="driver_id" value={formData.driver_id} onChange={handleInputChange} required className="auth-input">
                  <option value="">Select Driver</option>
                  {addFormDrivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.full_name} ({d.driver_status})
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

      {/* Complete Modal */}
      {isCompleteModalOpen && completeTripItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', background: '#121212', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Complete Trip: {completeTripItem.trip_number || `TRIP-${completeTripItem.id}`}</h3>
              <button className="icon-btn" onClick={() => setIsCompleteModalOpen(false)}><FiX /></button>
            </div>
            
            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group mb-3">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>START ODOMETER: {completeTripItem.start_odometer} km</label>
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

      {/* Interactive Dispatch & Asset Override Modal */}
      {isDispatchModalOpen && dispatchTripItem && (() => {
        const currentVeh = vehicles.find(v => v.id === dispatchTripItem.vehicle_id);
        const currentDrv = drivers.find(d => d.driver_id === dispatchTripItem.driver_id);
        
        const isVehAvailable = currentVeh?.status === 'Available';
        const isDrvAvailable = currentDrv?.driver_status === 'Available';

        // Filter lists to show available options (while still keeping the currently assigned option in the list)
        const dispatchVehicles = vehicles.filter(v => v.status === 'Available' || v.id === dispatchTripItem.vehicle_id);
        const dispatchDrivers = drivers.filter(d => d.driver_status === 'Available' || d.driver_id === dispatchTripItem.driver_id);

        const targetVehObj = vehicles.find(v => v.id === parseInt(dispatchVehId));
        const activeCapacity = targetVehObj ? parseFloat(targetVehObj.maximum_load_capacity) : 0;
        const cargoWeight = parseFloat(dispatchTripItem.cargo_weight) || 0;
        const isWeightValid = activeCapacity ? cargoWeight <= activeCapacity : true;

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div className="glass-panel" style={{ width: '460px', padding: '2rem', background: '#121212', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>Dispatch Trip: {dispatchTripItem.trip_number || `TRIP-${dispatchTripItem.id}`}</h3>
                <button className="icon-btn" onClick={() => setIsDispatchModalOpen(false)}><FiX /></button>
              </div>

              <form onSubmit={handleDispatchSubmit}>
                {dispatchError && <div className="text-danger mb-3" style={{ fontSize: '0.85rem' }}>{dispatchError}</div>}

                {/* Clear occupied alerts for assets */}
                {!isVehAvailable && (
                  <div className="text-warning mb-2" style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(230, 126, 34, 0.1)', borderRadius: '4px', border: '1px solid rgba(230, 126, 34, 0.2)' }}>
                    ⚠️ Current vehicle ({currentVeh?.registration_number}) is occupied ({currentVeh?.status}). Please assign another vehicle.
                  </div>
                )}
                {!isDrvAvailable && (
                  <div className="text-warning mb-3" style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(230, 126, 34, 0.1)', borderRadius: '4px', border: '1px solid rgba(230, 126, 34, 0.2)' }}>
                    ⚠️ Current driver ({currentDrv?.full_name}) is occupied ({currentDrv?.driver_status}). Please assign another driver.
                  </div>
                )}

                <div className="form-group mb-3">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ASSIGN VEHICLE (AVAILABLE ONLY)</label>
                  <select 
                    value={dispatchVehId} 
                    onChange={(e) => setDispatchVehId(e.target.value)} 
                    required 
                    className="auth-input"
                  >
                    {dispatchVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.vehicle_name} ({v.status}) (Cap: {Math.round(parseFloat(v.maximum_load_capacity))}kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ASSIGN DRIVER (AVAILABLE ONLY)</label>
                  <select 
                    value={dispatchDrvId} 
                    onChange={(e) => setDispatchDrvId(e.target.value)} 
                    required 
                    className="auth-input"
                  >
                    {dispatchDrivers.map(d => (
                      <option key={d.driver_id} value={d.driver_id}>
                        {d.full_name} ({d.driver_status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CARGO WEIGHT: {cargoWeight} kg</label>
                </div>

                {/* Cargo Capacity limit card inside modal */}
                {dispatchVehId && (
                  <div className={`validation-box ${isWeightValid ? 'valid' : 'invalid'}`} style={{ padding: '0.8rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', background: isWeightValid ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', border: isWeightValid ? '1px solid rgba(46, 204, 113, 0.2)' : '1px solid rgba(231, 76, 60, 0.2)' }}>
                    <div style={{ color: isWeightValid ? '#2ecc71' : '#ff7675' }}>Vehicle Capacity: {Math.round(activeCapacity).toLocaleString()} kg</div>
                    {!isWeightValid ? (
                      <div className="text-danger" style={{ color: '#ff7675' }}>❌ Capacity exceeded by {Math.round(cargoWeight - activeCapacity).toLocaleString()} kg - dispatch blocked!</div>
                    ) : (
                      <div className="text-success" style={{ color: '#2ecc71' }}>✔ Weight load verified within capacity limits</div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary-custom" onClick={() => setIsDispatchModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={!isWeightValid || !dispatchVehId || !dispatchDrvId} className="btn-primary-custom" style={{ flex: 1 }}>Confirm Dispatch</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TripManagement;
