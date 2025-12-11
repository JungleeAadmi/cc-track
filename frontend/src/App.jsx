import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, Plus, LogOut, LayoutDashboard, Settings, Trash2, Save, Eye,
  Camera, Image as ImageIcon, X, ChevronRight, Home, TrendingUp, Bell, Tag, CheckSquare, Square
} from 'lucide-react';

const API_URL = '/api';

// --- CONFIGURATION ---
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      if (window.location.pathname !== '/') window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// --- UTILS ---
const getNextDate = (dayOfMonth) => {
  if (!dayOfMonth) return 'N/A';
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); 
  let targetDate = new Date(currentYear, currentMonth, dayOfMonth);
  if (targetDate < today && targetDate.getDate() !== today.getDate()) {
     targetDate.setMonth(currentMonth + 1);
  }
  return targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

const CURRENCIES = [
  { code: 'USD', label: '$ USD' }, { code: 'EUR', label: '€ EUR' }, { code: 'GBP', label: '£ GBP' },
  { code: 'INR', label: '₹ INR' }, { code: 'JPY', label: '¥ JPY' }, { code: 'AUD', label: '$ AUD' },
  { code: 'CAD', label: '$ CAD' }, { code: 'CNY', label: '¥ CNY' }, { code: 'AED', label: 'د.إ AED' },
  { code: 'SAR', label: '﷼ SAR' }, { code: 'SGD', label: '$ SGD' },
];

const NetworkLogo = ({ network }) => {
  const style = "h-6 w-10 object-contain";
  const net = network ? network.toLowerCase() : '';
  if (net === 'visa') return <svg className={style} viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M19.9 5.7h6.6l4.1 20.6h-6.6l-1-5.1h-8.1l-1.3 5.1H7L19.9 5.7zM22 16.3l-2.4-11.5-4 11.5H22zM45.6 5.7h-6.6c-2 0-3.6 1.1-4.3 2.6l-15.3 18h6.9l2.7-7.6h8.4l.8 3.8 3.5 3.8H48L45.6 5.7z"/></svg>;
  if (net === 'mastercard') return <svg className={style} viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><circle fill="#EB001B" cx="15" cy="16" r="14"/><circle fill="#F79E1B" cx="33" cy="16" r="14"/><path fill="#FF5F00" d="M24 6.4c-3.1 0-6 1.1-8.3 3 2.3 2 3.8 4.9 3.8 8.1s-1.5 6.1-3.8 8.1c2.3 1.9 5.2 3 8.3 3 3.1 0 6-1.1 8.3-3-2.3-2-3.8-4.9-3.8-8.1s1.5-6.1 3.8-8.1c-2.3-1.9-5.2-3-8.3-3z"/></svg>;
  if (net === 'amex') return <svg className={style} viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><path fill="#2E77BC" d="M2 2h44v28H2z"/><path fill="#FFF" d="M29.9 14.2h-3.3v-4.1h7.5v-2h-12v15.9h12.3v-2.1h-7.8v-4.1h3.3v-3.6zM20.2 19.1l-1.9-4.8h-4.3v4.8H9.6V8.1h7.8c1.7 0 2.9.3 3.7.9.8.6 1.2 1.5 1.2 2.6 0 .9-.3 1.7-.8 2.2-.5.6-1.3 1-2.3 1.2l3.4 8.2h-2.4zm-2.7-6.5c.5-.4.7-1 .7-1.7 0-.7-.2-1.3-.7-1.7-.5-.4-1.2-.6-2.2-.6h-1.3v4.6h1.3c1 0 1.7-.2 2.2-.6z"/></svg>;
  return <CreditCard size={24} className="text-neutral-400"/>;
};

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          if (img.width > MAX_WIDTH) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
          }
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } catch (e) { reject(e); }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- COMPONENTS ---
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
    <div className="bg-neutral-900 border border-red-900/40 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
      <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20}/></button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

