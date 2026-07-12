import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiPieChart, 
  FiTruck, 
  FiUsers, 
  FiMap, 
  FiList, 
  FiTool, 
  FiDollarSign, 
  FiBarChart2, 
  FiSettings
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiPieChart /> },
    { name: 'Vehicle Registry', path: '/vehicles', icon: <FiTruck /> },
    { name: 'Driver Management', path: '/drivers', icon: <FiUsers /> },
    { name: 'Trip Management', path: '/trips', icon: <FiMap /> },
    { name: 'Dispatch Center', path: '/dispatch', icon: <FiTool /> },
    { name: 'Maintenance', path: '/maintenance', icon: <FiTool /> },
    { name: 'Fuel Logs', path: '/fuel', icon: <FiList /> },
    { name: 'Expenses', path: '/expenses', icon: <FiDollarSign /> },
    { name: 'Reports & Analytics', path: '/reports', icon: <FiBarChart2 /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon-container">
          <FiTruck className="brand-icon" />
          <div>
            <h2 className="logo-text">TransLogix Pro</h2>
            <span className="logo-subtext">Enterprise Logistics</span>
          </div>
        </div>
      </div>
      
      <div className="sidebar-menu">
        {navItems.map((item) => (
          <NavLink 
            to={item.path} 
            key={item.name}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <div className="sidebar-section-label" style={{ padding: '0 1.5rem', fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '0.5rem', marginTop: '1rem', textTransform: 'uppercase' }}>
          ADMINISTRATION
        </div>
        <div className="nav-item">
          <span className="nav-icon"><FiSettings /></span>
          <span className="nav-text">Settings</span>
        </div>
        
        <div className="sidebar-user-profile">
          <div className="avatar">
            <img src={`https://ui-avatars.com/api/?name=${user?.name?.replace(' ', '+') || 'John+Doe'}&background=0066ff&color=fff`} alt="User" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'John Doe'}</span>
            <span className="user-role">{user?.role || 'Fleet Manager'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
