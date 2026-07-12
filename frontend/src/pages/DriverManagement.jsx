import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUserPlus, FiStar, FiAlertCircle, FiX, FiCheck } from 'react-icons/fi';
import './DriverManagement.css';

const DriverManagement = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer & Form States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_category: 'Commercial',
    license_expiry: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Available'
  });

  // Fetch Drivers
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await API.get('/drivers', { params });
      setDrivers(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

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
      if (!formData.full_name || !formData.email || !formData.license_number || !formData.license_expiry) {
        setFormError('Required fields: Name, Email, License Number, License Expiry.');
        return;
      }

      await API.post('/drivers', formData);
      
      // Reset form and close
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        license_category: 'Commercial',
        license_expiry: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Available'
      });
      setIsAddDrawerOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to create driver.');
    }
  };

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      await API.put(`/drivers/${driverId}`, { status: newStatus });
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update driver status.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Available': return 'success';
      case 'On Trip': return 'primary';
      case 'Off Duty': return 'warning';
      case 'Suspended': return 'danger';
      default: return 'primary';
    }
  };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays < 90 && diffDays > 0;
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const today = new Date();
    return expiry < today;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canModify = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';

  return (
    <div className="driver-management">
      <div className="page-header">
        <h1 className="page-title">Driver Management</h1>
        <div className="header-actions">
          {canModify && (
            <button className="btn-primary-custom" onClick={() => setIsAddDrawerOpen(true)}>
              <FiUserPlus /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="glass-card registry-container" style={{ padding: '1.5rem' }}>
        <div className="registry-toolbar" style={{ border: 'none', padding: '0 0 1.5rem 0' }}>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search drivers by name, email, license..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="auth-input"
              style={{ width: '180px', padding: '0.4rem' }}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {error && <div className="text-danger mb-3">{error}</div>}

        {loading ? (
          <div className="text-center p-4">Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center p-4 text-muted-custom">No drivers found.</div>
        ) : (
          <div className="drivers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            {drivers.map(driver => (
              <div className="glass-panel driver-card" key={driver.driver_id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="driver-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="driver-profile-mini" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <div className="driver-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img src={`https://ui-avatars.com/api/?name=${driver.full_name.replace(' ', '+')}&background=random`} alt={driver.full_name} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div>
                      <h3 className="driver-name" style={{ fontSize: '1rem', margin: 0 }}>{driver.full_name}</h3>
                      <span className="driver-id text-muted-custom" style={{ fontSize: '0.75rem' }}>ID: {driver.driver_id} • {driver.email}</span>
                    </div>
                  </div>
                  <span className={`badge-custom badge-${getStatusBadge(driver.driver_status)}`}>{driver.driver_status}</span>
                </div>
                
                <div className="driver-stats" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span className="stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Safety Score</span>
                    <span className="stat-value" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                      <FiStar className="text-warning-custom" style={{ marginRight: '4px' }}/> {parseFloat(driver.safety_score).toFixed(1)}
                    </span>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Trips</span>
                    <span className="stat-value" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{driver.total_trips}</span>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span className="stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Category</span>
                    <span className="stat-value" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{driver.license_category || 'N/A'}</span>
                  </div>
                </div>

                <div className="driver-compliance">
                  {isExpired(driver.license_expiry) ? (
                    <div className="compliance-alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#ff6b6b' }}>
                      <FiAlertCircle /> License Expired ({formatDate(driver.license_expiry)})
                    </div>
                  ) : isExpiringSoon(driver.license_expiry) ? (
                    <div className="compliance-alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#f1c40f' }}>
                      <FiAlertCircle /> License Expiring Soon ({formatDate(driver.license_expiry)})
                    </div>
                  ) : (
                    <div className="compliance-alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(40,167,69,0.1)', border: '1px solid rgba(40,167,69,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#2ecc71' }}>
                      <FiCheck /> License Valid (Expires {formatDate(driver.license_expiry)})
                    </div>
                  )}
                </div>

                {canModify && (
                  <div className="driver-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status Controls:</span>
                    <select 
                      value={driver.driver_status} 
                      onChange={(e) => handleStatusUpdate(driver.driver_id, e.target.value)}
                      className="auth-input"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flex: 1 }}
                    >
                      <option value="Available">Available</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Driver Slide-out Drawer */}
      <div className={`drawer-overlay ${isAddDrawerOpen ? 'open' : ''}`} onClick={() => setIsAddDrawerOpen(false)}>
        <div className={`drawer-panel ${isAddDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isAddDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>Add New Driver Profile</h2>
            <button className="icon-btn" onClick={() => setIsAddDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}
              
              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FULL NAME *</label>
                <input 
                  type="text" 
                  name="full_name" 
                  value={formData.full_name} 
                  onChange={handleInputChange} 
                  required 
                  className="auth-input"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EMAIL ADDRESS *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  required 
                  className="auth-input"
                  placeholder="e.g. johndoe@transitops.com"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PHONE NUMBER</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange}
                  className="auth-input"
                  placeholder="e.g. +1 555-019-2834"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LICENSE NUMBER *</label>
                <input 
                  type="text" 
                  name="license_number" 
                  value={formData.license_number} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. DL-9876543"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LICENSE CATEGORY</label>
                <input 
                  type="text" 
                  name="license_category" 
                  value={formData.license_category} 
                  onChange={handleInputChange} 
                  className="auth-input"
                  placeholder="e.g. Heavy Commercial, LMV"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LICENSE EXPIRY DATE *</label>
                <input 
                  type="date" 
                  name="license_expiry" 
                  value={formData.license_expiry} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JOINING DATE</label>
                <input 
                  type="date" 
                  name="joining_date" 
                  value={formData.joining_date} 
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INITIAL STATUS</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="auth-input">
                  <option value="Available">Available</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsAddDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Create Driver</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;
