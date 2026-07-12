import React from 'react';
import { FiSearch, FiBell, FiMoon, FiPlus, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TopNav.css';

const TopNav = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topnav">
      <div className="search-container">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search tasks, vehicles or parts..." className="search-input" />
      </div>
      
      <div className="topnav-actions">
        <button className="icon-btn">
          <FiBell />
        </button>
        <button className="icon-btn">
          <FiMoon />
        </button>
        <button className="btn-quick-create">
          <FiPlus /> Quick Create
        </button>
        <button className="icon-btn text-danger-custom" onClick={handleLogout} title="Logout" style={{ marginLeft: '1rem' }}>
          <FiLogOut />
        </button>
      </div>
    </div>
  );
};

export default TopNav;
