import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CreditCard, Plus, LogOut, LayoutDashboard, Settings, Trash2, Save, Eye, EyeOff,
  Camera, Image as ImageIcon, X, ChevronRight, Home, TrendingUp, Bell, Tag, Download,
  Receipt, Calendar, Edit2, Check, Copy, CheckCircle, AlertTriangle, Upload,
  Users, Briefcase, DollarSign, Search, RefreshCw, Paperclip
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const API_URL = '/api';
const APP_VERSION = 'v2.7.2';
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// --- 1. CONFIG & UTILS ---
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

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
};

const getNextDate = (dayOfMonth) => {
  if (!dayOfMonth) return 'N/A';
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); 
  let targetDate = new Date(currentYear, currentMonth, dayOfMonth);
  if (targetDate < today && targetDate.getDate() !== today.getDate()) {
     targetDate.setMonth(currentMonth + 1);
  }
  return formatDate(targetDate);
};

const formatMoney = (amount, currency, privacy) => {
    if (privacy) return '****';
    return `${currency} ${amount.toLocaleString()}`;
};

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("No file");
    if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        return;
    }
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

const CURRENCIES = [
  { code: 'USD', label: '$ USD' }, { code: 'EUR', label: '€ EUR' }, { code: 'GBP', label: '£ GBP' },
  { code: 'INR', label: '₹ INR' }, { code: 'JPY', label: '¥ JPY' }, { code: 'AUD', label: '$ AUD' },
  { code: 'CAD', label: '$ CAD' }, { code: 'CNY', label: '¥ CNY' }, { code: 'AED', label: 'د.إ AED' },
  { code: 'SAR', label: '﷼ SAR' }, { code: 'SGD', label: '$ SGD' },
];

const CARD_TYPES = ["Credit Card", "Debit Card", "Gift Card", "Prepaid Card"];
const TXN_MODES = ["Online", "Swipe", "NFC", "Others"];

// --- 2. UI COMPONENTS ---
const NetworkLogo = ({ network }) => {
  const style = "h-8 w-12 object-contain";
  if (network?.toLowerCase() === 'visa') return <svg className={style} viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M19.9 5.7h6.6l4.1 20.6h-6.6l-1-5.1h-8.1l-1.3 5.1H7L19.9 5.7zM22 16.3l-2.4-11.5-4 11.5H22zM45.6 5.7h-6.6c-2 0-3.6 1.1-4.3 2.6l-15.3 18h6.9l2.7-7.6h8.4l.8 3.8 3.5 3.8H48L45.6 5.7z"/></svg>;
  if (network?.toLowerCase() === 'mastercard') return <svg className={style} viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg"><circle fill="#EB001B" cx="15" cy="16" r="14"/><circle fill="#F79E1B" cx="33" cy="16" r="14"/><path fill="#FF5F00" d="M24 6.4c-3.1 0-6 1.1-8.3 3 2.3 2 3.8 4.9 3.8 8.1s-1.5 6.1-3.8 8.1c2.3 1.9 5.2 3 8.3 3 3.1 0 6-1.1 8.3-3-2.3-2-3.8-4.9-3.8-8.1s1.5-6.1 3.8-8.1c-2.3-1.9-5.2-3-8.3-3z"/></svg>;
  return <CreditCard size={24} className="text-neutral-400"/>;
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur shrink-0 z-10">
        <h3 className="text-white font-bold text-lg tracking-tight">{title}</h3>
        <button onClick={onClose} className="bg-neutral-800 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"><X size={18}/></button>
      </div>
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, children }) => (
  <div className="w-full flex flex-col gap-1.5">
    <label className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider pl-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all placeholder:text-neutral-700 h-[48px] appearance-none ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ colorScheme: 'dark' }} />
);

