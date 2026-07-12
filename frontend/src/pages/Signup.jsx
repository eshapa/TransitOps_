import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './AuthForm.css';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Dispatcher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(fullName, email, password, role);
      // Registration complete, navigate to login
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>PASSWORD</label>
          <div className="password-input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>ROLE (RBAC)</label>
          <div className="custom-select-wrapper">
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="auth-input custom-select"
              disabled={loading}
            >
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Financial Analyst">Financial Analyst</option>
              <option value="Driver">Driver</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn-auth-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        {error && (
          <div className="auth-error-state">
            <FiAlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className="auth-switch" style={{ marginTop: '2rem' }}>
        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
      </div>
    </div>
  );
};

export default Signup;

