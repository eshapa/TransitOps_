import React from 'react';
import { FiSearch, FiBell, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './TopNav.css';

const TopNav = () => {
  const { user } = useAuth();
  
  return (
    <div className="topnav">
      <div className="search-container">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search vehicles, drivers, or trips..." className="search-input" />
      </div>
      
      <div className="topnav-actions">
        <button className="icon-btn">
          <FiMessageSquare />
        </button>
        <button className="icon-btn notification-btn">
          <FiBell />
          <span className="badge">3</span>
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <img src={`https://ui-avatars.com/api/?name=${(user?.fullName || user?.name || 'Admin User').replace(' ', '+')}&background=0066ff&color=fff`} alt="User" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || user?.name || 'Admin User'}</span>
            <span className="user-role badge-custom badge-primary">{user?.role || 'Fleet Manager'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
