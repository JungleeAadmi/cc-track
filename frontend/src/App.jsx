import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout'; // We will build this in Phase 4

// Placeholder Imports for Pages (We will build these in Phase 4)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cards from './pages/Cards';
import Transactions from './pages/Transactions';
import Lending from './pages/Lending';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import Salary from './pages/Salary'; // If you have a separate page

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-4 text-center text-slate-400">Loading app...</div>;
  
  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/lending" element={<Lending />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;