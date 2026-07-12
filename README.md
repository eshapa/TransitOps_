# TransitOps: Next-Gen Fleet Management System

TransitOps is a modern, full-stack fleet management and logistics platform designed for scalability, security, and exceptional user experience. Built with a stunning dark-mode Glassmorphism UI, it provides real-time insights and operational control over vehicles, drivers, trips, maintenance, and financials.

## 🌟 Unique Highlight Features

This project goes beyond standard CRUD operations by implementing advanced, intelligent systems:

### 1. ⛽ Intelligent Fuel Anomaly Detection Engine
A robust backend rules-engine that analyzes every fuel log against historical vehicle data and fleet-wide averages to automatically flag suspicious activities:
- **Capacity Violations:** Detects if logged liters exceed the vehicle's physical maximum tank capacity.
- **Fuel Theft Indicators:** Flags instances where a vehicle's km/L efficiency drops significantly below the fleet average.
- **Odometer Tampering:** Flags impossibly high km/L ratings.
- **Duplicate Entry Detection:** Prevents accidental or malicious double-logging within a tight time window.
- **Idle Refueling:** Flags fuel logged on days where the vehicle had no dispatched trips.
- **Price Gouging Alerts:** Detects abnormal price-per-liter inputs.

### 2. 🗺️ Live Vehicle Tracking Map
An interactive, real-time map built with Leaflet that plots dispatched trips visually. 
- **Dynamic Geocoding:** Automatically maps standard city names (e.g., Delhi, Mumbai, Pune, Munich) to actual GPS coordinates.
- **Simulated Progress:** Interpolates the vehicle's current position along a dashed route line based on actual vs. planned distance.
- **Status Indicators:** Map markers dynamically change color based on the vehicle's real-time progress (e.g., Green for moving, Gold for delayed).

### 3. 🛡️ Deep Role-Based Access Control (RBAC)
Security is baked into the core, providing distinct, tailored experiences and API access for different roles:
- **Fleet Managers:** Full CRUD access to all modules, dispatching, and system analytics.
- **Drivers:** Restricted to a self-service profile dashboard. Can only view their own assigned trips and update their real-time availability status.
- **Safety Officers:** Dedicated access to monitor and update Driver Safety Scores and compliance documents.
- **Financial Analysts:** Restricted access to view fuel logs, expenses, and financial ROI reports.

### 4. 🎨 Premium Glassmorphism Architecture
The frontend shuns generic styling for a highly polished, premium dark-mode aesthetic featuring:
- Frosted glass panels and layered depth.
- Smooth micro-animations and transitions.
- A highly responsive grid layout for KPIs and operational analytics.

---

## ⚙️ Core Functional Modules (Problem Statement Requirements)

TransitOps fulfills and exceeds all baseline requirements for modern transport operations:

- **Dashboard & KPIs:** Centralized view of Active Vehicles, Fleet Utilization (%), Drivers On Duty, and Pending Trips with region/status filters.
- **Vehicle Registry:** Complete lifecycle management. Tracks Odometer, Acquisition Cost, Load Capacity, and strict status constraints (Available, On Trip, In Shop, Retired).
- **Driver Management:** Profile tracking including License Expiry validation, Contact details, and Safety Scores.
- **Trip Lifecycle Management:** End-to-end dispatching (Draft → Dispatched → Completed). Enforces constraints like cargo weight limits and prevents dispatching suspended drivers or in-shop vehicles.
- **Automated Status Transitions:** Dispatching a trip automatically marks the vehicle and driver as *On Trip*. Logging maintenance automatically marks the vehicle as *In Shop*.
- **Maintenance Workflow:** Tracks service logs, costs, vendors, and completion dates.
- **Expense & ROI Analytics:** Computes total operational costs (Fuel + Maintenance) and calculates Vehicle ROI based on revenue vs. acquisition cost.

---

## 🛠️ Technology Stack

- **Frontend:** React, Vite, React-Router, Recharts (Data Visualization), React-Leaflet (Mapping).
- **Backend:** Node.js, Express, MySQL2 (TiDB Cloud integration).
- **Security:** JWT Authentication, Bcrypt Password Hashing, Helmet (HTTP Headers), Express Rate Limit, Joi (Input Validation).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Database (Local or TiDB Cloud)

### Installation

1. **Clone the repository**
2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file with DB credentials and JWT_SECRET
   npm run seed # Seeds the database with default roles, users, and mock data
   npm start
   ```
3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔒 Security Posture
- All database interactions utilize parameterized queries (`?`) to prevent SQL Injection.
- Sensitive backend routes are protected by both `authMiddleware` (JWT verification) and `authorizeRoles` middleware.
- The `seed.js` script handles automatic provisioning of core role hierarchies without manual intervention.