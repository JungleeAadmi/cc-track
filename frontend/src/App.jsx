import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, Plus, LogOut, LayoutDashboard, Wallet, User, Search, 
  TrendingUp, Tag, X, Camera, Image as ImageIcon
} from 'lucide-react';

const API_URL = '/api';

// --- SHARED COMPONENTS (Moved Outside to fix Focus Bug) ---
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-neutral-900 border border-red-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
      <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20}/></button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// --- LOGIN COMPONENT ---
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

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
        await axios.post(`${API_URL}/signup`, { username, password, full_name: fullName });
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
                 <img src="/android-chrome-192x192.png" alt="Logo" className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide lowercase">cc-track</h2>
            <p className="text-red-200/60 mt-2 text-sm">financial telemetry</p>
        </div>
        
        <div className="p-8">
            {error && <div className="mb-6 bg-red-950/50 border-l-4 border-red-600 p-4 text-sm text-red-200">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Username</label>
                  <input type="text" className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                    value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              )}
              <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Password</label>
                  <input type="password" className="block w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-white focus:border-red-600 outline-none"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-xl transition mt-4">
                  {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-neutral-500 hover:text-red-400 text-sm transition-colors">
                {isLogin ? "New user? Create account" : "Have an account? Login"}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  
  // Data State
  const [newCard, setNewCard] = useState({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', currency: 'USD', statement_day: 1, due_day: 20 });
  const [newTxn, setNewTxn] = useState({ description: '', amount: '', type: 'DEBIT', card_id: '', tag: '' });

  // Calculated Totals
  const totalAvailable = cards.reduce((acc, card) => acc + (card.available || 0), 0);
  const totalSpent = cards.reduce((acc, card) => acc + (card.spent || 0), 0);

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
        currency: newCard.currency,
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
        tag_name: newTxn.tag
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddTxn(false);
      fetchCards(); // Refresh to update limits
      alert('Transaction logged');
    } catch (err) { alert('Failed to add transaction'); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); window.location.href = '/'; };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24 md:pb-0 md:pl-64 text-neutral-200 font-sans">
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-red-900/20 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
             <div className="bg-gradient-to-br from-red-700 to-red-900 p-2 rounded-lg shadow-lg shadow-red-900/20">
                 <Wallet className="text-white w-6 h-6" />
             </div>
             <span className="font-bold text-xl text-white tracking-tight lowercase">cc<span className="text-red-600">track</span></span>
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
             <span className="font-bold text-lg text-white lowercase">cc-track</span>
          </div>
          <button onClick={handleLogout} className="text-neutral-500"><LogOut size={24} /></button>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
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

        {/* METRICS - Redesigned Short Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-gradient-to-br from-red-900 to-neutral-900 rounded-xl p-5 text-white border border-red-800/30">
                <p className="text-red-200/70 text-xs font-bold uppercase tracking-wider">Total Available</p>
                <h2 className="text-2xl font-bold tracking-tight mt-1">${totalAvailable.toLocaleString()}</h2>
            </div>
             <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Total Spent</p>
                <h2 className="text-2xl font-bold text-white mt-1">${totalSpent.toLocaleString()}</h2>
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
                            
                            <div className="relative z-10 flex items-start justify-between mb-6">
                                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                                    <CreditCard className="text-red-500 w-6 h-6" />
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md border border-neutral-700 block mb-1">{card.network}</span>
                                  <span className="text-[10px] text-neutral-500 uppercase">{card.currency}</span>
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-lg tracking-wide mb-1">{card.name}</h4>
                                <p className="text-sm text-neutral-500 mb-4">{card.bank} •••• {card.last_4 || 'XXXX'}</p>
                                
                                <div className="bg-black/20 rounded-lg p-3 mb-3 border border-neutral-800/50">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-neutral-400">Spent</span>
                                    <span className="text-white font-medium">${card.spent?.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                     <div className="bg-red-600 h-full" style={{width: `${Math.min((card.spent / card.total_limit) * 100, 100)}%`}}></div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-end text-xs text-neutral-500">
                                    <div>Limit: ${card.total_limit.toLocaleString()}</div>
                                    <div>Due: {card.payment_due_date}th</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* --- MODALS (Moved Outside) --- */}
      
      {showAddCard && (
        <Modal title="Add New Card" onClose={() => setShowAddCard(false)}>
           <form onSubmit={handleAddCard} className="space-y-4">
              {/* Card Capture UI (Camera/Gallery) */}
              <div className="flex gap-2 mb-4">
                <button type="button" className="flex-1 bg-neutral-800 p-3 rounded-xl border border-dashed border-neutral-600 text-neutral-400 hover:text-white hover:border-red-500 flex flex-col items-center gap-1">
                   <Camera size={20} />
                   <span className="text-xs">Scan Front</span>
                   <input type="file" accept="image/*" capture="environment" className="hidden" />
                </button>
                <button type="button" className="flex-1 bg-neutral-800 p-3 rounded-xl border border-dashed border-neutral-600 text-neutral-400 hover:text-white hover:border-red-500 flex flex-col items-center gap-1">
                   <ImageIcon size={20} />
                   <span className="text-xs">Upload Back</span>
                   <input type="file" accept="image/*" className="hidden" />
                </button>
              </div>

              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold">Card Nickname</label>
                 <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-red-600 outline-none mt-1" 
                    placeholder="e.g. Amex Gold" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Currency</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newCard.currency} onChange={e => setNewCard({...newCard, currency: e.target.value})}>
                        <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>JPY</option>
                    </select>
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
                    <label className="text-xs text-neutral-500 uppercase font-bold">Bank</label>
                    <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="Chase" value={newCard.bank} onChange={e => setNewCard({...newCard, bank: e.target.value})} required />
                  </div>
                  <div>
                     {/* Placeholder for Day Selects */}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Statement Day</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newCard.statement_day} onChange={e => setNewCard({...newCard, statement_day: e.target.value})}>
                        {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase font-bold">Due Day</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newCard.due_day} onChange={e => setNewCard({...newCard, due_day: e.target.value})}>
                        {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                    </select>
                  </div>
              </div>
              <button type="submit" className="w-full bg-red-700 text-white font-bold py-3 rounded-xl hover:bg-red-600 mt-2">Save Card</button>
           </form>
        </Modal>
      )}

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