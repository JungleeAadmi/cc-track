import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import { Plus, CreditCard, Banknote, Paperclip } from 'lucide-react';

const Transactions = () => {
  const [txs, setTxs] = useState([]);
  const [cards, setCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const initialForm = {
    description: '', amount: '', type: 'expense',
    card_id: '', merchant_location: '', payment_mode: 'online',
    is_emi: false, emi_months: '3', date_str: new Date().toISOString().split('T')[0]
  };
  const [form, setForm] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
        const [tRes, cRes] = await Promise.all([
            api.get('/api/transactions/'),
            api.get('/api/cards/')
        ]);
        setTxs(tRes.data);
        setCards(cRes.data);
    } catch(e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if(attachment) formData.append('attachment', attachment);

    try {
        await api.post('/api/transactions/', formData);
        setShowModal(false);
        setForm(initialForm);
        setAttachment(null);
        fetchData();
    } catch(e) { alert("Failed to add transaction"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Transactions</h2>
        <Button onClick={() => setShowModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="space-y-3">
        {txs.map(tx => (
            <div key={tx.id} className="bg-surface border border-white/5 p-4 rounded-xl flex justify-between items-center relative overflow-hidden group">
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-lg ${tx.type === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.card_id ? <CreditCard size={20}/> : <Banknote size={20}/>}
                    </div>
                    <div>
                        <p className="font-semibold text-white">{tx.description}</p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(tx.date).toLocaleDateString()} • {tx.payment_mode} {tx.is_emi && `• ${tx.emi_months}m EMI`}
                        </p>
                    </div>
                </div>
                
                <div className="text-right relative z-10">
                    <p className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                        {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                    </p>
                    {tx.attachment_path && (
                        <button onClick={() => window.open(`/uploads/${tx.attachment_path}`, '_blank')} className="text-[10px] text-primary hover:underline flex items-center justify-end gap-1 mt-1">
                            <Paperclip size={10}/> Receipt
                        </button>
                    )}
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
                <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-2 text-sm rounded-md transition-colors ${form.type === 'expense' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>Expense</button>
                <button type="button" onClick={() => setForm({...form, type: 'credit'})} className={`flex-1 py-2 text-sm rounded-md transition-colors ${form.type === 'credit' ? 'bg-green-600 text-white' : 'text-slate-400'}`}>Credit</button>
            </div>

            <Input label="Amount" type="number" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} required autoFocus />
            <Input label="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} required />
            <Input label="Merchant / Location" placeholder="e.g. Amazon, Starbucks" value={form.merchant_location} onChange={e=>setForm({...form, merchant_location: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={form.date_str} onChange={e=>setForm({...form, date_str: e.target.value})} required />
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Payment Mode</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.payment_mode} onChange={e=>setForm({...form, payment_mode: e.target.value})}>
                        <option value="online">Online</option>
                        <option value="swipe">Swipe (POS)</option>
                        <option value="cash">Cash</option>
                    </select>
                </div>
            </div>

            {form.payment_mode !== 'cash' && (
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Card (Optional)</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.card_id} onChange={e=>setForm({...form, card_id: e.target.value})}>
                        <option value="">Select a Card...</option>
                        {cards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.card_number_last4})</option>)}
                    </select>
                </div>
            )}

            {form.payment_mode !== 'cash' && form.type === 'expense' && (
                 <div className="flex items-center gap-3 p-3 border border-white/10 rounded-lg">
                    <input type="checkbox" checked={form.is_emi} onChange={e=>setForm({...form, is_emi: e.target.checked})} className="w-5 h-5"/>
                    <label className="text-sm">Convert to EMI</label>
                    {form.is_emi && (
                        <select className="ml-auto bg-slate-900 border border-slate-700 rounded p-1 text-sm" value={form.emi_months} onChange={e=>setForm({...form, emi_months: e.target.value})}>
                            {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} Months</option>)}
                        </select>
                    )}
                 </div>
            )}

            <FileInput label="Receipt / Screenshot" onChange={e=>setAttachment(e.target.files[0])} accept="image/*,.pdf" />
            
            <Button type="submit" className="w-full" isLoading={loading}>Save Transaction</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;