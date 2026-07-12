import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

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
