import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiAlertCircle } from 'react-icons/fi';
import './AuthForm.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'ravenk@transitops.in' && password === 'password') {
      login({ name: 'Raven K.', email, role });
      navigate('/');
    } else {
      setError('Invalid credentials. Account locked after 5 failed attempts.');
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>Sign in to your account</h2>
        <p>Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-group">
          <label>EMAIL</label>
          <input 
            type="email" 
            placeholder="ravenk@transitops.in" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
        </div>

        <div className="form-group">
          <label>PASSWORD</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
        </div>

        <div className="form-group">
          <label>ROLE (RBAC)</label>
          <div className="custom-select-wrapper">
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input custom-select"
            >
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Financial Analyst">Financial Analyst</option>
            </select>
          </div>
        </div>

        <div className="form-row-between">
          <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Remember me
          </label>
          <a href="#" className="forgot-link">Forgot password?</a>
        </div>

        <button type="submit" className="btn-auth-primary">
          Sign In
        </button>

        {error && (
          <div className="auth-error-state">
            <FiAlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className="auth-scope-info">
        <p className="scope-title">Access is scoped by role after login:</p>
        <ul className="scope-list">
          <li>• Fleet Manager &rarr; Fleet, Maintenance</li>
          <li>• Dispatcher &rarr; Dashboard, Trips</li>
          <li>• Safety Officer &rarr; Drivers, Compliance</li>
          <li>• Financial Analyst &rarr; Fuel & Expenses, Analytics</li>
        </ul>
      </div>

      <div className="auth-switch">
        Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
      </div>
    </div>
  );
};

export default Login;