const Select = (props) => (
  <div className="relative w-full">
    <select {...props} className={`w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all appearance-none h-[48px] ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{props.children}</select>
    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 rotate-90 pointer-events-none" size={16} />
  </div>
);

// --- 3. MODALS (RESTORED) ---
const CardSummaryModal = ({ cards, currency, onClose }) => {
  return (
    <Modal title="Limits Overview" onClose={onClose}>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-neutral-500 uppercase border-b border-neutral-800">
              <tr>
                <th className="pb-2 font-bold pl-2">Card</th>
                <th className="pb-2 font-bold text-right">Limit</th>
                <th className="pb-2 font-bold text-right">Spent</th>
                <th className="pb-2 font-bold text-right pr-2">Avail</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {cards.map(c => {
                  const limit = c.manual_limit && c.manual_limit > 0 ? c.manual_limit : c.total_limit;
                  const avail = limit - c.spent;
                  return (
                    <tr key={c.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 pl-2 font-medium">{c.name}</td>
                      <td className="py-3 text-right">{currency} {limit.toLocaleString()}</td>
                      <td className="py-3 text-right text-red-400">{currency} {c.spent.toLocaleString()}</td>
                      <td className="py-3 text-right pr-2 text-green-500">{currency} {avail.toLocaleString()}</td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

const TransactionsModal = ({ onClose, currency }) => {
    const [transactions, setTransactions] = useState([]);
    const [editingTxn, setEditingTxn] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTxns = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/transactions/`, { headers: { Authorization: `Bearer ${token}` } });
            setTransactions(res.data);
        } catch(err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchTxns(); }, []);

    const handleDelete = async (id) => {
        if(!confirm("Delete this transaction?")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchTxns();
        } catch(err) { alert("Failed to delete"); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/transactions/${editingTxn.id}`, {
                description: editingTxn.description,
                amount: parseFloat(editingTxn.amount),
                date: new Date(editingTxn.date).toISOString()
            }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTxn(null);
            fetchTxns();
        } catch(err) { alert("Failed to update"); }
    };

    return (
        <Modal title="Transaction History" onClose={onClose}>
            {editingTxn ? (
                <form onSubmit={handleUpdate} className="flex flex-col gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    <FormField label="Description">
                        <Input value={editingTxn.description} onChange={e => setEditingTxn({...editingTxn, description: e.target.value})} />
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Amount">
                            <Input type="number" step="0.01" value={editingTxn.amount} onChange={e => setEditingTxn({...editingTxn, amount: e.target.value})} />
                        </FormField>
                        <FormField label="Date">
                            <Input type="date" value={new Date(editingTxn.date).toISOString().split('T')[0]} onChange={e => setEditingTxn({...editingTxn, date: e.target.value})} />
                        </FormField>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800/50">
                        <button type="button" onClick={() => setEditingTxn(null)} className="bg-neutral-800 text-white px-4 py-3 rounded-xl text-xs font-bold transition-colors hover:bg-neutral-700">Cancel</button>
                        <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-xl text-xs font-bold transition-colors hover:bg-red-500">Save</button>
                    </div>
                </form>
            ) : (
                <div className="space-y-2">
                    {loading ? <p className="text-center text-neutral-500 py-4">Loading...</p> : 
                     transactions.map(t => (
                        <div key={t.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
                            <div>
                                <p className="text-white font-medium text-sm">{t.description}</p>
                                <p className="text-[10px] text-neutral-500">{formatDate(t.date)} • {t.mode}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold text-sm">{currency} {t.amount.toLocaleString()}</p>
                                <div className="flex gap-2 justify-end mt-2">
                                    <button onClick={() => setEditingTxn(t)} className="text-neutral-500 hover:text-white p-1"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDelete(t.id)} className="text-neutral-500 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && !loading && <p className="text-center text-neutral-500 py-4">No transactions found.</p>}
                </div>
            )}
        </Modal>
    );
};

const EditCardModal = ({ card, onClose, onDelete, onUpdate }) => {
  const [formData, setFormData] = useState({ ...card });
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useState('view'); 
  const [statements, setStatements] = useState([]);
  const [newStmt, setNewStmt] = useState({ date: new Date().toISOString().split('T')[0], amount: '' });
  const [editingStmtId, setEditingStmtId] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stmtOptions, setStmtOptions] = useState(null); 
  const longPressTimer = useRef(null);
  const formRef = useRef(null); 

  useEffect(() => {
    if (tab === 'statements') fetchStatements();
  }, [tab]);

  const fetchStatements = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get(`${API_URL}/cards/${card.id}/statements`, { headers: { Authorization: `Bearer ${token}` } });
        setStatements(res.data);
    } catch(err) { console.error(err); }
  };

  const handleUpdateCard = async () => {
      const token = localStorage.getItem('token');
      try {
          const payload = {
              name: formData.name,
              bank: formData.bank,
              network: formData.network,
              card_type: formData.card_type,
              total_limit: parseFloat(formData.total_limit) || 0,
              manual_limit: formData.manual_limit ? parseFloat(formData.manual_limit) : null,
              statement_date: parseInt(formData.statement_date) || 1,
              payment_due_date: parseInt(formData.payment_due_date) || 1,
              card_holder: formData.card_holder,
              last_4: formData.last_4,
              full_number: formData.full_number,
              cvv: formData.cvv,
              valid_thru: formData.valid_thru
          };

          const res = await axios.put(`${API_URL}/cards/${card.id}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
          onUpdate(res.data); 
          setIsEditing(false);
          alert("Card updated successfully");
      } catch (err) { alert("Failed to update card"); }
  };

  const handleAddOrUpdateStatement = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
        if (editingStmtId) {
            await axios.put(`${API_URL}/cards/${card.id}/statements/${editingStmtId}`, {
                date: new Date(newStmt.date).toISOString(),
                amount: parseFloat(newStmt.amount),
                card_id: card.id
            }, { headers: { Authorization: `Bearer ${token}` } });
        } else {
            await axios.post(`${API_URL}/cards/${card.id}/statements`, {
                date: new Date(newStmt.date).toISOString(),
                amount: parseFloat(newStmt.amount),
                card_id: card.id
            }, { headers: { Authorization: `Bearer ${token}` } });
        }
        fetchStatements();
        setNewStmt({ date: new Date().toISOString().split('T')[0], amount: '' });
        setEditingStmtId(null);
    } catch(err) { alert("Failed to save statement"); }
  };

  const toggleStatementPaid = async (stmt) => {
      const token = localStorage.getItem('token');
      try {
          await axios.put(`${API_URL}/cards/${card.id}/statements/${stmt.id}`, {
              is_paid: !stmt.is_paid
          }, { headers: { Authorization: `Bearer ${token}` } });
          fetchStatements();
      } catch(err) { alert("Failed to update status"); }
  };

  const handleDeleteStatement = async (stmtId) => {
      if(!confirm("Delete this statement?")) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`${API_URL}/cards/${card.id}/statements/${stmtId}`, { 
              headers: { Authorization: `Bearer ${token}` } 
          });
          fetchStatements();
          setStmtOptions(null);
      } catch(err) { alert("Failed to delete statement"); }
  };

  const startEditStatement = (stmt) => {
      try {
          let dateStr = new Date().toISOString().split('T')[0];
          if (stmt.date) {
            dateStr = new Date(stmt.date).toISOString().split('T')[0];
          }
          setNewStmt({ date: dateStr, amount: stmt.amount });
          setEditingStmtId(stmt.id);
          setStmtOptions(null);
          if(formRef.current) {
              formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } catch (e) { console.error(e); }
  };

  const handleTouchStart = (stmt) => {
      longPressTimer.current = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(50);
          setStmtOptions(stmt);
      }, 500);
  };

  const handleTouchEnd = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <Modal title={`Manage ${card.name}`} onClose={onClose}>
      <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        {['view', 'details', 'images', 'statements'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-none px-4 pb-2 text-sm font-medium capitalize transition-all whitespace-nowrap ${tab===t ? 'text-red-500 border-b-2 border-red-500' : 'text-neutral-400 hover:text-neutral-200'}`}>{t}</button>
        ))}
      </div>

      {tab === 'view' && (
          <div className="flex flex-col items-center gap-6 py-4">
              <div 
                  className="w-full h-48 rounded-2xl relative preserve-3d cursor-pointer transition-transform duration-500"
                  style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', perspective: '1000px' }}
                  onClick={() => setIsFlipped(!isFlipped)}
              >
                  {/* Front */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-neutral-800 to-black rounded-2xl p-6 flex flex-col justify-between shadow-2xl backface-hidden border border-neutral-700 ${isFlipped ? 'hidden' : 'block'}`}>
                      <div className="flex justify-between items-start">
                           <div className="text-white/40 text-[10px] font-mono tracking-widest">CC-TRACK VIRTUAL</div>
                           <NetworkLogo network={card.network} />
                      </div>
                      <div className="text-white text-xl font-mono tracking-widest text-center mt-2 drop-shadow-md">
                          {formData.full_number ? formData.full_number.match(/.{1,4}/g)?.join(' ') : `•••• •••• •••• ${formData.last_4 || '0000'}`}
                      </div>
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[8px] text-white/50 uppercase tracking-wide mb-1">Card Holder</p>
                              <p className="text-sm text-white font-medium uppercase tracking-wide truncate max-w-[120px]">{formData.card_holder || 'CARD HOLDER'}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[8px] text-white/50 uppercase tracking-wide mb-1">Valid Thru</p>
                              <p className="text-sm text-white font-mono">{formData.valid_thru || 'MM/YY'}</p>
                          </div>
                      </div>
                  </div>

                  {/* Back */}
                  <div className={`absolute inset-0 bg-neutral-900 rounded-2xl flex flex-col shadow-2xl backface-hidden border border-neutral-800 ${isFlipped ? 'block' : 'hidden'}`} style={{ transform: 'rotateY(180deg)' }}>
                      <div className="w-full h-10 bg-black mt-6"></div>
                      <div className="p-6 mt-2">
                          <div className="bg-white w-full h-10 flex items-center justify-end px-3 rounded-sm pattern-lines">
                              <span className="font-mono text-black font-bold italic text-lg tracking-widest">{formData.cvv || '***'}</span>
                          </div>
                          <p className="text-[8px] text-neutral-500 mt-4 leading-tight text-center">
                              This card is property of the issuer. Use for authorized transactions only.
                              <br/>Issued by {formData.bank}.
                          </p>
                      </div>
                  </div>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1"><Eye size={12}/> Tap card to flip</p>
          </div>
      )}

      {tab === 'details' && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField label="Nickname">
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!isEditing} />
               </FormField>
               <FormField label="Bank">
                  <Input value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} disabled={!isEditing} />
               </FormField>
           </div>
           
           <FormField label="Card Holder Name">
              <Input value={formData.card_holder || ''} onChange={e => setFormData({...formData, card_holder: e.target.value})} disabled={!isEditing} />
           </FormField>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Total Limit">
                 <Input type="number" value={formData.total_limit} onChange={e => setFormData({...formData, total_limit: e.target.value})} disabled={!isEditing} />
              </FormField>
              <FormField label="Manual Limit">
                 <Input type="number" value={formData.manual_limit || ''} onChange={e => setFormData({...formData, manual_limit: e.target.value})} disabled={!isEditing} />
              </FormField>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Card Number">
                  <Input value={formData.full_number || ''} onChange={e => {
                      const val = e.target.value.replace(/\D/g,'').substring(0,16);
                      setFormData({...formData, full_number: val, last_4: val.slice(-4)});
                  }} disabled={!isEditing} className="font-mono"/>
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                  <FormField label="Valid Thru">
                      <Input value={formData.valid_thru || ''} onChange={e => setFormData({...formData, valid_thru: e.target.value})} disabled={!isEditing} />
                  </FormField>
                  <FormField label="CVV">
                      <Input value={formData.cvv || ''} onChange={e => setFormData({...formData, cvv: e.target.value})} disabled={!isEditing} type="password"/>
                  </FormField>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Statement Date">
                  <Select value={formData.statement_date} onChange={e => setFormData({...formData, statement_date: e.target.value})} disabled={!isEditing}>
                      {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                  </Select>
              </FormField>
              <FormField label="Due Date">
                  <Select value={formData.payment_due_date} onChange={e => setFormData({...formData, payment_due_date: e.target.value})} disabled={!isEditing}>
                      {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                  </Select>
              </FormField>
           </div>

           {isEditing ? (
              <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-neutral-800 text-white py-3.5 rounded-xl font-bold hover:bg-neutral-700 transition-colors">Cancel</button>
                  <button onClick={handleUpdateCard} className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">Save Changes</button>
              </div>
           ) : (
              <>
                 <button onClick={() => setIsEditing(true)} className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                     <Edit2 size={16}/> Edit Card Details
                 </button>
                 <button onClick={() => onDelete(card.id)} className="w-full border border-red-900/30 bg-red-900/10 text-red-500 py-3.5 rounded-xl hover:bg-red-900/20 flex items-center justify-center gap-2 font-bold transition-colors">
                     <Trash2 size={16}/> Delete Card
                 </button>
              </>
           )}
        </div>
      )}
      
      {tab === 'images' && (
        <div className="space-y-6">
           <div className="space-y-4">
              <label className="text-xs text-neutral-500 uppercase font-bold">Front Side</label>
              {formData.image_front ? <img src={formData.image_front} className="w-full rounded-xl border border-neutral-700 shadow-md"/> : <div className="h-32 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600">No Image</div>}
           </div>
           <div className="space-y-4">
              <label className="text-xs text-neutral-500 uppercase font-bold">Back Side</label>
              {formData.image_back ? <img src={formData.image_back} className="w-full rounded-xl border border-neutral-700 shadow-md"/> : <div className="h-32 border-2 border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600">No Image</div>}
           </div>
        </div>
      )}

      {tab === 'statements' && (
          <div className="space-y-6 relative h-full">
              {/* Add Form */}
              <form ref={formRef} onSubmit={handleAddOrUpdateStatement} className="flex flex-col gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800 transition-colors duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Statement Date">
                        <Input type="date" value={newStmt.date} onChange={e => setNewStmt({...newStmt, date: e.target.value})} required />
                      </FormField>
                      <FormField label="Total Amount">
                        <Input type="number" step="0.01" placeholder="0.00" value={newStmt.amount} onChange={e => setNewStmt({...newStmt, amount: e.target.value})} required />
                      </FormField>
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800/50">
                     {editingStmtId && (
                         <button type="button" onClick={() => { setNewStmt({ date: new Date().toISOString().split('T')[0], amount: '' }); setEditingStmtId(null); }} className="bg-neutral-800 text-white px-4 py-3 rounded-xl hover:bg-neutral-700 text-xs font-bold transition-colors">Cancel</button>
                     )}
                     <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-500 text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20 w-full justify-center sm:w-auto">
                         {editingStmtId ? <Check size={16}/> : <Plus size={16}/>} {editingStmtId ? 'Update Statement' : 'Add Statement'}
                     </button>
                  </div>
              </form>
              
              <div className="space-y-2 relative pb-20">
                  {/* Options Overlay (Professional Look) */}
                  {stmtOptions && (
                     <div className="absolute inset-0 z-20 flex items-center justify-center animate-in fade-in duration-200">
                         {/* Backdrop */}
                         <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl" onClick={() => setStmtOptions(null)}></div>
                         {/* Card */}
                         <div className="bg-neutral-900 border border-neutral-700 p-1 rounded-2xl w-3/4 max-w-[200px] shadow-2xl transform scale-100 relative z-30 flex flex-col gap-1">
                             <div className="text-center py-3 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800">Options</div>
                             <button onClick={() => startEditStatement(stmtOptions)} className="w-full bg-neutral-800 text-white p-3 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition-colors">
                                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Edit2 size={16}/></div>
                                <span className="font-medium text-sm">Edit</span>
                             </button>
                             <button onClick={() => handleDeleteStatement(stmtOptions.id)} className="w-full bg-neutral-800 text-red-400 p-3 rounded-xl flex items-center gap-3 hover:bg-red-900/20 transition-colors">
                                <div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Trash2 size={16}/></div>
                                <span className="font-medium text-sm">Delete</span>
                             </button>
                             <button onClick={() => setStmtOptions(null)} className="w-full text-neutral-500 text-sm py-3 hover:text-white transition-colors">Cancel</button>
                         </div>
                     </div>
                  )}

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
                      {statements.map(stmt => (
                          <div 
                            key={stmt.id} 
                            className={`flex justify-between items-center p-4 rounded-xl border select-none transition-all mb-2 ${stmt.is_paid ? 'bg-green-900/10 border-green-900/30' : 'bg-neutral-800/50 border-neutral-800 active:scale-[0.98]'}`}
                            onTouchStart={() => handleTouchStart(stmt)}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={() => handleTouchStart(stmt)}
                            onMouseUp={handleTouchEnd}
                            onMouseLeave={handleTouchEnd}
                          >
                              <div className="flex items-center gap-4">
                                  <button onClick={(e) => { e.stopPropagation(); toggleStatementPaid(stmt); }} className={`p-2 rounded-full transition-colors ${stmt.is_paid ? 'text-green-500 bg-green-900/20' : 'text-neutral-600 hover:text-white bg-neutral-900 border border-neutral-700'}`}>
                                      {stmt.is_paid ? <CheckCircle size={20} fill="currentColor" className="text-green-900" /> : <div className="w-5 h-5 rounded-full" />}
                                  </button>
                                  <div className="flex flex-col">
                                      <span className="text-sm text-neutral-300 block font-medium">{formatDate(stmt.date)}</span>
                                      {stmt.is_paid && <span className="text-[10px] text-green-500 font-bold uppercase tracking-wide flex items-center gap-1"><Check size={10}/> Paid</span>}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`font-bold text-lg block ${stmt.is_paid ? 'text-green-500 line-through opacity-70' : 'text-white'}`}>{parseFloat(stmt.amount).toLocaleString()}</span>
                              </div>
                          </div>
                      ))}
                      {statements.length === 0 && <div className="text-center py-8 bg-neutral-900/30 rounded-xl border border-dashed border-neutral-800">
                          <Receipt className="mx-auto h-8 w-8 text-neutral-700 mb-2"/>
                          <p className="text-xs text-neutral-500">No statements logged.</p>
                      </div>}
                  </div>
              </div>
          </div>
      )}
    </Modal>
  );
};

