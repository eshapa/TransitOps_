import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import './DispatchCenter.css';

const DispatchCenter = () => {
  
  // Data lists
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [initialStatus, setInitialStatus] = useState('Dispatched'); // Default to Dispatched as mockup show

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tripsRes = await API.get('/trips');
      setTrips(tripsRes.data.data);

      // Only load vehicles that are 'Available' for dispatching
      const vehRes = await API.get('/vehicles');
      setVehicles(vehRes.data.data);

      // Only load drivers that are 'Available' for dispatching
      const drvRes = await API.get('/drivers');
      setDrivers(drvRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch dispatch lists.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Available lists for dropdown selection
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.driver_status === 'Available');

  // Find currently selected vehicle and check capacity limits
  const selectedVehicleObj = vehicles.find(v => v.id === parseInt(vehicleId));
  const vehicleCapacity = selectedVehicleObj ? parseFloat(selectedVehicleObj.maximum_load_capacity) : 0;
  const cargoNum = cargoWeight ? parseFloat(cargoWeight) : 0;
  
  const isWeightValid = vehicleId && cargoWeight ? cargoNum <= vehicleCapacity : true;
  const exceededBy = cargoNum - vehicleCapacity;

  // Form submit handler
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isWeightValid) {
      setFormError('Dispatch blocked due to vehicle cargo capacity overload.');
      return;
    }

    try {
      const payload = {
        vehicle_id: parseInt(vehicleId),
        driver_id: parseInt(driverId),
        source_location: source,
        destination_location: destination,
        cargo_weight: parseFloat(cargoWeight),
        planned_distance: plannedDistance ? parseFloat(plannedDistance) : null,
        status: initialStatus
      };

      await API.post('/trips', payload);
      setFormSuccess(`Trip successfully ${initialStatus === 'Dispatched' ? 'dispatched' : 'drafted'}!`);
      
      // Reset form
      setSource('');
      setDestination('');
      setVehicleId('');
      setDriverId('');
      setCargoWeight('');
      setPlannedDistance('');
      
      // Refresh list
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to dispatch trip.');
    }
  };

  const handleCancelForm = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setFormError('');
    setFormSuccess('');
  };

  // Actions for existing dispatches directly on Live Board cards
  const completeTrip = async (tripId, startOdo, plannedDist) => {
    const endOdoInput = prompt(`Enter end odometer (Must be >= ${startOdo}):`, (parseFloat(startOdo) + (parseFloat(plannedDist) || 0)).toString());
    if (!endOdoInput) return;
    const actualDistInput = prompt('Enter actual distance covered (km):', plannedDist || '10');
    if (!actualDistInput) return;

    try {
      await API.put(`/trips/${tripId}/complete`, {
        end_odometer: parseFloat(endOdoInput),
        actual_distance: parseFloat(actualDistInput)
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to complete trip.');
    }
  };

  const cancelTrip = async (tripId) => {
    const remarks = prompt('Reason for cancellation (optional):');
    if (remarks === null) return;
    try {
      await API.put(`/trips/${tripId}/cancel`, { remarks });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel trip.');
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

  return (
    <div className="dispatch-center">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Trip Dispatcher</h1>
      </div>

      {error && (
        <div className="text-danger mb-3" style={{ padding: '1rem', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="dispatch-layout">
        {/* Left Form: Create Trip */}
        <div className="dispatch-form-panel">
          <div className="form-title">Create Trip</div>

          {/* Stepper Timeline indicating progress */}
          <div className="stepper-container">
            <div className="step-item">
              <div className={`step-circle ${initialStatus === 'Draft' ? 'active' : 'completed'}`}></div>
              <span className="step-label">Draft</span>
            </div>
            <div className="step-item">
              <div className={`step-circle ${initialStatus === 'Dispatched' ? 'active' : ''}`}></div>
              <span className="step-label">Dispatched</span>
            </div>
            <div className="step-item">
              <div className="step-circle"></div>
              <span className="step-label">Completed</span>
            </div>
            <div className="step-item">
              <div className="step-circle"></div>
              <span className="step-label">Cancelled</span>
            </div>
          </div>

          <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {formError && <div className="text-danger mb-3" style={{ fontSize: '0.85rem' }}>{formError}</div>}
            {formSuccess && <div className="text-success mb-3" style={{ fontSize: '0.85rem' }}>{formSuccess}</div>}

            <div className="form-group-custom">
              <label>Source</label>
              <input 
                type="text" 
                placeholder="e.g. Gandhinagar Depot" 
                value={source} 
                onChange={(e) => setSource(e.target.value)} 
                required 
                className="auth-input"
              />
            </div>

            <div className="form-group-custom">
              <label>Destination</label>
              <input 
                type="text" 
                placeholder="e.g. Ahmedabad Hub" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                required 
                className="auth-input"
              />
            </div>

            <div className="form-group-custom">
              <label>Vehicle (Available Only)</label>
              <select 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                required 
                className="auth-input"
              >
                <option value="">Select Available Vehicle</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} - {v.vehicle_name} (Cap: {Math.round(parseFloat(v.maximum_load_capacity))}kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label>Driver (Available Only)</label>
              <select 
                value={driverId} 
                onChange={(e) => setDriverId(e.target.value)} 
                required 
                className="auth-input"
              >
                <option value="">Select Available Driver</option>
                {availableDrivers.map(d => (
                  <option key={d.driver_id} value={d.driver_id}>{d.full_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label>Cargo Weight (kg)</label>
              <input 
                type="number" 
                placeholder="e.g. 500" 
                value={cargoWeight} 
                onChange={(e) => setCargoWeight(e.target.value)} 
                required 
                className="auth-input"
              />
            </div>

            <div className="form-group-custom">
              <label>Planned Distance (km)</label>
              <input 
                type="number" 
                placeholder="e.g. 15" 
                value={plannedDistance} 
                onChange={(e) => setPlannedDistance(e.target.value)} 
                className="auth-input"
              />
            </div>

            <div className="form-group-custom">
              <label>Initial Dispatch Stage</label>
              <select 
                value={initialStatus} 
                onChange={(e) => setInitialStatus(e.target.value)} 
                className="auth-input"
              >
                <option value="Dispatched">Dispatched</option>
                <option value="Draft">Draft / Pending</option>
              </select>
            </div>

            {/* Inline Capacity Load Validation Alert */}
            {vehicleId && cargoWeight && (
              <div className={`validation-box ${isWeightValid ? 'valid' : 'invalid'}`}>
                <div>Vehicle Capacity: {Math.round(vehicleCapacity).toLocaleString()} kg</div>
                <div>Cargo Weight: {Math.round(cargoNum).toLocaleString()} kg</div>
                {isWeightValid ? (
                  <div>✔ Weight load verified within capacity limits</div>
                ) : (
                  <div>❌ Capacity exceeded by {Math.round(exceededBy).toLocaleString()} kg - dispatch blocked!</div>
                )}
              </div>
            )}

            <div className="btn-row">
              <button 
                type="submit" 
                disabled={!isWeightValid || !vehicleId || !driverId}
                className="btn-dispatch"
              >
                {!isWeightValid ? 'Dispatch (Blocked)' : 'Dispatch'}
              </button>
              <button type="button" onClick={handleCancelForm} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Live Board */}
        <div className="dispatch-board-panel">
          <div className="board-header">
            <div className="form-title">Live Board</div>
          </div>

          <div className="board-list">
            {loading ? (
              <div className="p-4 text-center">Loading live dashboard...</div>
            ) : trips.length === 0 ? (
              <div className="p-4 text-center text-muted-custom">No active dispatches.</div>
            ) : (
              trips.map(t => {
                const veh = vehicles.find(v => v.id === t.vehicle_id);
                const drv = drivers.find(d => d.driver_id === t.driver_id);
                return (
                  <div className="trip-board-card" key={t.id}>
                    <div className="trip-left">
                      <div className="trip-card-id">{t.trip_number || `TRP-${t.id}`}</div>
                      <div className="trip-card-route">
                        {t.source_location} &rarr; {t.destination_location}
                      </div>
                      <div className="trip-card-assets">
                        {veh ? veh.registration_number : 'Unassigned'} / {drv ? drv.full_name : 'No Driver'}
                      </div>
                    </div>
                    <div className="trip-right">
                      <span className={`badge-custom badge-${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                      <div className="trip-card-meta">
                        {t.planned_distance ? `${t.planned_distance} km` : ''}
                      </div>
                      
                      {/* Interactive inline Complete / Cancel actions directly on cards */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {t.status === 'Dispatched' && (
                          <button 
                            className="btn-secondary-custom" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#2ecc71', borderColor: 'rgba(46,204,113,0.3)' }}
                            onClick={() => completeTrip(t.id, t.start_odometer, t.planned_distance)}
                          >
                            Complete
                          </button>
                        )}
                        {(t.status === 'Draft' || t.status === 'Dispatched') && (
                          <button 
                            className="btn-secondary-custom" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ff7675', borderColor: 'rgba(231,76,60,0.3)' }}
                            onClick={() => cancelTrip(t.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Stepper helper notice */}
          <div className="board-footer-notice">
            On Complete dispatch: Fuel log is updated, expense recorded & driver availability restored
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchCenter;
