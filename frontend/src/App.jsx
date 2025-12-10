import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, Plus, LogOut, LayoutDashboard, Wallet, User, Search, 
  Calendar, AlertCircle, TrendingUp, Tag, Camera, X, ChevronRight 
} from 'lucide-react';

// --- CONFIG ---
const API_URL = '/api'; // Vite Proxy handles this

// --- COMPONENTS ---

// 1. LOGIN / SIGNUP SCREEN
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Not Specified');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      if (isLogin) {
        const response = await axios.post(`${API_URL}/token`, formData);
        localStorage.setItem('token', response.data.access_token);
        window.location.href = '/dashboard';
      } else {
        await axios.post(`${API_URL}/signup`, {
          username,
          password,
          full_name: fullName,
          age: parseInt(age) || 0,
          gender
        });
        // Auto-login
        const loginRes = await axios.post(`${API_URL}/token`, formData);
        localStorage.setItem('token', loginRes.data.access_token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-neutral-950 to-neutral-950">
      <div className="w-full max-w-md bg-neutral-900/80 border border-red-900/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="bg-gradient-to-b from-red-900 to-red-950 p-8 text-center border-b border-red-800/50">
            <div className="mx-auto bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
                 <Wallet className="text-white h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {isLogin ? 'Access Command' : 'Initialize Profile'}
            </h2>
            <p className="text-red-200/60 mt-2 text-sm">Secure Financial Telemetry</p>
        </div>
        
        <div className="p-8">
            {error && (
                <div className="mb-6 bg-red-950/50 border-l-4 border-red-600 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Username</label>
                  <input 
                    type="text" 
                    className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      type="text" 
                      className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1/2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Age</label>
                        <input 
                          type="number" 
                          className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          required
                        />
                     </div>
                     <div className="w-1/2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Gender</label>
                        <select 
                          className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                     </div>
                  </div>
                </>
              )}

              <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Password</label>
                  <input 
                    type="password" 
                    className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
              </div>

              <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-xl transition active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-red-900/20 mt-4"
              >
                  {loading ? 'Processing...' : (isLogin ? 'AUTHENTICATE' : 'REGISTER')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-neutral-500 hover:text-red-400 text-sm transition-colors"
              >
                {isLogin ? "Need access? Create Protocol ID" : "Already authorized? Login"}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// 2. DASHBOARD
const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  
  // New Card State
  const [newCard, setNewCard] = useState({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', statement_day: 1, due_day: 20 });
  
  // New Txn State
  const [newTxn, setNewTxn] = useState({ description: '', amount: '', type: 'DEBIT', card_id: '', tag: '' });

  const fetchCards = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/cards/`, { headers: { Authorization: `Bearer ${token}` } });
      setCards(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleAddCard = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/cards/`, {
        name: newCard.name,
        bank: newCard.bank,
        network: newCard.network,
        total_limit: parseFloat(newCard.limit),
        manual_limit: newCard.manual_limit ? parseFloat(newCard.manual_limit) : parseFloat(newCard.limit),
        statement_date: parseInt(newCard.statement_day),
        payment_due_date: parseInt(newCard.due_day)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddCard(false);
      fetchCards();
    } catch (err) { alert('Failed to add card'); }
  };

  const handleAddTxn = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/transactions/`, {
        description: newTxn.description,
        amount: parseFloat(newTxn.amount),
        type: newTxn.type,
        card_id: parseInt(newTxn.card_id),
        date: new Date().toISOString(),
        tag_name: newTxn.tag // Sending tag name directly to backend to handle logic
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddTxn(false);
      alert('Transaction logged');
    } catch (err) { alert('Failed to add transaction'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); window.location.href = '/'; };

  // --- RENDER HELPERS ---
  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-red-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 pb-24 md:pb-0 md:pl-64 text-neutral-200 font-sans">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-red-900/20 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
             <div className="bg-gradient-to-br from-red-700 to-red-900 p-2 rounded-lg shadow-lg shadow-red-900/20">
                 <Wallet className="text-white w-6 h-6" />
             </div>
             <span className="font-bold text-xl text-white tracking-tight">CC<span className="text-red-600">Track</span></span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {['Dashboard', 'My Cards', 'Analytics', 'Settings'].map((item, i) => (
               <a key={item} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${i===0 ? 'bg-red-900/20 text-red-500 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                {[<LayoutDashboard/>, <CreditCard/>, <TrendingUp/>, <User/>][i]}
                {item}
            </a> 
            ))}
        </nav>
        <div className="p-4 border-t border-neutral-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-xl transition-colors">
                <LogOut size={20} /> Terminate Session
            </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-neutral-900 border-b border-red-900/20 p-4 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-red-800 p-1.5 rounded-lg"><Wallet className="text-white w-5 h-5" /></div>
             <span className="font-bold text-lg text-white">CC Track</span>
          </div>
          <button onClick={handleLogout} className="text-neutral-500"><LogOut size={24} /></button>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* OVERVIEW HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Command Center</h1>
                <p className="text-neutral-500">Financial status overview</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddCard(true)} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-xl font-medium border border-neutral-700 transition-all">
                  <CreditCard size={18} /> Add Card
              </button>
              <button onClick={() => setShowAddTxn(true)} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-red-900/30 transition-all">
                  <Plus size={18} /> Add Txn
              </button>
            </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-red-900 to-neutral-900 rounded-2xl p-6 text-white shadow-2xl border border-red-800/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-red-200/70 text-sm font-medium mb-1">Total Available Limit</p>
                <h2 className="text-4xl font-bold tracking-tight mt-2">$24,500</h2>
                <div className="mt-4 flex items-center gap-2 text-red-300 bg-red-950/50 w-fit px-3 py-1 rounded-full text-xs border border-red-900/50">
                    <TrendingUp size={14}/> 12% Utilization
                </div>
            </div>
             <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-neutral-500 text-sm font-medium">Upcoming Dues</p>
                   <AlertCircle className="text-amber-500 w-5 h-5" />
                </div>
                <h2 className="text-3xl font-bold text-white">$1,240.50</h2>
                <p className="text-xs text-amber-500/80 mt-2 font-medium">• Due in 5 days (Amex Gold)</p>
            </div>
        </div>

        {/* CARDS GRID */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Active Cards</h3>
            </div>
            {loading ? (
                <div className="text-center py-12 text-neutral-600 animate-pulse">Scanning wallet protocol...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <div key={card.id} className="group bg-neutral-900 p-5 rounded-2xl shadow-lg border border-neutral-800 hover:border-red-900/50 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            
                            {/* Card Header */}
                            <div className="relative z-10 flex items-start justify-between mb-8">
                                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                                    <CreditCard className="text-red-500 w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md border border-neutral-700">{card.network}</span>
                            </div>
                            
                            {/* Card Details */}
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-lg tracking-wide">{card.name}</h4>
                                <p className="text-sm text-neutral-500 mb-4">{card.bank} •••• {card.last_4 || '0000'}</p>
                                
                                <div className="flex justify-between items-end border-t border-neutral-800 pt-4">
                                    <div>
                                        <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Total Limit</p>
                                        <p className="font-bold text-white">${card.total_limit.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                         <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">Cycle</p>
                                         <p className="text-xs text-neutral-300">{card.statement_date}th - {card.payment_due_date}th</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* --- MODALS --- */}
      
      {/* ADD CARD MODAL */}
      {showAddCard && (
        <Modal title="Add New Card" onClose={() => setShowAddCard(false)}>
           <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold">Card Nickname</label>
                 <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-red-600 outline-none mt-1" 
                    placeholder="e.g. Amex Gold" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Bank</label>
                    <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="Chase" value={newCard.bank} onChange={e => setNewCard({...newCard, bank: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Network</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newCard.network} onChange={e => setNewCard({...newCard, network: e.target.value})}>
                        <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
                    </select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Total Limit</label>
                    <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="50000" value={newCard.limit} onChange={e => setNewCard({...newCard, limit: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-red-400 uppercase font-bold">Manual Limit</label>
                    <input type="number" className="w-full bg-neutral-800 border border-red-900/50 rounded-lg p-3 text-white mt-1" 
                        placeholder="Optional" value={newCard.manual_limit} onChange={e => setNewCard({...newCard, manual_limit: e.target.value})} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Statement Day</label>
                    <input type="number" max="31" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="1" value={newCard.statement_day} onChange={e => setNewCard({...newCard, statement_day: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Due Day</label>
                    <input type="number" max="31" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="20" value={newCard.due_day} onChange={e => setNewCard({...newCard, due_day: e.target.value})} required />
                  </div>
              </div>
              <button type="submit" className="w-full bg-red-700 text-white font-bold py-3 rounded-xl hover:bg-red-600 mt-2">Save Card Protocol</button>
           </form>
        </Modal>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showAddTxn && (
        <Modal title="Log Transaction" onClose={() => setShowAddTxn(false)}>
           <form onSubmit={handleAddTxn} className="space-y-4">
              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold">Select Card</label>
                 <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                    value={newTxn.card_id} onChange={e => setNewTxn({...newTxn, card_id: e.target.value})} required>
                    <option value="">-- Choose Source --</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.last_4 || 'XXXX'})</option>)}
                 </select>
              </div>
              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold">Description</label>
                 <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                    placeholder="Starbucks, AWS, etc." value={newTxn.description} onChange={e => setNewTxn({...newTxn, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Amount</label>
                    <input type="number" step="0.01" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="0.00" value={newTxn.amount} onChange={e => setNewTxn({...newTxn, amount: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Type</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newTxn.type} onChange={e => setNewTxn({...newTxn, type: e.target.value})}>
                        <option value="DEBIT">Expense</option>
                        <option value="CREDIT">Payment/Refund</option>
                    </select>
                  </div>
              </div>
              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold flex items-center gap-2"><Tag size={12}/> Tag (Auto-saved)</label>
                 <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                    placeholder="Dining, Travel, Utilities..." value={newTxn.tag} onChange={e => setNewTxn({...newTxn, tag: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-red-700 text-white font-bold py-3 rounded-xl hover:bg-red-600 mt-2">Execute Log</button>
           </form>
        </Modal>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-neutral-800 flex justify-around p-3 z-30 pb-safe">
        <a href="#" className="flex flex-col items-center gap-1 text-red-500"><LayoutDashboard size={24} /><span className="text-[10px]">Home</span></a>
        <button onClick={() => setShowAddTxn(true)} className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white">
            <div className="bg-red-700 p-3 rounded-full -mt-8 border-4 border-neutral-950 shadow-lg"><Plus size={24} className="text-white"/></div>
        </button>
        <a href="#" className="flex flex-col items-center gap-1 text-neutral-400"><CreditCard size={24} /><span className="text-[10px]">Cards</span></a>
      </nav>
    </div>
  );
};

// --- APP ROUTER ---
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;