// --- 4. PAGE & FEATURE COMPONENTS ---

const SearchPage = ({ currency, privacy }) => {
    const [results, setResults] = useState([]);
    const [filters, setFilters] = useState({ search: '', min_amount: '', max_amount: '', start_date: '', end_date: '' });
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault(); setSearching(true);
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams();
            if(filters.search) params.append('search', filters.search);
            if(filters.min_amount) params.append('min_amount', filters.min_amount);
            if(filters.max_amount) params.append('max_amount', filters.max_amount);
            if(filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
            if(filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
            const res = await axios.get(`${API_URL}/transactions/?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            setResults(res.data);
        } catch(err) { console.error(err); } finally { setSearching(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white">Advanced Search</h2>
            <form onSubmit={handleSearch} className="space-y-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                <FormField label="Keyword"><Input placeholder="Merchant, Tag, Card..." value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})}/></FormField>
                <div className="grid grid-cols-2 gap-4"><FormField label="Min Amount"><Input type="number" value={filters.min_amount} onChange={e=>setFilters({...filters, min_amount:e.target.value})}/></FormField><FormField label="Max Amount"><Input type="number" value={filters.max_amount} onChange={e=>setFilters({...filters, max_amount:e.target.value})}/></FormField></div>
                <div className="grid grid-cols-2 gap-4"><FormField label="Start Date"><Input type="date" value={filters.start_date} onChange={e=>setFilters({...filters, start_date:e.target.value})}/></FormField><FormField label="End Date"><Input type="date" value={filters.end_date} onChange={e=>setFilters({...filters, end_date:e.target.value})}/></FormField></div>
                <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold mt-2">Search Transactions</button>
            </form>
            <div className="space-y-2">{results.map(t => (<div key={t.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center"><div><p className="text-white font-medium text-sm">{t.description}</p><p className="text-[10px] text-neutral-500">{formatDate(t.date)}</p></div><p className="text-white font-bold text-sm">{formatMoney(t.amount, currency, privacy)}</p></div>))}{results.length === 0 && !searching && <p className="text-center text-neutral-500 py-4">No results found.</p>}</div>
        </div>
    );
};

const SubscriptionsPage = ({ currency, privacy }) => {
    const [subs, setSubs] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newSub, setNewSub] = useState({ name: '', amount: '', billing_cycle: 'Monthly', next_due_date: '', attachment: '' });
    
    const [options, setOptions] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [viewingSubAtt, setViewingSubAtt] = useState(null);
    const longPressTimer = useRef(null);
    const fileRef = useRef(null);

    const fetchSubs = async () => {
        const token = localStorage.getItem('token');
        try { const res = await axios.get(`${API_URL}/subscriptions/`, { headers: { Authorization: `Bearer ${token}` } }); setSubs(res.data); } catch(e) { console.error(e); }
    };
    useEffect(() => { fetchSubs(); }, []);

    const handleAddOrUpdate = async (e) => {
        e.preventDefault(); const token = localStorage.getItem('token');
        const payload = { ...newSub, amount: parseFloat(newSub.amount), next_due_date: new Date(newSub.next_due_date).toISOString() };
        if (showEdit && options) {
            await axios.put(`${API_URL}/subscriptions/${options.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        } else {
            await axios.post(`${API_URL}/subscriptions/`, payload, { headers: { Authorization: `Bearer ${token}` } });
        }
        setShowAdd(false); setShowEdit(false); setOptions(null); fetchSubs();
        setNewSub({ name: '', amount: '', billing_cycle: 'Monthly', next_due_date: '', attachment: '' });
    };

    const handleDelete = async (id) => {
        if(!confirm("Stop tracking this subscription?")) return;
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/subscriptions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setOptions(null); fetchSubs();
    };
    
    const handleFile = async (e) => {
        try { const b64 = await processImage(e.target.files[0]); setNewSub(prev => ({...prev, attachment: b64})); } catch(e) { alert("Error processing file"); }
    };
    
    const handleTouchStart = (s) => { longPressTimer.current = setTimeout(() => { if(navigator.vibrate) navigator.vibrate(50); setOptions(s); }, 500); };
    const handleTouchEnd = () => { if(longPressTimer.current) clearTimeout(longPressTimer.current); };
    const startEdit = (s) => {
        setNewSub({ name: s.name, amount: s.amount, billing_cycle: s.billing_cycle, next_due_date: new Date(s.next_due_date).toISOString().split('T')[0], attachment: s.attachment || '' });
        setOptions(s); setShowEdit(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in relative">
            {options && !showEdit && (<div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOptions(null)}></div><div className="bg-neutral-900 border border-neutral-700 p-1 rounded-2xl w-3/4 max-w-[200px] shadow-2xl relative z-50 flex flex-col gap-1"><div className="text-center py-3 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800">Options</div><button onClick={() => startEdit(options)} className="w-full bg-neutral-800 text-white p-3 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition-colors"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Edit2 size={16}/></div><span className="font-medium text-sm">Edit</span></button><button onClick={() => handleDelete(options.id)} className="w-full bg-neutral-800 text-red-400 p-3 rounded-xl flex items-center gap-3 hover:bg-red-900/20 transition-colors"><div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Trash2 size={16}/></div><span className="font-medium text-sm">Delete</span></button><button onClick={() => setOptions(null)} className="w-full text-neutral-500 text-sm py-3 hover:text-white transition-colors">Cancel</button></div></div>)}
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Subscriptions</h2><button onClick={() => { setNewSub({ name: '', amount: '', billing_cycle: 'Monthly', next_due_date: '', attachment: '' }); setShowAdd(true); }} className="bg-neutral-800 text-white p-2 rounded-lg border border-neutral-700"><Plus size={20}/></button></div>
            <div className="grid gap-3">{subs.map(s => (<div key={s.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center select-none active:scale-95 transition-transform" onTouchStart={() => handleTouchStart(s)} onTouchEnd={handleTouchEnd} onMouseDown={() => handleTouchStart(s)} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}><div className="flex items-center gap-3"><div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400"><RefreshCw size={18}/></div> <div><p className="text-white font-bold text-sm">{s.name}</p><p className="text-[10px] text-neutral-500">Next: {formatDate(s.next_due_date)} • {s.billing_cycle}</p></div></div><div className="flex items-center gap-3">{s.attachment && <button onClick={(e) => { e.stopPropagation(); setViewingSubAtt(s.attachment); }} className="text-neutral-500 hover:text-white"><Eye size={16}/></button>}<p className="text-white font-bold text-sm">{formatMoney(s.amount, currency, privacy)}</p></div></div>))}{subs.length === 0 && <div className="text-center py-10 text-neutral-500">No active subscriptions.</div>}</div>
            {(showAdd || showEdit) && <Modal title={showEdit ? "Edit Subscription" : "Add Subscription"} onClose={() => { setShowAdd(false); setShowEdit(false); setOptions(null); }}><form onSubmit={handleAddOrUpdate} className="space-y-4"><FormField label="Service Name"><Input value={newSub.name} onChange={e=>setNewSub({...newSub, name: e.target.value})} required/></FormField><div className="grid grid-cols-2 gap-4"><FormField label="Amount"><Input type="number" value={newSub.amount} onChange={e=>setNewSub({...newSub, amount: e.target.value})} required/></FormField><FormField label="Cycle"><Select value={newSub.billing_cycle} onChange={e=>setNewSub({...newSub, billing_cycle: e.target.value})}><option>Monthly</option><option>Yearly</option></Select></FormField></div><FormField label="Next Billing Date"><Input type="date" value={newSub.next_due_date} onChange={e=>setNewSub({...newSub, next_due_date: e.target.value})} required/></FormField><FormField label="Attachment (Invoice/Receipt)"><div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-800" onClick={() => fileRef.current.click()}><Upload className="mx-auto text-neutral-500 mb-2"/><span className="text-xs text-neutral-400">{newSub.attachment ? 'File Selected' : 'Upload File'}</span></div><input type="file" ref={fileRef} className="hidden" onChange={handleFile}/></FormField><button className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold mt-2">Track Subscription</button></form></Modal>}
            {viewingSubAtt && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setViewingSubAtt(null)}><button onClick={() => setViewingSubAtt(null)} className="absolute top-6 right-6 bg-neutral-800/80 text-white p-3 rounded-full hover:bg-neutral-700 transition-colors z-[80]"><X size={24} /></button>{viewingSubAtt.startsWith('data:application/pdf') ? <iframe src={viewingSubAtt} className="w-full h-[85vh] rounded-lg shadow-2xl border-none" /> : <img src={viewingSubAtt} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} alt="Proof" />}</div>}
        </div>
    );
};

const CalendarPage = ({ cards, currency }) => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    const startDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); 
    const events = [];
    cards.forEach(c => { events.push({ day: c.payment_due_date, type: 'due', label: `${c.name} Due` }); events.push({ day: c.statement_date, type: 'stmt', label: `${c.name} Stmt` }); });
    const getDayEvents = (d) => events.filter(e => e.day === d);

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white mb-4">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">{['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-xs text-neutral-500 font-bold">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">{[...Array(startDay)].map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}{[...Array(daysInMonth)].map((_, i) => { const day = i + 1; const evts = getDayEvents(day); const isToday = day === today.getDate(); return (<div key={day} className={`aspect-square bg-neutral-900 border border-neutral-800 rounded-lg p-1 relative flex flex-col items-center ${isToday ? 'border-red-500' : ''}`}><span className={`text-xs font-medium ${isToday ? 'text-red-500' : 'text-neutral-400'}`}>{day}</span><div className="flex gap-0.5 mt-1 flex-wrap justify-center">{evts.map((e, idx) => (<div key={idx} className={`w-1.5 h-1.5 rounded-full ${e.type === 'due' ? 'bg-red-500' : 'bg-blue-500'}`} title={e.label}></div>))}</div></div>); })}</div>
            <div className="flex gap-4 justify-center text-xs text-neutral-500 mt-4"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Due Date</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Statement</div></div>
        </div>
    );
};

