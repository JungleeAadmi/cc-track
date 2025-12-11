import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, Plus, LogOut, LayoutDashboard, Wallet, User, 
  TrendingUp, Tag, X, Camera, Image as ImageIcon, Settings, Trash2, Save, RotateCcw
} from 'lucide-react';

const API_URL = '/api';

// --- HELPER: Image Resizer & Compressor ---
const processImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Max dimension 800px to keep size small (~50-100KB)
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress to JPEG 70% quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

// --- SHARED COMPONENTS ---
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-neutral-900 border border-red-900/40 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
      <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20}/></button>
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
);

// --- SETTINGS COMPONENT ---
const SettingsPage = ({ onClose, onUpdateUser }) => {
  const [user, setUser] = useState({ full_name: '', currency: 'USD' });
  const [password, setPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        setUser(res.data);
      } catch (err) { console.error(err); }
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_URL}/users/me`, {
        full_name: user.full_name,
        currency: user.currency,
        password: password || undefined
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onUpdateUser(res.data); // Update global state
      alert('Settings updated!');
    } catch (err) { alert('Failed to update'); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return; 
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
       <div>
         <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
         <form onSubmit={handleUpdate} className="space-y-4 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
             <div>
                <label className="text-xs text-neutral-500 font-bold uppercase">Display Name</label>
                <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1" 
                  value={user.full_name || ''} onChange={e => setUser({...user, full_name: e.target.value})} />
             </div>
             <div>
                <label className="text-xs text-neutral-500 font-bold uppercase">Default Currency</label>
                <select className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1"
                  value={user.currency || 'USD'} onChange={e => setUser({...user, currency: e.target.value})}>
                   <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>JPY</option>
                </select>
             </div>
             <div>
                <label className="text-xs text-neutral-500 font-bold uppercase">New Password (Optional)</label>
                <input type="password" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1" 
                   value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
             </div>
             <button type="submit" className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <Save size={16}/> Save Changes
             </button>
         </form>
       </div>

       <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/30">
          <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2"><Trash2 size={20}/> Danger Zone</h3>
          <p className="text-neutral-400 text-sm mb-4">Type DELETE to confirm account removal.</p>
          <div className="flex gap-4">
             <input className="bg-neutral-950 border border-red-900/50 rounded-lg p-3 text-white text-sm flex-1" 
               placeholder="DELETE" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
             <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'} 
               className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold">
               Delete Account
             </button>
          </div>
       </div>
    </div>
  );
};

// --- LOGIN ---
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
    } catch (err) { setError(err.response?.data?.detail || 'Authentication failed.'); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-neutral-950 to-neutral-950">
      <div className="w-full max-w-md bg-neutral-900/80 border border-red-900/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="bg-gradient-to-b from-red-900 to-red-950 p-8 text-center border-b border-red-800/50">
            <div className="mx-auto w-20 h-20 flex items-center justify-center mb-4">
                 <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" onError={(e) => e.target.src='/favicon.ico'} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-wide lowercase">cc-track</h2>
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

// --- DASHBOARD ---
const Dashboard = ({ activeView, currentUser, onUpdateUser }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  
  // Data State
  const [newCard, setNewCard] = useState({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', statement_day: 1, due_day: 20, image_front: '', image_back: '' });
  const [newTxn, setNewTxn] = useState({ description: '', amount: '', type: 'DEBIT', card_id: '', tag: '' });

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

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

  // NEW: Image processing with compression
  const handleImageUpload = async (e, side) => {
    const file = e.target.files[0];
    if (file) {
      // 5MB limit check (pre-compression)
      if(file.size > 5 * 1024 * 1024) {
         alert("Original image too large. Attempting to compress...");
      }
      try {
        const compressedBase64 = await processImage(file);
        setNewCard(prev => ({ ...prev, [side]: compressedBase64 }));
      } catch (err) {
        alert("Failed to process image.");
      }
    }
  };

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
        payment_due_date: parseInt(newCard.due_day),
        image_front: newCard.image_front,
        image_back: newCard.image_back
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddCard(false);
      fetchCards();
      // Reset form
      setNewCard({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', statement_day: 1, due_day: 20, image_front: '', image_back: '' });
    } catch (err) { alert('Failed to add card. Try taking a lower resolution photo if problem persists.'); }
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
      fetchCards();
      alert('Transaction logged');
    } catch (err) { alert('Failed to add transaction'); }
  };
  
  const handleDeleteCard = async (id) => {
      if(!confirm("Delete this card?")) return;
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/cards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCards();
  }

  if (activeView === 'Settings') return <SettingsPage onUpdateUser={onUpdateUser} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-gradient-to-br from-red-900 to-neutral-900 rounded-xl p-5 text-white border border-red-800/30">
                <p className="text-red-200/70 text-xs font-bold uppercase tracking-wider">Total Available</p>
                <h2 className="text-2xl font-bold tracking-tight mt-1">{currentUser.currency} {totalAvailable.toLocaleString()}</h2>
            </div>
             <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Total Spent</p>
                <h2 className="text-2xl font-bold text-white mt-1">{currentUser.currency} {totalSpent.toLocaleString()}</h2>
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Active Cards</h3>
            </div>
            {loading ? <div className="text-center py-12 text-neutral-600 animate-pulse">Loading...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <div key={card.id} className="group bg-neutral-900 p-5 rounded-2xl shadow-lg border border-neutral-800 hover:border-red-900/50 transition-all relative overflow-hidden">
                            <button onClick={() => handleDeleteCard(card.id)} className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 z-20"><Trash2 size={16}/></button>
                            <div className="relative z-10 flex items-start justify-between mb-6">
                                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                                    <CreditCard className="text-red-500 w-6 h-6" />
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md border border-neutral-700 block mb-1">{card.network}</span>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold text-white text-lg tracking-wide mb-1">{card.name}</h4>
                                <p className="text-sm text-neutral-500 mb-4">{card.bank} •••• {card.last_4 || 'XXXX'}</p>
                                
                                <div className="bg-black/20 rounded-lg p-3 mb-3 border border-neutral-800/50">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-neutral-400">Spent</span>
                                    <span className="text-white font-medium">{currentUser.currency} {card.spent?.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                     <div className="bg-red-600 h-full" style={{width: `${Math.min((card.spent / card.total_limit) * 100, 100)}%`}}></div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-end text-xs text-neutral-500">
                                    <div>Limit: {card.total_limit.toLocaleString()}</div>
                                    <div>Due: {card.payment_due_date}th</div>
                                </div>
                                {/* Image Preview Indicator */}
                                {(card.image_front || card.image_back) && (
                                   <div className="absolute bottom-2 right-2">
                                     <ImageIcon size={14} className="text-neutral-600" />
                                   </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {showAddCard && (
        <Modal title="Add New Card" onClose={() => setShowAddCard(false)}>
           <form onSubmit={handleAddCard} className="space-y-4">
              {/* Dotted Capture Area UI */}
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => frontInputRef.current.click()} className={`flex-1 p-4 rounded-xl border-2 border-dashed ${newCard.image_front ? 'border-red-500 bg-red-900/20' : 'border-neutral-600 bg-neutral-800'} text-neutral-400 hover:text-white flex flex-col items-center gap-2 transition-colors`}>
                   <div className="w-12 h-8 border border-neutral-500 rounded flex items-center justify-center">
                     {newCard.image_front ? <ImageIcon size={16} className="text-red-500"/> : <Camera size={16}/>}
                   </div>
                   <span className="text-xs font-bold">{newCard.image_front ? 'Front Saved' : 'Scan Front'}</span>
                   <input type="file" ref={frontInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'image_front')} className="hidden" />
                </button>
                <button type="button" onClick={() => backInputRef.current.click()} className={`flex-1 p-4 rounded-xl border-2 border-dashed ${newCard.image_back ? 'border-red-500 bg-red-900/20' : 'border-neutral-600 bg-neutral-800'} text-neutral-400 hover:text-white flex flex-col items-center gap-2 transition-colors`}>
                   <div className="w-12 h-8 border border-neutral-500 rounded flex items-center justify-center">
                     {newCard.image_back ? <ImageIcon size={16} className="text-red-500"/> : <ImageIcon size={16}/>}
                   </div>
                   <span className="text-xs font-bold">{newCard.image_back ? 'Back Saved' : 'Scan Back'}</span>
                   <input type="file" ref={backInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'image_back')} className="hidden" />
                </button>
              </div>

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
                    <label className="text-xs text-neutral-500 uppercase font-bold">Manual Limit</label>
                    <input type="number" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="Optional" value={newCard.manual_limit} onChange={e => setNewCard({...newCard, manual_limit: e.target.value})} />
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
    </div>
  );
};

// --- AUTH WRAPPER ---
const AuthenticatedApp = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState({ currency: 'USD' });
  
  // Fetch user globally so settings updates reflect everywhere
  const fetchUser = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        setCurrentUser(res.data);
      } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUser(); }, []);

  const handleLogout = () => { localStorage.removeItem('token'); window.location.href = '/'; };

  return (
    <div className="min-h-screen bg-neutral-950 pb-24 md:pb-0 md:pl-64 text-neutral-200 font-sans">
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-red-900/20 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
             <div className="bg-gradient-to-br from-red-700 to-red-900 p-2 rounded-lg shadow-lg shadow-red-900/20">
                 <img src="/logo.png" alt="Icon" className="w-6 h-6 object-contain invert" onError={(e) => e.target.src='/favicon.ico'} />
             </div>
             <span className="font-bold text-xl text-white tracking-tight lowercase">cc<span className="text-red-600">track</span></span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {[
              { name: 'Dashboard', icon: <LayoutDashboard size={20}/> },
              { name: 'My Cards', icon: <CreditCard size={20}/> },
              { name: 'Analytics', icon: <TrendingUp size={20}/> },
              { name: 'Settings', icon: <Settings size={20}/> }
            ].map((item) => (
               <button key={item.name} onClick={() => setActiveView(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeView === item.name ? 'bg-red-900/20 text-red-500 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                {item.icon} {item.name}
            </button> 
            ))}
        </nav>
        <div className="p-4 border-t border-neutral-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-xl transition-colors">
                <LogOut size={20} /> Terminate Session
            </button>
        </div>
      </aside>

      <header className="md:hidden bg-neutral-900 border-b border-red-900/20 p-4 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-red-800 p-1.5 rounded-lg"><Wallet className="text-white w-5 h-5" /></div>
             <span className="font-bold text-lg text-white lowercase">cc-track</span>
          </div>
          <button onClick={handleLogout} className="text-neutral-500"><LogOut size={24} /></button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
         <Dashboard activeView={activeView} currentUser={currentUser} onUpdateUser={setCurrentUser} />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-neutral-800 flex justify-around p-3 z-30 pb-safe">
        <button onClick={() => setActiveView('Dashboard')} className={`flex flex-col items-center gap-1 ${activeView==='Dashboard'?'text-red-500':'text-neutral-500'}`}><LayoutDashboard size={24} /><span className="text-[10px]">Home</span></button>
        <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-white"><div className="bg-red-700 p-3 rounded-full -mt-8 border-4 border-neutral-950 shadow-lg"><Plus size={24} className="text-white"/></div></button>
        <button onClick={() => setActiveView('Settings')} className={`flex flex-col items-center gap-1 ${activeView==='Settings'?'text-red-500':'text-neutral-500'}`}><Settings size={24} /><span className="text-[10px]">Settings</span></button>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><AuthenticatedApp /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;