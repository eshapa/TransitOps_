export const kpiData = [
  { title: 'Active Vehicles', value: '142', change: '+5.4%', status: 'success' },
  { title: 'Available Vehicles', value: '38', change: '-2.1%', status: 'warning' },
  { title: 'In Maintenance', value: '12', change: '0%', status: 'neutral' },
  { title: 'Active Trips', value: '115', change: '+12%', status: 'success' },
  { title: 'Fleet Utilization', value: '85%', change: '+3%', status: 'success' },
  { title: 'Monthly Revenue', value: '$245k', change: '+8.4%', status: 'success' },
];

export const utilizationData = [
  { name: 'Mon', utilization: 82 },
  { name: 'Tue', utilization: 84 },
  { name: 'Wed', utilization: 87 },
  { name: 'Thu', utilization: 85 },
  { name: 'Fri', utilization: 92 },
  { name: 'Sat', utilization: 75 },
  { name: 'Sun', utilization: 68 },
];

export const statusDistribution = [
  { name: 'Active', value: 142, color: '#10b981' },
  { name: 'Available', value: 38, color: '#0066ff' },
  { name: 'Maintenance', value: 12, color: '#f59e0b' },
  { name: 'Out of Service', value: 4, color: '#ef4444' },
];

export const recentTrips = [
  { id: 'TRP-1042', vehicle: 'Volvo VNL 860', driver: 'Sarah Jenkins', origin: 'Chicago, IL', dest: 'Dallas, TX', status: 'In Transit' },
  { id: 'TRP-1043', vehicle: 'Freightliner Cascadia', driver: 'Mike Torres', origin: 'Atlanta, GA', dest: 'Miami, FL', status: 'Completed' },
  { id: 'TRP-1044', vehicle: 'Peterbilt 579', driver: 'David Chen', origin: 'Seattle, WA', dest: 'Denver, CO', status: 'Dispatched' },
  { id: 'TRP-1045', vehicle: 'Kenworth T680', driver: 'Amanda Woods', origin: 'Los Angeles, CA', dest: 'Phoenix, AZ', status: 'Delayed' },
];
