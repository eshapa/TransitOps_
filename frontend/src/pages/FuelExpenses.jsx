import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

const FuelExpenses = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Fuel & Expenses</h1>
        <div className="header-actions">
          <button className="btn-primary-custom"><FiDollarSign /> Add Expense</button>
        </div>
      </div>
      <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FiDollarSign style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
          <h2>Financial Control Center</h2>
          <p>This module tracks total fuel costs, maintenance expenses, and operational spending.</p>
        </div>
      </div>
    </div>
  );
};

export default FuelExpenses;
