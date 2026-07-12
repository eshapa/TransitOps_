import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { FiDollarSign, FiPlus, FiX } from 'react-icons/fi';
import './TripManagement.css'; // Reuse table/drawer overlay classes

const FuelExpenses = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drawer states
  const [isFuelDrawerOpen, setIsFuelDrawerOpen] = useState(false);
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  
  const [formError, setFormError] = useState('');

  // Form states
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    price_per_liter: '',
    odometer: '',
    fuel_station: '',
    filled_date: new Date().toISOString().split('T')[0]
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    trip_id: '',
    expense_type: 'Toll',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fuelRes = await API.get('/fuel');
      setFuelLogs(fuelRes.data.data);

      const expRes = await API.get('/expenses');
      setExpenses(expRes.data.data);

      const vehRes = await API.get('/vehicles');
      setVehicles(vehRes.data.data.filter(v => v.status !== 'Retired'));

      const tripRes = await API.get('/trips');
      setTrips(tripRes.data.data.filter(t => t.status === 'Dispatched' || t.status === 'Completed'));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (!fuelForm.vehicle_id || !fuelForm.liters || !fuelForm.price_per_liter) {
        setFormError('Required: Vehicle, Liters, and Price per Liter.');
        return;
      }

      await API.post('/fuel', {
        ...fuelForm,
        vehicle_id: parseInt(fuelForm.vehicle_id),
        trip_id: fuelForm.trip_id ? parseInt(fuelForm.trip_id) : null,
        liters: parseFloat(fuelForm.liters),
        price_per_liter: parseFloat(fuelForm.price_per_liter),
        odometer: fuelForm.odometer ? parseFloat(fuelForm.odometer) : null
      });

      setIsFuelDrawerOpen(false);
      setFuelForm({
        vehicle_id: '',
        trip_id: '',
        liters: '',
        price_per_liter: '',
        odometer: '',
        fuel_station: '',
        filled_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to log fuel.');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (!expenseForm.amount || !expenseForm.expense_type) {
        setFormError('Required: Expense Type and Amount.');
        return;
      }

      await API.post('/expenses', {
        ...expenseForm,
        vehicle_id: expenseForm.vehicle_id ? parseInt(expenseForm.vehicle_id) : null,
        trip_id: expenseForm.trip_id ? parseInt(expenseForm.trip_id) : null,
        amount: parseFloat(expenseForm.amount)
      });

      setIsExpenseDrawerOpen(false);
      setExpenseForm({
        vehicle_id: '',
        trip_id: '',
        expense_type: 'Toll',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to add expense.');
    }
  };

  // Operational cost sums
  const totalFuelCost = expenses
    .filter(e => e.expense_type === 'Fuel')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
  const totalMaintenanceCost = expenses
    .filter(e => e.expense_type === 'Maintenance' || e.expense_type === 'Repair')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalOtherCost = expenses
    .filter(e => e.expense_type !== 'Fuel' && e.expense_type !== 'Maintenance' && e.expense_type !== 'Repair')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherCost;

  return (
    <div className="financial-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1 className="page-title">Fuel & Expenses</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary-custom" onClick={() => setIsFuelDrawerOpen(true)}>
            <FiPlus /> Log Fuel
          </button>
          <button className="btn-primary-custom" onClick={() => setIsExpenseDrawerOpen(true)}>
            <FiDollarSign /> Add Expense
          </button>
        </div>
      </div>

      {error && <div className="text-danger p-3 glass-card">{error}</div>}

      {/* Summary KPI Cards */}
      <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL OPERATIONAL COST</label>
          <h2 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-accent)' }}>${totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>FUEL SPENDING</label>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MAINTENANCE & REPAIR</label>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OTHER COSTS (TOLL/MISC)</label>
          <h2 style={{ margin: '0.5rem 0 0 0' }}>${totalOtherCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flex: 1 }}>
        {/* Fuel Logs Grid */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>Fuel Log Records</h3>
          <div className="table-responsive" style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {loading ? (
              <div className="text-center p-3">Loading fuel logs...</div>
            ) : fuelLogs.length === 0 ? (
              <div className="text-center p-3 text-muted-custom">No fuel logs found.</div>
            ) : (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Veh ID</th>
                    <th>Date</th>
                    <th>Liters</th>
                    <th>Price/L</th>
                    <th>Total Cost</th>
                    <th>Station</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map(fl => {
                    const vehObj = vehicles.find(v => v.id === fl.vehicle_id);
                    const vehReg = vehObj ? vehObj.registration_number : `Veh #${fl.vehicle_id}`;
                    return (
                      <tr key={fl.id}>
                        <td>{vehReg}</td>
                        <td>{new Date(fl.filled_date).toLocaleDateString()}</td>
                        <td>{fl.liters} L</td>
                        <td>${fl.price_per_liter}</td>
                        <td className="text-primary-custom font-weight-bold">${parseFloat(fl.total_cost).toFixed(2)}</td>
                        <td>{fl.fuel_station || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* General Expenses Grid */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>General Expenses</h3>
          <div className="table-responsive" style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
            {loading ? (
              <div className="text-center p-3">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center p-3 text-muted-custom">No expenses found.</div>
            ) : (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Veh/Trip</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => {
                    const vehObj = vehicles.find(v => v.id === exp.vehicle_id);
                    const vehReg = vehObj ? vehObj.registration_number : '';
                    const displaySource = vehReg ? `Veh: ${vehReg}` : exp.trip_id ? `Trip: ${exp.trip_id}` : 'General';
                    return (
                      <tr key={exp.id}>
                        <td>{displaySource}</td>
                        <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                        <td>{exp.expense_type}</td>
                        <td className="text-primary-custom font-weight-bold">${parseFloat(exp.amount).toFixed(2)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.description || 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Log Fuel Drawer */}
      <div className={`drawer-overlay ${isFuelDrawerOpen ? 'open' : ''}`} onClick={() => setIsFuelDrawerOpen(false)}>
        <div className={`drawer-panel ${isFuelDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isFuelDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>Log Fuel Fill-Up</h2>
            <button className="icon-btn" onClick={() => setIsFuelDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleFuelSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SELECT VEHICLE *</label>
                <select 
                  value={fuelForm.vehicle_id} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  required 
                  className="auth-input"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} - {v.manufacturer} {v.vehicle_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LINKED DISPATCH / TRIP (OPTIONAL)</label>
                <select 
                  value={fuelForm.trip_id} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, trip_id: e.target.value }))}
                  className="auth-input"
                >
                  <option value="">Select Trip</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.trip_number || `TRIP-${t.id}`} ({t.source_location} &rarr; {t.destination_location})</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LITERS FILLED *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fuelForm.liters} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, liters: e.target.value }))}
                  required 
                  className="auth-input"
                  placeholder="e.g. 45.5"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PRICE PER LITER ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fuelForm.price_per_liter} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, price_per_liter: e.target.value }))}
                  required 
                  className="auth-input"
                  placeholder="e.g. 1.45"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CURRENT ODOMETER READOUT (KM)</label>
                <input 
                  type="number" 
                  value={fuelForm.odometer} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, odometer: e.target.value }))}
                  className="auth-input"
                  placeholder="e.g. 14200"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>FUEL STATION VENDOR</label>
                <input 
                  type="text" 
                  value={fuelForm.fuel_station} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, fuel_station: e.target.value }))}
                  className="auth-input"
                  placeholder="e.g. Shell City Center"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DATE FILLED *</label>
                <input 
                  type="date" 
                  value={fuelForm.filled_date} 
                  onChange={(e) => setFuelForm(prev => ({ ...prev, filled_date: e.target.value }))}
                  required 
                  className="auth-input"
                />
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsFuelDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Save Fuel Log</button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Expense Drawer */}
      <div className={`drawer-overlay ${isExpenseDrawerOpen ? 'open' : ''}`} onClick={() => setIsExpenseDrawerOpen(false)}>
        <div className={`drawer-panel ${isExpenseDrawerOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()} style={{ width: '500px', right: isExpenseDrawerOpen ? '0' : '-500px' }}>
          <div className="drawer-header">
            <h2>Add General Expense</h2>
            <button className="icon-btn" onClick={() => setIsExpenseDrawerOpen(false)}><FiX /></button>
          </div>
          <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
            <div className="drawer-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {formError && <div className="text-danger mb-3">{formError}</div>}

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EXPENSE TYPE *</label>
                <select 
                  value={expenseForm.expense_type} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_type: e.target.value }))}
                  required 
                  className="auth-input"
                >
                  <option value="Toll">Toll Fee</option>
                  <option value="Maintenance">Maintenance Log</option>
                  <option value="Insurance">Insurance Premium</option>
                  <option value="Repair">Repair Work</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LINK TO VEHICLE (OPTIONAL)</label>
                <select 
                  value={expenseForm.vehicle_id} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="auth-input"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>LINK TO TRIP (OPTIONAL)</label>
                <select 
                  value={expenseForm.trip_id} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, trip_id: e.target.value }))}
                  className="auth-input"
                >
                  <option value="">Select Trip</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.trip_number || `TRIP-${t.id}`}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AMOUNT ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={expenseForm.amount} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  required 
                  className="auth-input"
                  placeholder="e.g. 50.00"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DATE PAID *</label>
                <input 
                  type="date" 
                  value={expenseForm.expense_date} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                  required 
                  className="auth-input"
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>REMARKS / DESCRIPTION</label>
                <textarea 
                  value={expenseForm.description} 
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="auth-input" 
                  rows="3"
                  placeholder="Bridge toll fee, AC parts, etc."
                />
              </div>
            </div>
            
            <div className="drawer-footer" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn-secondary-custom" onClick={() => setIsExpenseDrawerOpen(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary-custom" style={{ flex: 1 }}>Record Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FuelExpenses;
