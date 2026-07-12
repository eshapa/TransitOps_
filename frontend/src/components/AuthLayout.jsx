import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = () => {
  return (
    <div className="auth-container">
      <div className="auth-left-pane">
        <div className="auth-left-overlay"></div>
        <div className="auth-left-content glass-card">
          <div className="auth-logo-section">
            <div className="auth-logo-icon">T</div>
            <div>
              <h1 className="auth-logo-text">TransitOps</h1>
              <p className="auth-logo-subtext">Smart Transport Operations Platform</p>
            </div>
          </div>
          
          <div className="auth-roles-section">
            <h3 className="auth-roles-title">One login, four roles:</h3>
            <ul className="auth-roles-list">
              <li><span className="role-dot bg-warning"></span> Fleet Manager</li>
              <li><span className="role-dot bg-primary"></span> Dispatcher</li>
              <li><span className="role-dot bg-success"></span> Safety Officer</li>
              <li><span className="role-dot bg-danger"></span> Financial Analyst</li>
            </ul>
          </div>
          
          <div className="auth-footer">
            <p>TRANSITOPS © 2026 • RBAC ENABLED</p>
          </div>
        </div>
      </div>
      
      <div className="auth-right-pane">
        <div className="auth-form-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
