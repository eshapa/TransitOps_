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
  FiSettings, 
  FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FiPieChart /> },
    { name: 'Vehicle Registry', path: '/vehicles', icon: <FiTruck /> },
    { name: 'Driver Management', path: '/drivers', icon: <FiUsers /> },
    { name: 'Dispatch Center', path: '/dispatch', icon: <FiMap /> },
    { name: 'Trip Management', path: '/trips', icon: <FiList /> },
    { name: 'Maintenance', path: '/maintenance', icon: <FiTool /> },
    { name: 'Fuel & Expenses', path: '/expenses', icon: <FiDollarSign /> },
    { name: 'Reports', path: '/reports', icon: <FiBarChart2 /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">T</div>
        <h2 className="logo-text">TransitOps</h2>
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
        <div className="nav-item">
          <span className="nav-icon"><FiSettings /></span>
          <span className="nav-text">Settings</span>
        </div>
        <div className="nav-item text-danger-custom" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-text">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