const LendingPage = ({ currentUser, privacy }) => {
    const [lendingList, setLendingList] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showReturn, setShowReturn] = useState(null); 
    const [viewingProof, setViewingProof] = useState(null); 
    const [newItem, setNewItem] = useState({ borrower_name: '', amount: '', lent_date: new Date().toISOString().split('T')[0], reminder_date: '', attachment_lent: '' });
    const [returnItem, setReturnItem] = useState({ returned_date: new Date().toISOString().split('T')[0], attachment_returned: '' });
    const fileRef = useRef(null); const returnFileRef = useRef(null);

    const [lendOptions, setLendOptions] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const longPressTimer = useRef(null);

    const fetchLending = async () => { const token = localStorage.getItem('token'); try { const res = await axios.get(`${API_URL}/lending/`, { headers: { Authorization: `Bearer ${token}` } }); setLendingList(res.data); } catch (e) { console.error(e); } };
    useEffect(() => { fetchLending(); }, []);

    const handleAddOrUpdate = async (e) => { 
        e.preventDefault(); const token = localStorage.getItem('token'); 
        try { 
            const payload = { ...newItem, amount: parseFloat(newItem.amount), lent_date: new Date(newItem.lent_date).toISOString(), reminder_date: newItem.reminder_date ? new Date(newItem.reminder_date).toISOString() : null };
            if (showEdit && lendOptions) {
                await axios.put(`${API_URL}/lending/${lendOptions.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/lending/`, payload, { headers: { Authorization: `Bearer ${token}` } }); 
            }
            setShowAdd(false); setShowEdit(false); setLendOptions(null); fetchLending(); setNewItem({ borrower_name: '', amount: '', lent_date: new Date().toISOString().split('T')[0], reminder_date: '', attachment_lent: '' }); 
        } catch(e) { alert("Failed to save"); } 
    };
    
    const handleDelete = async (id) => {
        if(!confirm("Delete record?")) return;
        const token = localStorage.getItem('token');
        try { await axios.delete(`${API_URL}/lending/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setLendOptions(null); fetchLending(); } catch(e) { alert("Failed"); }
    };

    const handleReturn = async (e) => { e.preventDefault(); const token = localStorage.getItem('token'); try { await axios.put(`${API_URL}/lending/${showReturn}/return`, { is_returned: true, returned_date: new Date(returnItem.returned_date).toISOString(), attachment_returned: returnItem.attachment_returned }, { headers: { Authorization: `Bearer ${token}` } }); setShowReturn(null); fetchLending(); } catch(e) { alert("Failed to update"); } };
    const handleFile = async (e, setter, field) => { try { const b64 = await processImage(e.target.files[0]); setter(prev => ({...prev, [field]: b64})); } catch(e) { alert("Error processing image"); } };
    
    const handleTouchStart = (item) => { longPressTimer.current = setTimeout(() => { if(navigator.vibrate) navigator.vibrate(50); setLendOptions(item); }, 500); };
    const handleTouchEnd = () => { if(longPressTimer.current) clearTimeout(longPressTimer.current); };

    const startEdit = (item) => {
        setNewItem({ borrower_name: item.borrower_name, amount: item.amount, lent_date: new Date(item.lent_date).toISOString().split('T')[0], reminder_date: item.reminder_date ? new Date(item.reminder_date).toISOString().split('T')[0] : '', attachment_lent: item.attachment_lent });
        setLendOptions(item); setShowEdit(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in relative">
            {lendOptions && !showEdit && (<div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLendOptions(null)}></div><div className="bg-neutral-900 border border-neutral-700 p-1 rounded-2xl w-3/4 max-w-[200px] shadow-2xl relative z-50 flex flex-col gap-1"><div className="text-center py-3 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800">Options</div><button onClick={() => startEdit(lendOptions)} className="w-full bg-neutral-800 text-white p-3 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition-colors"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Edit2 size={16}/></div><span className="font-medium text-sm">Edit</span></button><button onClick={() => handleDelete(lendOptions.id)} className="w-full bg-neutral-800 text-red-400 p-3 rounded-xl flex items-center gap-3 hover:bg-red-900/20 transition-colors"><div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Trash2 size={16}/></div><span className="font-medium text-sm">Delete</span></button><button onClick={() => setLendOptions(null)} className="w-full text-neutral-500 text-sm py-3 hover:text-white transition-colors">Cancel</button></div></div>)}
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Debt Portfolio</h2><button onClick={() => { setNewItem({ borrower_name: '', amount: '', lent_date: new Date().toISOString().split('T')[0], reminder_date: '', attachment_lent: '' }); setShowAdd(true); }} className="bg-neutral-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold border border-neutral-700"><Plus size={16}/> Lend Money</button></div>
            <div className="space-y-3">{lendingList.map(item => (<div key={item.id} className={`p-4 rounded-xl border select-none transition-transform active:scale-[0.98] ${item.is_returned ? 'bg-green-900/10 border-green-900/30' : 'bg-neutral-900 border-neutral-800'}`} onTouchStart={() => handleTouchStart(item)} onTouchEnd={handleTouchEnd} onMouseDown={() => handleTouchStart(item)} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}><div className="flex justify-between items-start mb-2"><div><h3 className="font-bold text-white text-lg">{item.borrower_name}</h3><p className="text-xs text-neutral-500">Lent on {formatDate(item.lent_date)}</p></div><div className="text-right"><span className={`font-bold text-lg ${item.is_returned ? 'text-green-500 line-through' : 'text-red-500'}`}>{formatMoney(item.amount, currentUser.currency, privacy)}</span></div></div>{item.attachment_lent && (<div className="mt-2 mb-2 p-2 bg-black/30 rounded-lg border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-black/50 transition-colors" onClick={(e) => { e.stopPropagation(); setViewingProof(item.attachment_lent); }}><Eye size={14} className="text-blue-400"/> <span className="text-xs text-blue-300">View Proof (Lent)</span></div>)}{!item.is_returned ? (<div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5"><span className="text-xs text-neutral-500 flex items-center gap-1"><Bell size={12}/> {item.reminder_date ? `Remind: ${formatDate(item.reminder_date)}` : 'No reminder'}</span><button onClick={(e) => { e.stopPropagation(); setShowReturn(item.id); }} className="bg-green-700/20 text-green-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-700/50 hover:bg-green-700/30">Mark Returned</button></div>) : (<div className="mt-2 text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12}/> Returned on {formatDate(item.returned_date)}{item.attachment_returned && (<button onClick={(e) => { e.stopPropagation(); setViewingProof(item.attachment_returned); }} className="ml-2 hover:text-green-300"><Eye size={12}/></button>)}</div>)}</div>))}{lendingList.length === 0 && <div className="text-center py-10 text-neutral-500">No active debts.</div>}</div>
            {(showAdd || showEdit) && (<Modal title={showEdit ? "Edit Lending" : "Lend Money"} onClose={() => { setShowAdd(false); setShowEdit(false); setLendOptions(null); }}><form onSubmit={handleAddOrUpdate} className="space-y-6"><FormField label="Friend Name"><Input value={newItem.borrower_name} onChange={e=>setNewItem({...newItem, borrower_name: e.target.value})} required/></FormField><FormField label="Amount"><Input type="number" value={newItem.amount} onChange={e=>setNewItem({...newItem, amount: e.target.value})} required/></FormField><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Lent Date"><Input type="date" value={newItem.lent_date} onChange={e=>setNewItem({...newItem, lent_date: e.target.value})} required/></FormField><FormField label="Reminder Date"><Input type="date" value={newItem.reminder_date} onChange={e=>setNewItem({...newItem, reminder_date: e.target.value})}/></FormField></div><FormField label="Proof (Optional)"><div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-800" onClick={() => fileRef.current.click()}><Upload className="mx-auto text-neutral-500 mb-2"/><span className="text-xs text-neutral-400">{newItem.attachment_lent ? 'File Selected' : 'Upload Screenshot'}</span></div><input type="file" ref={fileRef} className="hidden" onChange={(e) => handleFile(e, setNewItem, 'attachment_lent')}/></FormField><button className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold mt-2">Save Record</button></form></Modal>)}
            {showReturn && <Modal title="Mark as Returned" onClose={() => setShowReturn(null)}><form onSubmit={handleReturn} className="space-y-6"><FormField label="Returned Date"><Input type="date" value={returnItem.returned_date} onChange={e=>setReturnItem({...returnItem, returned_date: e.target.value})} required/></FormField><FormField label="Proof of Return (Optional)"><div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-800" onClick={() => returnFileRef.current.click()}><Upload className="mx-auto text-neutral-500 mb-2"/><span className="text-xs text-neutral-400">{returnItem.attachment_returned ? 'File Selected' : 'Upload Screenshot'}</span></div><input type="file" ref={returnFileRef} className="hidden" onChange={(e) => handleFile(e, setReturnItem, 'attachment_returned')}/></FormField><button className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold mt-2">Confirm Return</button></form></Modal>}
            {viewingProof && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setViewingProof(null)}><button onClick={() => setViewingProof(null)} className="absolute top-6 right-6 bg-neutral-800/80 text-white p-3 rounded-full hover:bg-neutral-700 transition-colors z-[80]"><X size={24} /></button>{viewingProof.startsWith('data:application/pdf') ? <iframe src={viewingProof} className="w-full h-[85vh] rounded-lg shadow-2xl border-none" /> : <img src={viewingProof} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} alt="Proof" />}</div>}
        </div>
    );
};

const IncomePage = ({ currentUser, privacy }) => {
    const [companies, setCompanies] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [showAddComp, setShowAddComp] = useState(false);
    const [showLogSal, setShowLogSal] = useState(false);
    const [compOptions, setCompOptions] = useState(null); 
    const [showEditComp, setShowEditComp] = useState(false); 
    const [salOptions, setSalOptions] = useState(null);
    const [showEditSal, setShowEditSal] = useState(false);
    const [viewCompany, setViewCompany] = useState(null);
    const [viewingSlip, setViewingSlip] = useState(null);
    const longPressTimer = useRef(null);
    const [newComp, setNewComp] = useState({ name: '', joining_date: new Date().toISOString().split('T')[0], leaving_date: '', is_current: true, logo: '' });
    const [newSal, setNewSal] = useState({ amount: '', date: new Date().toISOString().split('T')[0], company_id: '', slip: '' });
    const logoRef = useRef(null);
    const slipRef = useRef(null);

    const fetchData = async () => { const token = localStorage.getItem('token'); const [c, s] = await Promise.all([axios.get(`${API_URL}/income/companies`, { headers: { Authorization: `Bearer ${token}` } }), axios.get(`${API_URL}/income/salary`, { headers: { Authorization: `Bearer ${token}` } })]); setCompanies(c.data); setSalaries(s.data); };
    useEffect(() => { fetchData(); }, []);

    const handleAddOrUpdateComp = async (e) => { e.preventDefault(); const token = localStorage.getItem('token'); try { const payload = { name: newComp.name, joining_date: new Date(newComp.joining_date).toISOString(), leaving_date: newComp.leaving_date ? new Date(newComp.leaving_date).toISOString() : null, is_current: newComp.is_current, logo: newComp.logo }; if (showEditComp && compOptions) { await axios.put(`${API_URL}/income/companies/${compOptions.id}`, payload, { headers: { Authorization: `Bearer ${token}` } }); } else { await axios.post(`${API_URL}/income/companies`, payload, { headers: { Authorization: `Bearer ${token}` } }); } setShowAddComp(false); setShowEditComp(false); setCompOptions(null); fetchData(); setNewComp({ name: '', joining_date: new Date().toISOString().split('T')[0], leaving_date: '', is_current: true, logo: '' }); } catch(err) { alert("Failed to save company"); } };
    const handleDeleteComp = async (id) => { if(!confirm("Delete this company?")) return; const token = localStorage.getItem('token'); try { await axios.delete(`${API_URL}/income/companies/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setCompOptions(null); fetchData(); } catch(err) { alert("Failed to delete company"); } };
    
    // FIXED SALARY SUBMISSION
    const handleLogOrUpdateSal = async (e) => { 
        e.preventDefault(); 
        if(!newSal.company_id) { alert("Please select a company"); return; } 
        const token = localStorage.getItem('token'); 
        try { 
            const payload = { 
                amount: parseFloat(newSal.amount), 
                date: new Date(newSal.date).toISOString(), 
                company_id: parseInt(newSal.company_id), 
                slip: newSal.slip || null 
            }; 
            if (showEditSal && salOptions) { 
                await axios.put(`${API_URL}/income/salary/${salOptions.id}`, payload, { headers: { Authorization: `Bearer ${token}` } }); 
            } else { 
                await axios.post(`${API_URL}/income/salary`, payload, { headers: { Authorization: `Bearer ${token}` } }); 
            } 
            setShowLogSal(false); setShowEditSal(false); setSalOptions(null); fetchData(); 
            setNewSal({ amount: '', date: new Date().toISOString().split('T')[0], company_id: '', slip: '' }); 
        } catch(err) { alert("Failed to save salary: " + (err.response?.data?.detail || err.message)); } 
    };
    
    const handleDeleteSal = async (id) => { if(!confirm("Delete this record?")) return; const token = localStorage.getItem('token'); try { await axios.delete(`${API_URL}/income/salary/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setSalOptions(null); fetchData(); } catch(err) { alert("Failed to delete salary"); } };
    const handleLogoUpload = async (e) => { try { const b64 = await processImage(e.target.files[0]); setNewComp(prev => ({...prev, logo: b64})); } catch(err) { alert("Error uploading logo"); } };
    const handleSlipUpload = async (e) => { try { const b64 = await processImage(e.target.files[0]); setNewSal(prev => ({...prev, slip: b64})); } catch(err) { alert("Error uploading slip"); } };
    const handleTouchStart = (item, setter) => { longPressTimer.current = setTimeout(() => { if (navigator.vibrate) navigator.vibrate(50); setter(item); }, 500); };
    const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
    const startEditComp = (comp) => { setNewComp({ name: comp.name, joining_date: new Date(comp.joining_date).toISOString().split('T')[0], leaving_date: comp.leaving_date ? new Date(comp.leaving_date).toISOString().split('T')[0] : '', is_current: comp.is_current, logo: comp.logo || '' }); setCompOptions(comp); setShowEditComp(true); };
    const startEditSal = (sal) => { setNewSal({ amount: sal.amount, date: new Date(sal.date).toISOString().split('T')[0], company_id: sal.company_id, slip: sal.slip || '' }); setSalOptions(sal); setShowEditSal(true); };
    const getCompanyTotal = (id) => salaries.filter(s => s.company_id === id).reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in relative">
            {compOptions && !showEditComp && (<div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCompOptions(null)}></div><div className="bg-neutral-900 border border-neutral-700 p-1 rounded-2xl w-3/4 max-w-[200px] shadow-2xl relative z-50 flex flex-col gap-1"><div className="text-center py-3 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800">Company Options</div><button onClick={() => startEditComp(compOptions)} className="w-full bg-neutral-800 text-white p-3 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition-colors"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Edit2 size={16}/></div><span className="font-medium text-sm">Edit</span></button><button onClick={() => handleDeleteComp(compOptions.id)} className="w-full bg-neutral-800 text-red-400 p-3 rounded-xl flex items-center gap-3 hover:bg-red-900/20 transition-colors"><div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Trash2 size={16}/></div><span className="font-medium text-sm">Delete</span></button><button onClick={() => setCompOptions(null)} className="w-full text-neutral-500 text-sm py-3 hover:text-white transition-colors">Cancel</button></div></div>)}
            {salOptions && !showEditSal && (<div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSalOptions(null)}></div><div className="bg-neutral-900 border border-neutral-700 p-1 rounded-2xl w-3/4 max-w-[200px] shadow-2xl relative z-50 flex flex-col gap-1"><div className="text-center py-3 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-800">Salary Options</div><button onClick={() => startEditSal(salOptions)} className="w-full bg-neutral-800 text-white p-3 rounded-xl flex items-center gap-3 hover:bg-neutral-700 transition-colors"><div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Edit2 size={16}/></div><span className="font-medium text-sm">Edit</span></button><button onClick={() => handleDeleteSal(salOptions.id)} className="w-full bg-neutral-800 text-red-400 p-3 rounded-xl flex items-center gap-3 hover:bg-red-900/20 transition-colors"><div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Trash2 size={16}/></div><span className="font-medium text-sm">Delete</span></button><button onClick={() => setSalOptions(null)} className="w-full text-neutral-500 text-sm py-3 hover:text-white transition-colors">Cancel</button></div></div>)}
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Income Streams</h2><div className="flex gap-2"><button onClick={() => { setNewComp({ name: '', joining_date: new Date().toISOString().split('T')[0], is_current: true, logo: '' }); setShowAddComp(true); }} className="bg-neutral-800 text-white p-2 rounded-lg border border-neutral-700 hover:bg-neutral-700"><Briefcase size={20}/></button><button onClick={() => { setNewSal({ amount: '', date: new Date().toISOString().split('T')[0], company_id: '', slip: '' }); setShowLogSal(true); }} className="bg-green-700 text-white p-2 rounded-lg hover:bg-green-600"><Plus size={20}/></button></div></div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">{companies.map(c => (<div key={c.id} onClick={() => setViewCompany(c)} className="min-w-[150px] bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between h-28 relative select-none transition-transform active:scale-95 cursor-pointer" onTouchStart={() => handleTouchStart(c, setCompOptions)} onTouchEnd={handleTouchEnd} onMouseDown={() => handleTouchStart(c, setCompOptions)} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}>{c.logo ? (<img src={c.logo} className="w-8 h-8 object-contain rounded mb-1" alt="logo" />) : (<Briefcase size={24} className="text-blue-500 mb-1"/>)}<div><p className="font-bold text-white text-sm truncate">{c.name}</p><p className="text-[10px] text-neutral-500">{formatDate(c.joining_date)} - {c.is_current ? 'Present' : formatDate(c.leaving_date)}</p><p className="text-xs font-bold text-green-500 mt-1">{formatMoney(getCompanyTotal(c.id), currentUser.currency, privacy)}</p></div>{c.is_current && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}</div>))}<button onClick={() => { setNewComp({ name: '', joining_date: new Date().toISOString().split('T')[0], is_current: true, logo: '' }); setShowAddComp(true); }} className="min-w-[60px] bg-neutral-900/50 border border-dashed border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 hover:text-white hover:border-neutral-600"><Plus size={24}/></button></div>
            <div className="space-y-3"><h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Recent Credits</h3>{salaries.map(s => (<div key={s.id} className="flex justify-between items-center p-4 bg-neutral-900 rounded-xl border border-neutral-800 select-none active:scale-95 transition-transform" onTouchStart={() => handleTouchStart(s, setSalOptions)} onTouchEnd={handleTouchEnd} onMouseDown={() => handleTouchStart(s, setSalOptions)} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd}><div className="flex items-center gap-3"><div className="bg-green-900/20 p-2 rounded-lg text-green-500"><DollarSign size={18}/></div><div><p className="text-white font-medium text-sm">{companies.find(c=>c.id===s.company_id)?.name || 'Unknown'}</p><p className="text-[10px] text-neutral-500">{formatDate(s.date)}</p></div></div><div className="flex items-center gap-3">{s.slip && <button onClick={(e) => { e.stopPropagation(); setViewingSlip(s.slip); }} className="text-neutral-500 hover:text-white"><Eye size={16}/></button>}<span className="font-bold text-green-500">+ {formatMoney(s.amount, currentUser.currency, privacy)}</span></div></div>))}{salaries.length === 0 && <div className="text-center py-10 text-neutral-500">No salary history.</div>}</div>
            {(showAddComp || showEditComp) && (<Modal title={showEditComp ? "Edit Company" : "Add Company"} onClose={() => { setShowAddComp(false); setShowEditComp(false); setCompOptions(null); }}><form onSubmit={handleAddOrUpdateComp} className="space-y-6"><div className="flex justify-center mb-4"><div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center cursor-pointer overflow-hidden relative group" onClick={() => logoRef.current.click()}>{newComp.logo ? <img src={newComp.logo} className="w-full h-full object-cover"/> : <Upload size={24} className="text-neutral-500"/>}<div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-[10px] text-white">Change</div></div><input type="file" ref={logoRef} className="hidden" onChange={handleLogoUpload}/></div><FormField label="Company Name"><Input value={newComp.name} onChange={e=>setNewComp({...newComp, name: e.target.value})} required/></FormField><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Joining Date"><Input type="date" value={newComp.joining_date} onChange={e=>setNewComp({...newComp, joining_date: e.target.value})} required/></FormField>{!newComp.is_current && (<FormField label="Leaving Date"><Input type="date" value={newComp.leaving_date} onChange={e=>setNewComp({...newComp, leaving_date: e.target.value})} required/></FormField>)}</div><div className="flex items-center gap-3 bg-neutral-800 p-3 rounded-xl border border-neutral-700"><div onClick={() => setNewComp({...newComp, is_current: !newComp.is_current})} className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${newComp.is_current ? 'bg-green-600 border-green-600' : 'border-neutral-500'}`}>{newComp.is_current && <Check size={14} className="text-white"/>}</div><span className="text-sm text-white font-medium" onClick={() => setNewComp({...newComp, is_current: !newComp.is_current})}>I currently work here</span></div><button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold mt-2 hover:bg-blue-500 transition-colors">{showEditComp ? "Update Company" : "Add Company"}</button></form></Modal>)}
            {(showLogSal || showEditSal) && (<Modal title={showEditSal ? "Edit Salary" : "Log Salary"} onClose={() => { setShowLogSal(false); setShowEditSal(false); setSalOptions(null); }}><form onSubmit={handleLogOrUpdateSal} className="space-y-6"><FormField label="Select Company"><Select value={newSal.company_id} onChange={e=>setNewSal({...newSal, company_id: e.target.value})} required><option value="">-- Select --</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></FormField><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><FormField label="Date"><Input type="date" value={newSal.date} onChange={e=>setNewSal({...newSal, date: e.target.value})} required/></FormField><FormField label="Amount"><Input type="number" value={newSal.amount} onChange={e=>setNewSal({...newSal, amount: e.target.value})} required/></FormField></div><FormField label="Salary Slip (Optional)"><div className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-800" onClick={() => slipRef.current.click()}><Upload className="mx-auto text-neutral-500 mb-2"/><span className="text-xs text-neutral-400">{newSal.slip ? 'File Selected' : 'Upload Slip (PDF/Img)'}</span></div><input type="file" ref={slipRef} className="hidden" onChange={handleSlipUpload}/></FormField><button className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold mt-2 hover:bg-green-500 transition-colors">{showEditSal ? "Update Record" : "Log Credit"}</button></form></Modal>)}
            {viewCompany && (
                <Modal title={viewCompany.name} onClose={() => setViewCompany(null)}>
                    <div className="text-center py-6 border-b border-neutral-800 mb-4">
                        <p className="text-neutral-500 text-xs uppercase tracking-wider">Lifetime Earnings</p>
                        <h2 className="text-3xl font-bold text-white mt-2">{formatMoney(getCompanyTotal(viewCompany.id), currentUser.currency, privacy)}</h2>
                        <p className="text-xs text-neutral-600 mt-2">{formatDate(viewCompany.joining_date)} - {viewCompany.is_current ? 'Present' : formatDate(viewCompany.leaving_date)}</p>
                    </div>
                    <div className="space-y-3">
                        {salaries.filter(s => s.company_id === viewCompany.id).map(s => (
                            <div key={s.id} className="flex justify-between items-center p-3 bg-neutral-950 rounded-xl border border-neutral-800 select-none active:scale-95 transition-transform"
                                 onTouchStart={() => handleTouchStart(s, setSalOptions)} 
                                 onTouchEnd={handleTouchEnd} 
                                 onMouseDown={() => handleTouchStart(s, setSalOptions)} 
                                 onMouseUp={handleTouchEnd} 
                                 onMouseLeave={handleTouchEnd}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-900/20 p-2 rounded-lg text-green-500"><DollarSign size={16}/></div>
                                    <div><p className="text-white font-medium text-sm">{formatDate(s.date)}</p></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {s.slip && <button onClick={(e) => { e.stopPropagation(); setViewingSlip(s.slip); }} className="text-neutral-500 hover:text-white"><Eye size={14}/></button>}
                                    <span className="font-bold text-green-500 text-sm">+ {formatMoney(s.amount, currentUser.currency, privacy)}</span>
                                </div>
                            </div>
                        ))}
                        {salaries.filter(s => s.company_id === viewCompany.id).length === 0 && <p className="text-center text-neutral-500 text-sm">No records found.</p>}
                    </div>
                </Modal>
            )}
            {viewingSlip && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setViewingSlip(null)}><button onClick={() => setViewingSlip(null)} className="absolute top-6 right-6 bg-neutral-800/80 text-white p-3 rounded-full hover:bg-neutral-700 transition-colors z-[80]"><X size={24} /></button>{viewingSlip.startsWith('data:application/pdf') ? <iframe src={viewingSlip} className="w-full h-[85vh] rounded-lg shadow-2xl border-none" /> : <img src={viewingSlip} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} alt="Proof" />}</div>}
        </div>
    );
};

