import React from 'react';
import { drivers } from '../mockData/driverData';
import { FiSearch, FiFilter, FiUserPlus, FiStar, FiAlertCircle } from 'react-icons/fi';
import './DriverManagement.css';

const DriverManagement = () => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'On Duty': return 'success';
      case 'Available': return 'primary';
      case 'Off Duty': return 'warning';
      case 'On Leave': return 'danger';
      default: return 'primary';
    }
  };

  const isExpiringSoon = (dateStr) => {
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays < 90 && diffDays > 0;
  };

  const isExpired = (dateStr) => {
    const expiry = new Date(dateStr);
    const today = new Date();
    return expiry < today;
  };

  return (
    <div className="driver-management">
      <div className="page-header">
        <h1 className="page-title">Driver Management</h1>
        <div className="header-actions">
          <button className="btn-primary-custom"><FiUserPlus /> Add Driver</button>
        </div>
      </div>

      <div className="glass-card registry-container">
        <div className="registry-toolbar">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search drivers by name, ID, or license..." />
          </div>
          <button className="btn-secondary-custom"><FiFilter /> Filters</button>
        </div>

        <div className="drivers-grid">
          {drivers.map(driver => (
            <div className="glass-panel driver-card" key={driver.id}>
              <div className="driver-card-header">
                <div className="driver-profile-mini">
                  <div className="driver-avatar">
                    <img src={`https://ui-avatars.com/api/?name=${driver.name.replace(' ', '+')}&background=random`} alt={driver.name} />
                  </div>
                  <div>
                    <h3 className="driver-name">{driver.name}</h3>
                    <span className="driver-id text-muted-custom">{driver.id} • {driver.role}</span>
                  </div>
                </div>
                <span className={`badge-custom badge-${getStatusBadge(driver.status)}`}>{driver.status}</span>
              </div>
              
              <div className="driver-stats">
                <div className="stat-item">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value"><FiStar className="text-warning-custom" style={{ marginRight: '4px' }}/> {driver.rating}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Trips</span>
                  <span className="stat-value">{driver.trips}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">License</span>
                  <span className="stat-value">{driver.license}</span>
                </div>
              </div>

              <div className="driver-compliance">
                {isExpired(driver.expiry) ? (
                  <div className="compliance-alert alert-danger">
                    <FiAlertCircle /> License Expired ({driver.expiry})
                  </div>
                ) : isExpiringSoon(driver.expiry) ? (
                  <div className="compliance-alert alert-warning">
                    <FiAlertCircle /> License Expiring Soon ({driver.expiry})
                  </div>
                ) : (
                  <div className="compliance-alert alert-success">
                    License Valid (Expires {driver.expiry})
                  </div>
                )}
              </div>

              <div className="driver-actions">
                <button className="btn-secondary-custom" style={{ flex: 1 }}>View Profile</button>
                <button className="btn-primary-custom" style={{ flex: 1 }}>Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;
