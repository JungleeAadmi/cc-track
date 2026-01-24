import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import VirtualCard from '../components/VirtualCard';
import useLongPress from '../hooks/useLongPress';
import { Plus, Trash2, Camera, RefreshCw } from 'lucide-react';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const initialForm = {
    name: '', bank_name: '', card_network: 'Visa', card_type: 'Credit',
    card_number_last4: '', cvv: '', expiry_date: '', owner_name: '',
    limit: '', statement_date: '', payment_due_date: '', color_theme: 'gradient-1'
  };
  const [form, setForm] = useState(initialForm);
  const [frontImg, setFrontImg] = useState(null);
  const [backImg, setBackImg] = useState(null);

  // Auto-Refresh polling (every 15s) for multi-device sync
  useEffect(() => {
    fetchCards();
    const interval = setInterval(fetchCards, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/api/cards/');
      setCards(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    if (frontImg) formData.append('front_image', frontImg);
    if (backImg) formData.append('back_image', backImg);

    try {
      await api.post('/api/cards/', formData);
      setShowModal(false);
      setForm(initialForm);
      setFrontImg(null);
      setBackImg(null);
      fetchCards();
    } catch (err) {
      alert("Failed to add card. Check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this card permanently?")) {
      await api.delete(`/api/cards/${id}`);
      fetchCards();
    }
  };

  // Long press handler setup
  const longPressProps = useLongPress(
    (e) => {
        // Find the card ID from the dataset of the clicked element or parent
        const cardId = e.target.closest('[data-card-id]')?.dataset.cardId;
        if(cardId) handleDelete(cardId);
    },
    () => {}, // Normal click (could open details view)
    { delay: 800 }
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Wallet</h2>
        <Button onClick={() => setShowModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
            <div key={card.id} data-card-id={card.id} {...longPressProps} className="relative">
                <VirtualCard card={card} />
            </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Card">
        <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Card Nickname" placeholder="HDFC Regalia" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
                <Input label="Bank Name" placeholder="HDFC" value={form.bank_name} onChange={e=>setForm({...form, bank_name: e.target.value})} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Network</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.card_network} onChange={e=>setForm({...form, card_network: e.target.value})}>
                        <option>Visa</option><option>Mastercard</option><option>RuPay</option><option>Amex</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Type</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.card_type} onChange={e=>setForm({...form, card_type: e.target.value})}>
                        <option>Credit</option><option>Debit</option><option>Forex</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Input label="Last 4" maxLength="4" placeholder="1234" value={form.card_number_last4} onChange={e=>setForm({...form, card_number_last4: e.target.value})} required />
                <Input label="Expiry" placeholder="MM/YY" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})} required />
                <Input label="CVV" type="password" maxLength="4" value={form.cvv} onChange={e=>setForm({...form, cvv: e.target.value})} />
            </div>

            <Input label="Owner Name on Card" value={form.owner_name} onChange={e=>setForm({...form, owner_name: e.target.value})} required />
            <Input label="Total Limit" type="number" value={form.limit} onChange={e=>setForm({...form, limit: e.target.value})} required />

            <div className="grid grid-cols-2 gap-4">
                <Input label="Statement Date (Day)" type="number" max="31" placeholder="e.g 15" value={form.statement_date} onChange={e=>setForm({...form, statement_date: e.target.value})} />
                <Input label="Payment Due (Day)" type="number" max="31" placeholder="e.g 5" value={form.payment_due_date} onChange={e=>setForm({...form, payment_due_date: e.target.value})} />
            </div>
            
            <div className="space-y-1">
                 <label className="text-xs text-slate-400">Card Color Theme</label>
                 <div className="flex gap-2">
                     {['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'].map(theme => (
                         <div 
                            key={theme} 
                            onClick={() => setForm({...form, color_theme: theme})}
                            className={`w-8 h-8 rounded-full cursor-pointer border-2 ${form.color_theme === theme ? 'border-white' : 'border-transparent'} bg-gradient-to-br ${theme === 'gradient-1' ? 'from-purple-900 to-blue-900' : theme === 'gradient-2' ? 'from-slate-900 to-black' : theme === 'gradient-3' ? 'from-red-900 to-rose-900' : theme === 'gradient-4' ? 'from-emerald-900 to-teal-900' : 'from-yellow-700 to-orange-800'}`}
                         />
                     ))}
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <FileInput label="Front Photo" onChange={e=>setFrontImg(e.target.files[0])} accept="image/*" />
                <FileInput label="Back Photo" onChange={e=>setBackImg(e.target.files[0])} accept="image/*" />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>Save Card</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Cards;