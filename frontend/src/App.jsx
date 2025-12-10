import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Plus, LogOut, LayoutDashboard, Wallet, User, Search } from 'lucide-react';

// --- FILE: src/pages/Login.jsx ---
// Copy the code below into src/pages/Login.jsx for your repo
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      // Pointing to backend API
      const response = await axios.post('/api/token', formData);
      
      localStorage.setItem('token', response.data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
            <div className="mx-auto bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                 <Wallet className="text-white h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-blue-100 mt-2 text-sm">Sign in to manage your finances</p>
        </div>
        
        <div className="p-8">
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                <input 
                type="text" 
                className="block w-full rounded-lg border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all outline-none"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <input 
                type="password" 
                className="block w-full rounded-lg border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>
            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-blue-600/30"
            >
                {loading ? 'Signing in...' : 'Sign In'}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};

// --- FILE: src/pages/Dashboard.jsx ---
// Copy the code below into src/pages/Dashboard.jsx for your repo
const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get('/api/cards/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCards(res.data);
      } catch (err) {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 md:pl-64">
      {/* Sidebar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                 <Wallet className="text-white w-6 h-6" />
             </div>
             <span className="font-bold text-xl text-gray-800 tracking-tight">CC Track</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium transition-colors">
                <LayoutDashboard size={20} />
                Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                <CreditCard size={20} />
                My Cards
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                <User size={20} />
                Profile
            </a>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
                <LogOut size={20} />
                Sign Out
            </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-blue-600 p-1.5 rounded-lg">
                 <Wallet className="text-white w-5 h-5" />
             </div>
             <span className="font-bold text-lg text-gray-800">CC Track</span>
          </div>
          <button onClick={handleLogout} className="text-gray-500"><LogOut size={24} /></button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Overview</h1>
                <p className="text-gray-500">Track your spending and limits</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                <Plus size={20} />
                Add Transaction
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/10">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Limit Available</p>
                <h2 className="text-3xl font-bold tracking-tight">$12,450.00</h2>
                <div className="mt-4 flex items-center gap-2">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">12% Utilization</span>
                </div>
            </div>
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-sm font-medium mb-1">Upcoming Payments</p>
                <h2 className="text-3xl font-bold text-gray-900">$240.50</h2>
                <p className="text-xs text-orange-600 mt-2 font-medium">• Due in 5 days (Amex)</p>
            </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search transactions..." className="w-full py-2 outline-none text-gray-700" />
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Filter</button>
        </div>

        {/* Cards List */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Your Cards</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">Manage Cards</button>
            </div>
            
            {loading ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading your wallet...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.length === 0 ? (
                        <div className="col-span-full bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                            <CreditCard className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                            <p>No cards added yet.</p>
                            <button className="mt-4 text-blue-600 font-medium">Add your first card</button>
                        </div>
                    ) : (
                        cards.map(card => (
                            <div key={card.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10 flex items-start justify-between mb-4">
                                    <div className="bg-gray-50 p-3 rounded-xl">
                                        <CreditCard className="text-gray-700 w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{card.network}</span>
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-gray-800 text-lg">{card.name}</h4>
                                    <p className="text-sm text-gray-500 mb-3">{card.bank} •••• {card.last_4 || '0000'}</p>
                                    <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Limit</p>
                                            <p className="font-bold text-gray-900">${card.total_limit.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-30 pb-safe">
        <a href="#" className="flex flex-col items-center gap-1 text-blue-600">
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Home</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <CreditCard size={24} />
            <span className="text-[10px] font-medium">Cards</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <Plus size={32} className="text-blue-600 -mt-6 bg-white rounded-full shadow-lg p-1 border border-gray-100" />
            <span className="text-[10px] font-medium">Add</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <User size={24} />
            <span className="text-[10px] font-medium">Profile</span>
        </a>
      </nav>
    </div>
  );
};

// --- Main App & Routing ---
// Keep this in src/App.jsx
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;