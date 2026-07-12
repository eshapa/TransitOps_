<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiPlus, FiMoreHorizontal, FiX } from 'react-icons/fi';
import './VehicleRegistry.css';

const VehicleRegistry = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
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
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = await API.get('/vehicles', { params });
      setVehicles(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

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
      // Validate inputs loosely on frontend
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'On Trip': return 'warning';
      case 'Available': return 'success';
      case 'In Shop': return 'danger';
      case 'Retired': return 'danger';
      default: return 'primary';
    }
  };
=======
import React, { useState } from 'react';
import { FiCamera, FiEdit2, FiDownload, FiCheckCircle } from 'react-icons/fi';
import './VehicleRegistry.css';

const vehicles = [
  {
    id: 'v-904221',
    regNumber: 'TX-9042-BR',
    name: 'Freightliner Cascadia',
    model: 'Model 2023',
    vin: '...8921',
    type: 'HEAVY TRUCK',
    capacity: '45,000 lbs',
    odometer: '124,500 mi',
    fuelCapacity: '200 Gallons',
    avgConsumption: '7.2 MPG',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    insurance: [
      { name: 'Liability_Cert_2024.pdf', expires: 'Dec 12, 2024' },
      { name: 'Safety_Inspection_Q1.pdf', status: 'Verified', date: 'Mar 2024' }
    ],
    maintenance: [
      {
        title: 'Standard Oil Change & Filter',
        date: 'May 15, 2024',
        mileage: '122,100 mi',
        desc: 'Full synthetic change, replaced air filter and checked tire pressure. All clear.',
        type: 'completed'
      },
      {
        title: 'Brake Pad Replacement (Front)',
        date: 'Feb 02, 2024',
        mileage: '115,400 mi',
        desc: '',
        type: 'past'
      },
      {
        title: 'Annual Comprehensive Inspection',
        date: 'Nov 28, 2023',
        mileage: '108,000 mi',
        desc: '',
        type: 'past'
      }
    ]
  },
  {
    id: 'v-904222',
    regNumber: 'VN-2210-MK',
    name: 'Mercedes Sprinter',
    model: 'Model 2024',
    vin: '...4432',
    type: 'DELIVERY VAN',
    capacity: '3,500 lbs',
    odometer: '12,180 mi'
  },
  {
    id: 'v-904223',
    regNumber: 'TX-4491-LT',
    name: 'Volvo FH16',
    model: 'Model 2022',
    vin: '...1102',
    type: 'HEAVY TRUCK',
    capacity: '42,000 lbs',
    odometer: '234,010 mi'
  },
  {
    id: 'v-904224',
    regNumber: 'TR-1100-XP',
    name: 'Scania R-Series',
    model: 'Model 2023',
    vin: '...5567',
    type: 'HEAVY TRUCK',
    capacity: '48,000 lbs',
    odometer: '89,240 mi'
  },
  {
    id: 'v-904225',
    regNumber: 'EV-9004-QQ',
    name: 'Rivian EDV',
    model: 'Model 2024',
    vin: '...2231',
    type: 'ELECTRIC EV',
    capacity: '2,800 lbs',
    odometer: '5,400 mi'
  }
];