// --- 5. DASHBOARD & SETTINGS ---

const Dashboard = ({ cards, loading, currentUser, onEditCard, onAnalyticsClick, onShowTxnList, onShowSummary, privacy }) => {
  const totalAvailable = cards.reduce((acc, card) => acc + (card.available || 0), 0);
  const totalSpent = cards.reduce((acc, card) => acc + (card.spent || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div onClick={onShowSummary} className="bg-gradient-to-br from-red-900 to-neutral-900 rounded-2xl p-5 text-white border border-red-800/30 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform">
                <p className="text-red-200/70 text-[10px] font-bold uppercase tracking-wider mb-1">Total Available</p>
                <h2 className="text-2xl font-bold tracking-tight">{formatMoney(totalAvailable, currentUser.currency, privacy)}</h2>
            </div>
             <div onClick={onShowTxnList} className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800 shadow-md cursor-pointer hover:border-red-500/50 transition-all active:scale-95">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between mb-1">
                    Total Spent <TrendingUp size={14} className="text-neutral-600"/>
                </p>
                <h2 className="text-2xl font-bold text-white">{formatMoney(totalSpent, currentUser.currency, privacy)}</h2>
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
                        <div className="bg-black/40 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                            <NetworkLogo network={card.network} />
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-400 font-mono tracking-widest text-sm font-bold block">•••• {card.last_4 || 'XXXX'}</span>
                          <span className="text-[10px] text-neutral-500 uppercase">{card.card_type}</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h4 className="font-bold text-white text-xl tracking-wide leading-tight mb-1">{card.name}</h4>
                        <p className="text-xs text-neutral-400 mb-6 uppercase tracking-wider font-semibold">{card.bank}</p>
                        
                        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-neutral-400 text-xs font-medium">Used</span>
                            <span className="text-white font-bold text-xs">{formatMoney(card.spent, currentUser.currency, privacy)}</span>
                          </div>
                          <div className="w-full bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-red-600 h-full" style={{width: `${Math.min((card.spent / card.total_limit) * 100, 100)}%`}}></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 border-t border-white/5 pt-3 mt-1">
                            <div>
                                <span className="block text-neutral-500 uppercase font-bold mb-0.5">Statement</span>
                                <span className="text-neutral-200 font-mono">{getNextDate(card.statement_date)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-neutral-500 uppercase font-bold mb-0.5">Due Date</span>
                                <span className="text-red-400 font-bold font-mono">{getNextDate(card.payment_due_date)}</span>
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
    notify_payment_done: currentUser.notify_payment_done !== false,
  });
  const [password, setPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const fileInputRef = useRef(null); 

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
  
  const handleDownloadCSV = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get(`${API_URL}/transactions/export`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) { alert("Failed to download CSV"); }
  };

  const handleDownloadExcel = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get(`${API_URL}/data/export_excel`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cc_track_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) { alert("Failed to download Excel"); }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("file", file);

    try {
        await axios.post(`${API_URL}/data/import_excel`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        alert("Data imported successfully! Please reload.");
        window.location.reload();
    } catch (err) { alert("Failed to import: " + (err.response?.data?.detail || err.message)); }
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
    <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
       <span className="text-sm text-neutral-300 font-medium">{label}</span>
       <button type="button" onClick={() => setFormData({...formData, [field]: !checked})} className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ${checked ? 'bg-red-600' : 'bg-neutral-700'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
       </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
       <div>
         <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
         <form onSubmit={handleUpdate} className="space-y-6 bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
             
             <div className="grid md:grid-cols-2 gap-6">
                 <FormField label="Display Name">
                    <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                 </FormField>
                 <FormField label="Default Currency">
                    <Select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                       {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </Select>
                 </FormField>
             </div>

             <div className="bg-neutral-950/50 p-5 rounded-xl border border-neutral-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase flex items-center gap-2 mb-1">
                            <Tag size={12} className="text-blue-500"/> Data Management
                        </label>
                        <p className="text-xs text-neutral-500">Backup and restore your data.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={handleDownloadExcel} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 text-white px-5 py-3 rounded-xl text-sm hover:bg-neutral-700 transition-colors font-medium">
                        <Download size={16} /> Export Data
                    </button>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 text-white px-5 py-3 rounded-xl text-sm hover:bg-neutral-700 transition-colors font-medium">
                        <Upload size={16} /> Import Data
                    </button>
                    <input type="file" ref={fileInputRef} accept=".xlsx" className="hidden" onChange={handleImportExcel} />
                </div>
             </div>

             <div className="bg-neutral-900 p-1 rounded-xl">
                <label className="text-[10px] text-neutral-500 font-bold uppercase flex items-center gap-2 mb-4 pl-1">
                  <Bell size={12} className="text-red-500"/> Notifications (Ntfy)
                </label>
                <div className="space-y-3 mb-6">
                   <Input placeholder="Server URL (e.g. https://ntfy.sh)" value={formData.ntfy_server} onChange={e => setFormData({...formData, ntfy_server: e.target.value})} />
                   <div className="flex gap-2">
                     <div className="flex-1">
                        <Input placeholder="Topic Name (e.g. my-cards)" value={formData.ntfy_topic} onChange={e => setFormData({...formData, ntfy_topic: e.target.value})} />
                     </div>
                     <button type="button" onClick={handleTestNotify} className="bg-neutral-800 border border-neutral-700 text-white px-5 rounded-xl text-sm hover:bg-neutral-700 transition-colors font-bold">Test</button>
                   </div>
                </div>
                <div className="space-y-3">
                   <Toggle label="Card Added Alert" checked={formData.notify_card_add} field="notify_card_add" />
                   <Toggle label="Transaction Added Alert" checked={formData.notify_txn_add} field="notify_txn_add" />
                   <Toggle label="Card Deleted Alert" checked={formData.notify_card_del} field="notify_card_del" />
                   <Toggle label="Statement Day Alert" checked={formData.notify_statement} field="notify_statement" />
                   <Toggle label="Due Date Warning (5 Days)" checked={formData.notify_due_dates} field="notify_due_dates" />
                   <Toggle label="Payment Completed" checked={formData.notify_payment_done} field="notify_payment_done" />
                </div>
             </div>
             
             <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white text-black px-4 py-4 rounded-xl font-bold hover:bg-neutral-200 transition-colors">
                <Save size={18}/> Save Changes
             </button>
         </form>
         
         <div className="text-center text-[10px] text-neutral-600 mt-8 font-mono uppercase tracking-widest">
            CC-Track {APP_VERSION}
         </div>
       </div>

       <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/30">
          <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><Trash2 size={16}/> Danger Zone</h3>
          <div className="flex flex-col sm:flex-row gap-4">
             <input className="bg-neutral-950 border border-red-900/50 rounded-xl px-4 py-3 text-white text-sm flex-1 focus:border-red-500 outline-none" 
               placeholder="Type DELETE to confirm" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
             <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'DELETE'} 
               className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/40">
               Delete Account
             </button>
          </div>
       </div>
    </div>
  );
};

const AnalyticsPage = ({ currentUser }) => {
    const [data, setData] = useState({ monthly: [], category: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(`${API_URL}/transactions/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="text-center py-20 text-neutral-600 animate-pulse">Analyzing data...</div>;
    
    if (data.monthly.length === 0 && data.category.length === 0) {
        return (
            <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
                <TrendingUp className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
                <h3 className="text-lg font-medium text-white">No data yet</h3>
                <p className="text-neutral-500">Log some transactions to see insights.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Monthly Spending</h2>
                <div className="h-64 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.monthly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                            <Tooltip cursor={{fill: '#262626'}} contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }} />
                            <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-white mb-4">Spending by Category</h2>
                <div className="h-64 bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.category}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.category.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- 6. AUTH APP & LOGIN ---
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
  
  // New Modals
  const [showTxnList, setShowTxnList] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const [newCard, setNewCard] = useState({ 
      name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', 
      statement_day: 1, due_day: 20, image_front: '', image_back: '', last_4: '',
      card_type: 'Credit Card', expiry_date: '', full_number: '', cvv: '', valid_thru: ''
  });
  const [newTxn, setNewTxn] = useState({ 
      description: '', amount: '', type: 'DEBIT', card_id: '', tag: '', 
      date: new Date().toISOString().split('T')[0], 
      mode: 'Online', custom_mode: '',
      is_emi: false, emi_tenure: 3 
  });
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
        card_type: newCard.card_type,
        expiry_date: newCard.expiry_date,
        total_limit: parseFloat(newCard.limit),
        manual_limit: newCard.manual_limit ? parseFloat(newCard.manual_limit) : parseFloat(newCard.limit),
        statement_date: parseInt(newCard.statement_day),
        payment_due_date: parseInt(newCard.due_day),
        image_front: newCard.image_front,
        image_back: newCard.image_back,
        last_4: newCard.last_4,
        full_number: newCard.full_number,
        cvv: newCard.cvv,
        valid_thru: newCard.valid_thru
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddCard(false);
      fetchData(); 
      setNewCard({ 
          name: '', bank: '', limit: '', manual_limit: '', network: 'Visa', 
          statement_day: 1, due_day: 20, image_front: '', image_back: '', 
          last_4: '', full_number: '', cvv: '', valid_thru: '', card_type: 'Credit Card', expiry_date: ''
      });
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
    
    let finalMode = newTxn.mode;
    if (newTxn.mode === "Others") {
        if (!newTxn.custom_mode.trim()) {
            alert("Please enter the mode manually.");
            return;
        }
        finalMode = newTxn.custom_mode;
    }

    try {
      await axios.post(`${API_URL}/transactions/`, {
        description: newTxn.description,
        amount: parseFloat(newTxn.amount),
        type: newTxn.type,
        card_id: parseInt(newTxn.card_id),
        date: newTxn.date ? new Date(newTxn.date).toISOString() : new Date().toISOString(),
        tag_name: newTxn.tag,
        mode: finalMode,
        is_emi: newTxn.is_emi,
        emi_tenure: newTxn.is_emi ? parseInt(newTxn.emi_tenure) : null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowAddTxn(false);
      fetchData();
      alert('Transaction logged');
      // Reset
      setNewTxn({ description: '', amount: '', type: 'DEBIT', card_id: '', tag: '', date: new Date().toISOString().split('T')[0], mode: 'Online', custom_mode: '', is_emi: false, emi_tenure: 3 });
    } catch (err) { alert('Failed to add transaction: ' + (err.response?.data?.detail || err.message)); }
  };

  const NavButton = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[64px] gap-1 transition-colors ${active ? 'text-red-500' : 'text-neutral-500 hover:text-neutral-300'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
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
              { name: 'Debt & Lending', icon: Users },
              { name: 'Income Streams', icon: DollarSign },
              { name: 'Analytics', icon: TrendingUp },
              { name: 'Settings', icon: Settings }
            ].map((item) => (
               <button key={item.name} onClick={() => setActiveView(item.name)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeView === item.name ? 'bg-red-900/20 text-red-500 border border-red-900/30' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
                <item.icon size={20} /> {item.name}
            </button> 
            ))}
        </nav>
        <div className="p-4 border-t border-neutral-800 flex gap-2">
             <button onClick={() => setPrivacy(!privacy)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors">{privacy ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-xl transition-colors"><LogOut size={20}/></button>
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
          <div className="flex gap-4">
             <button onClick={() => setPrivacy(!privacy)} className="text-neutral-500">{privacy ? <EyeOff size={24}/> : <Eye size={24}/>}</button>
             <button onClick={handleLogout} className="text-neutral-500"><LogOut size={24} /></button>
          </div>
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
              <Dashboard 
                cards={cards} 
                loading={loading} 
                currentUser={currentUser} 
                onEditCard={setEditingCard} 
                onAnalyticsClick={() => setActiveView('Analytics')} 
                onShowTxnList={() => setShowTxnList(true)}
                onShowSummary={() => setShowSummary(true)}
                privacy={privacy}
              />
            </>
         )}
         {activeView === 'Settings' && <SettingsPage currentUser={currentUser} onUpdateUser={setCurrentUser} />}
         {activeView === 'Analytics' && <AnalyticsPage currentUser={currentUser} />}
         {activeView === 'Debt & Lending' && <LendingPage currentUser={currentUser} privacy={privacy} />}
         {activeView === 'Income Streams' && <IncomePage currentUser={currentUser} privacy={privacy} />}
         {activeView === 'Search' && <SearchPage currency={currentUser.currency} privacy={privacy} />}
         {activeView === 'Subscriptions' && <SubscriptionsPage currency={currentUser.currency} privacy={privacy} />}
         {activeView === 'Calendar' && <CalendarPage cards={cards} currency={currentUser.currency} />}
         {activeView === 'My Cards' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(card => (
                  <div key={card.id} onClick={() => setEditingCard(card)} className="cursor-pointer">
                    <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 hover:border-red-900">
                        <p className="font-bold text-white">{card.name}</p>
                        <p className="text-xs text-neutral-500">{card.bank} •••• {card.last_4}</p>
                    </div>
                  </div>
              ))}
              {cards.length === 0 && <p className="text-center text-neutral-500 col-span-full">No cards found.</p>}
           </div>
         )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900 border-t border-neutral-800 flex justify-between items-center px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+24px)] z-30 overflow-x-auto no-scrollbar gap-4">
        <NavButton label="Home" icon={Home} active={activeView === 'Dashboard'} onClick={() => setActiveView('Dashboard')} />
        <NavButton label="Add Card" icon={CreditCard} onClick={() => setShowAddCard(true)} />
        <NavButton label="Add Txn" icon={Plus} onClick={() => setShowAddTxn(true)} />
        <NavButton label="Debt" icon={Users} active={activeView === 'Debt & Lending'} onClick={() => setActiveView('Debt & Lending')} />
        <NavButton label="Income" icon={DollarSign} active={activeView === 'Income Streams'} onClick={() => setActiveView('Income Streams')} />
        <NavButton label="Search" icon={Search} active={activeView === 'Search'} onClick={() => setActiveView('Search')} />
        <NavButton label="Subs" icon={RefreshCw} active={activeView === 'Subscriptions'} onClick={() => setActiveView('Subscriptions')} />
        <NavButton label="Cal" icon={Calendar} active={activeView === 'Calendar'} onClick={() => setActiveView('Calendar')} />
        <NavButton label="Analytics" icon={TrendingUp} active={activeView === 'Analytics'} onClick={() => setActiveView('Analytics')} />
        <NavButton label="Settings" icon={Settings} active={activeView === 'Settings'} onClick={() => setActiveView('Settings')} />
      </nav>

      {/* --- MODALS --- */}
      
      {showTxnList && <TransactionsModal onClose={() => setShowTxnList(false)} currency={currentUser.currency} />}
      {showSummary && <CardSummaryModal cards={cards} currency={currentUser.currency} onClose={() => setShowSummary(false)} />}

      {showAddCard && (
        <Modal title="Add New Card" onClose={() => setShowAddCard(false)}>
           <form onSubmit={handleAddCard} className="space-y-6">
              <div className="flex gap-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField label="Nickname">
                    <Input placeholder="e.g. Amex Gold" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} required />
                 </FormField>
                 <FormField label="Bank Name">
                    <Input placeholder="Chase" value={newCard.bank} onChange={e => setNewCard({...newCard, bank: e.target.value})} required />
                 </FormField>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Last 4 Digits">
                     <Input placeholder="1234" maxLength="4" value={newCard.last_4} onChange={e => setNewCard({...newCard, last_4: e.target.value})} />
                  </FormField>
                  <FormField label="Network">
                     <Select value={newCard.network} onChange={e => setNewCard({...newCard, network: e.target.value})}>
                        <option>Visa</option><option>Mastercard</option><option>Amex</option><option>Discover</option>
                     </Select>
                  </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Total Limit">
                     <Input type="number" placeholder="50000" value={newCard.limit} onChange={e => setNewCard({...newCard, limit: e.target.value})} required />
                  </FormField>
                  <FormField label="Manual Limit">
                     <Input type="number" placeholder="Optional" value={newCard.manual_limit} onChange={e => setNewCard({...newCard, manual_limit: e.target.value})} />
                  </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Card Type">
                      <Select value={newCard.card_type} onChange={e => setNewCard({...newCard, card_type: e.target.value})}>
                          {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </Select>
                  </FormField>
                  <FormField label="Expiry (MM/YY)">
                      <Input placeholder="12/28" value={newCard.expiry_date} onChange={e => setNewCard({...newCard, expiry_date: e.target.value})} />
                  </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Statement Date">
                      <Select value={newCard.statement_day} onChange={e => setNewCard({...newCard, statement_day: e.target.value})}>
                          {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                      </Select>
                  </FormField>
                  <FormField label="Payment Due Date">
                      <Select value={newCard.due_day} onChange={e => setNewCard({...newCard, due_day: e.target.value})}>
                          {[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}th</option>)}
                      </Select>
                  </FormField>
              </div>

              {/* Virtual Card Details (Collapsed by default logic handled by user filling or not) */}
              <div className="pt-4 border-t border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Virtual Card Details (Optional)</p>
                  <div className="grid grid-cols-1 gap-4">
                      <FormField label="Full Card Number">
                         <Input placeholder="0000 0000 0000 0000" maxLength="19" 
                            value={newCard.full_number || ''} 
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g,'').substring(0,16);
                                setNewCard({...newCard, full_number: val, last_4: val.slice(-4)});
                            }} />
                      </FormField>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField label="Valid Thru">
                             <Input placeholder="MM/YY" maxLength="5" value={newCard.valid_thru || ''} onChange={e => setNewCard({...newCard, valid_thru: e.target.value})} />
                          </FormField>
                          <FormField label="CVV">
                             <Input placeholder="123" maxLength="4" type="password" value={newCard.cvv || ''} onChange={e => setNewCard({...newCard, cvv: e.target.value})} />
                          </FormField>
                      </div>
                  </div>
              </div>

              <button type="submit" className="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 mt-2 transition-colors">Save Card</button>
           </form>
        </Modal>
      )}

      {showAddTxn && (
        <Modal title="Log Transaction" onClose={() => setShowAddTxn(false)}>
           <form onSubmit={handleAddTxn} className="space-y-6">
              <FormField label="Select Card">
                 <Select value={newTxn.card_id} onChange={e => setNewTxn({...newTxn, card_id: e.target.value})} required>
                    <option value="">-- Choose Source --</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.last_4 || 'XXXX'})</option>)}
                 </Select>
              </FormField>

              <FormField label="Description">
                 <Input placeholder="Starbucks, AWS, etc." value={newTxn.description} onChange={e => setNewTxn({...newTxn, description: e.target.value})} required />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Date">
                     <Input type="date" value={newTxn.date} onChange={e => setNewTxn({...newTxn, date: e.target.value})} required />
                  </FormField>
                  <FormField label="Mode">
                     <Select value={newTxn.mode} onChange={e => setNewTxn({...newTxn, mode: e.target.value})}>
                        {TXN_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                     </Select>
                  </FormField>
              </div>

              {/* Conditional Input for "Others" Mode */}
              {newTxn.mode === 'Others' && (
                <FormField label="Specify Mode">
                   <Input placeholder="e.g. Bank Transfer" value={newTxn.custom_mode} onChange={e => setNewTxn({...newTxn, custom_mode: e.target.value})} required />
                </FormField>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Amount">
                     <Input type="number" step="0.01" placeholder="0.00" value={newTxn.amount} onChange={e => setNewTxn({...newTxn, amount: e.target.value})} required />
                  </FormField>
                  <FormField label="Type">
                     <Select value={newTxn.type} onChange={e => setNewTxn({...newTxn, type: e.target.value})}>
                        <option value="DEBIT">Expense</option>
                        <option value="CREDIT">Payment/Refund</option>
                     </Select>
                  </FormField>
              </div>

              {/* Payment Style (EMI vs Full) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <FormField label="Payment Style">
                       <Select value={newTxn.is_emi ? "EMI" : "Full"} onChange={e => setNewTxn({...newTxn, is_emi: e.target.value === "EMI"})}>
                           <option value="Full">Full Swipe</option>
                           <option value="EMI">EMI</option>
                       </Select>
                   </FormField>
                   {newTxn.is_emi && (
                       <FormField label="Tenure">
                           <Select value={newTxn.emi_tenure} onChange={e => setNewTxn({...newTxn, emi_tenure: e.target.value})}>
                               {[3, 6, 9, 12, 18, 24, 36, 48].map(m => <option key={m} value={m}>{m} Months</option>)}
                           </Select>
                       </FormField>
                   )}
              </div>

              <FormField label="Tag (Auto-saved)">
                 <Input placeholder="Dining, Travel, Utilities..." value={newTxn.tag} onChange={e => setNewTxn({...newTxn, tag: e.target.value})} />
              </FormField>

              <button type="submit" className="w-full bg-red-700 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 mt-2 transition-colors">Add Transaction</button>
           </form>
        </Modal>
      )}

      {editingCard && (
        <EditCardModal 
            card={editingCard} 
            onClose={() => setEditingCard(null)} 
            onDelete={handleDeleteCard}
            onUpdate={fetchData} 
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
              <FormField label="Username">
                  <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </FormField>
              {!isLogin && (
                <FormField label="Full Name">
                  <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </FormField>
              )}
              <FormField label="Password">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </FormField>
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