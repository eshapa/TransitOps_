<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiCheckCircle, FiX, FiPlus } from 'react-icons/fi';
import './Maintenance.css';

const Maintenance = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form & Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: '',
    description: '',
    vendor: '',
    cost: '',
    start_date: new Date().toISOString().split('T')[0],
    next_service_due: '',
    status: 'Scheduled'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const logsRes = await API.get('/maintenance');
      setLogs(logsRes.data.data);

      const vehRes = await API.get('/vehicles');
      // Fleet Managers can select any vehicle except retired
      setVehicles(vehRes.data.data.filter(v => v.status !== 'Retired'));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load maintenance data.');
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.vehicle_id || !formData.maintenance_type) {
        setFormError('Required: Vehicle and Service Type.');
        return;
      }

      const payload = {
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        next_service_due: formData.next_service_due || null
      };

      await API.post('/maintenance', payload);
      setIsAddDrawerOpen(false);
      setFormData({
        vehicle_id: '',
        maintenance_type: '',
        description: '',
        vendor: '',
        cost: '',
        start_date: new Date().toISOString().split('T')[0],
        next_service_due: '',
        status: 'Scheduled'
      });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to log maintenance.');
    }
  };

  const handleComplete = async (logId) => {
    const costInput = prompt('Enter final maintenance cost (optional):');
    const nextServiceInput = prompt('Enter next service due date (YYYY-MM-DD) (optional):');
    
    const payload = {};
    if (costInput) payload.cost = parseFloat(costInput);
    if (nextServiceInput) payload.next_service_due = nextServiceInput;
    payload.completion_date = new Date().toISOString().split('T')[0];

    try {
      await API.put(`/maintenance/${logId}/complete`, payload);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to complete maintenance.');
    }
  };

  const isFleetManager = user?.role === 'Fleet Manager';

  // Group logs into stages
  const scheduledTasks = logs.filter(l => l.status === 'Scheduled');
  const inProgressTasks = logs.filter(l => l.status === 'In Progress');
  const completedTasks = logs.filter(l => l.status === 'Completed');

  const kanbanStages = [
    { id: 'Scheduled', title: 'Scheduled', tasks: scheduledTasks },
    { id: 'In Progress', title: 'In Progress', tasks: inProgressTasks },
    { id: 'Completed', title: 'Completed', tasks: completedTasks }
  ];

  return (
    <div className="maintenance-dashboard">
      <div className="page-header">
        <h1 className="page-title">Maintenance Dashboard</h1>
        <div className="header-actions">
          {isFleetManager && (
            <button className="btn-primary-custom" onClick={() => setIsAddDrawerOpen(true)}>
              <FiPlus /> New Work Order
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-danger mb-3 p-3 glass-card">{error}</div>}

      {loading ? (
        <div className="text-center p-4">Loading maintenance board...</div>
      ) : (
        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {kanbanStages.map(stage => (
            <div className="kanban-column glass-panel" key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '400px' }}>
              <div className="kanban-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>{stage.title}</h3>
                <span className="task-count" style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>
                  {stage.tasks.length}
                </span>
              </div>
              
              <div className="kanban-cards" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                {stage.tasks.map(task => (
                  <div className="kanban-card glass-card" key={task.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span className="task-id">Order ID: #{task.id}</span>
                      <span>Veh ID: {task.vehicle_id}</span>
                    </div>
                    <h4 className="task-vehicle" style={{ fontSize: '0.9rem', margin: 0, color: 'var(--primary-accent)' }}>
                      {task.maintenance_type || 'General Service'}
                    </h4>
                    <p className="task-desc" style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-secondary)' }}>{task.description || 'No description provided.'}</p>
                    
                    <div className="task-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                      {task.vendor && <span>Vendor: {task.vendor}</span>}
                      {task.cost && <span>Cost: ${parseFloat(task.cost).toLocaleString()}</span>}
                      {task.start_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FiClock /> Start: {new Date(task.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.completion_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2ecc71' }}>
                          <FiCheckCircle /> Finished: {new Date(task.completion_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {isFleetManager && task.status !== 'Completed' && (
                      <button 
                        className="btn-secondary-custom mt-2" 
                        style={{ padding: '0.3rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: '#2ecc71', borderColor: 'rgba(46, 204, 113, 0.2)' }}
                        onClick={() => handleComplete(task.id)}
                      >
                        <FiCheckCircle /> Complete Order
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Work Order Drawer */}
      <div className={`drawer-overlay ${isAddDrawerOpen ? 'open' : ''}`} onClick={() => setIsAddDrawerOpen(false)}>
        <div className={`drawer-panel ${isAddDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isAddDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>New Maintenance Work Order</h2>
            <button className="icon-btn" onClick={() => setIsAddDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SELECT VEHICLE *</label>
                <select name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required className="auth-input">
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.manufacturer} {v.vehicle_name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SERVICE TYPE / CATEGORY *</label>
                <input 
                  type="text" 
                  name="maintenance_type" 
                  value={formData.maintenance_type} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                  placeholder="e.g. Oil Change, Engine Diagnostic, Brake Pad Replacement"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VENDOR / WORKSHOP</label>
                <input 
                  type="text" 
                  name="vendor" 
                  value={formData.vendor} 
                  onChange={handleInputChange} 
                  className="auth-input"
                  placeholder="e.g. Quick Fix Auto Garage"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ESTIMATED COST ($)</label>
                <input 
                  type="number" 
                  name="cost" 
                  value={formData.cost} 
                  onChange={handleInputChange} 
                  className="auth-input"
                  placeholder="e.g. 150"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>START DATE *</label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleInputChange} 
                  required
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NEXT SERVICE DUE DATE</label>
                <input 
                  type="date" 
                  name="next_service_due" 
                  value={formData.next_service_due} 
                  onChange={handleInputChange} 
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INITIAL STAGE</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="auth-input">
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DESCRIPTION</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="auth-input" 
                  rows="3"
                  placeholder="Details of the issues/servicing to perform..."
                />
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsAddDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Schedule Order</button>
            </div>
          </form>
=======
import React from 'react';
import { FiMoreHorizontal, FiPlus, FiFilter, FiList, FiDownload, FiCheckCircle } from 'react-icons/fi';
import './Maintenance.css';

const Maintenance = () => {
  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <div className="maintenance-title">
          <h1>Maintenance Board</h1>
          <div className="maintenance-meta">
            <span>🔄 Last updated: 2 mins ago</span>
            <span>🔧 24 active jobs</span>
          </div>
        </div>
        
        <div className="maintenance-actions">
          <div className="avatar-stack">
            <img src="https://ui-avatars.com/api/?name=David+Miller&background=random" alt="Tech" />
            <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random" alt="Tech" />
            <img src="https://ui-avatars.com/api/?name=Robert+Fox&background=random" alt="Tech" />
            <div className="avatar-more">+5</div>
          </div>
          <button className="btn-outline"><FiFilter /> Filter</button>
          <button className="btn-outline"><FiList /> Priority</button>
        </div>
      </div>

      <div className="kanban-board">
        {/* Scheduled Column */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>Scheduled <span className="col-count">8</span></h3>
            <FiPlus className="col-add-icon" />
          </div>
          
          <div className="kanban-cards">
            <div className="task-card">
              <div className="card-header">
                <span className="badge badge-routine">ROUTINE CHECK</span>
                <FiMoreHorizontal className="more-icon" />
              </div>
              <h4>Freightliner Cascadia #8842</h4>
              <p className="task-desc">50k Mile Engine Lubrication Service</p>
              
              <div className="task-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Assignee:</span>
                  <span className="detail-val">David Miller</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📅 Due Date:</span>
                  <span className="detail-val">Oct 24, 2023</span>
                </div>
                <div className="detail-row mt-2">
                  <span className="detail-label">Est. Cost:</span>
                  <span className="detail-val text-success font-semibold">$1,240.00</span>
                </div>
              </div>
            </div>

            <div className="task-card">
              <div className="card-header">
                <span className="badge badge-urgent">URGENT WARNING</span>
                <FiMoreHorizontal className="more-icon" />
              </div>
              <h4>Kenworth T680 #2210</h4>
              <p className="task-desc">Brake Pad Sensor Alert - Front Axle</p>
              
              <div className="task-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Assignee:</span>
                  <span className="detail-val">Sarah Jenkins</span>
                </div>
                <div className="detail-row mt-2">
                  <span className="detail-label">! Priority:</span>
                  <span className="detail-val text-danger font-semibold">High</span>
                </div>
              </div>
            </div>
            
            <button className="btn-add-task">+ Add New Task</button>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>In Progress <span className="col-count active">4</span></h3>
          </div>
          
          <div className="kanban-cards">
            <div className="task-card card-active">
              <div className="card-header">
                <span className="badge badge-processing"><span className="dot-green"></span> PROCESSING</span>
                <FiMoreHorizontal className="more-icon" />
              </div>
              <h4>Peterbilt 579 #5521</h4>
              <p className="task-desc">Transmission Overhaul & Fluid Flush</p>
              
              <div className="task-progress-section">
                <div className="progress-labels">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-green" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div className="task-details">
                <div className="detail-row">
                  <span className="detail-label">🛠️ Tech:</span>
                  <div className="tech-user">
                    <img src="https://ui-avatars.com/api/?name=Robert+Fox&background=random" alt="Tech" />
                    <span>Robert Fox</span>
                  </div>
                </div>
                <div className="detail-row mt-2">
                  <span className="detail-label">Current Accrual:</span>
                  <span className="detail-val font-mono">$4,850.22</span>
                </div>
              </div>
            </div>

            <div className="task-card card-active card-warning-border">
              <div className="card-header">
                <span className="badge badge-processing"><span className="dot-green"></span> AWAITING PARTS</span>
                <FiMoreHorizontal className="more-icon" />
              </div>
              <h4>Volvo VNL #9001</h4>
              <p className="task-desc">HVAC System Replacement</p>
              
              <div className="backorder-alert">
                📦 Blower motor backordered (ETA 10/26)
              </div>
            </div>
          </div>
        </div>

        {/* Completed Column */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>Completed <span className="col-count">12</span></h3>
            <span className="clear-all">Clear All</span>
          </div>
          
          <div className="kanban-cards">
            <div className="task-card card-completed">
              <div className="card-header">
                <span className="badge badge-finalized">FINALIZED</span>
                <FiCheckCircle className="text-success" />
              </div>
              <h4>Mack Anthem #1143</h4>
              <p className="task-desc">Tire Rotation and Alignment</p>
              
              <div className="task-details">
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-val">4h 15m</span>
                </div>
                <div className="detail-row mt-2">
                  <span className="detail-label">Total Cost:</span>
                  <span className="detail-val font-semibold">$412.00</span>
                </div>
              </div>
            </div>

            <div className="task-card card-completed">
              <div className="card-header">
                <span className="badge badge-finalized">FINALIZED</span>
                <FiCheckCircle className="text-success" />
              </div>
              <h4>International LT #7762</h4>
              <p className="task-desc">Oil & Filter Change</p>
              
              <div className="card-actions">
                <button className="btn-view-report">View Report</button>
                <button className="btn-download-icon"><FiDownload /></button>
              </div>
            </div>
          </div>
>>>>>>> 12846b3 (made maintance page and report)
        </div>
      </div>
      
      <button className="fab-add">
        <FiPlus />
      </button>
    </div>
  );
};

export default Maintenance;
