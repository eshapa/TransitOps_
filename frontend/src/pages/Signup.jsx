import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthForm.css';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = (e) => {
    e.preventDefault();
    login({ name: fullName, email, role });
    navigate('/');
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>Create an account</h2>
        <p>Join TransitOps to manage your fleet operations</p>
      </div>

      <form onSubmit={handleSignup} className="auth-form">
        <div className="form-group">
          <label>FULL NAME</label>
          <input 
            type="text" 
            placeholder="John Doe" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="auth-input"
          />
        </div>

        <div className="form-group">
          <label>EMAIL</label>
          <input 
            type="email" 
            placeholder="john@transitops.in" 
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

        <button type="submit" className="btn-auth-primary">
          Sign Up
        </button>
      </form>

      <div className="auth-switch" style={{ marginTop: '2rem' }}>
        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
      </div>
    </div>
  );
};

export default Signup;
