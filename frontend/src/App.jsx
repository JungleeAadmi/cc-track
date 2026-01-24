import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Lending from './pages/Lending';
import Settings from './pages/Settings';

const isAuthenticated = () => !!localStorage.getItem('token');

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />
      } />

      <Route path="/dashboard" element={
        isAuthenticated() ? <Dashboard /> : <Navigate to="/" />
      } />

      <Route path="/transactions" element={
        isAuthenticated() ? <Transactions /> : <Navigate to="/" />
      } />

      <Route path="/lending" element={
        isAuthenticated() ? <Lending /> : <Navigate to="/" />
      } />

      <Route path="/settings" element={
        isAuthenticated() ? <Settings /> : <Navigate to="/" />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
