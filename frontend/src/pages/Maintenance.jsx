import React from 'react';
import { FiClock, FiTool, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi';
import './Maintenance.css';

const Maintenance = () => {
  const kanbanStages = [
    { id: 'scheduled', title: 'Scheduled', tasks: [
      { id: 'M-201', vehicle: 'Volvo VNL 860', task: 'Oil Change & Filter', date: 'Oct 15', priority: 'low' },
      { id: 'M-202', vehicle: 'Ford Transit', task: 'Tire Rotation', date: 'Oct 16', priority: 'medium' }
    ]},
    { id: 'in-progress', title: 'In Progress', tasks: [
      { id: 'M-198', vehicle: 'Freightliner Cascadia', task: 'Engine Diagnostics', technician: 'Tech A. Smith', priority: 'high' }
    ]},
    { id: 'waiting', title: 'Waiting for Parts', tasks: [
      { id: 'M-195', vehicle: 'Kenworth T680', task: 'Transmission Overhaul', parts: 'Clutch Kit', priority: 'high' }
    ]},
    { id: 'completed', title: 'Completed', tasks: [
      { id: 'M-190', vehicle: 'Peterbilt 579', task: 'Brake Pad Replacement', date: 'Oct 12', priority: 'medium' },
      { id: 'M-191', vehicle: 'Mercedes Sprinter', task: 'AC Service', date: 'Oct 12', priority: 'low' }
    ]}
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  return (
    <div className="maintenance-dashboard">
      <div className="page-header">
        <h1 className="page-title">Maintenance Dashboard</h1>
        <div className="header-actions">
          <button className="btn-primary-custom"><FiTool /> New Work Order</button>
        </div>
      </div>

      <div className="kanban-board">
        {kanbanStages.map(stage => (
          <div className="kanban-column glass-panel" key={stage.id}>
            <div className="kanban-column-header">
              <h3>{stage.title}</h3>
              <span className="task-count">{stage.tasks.length}</span>
            </div>
            
            <div className="kanban-cards">
              {stage.tasks.map(task => (
                <div className="kanban-card glass-card" key={task.id}>
                  <div className="card-top">
                    <span className="task-id">{task.id}</span>
                    <span className={`priority-indicator bg-${getPriorityColor(task.priority)}`}></span>
                  </div>
                  <h4 className="task-vehicle">{task.vehicle}</h4>
                  <p className="task-desc">{task.task}</p>
                  
                  <div className="task-meta">
                    {task.date && <span><FiClock /> {task.date}</span>}
                    {task.technician && <span><FiTool /> {task.technician}</span>}
                    {task.parts && <span className="text-warning-custom"><FiAlertOctagon /> {task.parts}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Maintenance;
