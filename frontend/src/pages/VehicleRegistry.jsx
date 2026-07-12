import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiX, FiPlus } from 'react-icons/fi';
import './VehicleRegistry.css';

const VehicleRegistry = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchReg, setSearchReg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Drawer States
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // Form State for Adding Vehicle
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    registration_number: '',
    vehicle_name: '',
    vehicle_model: '',
    vehicle_type: 'Van',
    manufacturer: '',
    manufacture_year: new Date().getFullYear(),
    maximum_load_capacity: '',
    fuel_type: 'Petrol',
    current_odometer: 0,
    acquisition_cost: '',
    status: 'Available'
  });

  // Fetch vehicles with filters
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchReg) params.search = searchReg;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await API.get('/vehicles', { params });
      setVehicles(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  }, [searchReg, statusFilter, typeFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.registration_number || !formData.maximum_load_capacity) {
        setFormError('Registration number and load capacity are required.');
        return;
      }

      const payload = {
        ...formData,
        maximum_load_capacity: parseFloat(formData.maximum_load_capacity),
        manufacture_year: parseInt(formData.manufacture_year),
        current_odometer: parseFloat(formData.current_odometer || 0),
        acquisition_cost: formData.acquisition_cost ? parseFloat(formData.acquisition_cost) : null
      };

      await API.post('/vehicles', payload);
      
      // Reset form and close drawer
      setFormData({
        registration_number: '',
        vehicle_name: '',
        vehicle_model: '',
        vehicle_type: 'Van',
        manufacturer: '',
        manufacture_year: new Date().getFullYear(),
        maximum_load_capacity: '',
        fuel_type: 'Petrol',
        current_odometer: 0,
        acquisition_cost: '',
        status: 'Available'
      });
      setIsAddDrawerOpen(false);
      
      // Refresh list
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to register vehicle.');
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Available': return 'available';
      case 'On Trip': return 'on-trip';
      case 'In Shop': return 'in-shop';
      case 'Retired': return 'retired';
      default: return 'available';
    }
  };

  // Helper to format capacity e.g. 500 kg or 5 Ton
  const formatCapacity = (cap) => {
    const num = parseFloat(cap);
    if (isNaN(num)) return cap;
    if (num >= 1000) {
      const tons = num / 1000;
      return `${Number(tons.toFixed(1))} Ton`;
    }
    return `${Math.round(num)} kg`;
  };

  const isFleetManager = user?.role === 'Fleet Manager';

  return (
    <div className="vehicle-registry">
      <div className="page-header">
        <h1 className="page-title">Vehicle Registry</h1>
      </div>

      <div className="glass-card registry-container">
        {/* Registry Toolbar with custom styled selects and Add Vehicle on right */}
        <div className="registry-toolbar">
          <div className="filters-group">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Type: All</option>
              <option value="Van">Type: Van</option>
              <option value="Truck">Type: Truck</option>
              <option value="Mini">Type: Mini</option>
              <option value="Trailer">Type: Trailer</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Status: All</option>
              <option value="Available">Status: Available</option>
              <option value="On Trip">Status: On Trip</option>
              <option value="In Shop">Status: In Shop</option>
              <option value="Retired">Status: Retired</option>
            </select>

            <input 
              type="text" 
              placeholder="Search reg. no..." 
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              className="search-reg-input"
            />
          </div>

          {isFleetManager && (
            <button className="btn-add-vehicle" onClick={() => setIsAddDrawerOpen(true)}>
              <FiPlus /> Add Vehicle
            </button>
          )}
        </div>

        {error && <div className="p-3 text-danger">{error}</div>}

        <div className="table-responsive">
          {loading ? (
            <div className="p-4 text-center">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-4 text-center text-muted-custom">No vehicles found.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Reg. No. (Unique)</th>
                  <th>Name/Model</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Odometer</th>
                  <th>Acq. Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} onClick={() => setSelectedVehicle(v)} className="clickable-row">
                    <td className="text-primary-custom font-weight-bold">{v.registration_number}</td>
                    <td>{v.vehicle_name || ''}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{formatCapacity(v.maximum_load_capacity)}</td>
                    <td>{Math.round(parseFloat(v.current_odometer)).toLocaleString('en-US')}</td>
                    <td>{v.acquisition_cost ? Math.round(parseFloat(v.acquisition_cost)).toLocaleString('en-IN') : 'N/A'}</td>
                    <td>
                      <span className={`status-pill ${getStatusClass(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orange Rule Text Notice below Table */}
        <div className="rule-notice-text">
          Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
        </div>
      </div>

      {/* Vehicle Details Drawer */}
      <div className={`drawer-overlay ${selectedVehicle ? 'open' : ''}`} onClick={() => setSelectedVehicle(null)}>
        <div className={`drawer-panel ${selectedVehicle ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          {selectedVehicle && (
            <>
              <div className="drawer-header">
                <h2>{selectedVehicle.manufacturer} {selectedVehicle.vehicle_name}</h2>
                <button className="icon-btn" onClick={() => setSelectedVehicle(null)}><FiX /></button>
              </div>
              <div className="drawer-content">
                <div className="drawer-section">
                  <h3>Overview</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>ID</label>
                      <span>{selectedVehicle.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span className={`status-pill ${getStatusClass(selectedVehicle.status)}`} style={{ display: 'block', width: '100px' }}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Registration Number</label>
                      <span>{selectedVehicle.registration_number}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <span>{selectedVehicle.vehicle_type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Load Capacity</label>
                      <span>{formatCapacity(selectedVehicle.maximum_load_capacity)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Odometer</label>
                      <span>{Math.round(parseFloat(selectedVehicle.current_odometer)).toLocaleString('en-US')} km</span>
                    </div>
                    <div className="detail-item">
                      <label>Acquisition Cost</label>
                      <span>{selectedVehicle.acquisition_cost ? `$${Math.round(parseFloat(selectedVehicle.acquisition_cost)).toLocaleString('en-IN')}` : 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Fuel Type</label>
                      <span>{selectedVehicle.fuel_type}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="drawer-footer">
                <button className="btn-secondary-custom" onClick={() => setSelectedVehicle(null)}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Vehicle Drawer */}
      <div className={`drawer-overlay ${isAddDrawerOpen ? 'open' : ''}`} onClick={() => setIsAddDrawerOpen(false)}>
        <div className={`drawer-panel ${isAddDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isAddDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>Add New Vehicle</h2>
            <button className="icon-btn" onClick={() => setIsAddDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}
              
              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>REGISTRATION NUMBER (PLATE) *</label>
                <input 
                  type="text" 
                  name="registration_number" 
                  value={formData.registration_number} 
                  onChange={handleInputChange} 
                  required 
                  className="auth-input"
                  placeholder="e.g. GJ01AB1234"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>VEHICLE NAME / MAKE *</label>
                <input 
                  type="text" 
                  name="vehicle_name" 
                  value={formData.vehicle_name} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. VAN-05"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>MODEL</label>
                <input 
                  type="text" 
                  name="vehicle_model" 
                  value={formData.vehicle_model} 
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="e.g. T-200"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>MANUFACTURER</label>
                <input 
                  type="text" 
                  name="manufacturer" 
                  value={formData.manufacturer} 
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="e.g. Ford"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>TYPE</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} className="auth-input">
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Mini">Mini</option>
                  <option value="Trailer">Trailer</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>MAX LOAD CAPACITY (KG) *</label>
                <input 
                  type="number" 
                  name="maximum_load_capacity" 
                  value={formData.maximum_load_capacity} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. 500"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>FUEL TYPE</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className="auth-input">
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>CURRENT ODOMETER (KM)</label>
                <input 
                  type="number" 
                  name="current_odometer" 
                  value={formData.current_odometer} 
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: '#a0aec0' }}>ACQUISITION COST ($)</label>
                <input 
                  type="number" 
                  name="acquisition_cost" 
                  value={formData.acquisition_cost} 
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="e.g. 620000"
                />
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsAddDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Register Vehicle</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistry;