const VehicleRegistry = () => {
  const [activeVehicle, setActiveVehicle] = useState(vehicles[0]);
>>>>>>> 12846b3 (made maintance page and report)

  const isFleetManager = user?.role === 'Fleet Manager';

  return (
<<<<<<< HEAD
    <div className="vehicle-registry">
      <div className="page-header">
        <h1 className="page-title">Vehicle Registry</h1>
        <div className="header-actions">
          {isFleetManager && (
            <button className="btn-primary-custom" onClick={() => setIsAddDrawerOpen(true)}>
              <FiPlus /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="glass-card registry-container">
        <div className="registry-toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, model, plate..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-box" style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="auth-input"
              style={{ width: '150px', padding: '0.4rem' }}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="auth-input"
              style={{ width: '150px', padding: '0.4rem' }}
            >
              <option value="">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
              <option value="Trailer">Trailer</option>
            </select>
          </div>
        </div>

        {error && <div className="p-3 text-danger">{error}</div>}

        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div className="p-4 text-center">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-4 text-center text-muted-custom">No vehicles found.</div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Plate / Reg No</th>
                  <th>Make & Model</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Odometer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} onClick={() => setSelectedVehicle(v)} className="clickable-row">
                    <td className="text-primary-custom font-weight-bold">{v.registration_number}</td>
                    <td>{v.manufacturer || ''} {v.vehicle_name || ''} {v.vehicle_model || ''}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{v.maximum_load_capacity} kg</td>
                    <td>{parseFloat(v.current_odometer).toLocaleString()} km</td>
                    <td>
                      <span className={`badge-custom badge-${getStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); }}><FiMoreHorizontal /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
=======
    <div className="registry-container">
      <div className="registry-header">
        <h1>Vehicle Registry</h1>
        <p>Manage and monitor 124 active enterprise assets</p>
      </div>

      <div className="registry-content">
        {/* Left Side: Table */}
        <div className="registry-table-wrapper">
          <table className="registry-table">
            <thead>
              <tr>
                <th>REG. NUMBER</th>
                <th>VEHICLE DETAILS</th>
                <th>TYPE</th>
                <th>CAPACITY</th>
                <th>ODOMETER</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr 
                  key={v.id} 
                  className={activeVehicle.id === v.id ? 'active-row' : ''}
                  onClick={() => setActiveVehicle(v)}
                >
                  <td className="reg-col">{v.regNumber}</td>
                  <td>
                    <div className="veh-name">{v.name}</div>
                    <div className="veh-subtext">{v.model} • VIN: {v.vin}</div>
                  </td>
                  <td>
                    <span className="type-badge">
                      {v.type.split(' ').map((word, i) => (
                        <span key={i} className="type-word">{word}</span>
                      ))}
                    </span>
                  </td>
                  <td>{v.capacity}</td>
                  <td className="odo-text">{v.odometer}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing 1-10 of 124 entries
          </div>
>>>>>>> 12846b3 (made maintance page and report)
        </div>

<<<<<<< HEAD
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
                  <div className="drawer-image-placeholder">
                    <span>{selectedVehicle.vehicle_model || 'Vehicle Model'}</span>
                  </div>
                </div>
                <div className="drawer-section">
                  <h3>Overview</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>ID</label>
                      <span>{selectedVehicle.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span className={`badge-custom badge-${getStatusColor(selectedVehicle.status)}`}>{selectedVehicle.status}</span>
                    </div>
                    <div className="detail-item">
                      <label>License Plate</label>
                      <span>{selectedVehicle.registration_number}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <span>{selectedVehicle.vehicle_type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Load Capacity</label>
                      <span>{selectedVehicle.maximum_load_capacity} kg</span>
                    </div>
                    <div className="detail-item">
                      <label>Odometer</label>
                      <span>{parseFloat(selectedVehicle.current_odometer).toLocaleString()} km</span>
                    </div>
                    <div className="detail-item">
                      <label>Acquisition Cost</label>
                      <span>{selectedVehicle.acquisition_cost ? `$${parseFloat(selectedVehicle.acquisition_cost).toLocaleString()}` : 'N/A'}</span>
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
=======
        {/* Right Side: Detail Panel */}
        <div className="registry-detail-panel">
          <div className="panel-header">
            <div className="asset-status">
              <span className="status-indicator"></span>
              <span className="status-text">ACTIVE ASSET</span>
              <span className="asset-id">ID: {activeVehicle.id}</span>
            </div>
            <h2 className="detail-name">{activeVehicle.name}</h2>
            <p className="detail-reg">{activeVehicle.regNumber}</p>
          </div>

          <div className="asset-image-container">
            <img src={activeVehicle.image || 'https://images.unsplash.com/photo-1593955681123-5e937d57fb4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} alt="Vehicle" />
            <div className="image-actions">
              <button className="img-btn"><FiCamera /></button>
              <button className="img-btn"><FiEdit2 /></button>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">FUEL CAPACITY</span>
              <div className="metric-value">
                <span className="big-val">{activeVehicle.fuelCapacity ? activeVehicle.fuelCapacity.split(' ')[0] : 'N/A'}</span>
                <span className="small-val">{activeVehicle.fuelCapacity ? activeVehicle.fuelCapacity.split(' ')[1] : ''}</span>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-label">AVG CONSUMPTION</span>
              <div className="metric-value">
                <span className="big-val">{activeVehicle.avgConsumption ? activeVehicle.avgConsumption.split(' ')[0] : 'N/A'}</span>
                <span className="small-val">{activeVehicle.avgConsumption ? activeVehicle.avgConsumption.split(' ')[1] : ''}</span>
              </div>
            </div>
          </div>

          <div className="section-block">
            <div className="section-header">
              <h3>Insurance & Compliance</h3>
              <a href="#" className="view-all">View All</a>
            </div>
            <div className="docs-list">
              {(activeVehicle.insurance || []).map((doc, i) => (
                <div className="doc-card" key={i}>
                  <div className="doc-icon">
                    {doc.status === 'Verified' ? <FiCheckCircle /> : <div className="file-icon">📄</div>}
                  </div>
                  <div className="doc-info">
                    <h4>{doc.name}</h4>
                    <p>{doc.expires ? `Expires: ${doc.expires}` : `Status: ${doc.status} • ${doc.date}`}</p>
                  </div>
                  <button className="download-btn"><FiDownload /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="section-block">
            <div className="section-header">
              <h3>Maintenance History</h3>
              <button className="schedule-btn">Schedule Task</button>
            </div>
            <div className="timeline">
              {(activeVehicle.maintenance || []).map((maint, i) => (
                <div className={`timeline-item ${maint.type}`} key={i}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>{maint.title}</h4>
                    <span className="timeline-date">{maint.date} • {maint.mileage}</span>
                    {maint.desc && <p className="timeline-desc">{maint.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-footer-actions">
            <button className="btn-secondary">Edit Details</button>
            <button className="btn-primary">Assign Driver</button>
          </div>
>>>>>>> 12846b3 (made maintance page and report)
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>REGISTRATION NUMBER (PLATE) *</label>
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VEHICLE NAME / MAKE *</label>
                <input 
                  type="text" 
                  name="vehicle_name" 
                  value={formData.vehicle_name} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. Transit Van"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MODEL</label>
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MANUFACTURER</label>
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TYPE</label>
                <select name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} className="auth-input">
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Mini">Mini</option>
                  <option value="Trailer">Trailer</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>MAX LOAD CAPACITY (KG) *</label>
                <input 
                  type="number" 
                  name="maximum_load_capacity" 
                  value={formData.maximum_load_capacity} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. 1500"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FUEL TYPE</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className="auth-input">
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CURRENT ODOMETER (KM)</label>
                <input 
                  type="number" 
                  name="current_odometer" 
                  value={formData.current_odometer} 
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ACQUISITION COST ($)</label>
                <input 
                  type="number" 
                  name="acquisition_cost" 
                  value={formData.acquisition_cost} 
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="e.g. 45000"
                />
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
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
