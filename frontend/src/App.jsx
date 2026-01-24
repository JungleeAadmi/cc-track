import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Lending from './pages/Lending';
import Salary from './pages/Salary';
import Subscriptions from './pages/Subscriptions';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

const isAuthed = () => !!localStorage.getItem('token');

function Protected({ children }) {
  return isAuthed() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        isAuthed() ? <Navigate to="/dashboard" replace /> : <Login />
      } />

      <Route path="/signup" element={
        isAuthed() ? <Navigate to="/dashboard" replace /> : <Signup />
      } />

      <Route path="/" element={<Protected><Navbar /></Protected>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="lending" element={<Lending />} />
        <Route path="salary" element={<Salary />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
