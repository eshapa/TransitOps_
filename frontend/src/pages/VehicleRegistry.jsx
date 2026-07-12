import React, { useState } from 'react';
import { vehicles } from '../mockData/vehicleData';
import { FiSearch, FiFilter, FiPlus, FiMoreHorizontal, FiX } from 'react-icons/fi';
import './VehicleRegistry.css';

const VehicleRegistry = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Available': return 'primary';
      case 'In Maintenance': return 'warning';
      case 'Out of Service': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <div className="vehicle-registry">
      <div className="page-header">
        <h1 className="page-title">Vehicle Registry</h1>
        <div className="header-actions">
          <button className="btn-primary-custom"><FiPlus /> Add Vehicle</button>
        </div>
      </div>

      <div className="glass-card registry-container">
        <div className="registry-toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search vehicles by ID, make, or plate..." />
          </div>
          <button className="btn-secondary-custom"><FiFilter /> Filters</button>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Make & Model</th>
                <th>License Plate</th>
                <th>Type</th>
                <th>Mileage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} onClick={() => setSelectedVehicle(v)} className="clickable-row">
                  <td className="text-primary-custom font-weight-bold">{v.id}</td>
                  <td>{v.year} {v.make} {v.model}</td>
                  <td>{v.plate}</td>
                  <td>{v.type}</td>
                  <td>{v.mileage}</td>
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
        </div>
      </div>

      {/* Slide-out Drawer */}
      <div className={`drawer-overlay ${selectedVehicle ? 'open' : ''}`} onClick={() => setSelectedVehicle(null)}>
        <div className={`drawer-panel ${selectedVehicle ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          {selectedVehicle && (
            <>
              <div className="drawer-header">
                <h2>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</h2>
                <button className="icon-btn" onClick={() => setSelectedVehicle(null)}><FiX /></button>
              </div>
              <div className="drawer-content">
                <div className="drawer-section">
                  <div className="drawer-image-placeholder">
                    <span>Vehicle Image</span>
                  </div>
                </div>
                <div className="drawer-section">
                  <h3>Overview</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Vehicle ID</label>
                      <span>{selectedVehicle.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <span className={`badge-custom badge-${getStatusColor(selectedVehicle.status)}`}>{selectedVehicle.status}</span>
                    </div>
                    <div className="detail-item">
                      <label>License Plate</label>
                      <span>{selectedVehicle.plate}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <span>{selectedVehicle.type}</span>
                    </div>
                    <div className="detail-item">
                      <label>Capacity</label>
                      <span>{selectedVehicle.capacity}</span>
                    </div>
                    <div className="detail-item">
                      <label>Odometer</label>
                      <span>{selectedVehicle.mileage}</span>
                    </div>
                  </div>
                </div>
                <div className="drawer-section">
                  <h3>Recent Maintenance</h3>
                  <p className="text-muted-custom">Last serviced: {selectedVehicle.lastServiced}</p>
                  <button className="btn-secondary-custom mt-2" style={{ width: '100%' }}>View Full History</button>
                </div>
              </div>
              <div className="drawer-footer">
                <button className="btn-secondary-custom">Edit Details</button>
                <button className="btn-primary-custom">Assign Trip</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistry;