const EditCardModal = ({ card, onClose, onDelete }) => {
  const [formData, setFormData] = useState({ ...card });
  const [tab, setTab] = useState('details'); 

  return (
    <Modal title={`Manage ${card.name}`} onClose={onClose}>
      <div className="flex gap-2 mb-4 border-b border-neutral-800 pb-2">
        <button onClick={() => setTab('details')} className={`flex-1 pb-2 text-sm font-medium ${tab==='details' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}>Details</button>
        <button onClick={() => setTab('images')} className={`flex-1 pb-2 text-sm font-medium ${tab==='images' ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400'}`}>Images</button>
      </div>
      {tab === 'details' && (
        <div className="space-y-4">
           <div className="bg-neutral-800 p-4 rounded-lg mb-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-neutral-500 uppercase">Total Limit</p>
                <p className="text-white font-bold">{formData.total_limit.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 uppercase">Last 4</p>
                <p className="text-white font-mono">{formData.last_4 || 'N/A'}</p>
              </div>
           </div>
           <button onClick={() => onDelete(card.id)} className="w-full border border-red-900/50 text-red-500 py-3 rounded-xl hover:bg-red-900/10 mt-4 flex items-center justify-center gap-2">
             <Trash2 size={18}/> Delete Card
           </button>
           <p className="text-center text-xs text-neutral-600 mt-2">To edit limits or dates, please delete and re-add.</p>
        </div>
      )}
      {tab === 'images' && (
        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase font-bold">Front Side</label>
              {formData.image_front ? <img src={formData.image_front} className="w-full rounded-xl border border-neutral-700 shadow-md"/> : <div className="h-32 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600">No Image</div>}
           </div>
           <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase font-bold">Back Side</label>
              {formData.image_back ? <img src={formData.image_back} className="w-full rounded-xl border border-neutral-700 shadow-md"/> : <div className="h-32 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600">No Image</div>}
           </div>
        </div>
      )}
    </Modal>
  );
};

const SettingsPage = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({ 
    full_name: currentUser.full_name || '', 
    currency: currentUser.currency || 'USD',
    ntfy_topic: currentUser.ntfy_topic || '',
    ntfy_server: currentUser.ntfy_server || 'https://ntfy.sh',
    notify_card_add: currentUser.notify_card_add !== false,
    notify_txn_add: currentUser.notify_txn_add !== false,
    notify_card_del: currentUser.notify_card_del !== false,
    notify_statement: currentUser.notify_statement !== false,
    notify_due_dates: currentUser.notify_due_dates !== false,
  });
  const [password, setPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_URL}/users/me`, {
        ...formData,
        password: password || undefined
      }, { headers: { Authorization: `Bearer ${token}` } });
      onUpdateUser(res.data);
      localStorage.setItem('user_currency', res.data.currency);
      alert('Settings updated!');
    } catch (err) { alert('Failed to update'); }
  };

  const handleTestNotify = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/users/test-notify`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Notification sent!');
    } catch (err) { alert('Failed to send test: ' + (err.response?.data?.detail || err.message)); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return; 
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/';
    } catch (err) { alert('Failed to delete'); }
  };

  const Toggle = ({ label, checked, field }) => (
    <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
       <span className="text-sm text-neutral-300">{label}</span>
       <button type="button" onClick={() => setFormData({...formData, [field]: !checked})} className={`w-10 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-red-600' : 'bg-neutral-700'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
       </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
       <div>
         <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
         <form onSubmit={handleUpdate} className="space-y-6 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
             <div className="grid md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase">Display Name</label>
                    <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1" 
                      value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs text-neutral-500 font-bold uppercase">Default Currency</label>
                    <select className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1"
                      value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                       {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                 </div>
             </div>

             <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-800">
                <label className="text-xs text-neutral-400 font-bold uppercase flex items-center gap-2 mb-4">
                  <Bell size={14} className="text-red-500"/> Notifications (Ntfy)
                </label>
                <div className="space-y-3 mb-4">
                   <input className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white text-sm" 
                     placeholder="Server URL (e.g. https://ntfy.sh)" value={formData.ntfy_server} onChange={e => setFormData({...formData, ntfy_server: e.target.value})} />
                   <div className="flex gap-2">
                     <input className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white text-sm" 
                       placeholder="Topic Name (e.g. my-cards)" value={formData.ntfy_topic} onChange={e => setFormData({...formData, ntfy_topic: e.target.value})} />
                     <button type="button" onClick={handleTestNotify} className="bg-neutral-800 border border-neutral-700 text-white px-4 rounded-lg text-sm hover:bg-neutral-700">Test</button>
                   </div>
                </div>
                <div className="space-y-2">
                   <Toggle label="Card Added Alert" checked={formData.notify_card_add} field="notify_card_add" />
                   <Toggle label="Transaction Added Alert" checked={formData.notify_txn_add} field="notify_txn_add" />
                   <Toggle label="Card Deleted Alert" checked={formData.notify_card_del} field="notify_card_del" />
                   <Toggle label="Statement Day Alert" checked={formData.notify_statement} field="notify_statement" />
                   <Toggle label="Due Date Warning (5 Days)" checked={formData.notify_due_dates} field="notify_due_dates" />
                </div>
             </div>

             <div>
                <label className="text-xs text-neutral-500 font-bold uppercase">New Password</label>
                <input type="password" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white mt-1" 
                   value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
             </div>
             <button type="submit" className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                <Save size={16}/> Save Changes
             </button>
         </form>
       </div>

       <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/30">
          <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2"><Trash2 size={20}/> Danger Zone</h3>
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

const Dashboard = ({ cards, loading, currentUser, onEditCard }) => {
  const totalAvailable = cards.reduce((acc, card) => acc + (card.available || 0), 0);
  const totalSpent = cards.reduce((acc, card) => acc + (card.spent || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-gradient-to-br from-red-900 to-neutral-900 rounded-xl p-5 text-white border border-red-800/30 shadow-lg">
                <p className="text-red-200/70 text-xs font-bold uppercase tracking-wider">Total Available</p>
                <h2 className="text-2xl font-bold tracking-tight mt-1">{currentUser.currency} {totalAvailable.toLocaleString()}</h2>
            </div>
             <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800 shadow-md">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Total Spent</p>
                <h2 className="text-2xl font-bold text-white mt-1">{currentUser.currency} {totalSpent.toLocaleString()}</h2>
            </div>
        </div>

        {cards.length === 0 && !loading && (
            <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
                <CreditCard className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
                <h3 className="text-lg font-medium text-white">No cards yet</h3>
                <p className="text-neutral-500">Add your first credit card to start tracking.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => (
                <div key={card.id} onClick={() => onEditCard(card)} className="group bg-neutral-800/80 p-5 rounded-2xl shadow-lg border border-neutral-700/50 hover:border-red-500/30 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]">
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                            <NetworkLogo network={card.network} />
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-400 font-mono tracking-widest text-sm font-bold">•••• {card.last_4 || 'XXXX'}</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h4 className="font-bold text-white text-xl tracking-wide leading-tight mb-1">{card.name}</h4>
                        <p className="text-xs text-neutral-400 mb-4 uppercase tracking-wider font-semibold">{card.bank}</p>
                        
                        <div className="bg-black/30 rounded-lg p-3 mb-3 border border-white/5">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-400 text-xs font-medium">Used</span>
                            <span className="text-white font-bold text-xs">{currentUser.currency} {card.spent?.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-red-600 h-full" style={{width: `${Math.min((card.spent / card.total_limit) * 100, 100)}%`}}></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 border-t border-white/5 pt-3 mt-1">
                            <div>
                                <span className="block text-neutral-500 uppercase font-bold mb-0.5">Statement</span>
                                <span className="text-neutral-200">{getNextDate(card.statement_date)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-neutral-500 uppercase font-bold mb-0.5">Due Date</span>
                                <span className="text-red-400 font-bold">{getNextDate(card.payment_due_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {loading && <div className="text-center py-12 text-neutral-600 animate-pulse">Syncing data...</div>}
    </div>
  );
};

// --- AUTHENTICATED APP WRAPPER ---
const AuthenticatedApp = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [currentUser, setCurrentUser] = useState({ 
    currency: 'USD', 
    username: localStorage.getItem('username') || 'User' 
  });
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const [newCard, setNewCard] = useState({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', statement_day: 1, due_day: 20, image_front: '', image_back: '', last_4: '' });
  const [newTxn, setNewTxn] = useState({ description: '', amount: '', type: 'DEBIT', card_id: '', tag: '' });
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const fetchData = useCallback(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const [userRes, cardsRes] = await Promise.all([
            axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/cards/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setCurrentUser(prev => JSON.stringify(prev) !== JSON.stringify(userRes.data) ? userRes.data : prev);
        setCards(prev => JSON.stringify(prev) !== JSON.stringify(cardsRes.data) ? cardsRes.data : prev);
        localStorage.setItem('username', userRes.data.username);
        localStorage.setItem('user_currency', userRes.data.currency);
      } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogout = () => { 
    localStorage.removeItem('token'); 
    localStorage.removeItem('username');
    localStorage.removeItem('user_currency');
    window.location.href = '/'; 
  };

  const handleImageUpload = async (e, side) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedBase64 = await processImage(file);
        setNewCard(prev => ({ ...prev, [side]: compressedBase64 }));
      } catch (err) { alert("Failed to process image: " + err); }
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
        image_back: newCard.image_back,
        last_4: newCard.last_4 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddCard(false);
      fetchData(); 
      setNewCard({ name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', statement_day: 1, due_day: 20, image_front: '', image_back: '', last_4: '' });
    } catch (err) { alert(`Failed to add card: ${err.response?.data?.detail || err.message}`); }
  };

  const handleDeleteCard = async (id) => {
      if(!confirm("Delete this card and all its transactions?")) return;
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/cards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setEditingCard(null);
      fetchData();
  }

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
      fetchData();
      alert('Transaction logged');
    } catch (err) { alert('Failed to add transaction: ' + (err.response?.data?.detail || err.message)); }
  };

  const NavButton = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${active ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-950 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0 md:pl-64 text-neutral-200 font-sans">
      <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-red-900/20 hidden md:flex flex-col z-20">
        <div className="p-6">
             <div className="flex items-center gap-3 mb-2">
               <div className="bg-gradient-to-br from-red-700 to-red-900 p-2 rounded-lg shadow-lg shadow-red-900/20">
                   <img src="/logo.png" alt="Icon" className="w-6 h-6 object-contain invert" onError={(e) => e.target.src='/favicon.ico'} />
               </div>
               <span className="font-bold text-xl text-white tracking-tight lowercase">cc<span className="text-red-600">track</span></span>
             </div>
             <p className="text-xs text-neutral-500 pl-1 font-mono">@{currentUser.username}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'My Cards', icon: CreditCard },
              { name: 'Analytics', icon: TrendingUp },
              { name: 'Settings', icon: Settings }
            ].map((item) => (
               <button key={item.name} onClick={() => setActiveView(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeView === item.name ? 'bg-red-900/20 text-red-500 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                <item.icon size={20} /> {item.name}
            </button> 
            ))}
        </nav>
        <div className="p-4 border-t border-neutral-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-xl transition-colors">
                <LogOut size={20} /> Terminate Session
            </button>
        </div>
      </aside>

      <header className="md:hidden bg-neutral-900 border-b border-red-900/20 p-4 sticky top-0 z-10 flex justify-between items-center rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-2">
             <div className="bg-red-800 p-1.5 rounded-lg"><img src="/logo.png" alt="Icon" className="w-5 h-5 object-contain invert" onError={(e) => e.target.src='/favicon.ico'} /></div>
             <div>
                <span className="font-bold text-lg text-white lowercase block leading-none">cc-track</span>
                <span className="text-[10px] text-neutral-400 block leading-none mt-0.5">@{currentUser.username}</span>
             </div>
          </div>
          <button onClick={handleLogout} className="text-neutral-500"><LogOut size={24} /></button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
         {activeView === 'Dashboard' && (
            <>
              <div className="flex flex-col md:flex-row justify-end gap-3 mb-6 hidden md:flex">
                <button onClick={() => setShowAddCard(true)} className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-2.5 rounded-xl font-medium border border-neutral-700 transition-all">
                    <CreditCard size={18} /> Add Card
                </button>
                <button onClick={() => setShowAddTxn(true)} className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-red-900/30 transition-all">
                    <Plus size={18} /> Add Txn
                </button>
              </div>
              <Dashboard cards={cards} loading={loading} currentUser={currentUser} onEditCard={setEditingCard} />
            </>
         )}
         {activeView === 'Settings' && <SettingsPage currentUser={currentUser} onUpdateUser={setCurrentUser} />}
         {(activeView === 'My Cards' || activeView === 'Analytics') && <div className="text-center py-20 text-neutral-500">Coming Soon</div>}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-neutral-800 flex justify-around items-center p-3 pb-[calc(env(safe-area-inset-bottom)+10px)] z-30">
        <NavButton label="Home" icon={Home} active={activeView === 'Dashboard'} onClick={() => setActiveView('Dashboard')} />
        <NavButton label="Add Card" icon={CreditCard} onClick={() => setShowAddCard(true)} />
        <NavButton label="Add Txn" icon={Plus} onClick={() => setShowAddTxn(true)} />
        <NavButton label="Settings" icon={Settings} active={activeView === 'Settings'} onClick={() => setActiveView('Settings')} />
      </nav>

      {/* --- MODALS --- */}
      {showAddCard && (
        <Modal title="Add New Card" onClose={() => setShowAddCard(false)}>
           <form onSubmit={handleAddCard} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => frontInputRef.current.click()} className={`flex-1 h-24 rounded-xl border-2 border-dashed ${newCard.image_front ? 'border-red-500 bg-red-900/20' : 'border-neutral-700 bg-neutral-800/50'} text-neutral-400 hover:text-white hover:border-red-500 flex flex-col items-center justify-center gap-1 transition-colors relative overflow-hidden`}>
                   {newCard.image_front ? <img src={newCard.image_front} className="absolute inset-0 w-full h-full object-cover opacity-50"/> : null}
                   <Camera size={20} className="relative z-10"/>
                   <span className="text-[10px] uppercase font-bold relative z-10">{newCard.image_front ? 'Retake Front' : 'Front'}</span>
                   <div className="absolute inset-4 border border-dashed border-white/30 pointer-events-none rounded opacity-50"></div>
                   <input type="file" ref={frontInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'image_front')} className="hidden" />
                </button>
                <button type="button" onClick={() => backInputRef.current.click()} className={`flex-1 h-24 rounded-xl border-2 border-dashed ${newCard.image_back ? 'border-red-500 bg-red-900/20' : 'border-neutral-700 bg-neutral-800/50'} text-neutral-400 hover:text-white hover:border-red-500 flex flex-col items-center justify-center gap-1 transition-colors relative overflow-hidden`}>
                   {newCard.image_back ? <img src={newCard.image_back} className="absolute inset-0 w-full h-full object-cover opacity-50"/> : null}
                   <ImageIcon size={20} className="relative z-10"/>
                   <span className="text-[10px] uppercase font-bold relative z-10">{newCard.image_back ? 'Retake Back' : 'Back'}</span>
                   <input type="file" ref={backInputRef} accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'image_back')} className="hidden" />
                </button>
              </div>

              <div>
                 <label className="text-xs text-neutral-500 uppercase font-bold">Nickname</label>
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
                    <label className="text-xs text-neutral-500 uppercase font-bold">Last 4 Digits</label>
                    <input className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1" 
                        placeholder="1234" maxLength="4" value={newCard.last_4} onChange={e => setNewCard({...newCard, last_4: e.target.value})} />
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
                    <label className="text-xs text-neutral-500 uppercase font-bold">Network</label>
                    <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1"
                        value={newCard.network} onChange={e => setNewCard({...newCard, network: e.target.value})}>
                        <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">Stmt</label>
                      <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 text-sm"
                          value={newCard.statement_day} onChange={e => setNewCard({...newCard, statement_day: e.target.value})}>
                          {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase font-bold">Due</label>
                      <select className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white mt-1 text-sm"
                          value={newCard.due_day} onChange={e => setNewCard({...newCard, due_day: e.target.value})}>
                          {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
                      </select>
                    </div>
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

      {editingCard && (
        <EditCardModal 
            card={editingCard} 
            onClose={() => setEditingCard(null)} 
            onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
};

// --- 4. LOGIN & ERROR BOUNDARY WRAPPERS ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-red-500 p-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-4">System Malfunction</h1>
          <div className="bg-neutral-900 p-4 rounded border border-red-900 font-mono text-sm max-w-2xl overflow-auto text-left">
            <p className="font-bold border-b border-red-900/30 pb-2 mb-2">Error Details:</p>
            {this.state.error?.toString()}
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        localStorage.setItem('username', username);
        window.location.href = '/dashboard';
      } else {
        await axios.post(`${API_URL}/signup`, { username, password, full_name: fullName });
        const loginRes = await axios.post(`${API_URL}/token`, formData);
        localStorage.setItem('token', loginRes.data.access_token);
        localStorage.setItem('username', username);
        window.location.href = '/dashboard';
      }
    } catch (err) { 
        console.error(err);
        setError(err.response?.data?.detail || 'Authentication failed. Check your connection.'); 
    } finally { 
        setLoading(false); 
    }
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

// --- MAIN ROUTER ---
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><AuthenticatedApp /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;