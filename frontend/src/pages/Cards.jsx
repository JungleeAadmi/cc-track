import React, { useEffect, useState } from 'react';
import api from '../api';
import { Button, Input, FileInput } from '../components/ui';
import Modal from '../components/Modal';
import VirtualCard from '../components/VirtualCard';
import useLongPress from '../hooks/useLongPress';
import { Plus, Trash2, Eye, RotateCw } from 'lucide-react';

// --- Card Flip Modal Component ---
const CardDetailModal = ({ card, isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md space-y-6 relative">
            {/* Close Button */}
            <button onClick={onClose} className="absolute -top-12 right-0 text-white p-2">Close</button>
            
            {/* 3D Flip Container */}
            <div className="perspective-1000 w-full aspect-[1.58/1] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden">
                        <VirtualCard card={card} />
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 h-full w-full bg-slate-900 rounded-2xl border border-white/20 p-6 flex flex-col justify-center items-center shadow-2xl">
                        <div className="w-full h-12 bg-black/50 mb-4"></div>
                        <div className="w-3/4 h-10 bg-white/10 flex items-center justify-end px-4 font-mono text-xl tracking-widest text-black bg-white">
                            {card.cvv || '***'}
                        </div>
                        <p className="text-slate-400 text-xs mt-2">CVV / CVC</p>
                        <p className="mt-8 text-xs text-slate-500">Authorized Signature</p>
                    </div>
                </div>
            </div>

            <div className="text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <RotateCw size={14}/> Tap card to flip
            </div>

            {/* Details & Images */}
            <div className="bg-surface p-4 rounded-xl border border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Limit:</span> <span className="text-white">₹{card.limit}</span></div>
                    <div><span className="text-slate-500">Due Date:</span> <span className="text-white">Day {card.payment_due_date}</span></div>
                    <div><span className="text-slate-500">Statement:</span> <span className="text-white">Day {card.statement_date}</span></div>
                </div>
                
                {(card.front_image_path || card.back_image_path) && (
                    <div className="pt-2 border-t border-white/10 flex gap-2 overflow-x-auto">
                        {card.front_image_path && (
                            <img src={`/uploads/${card.front_image_path}`} className="h-20 rounded-md border border-white/10" onClick={(e)=>{e.stopPropagation(); window.open(e.target.src)}}/>
                        )}
                        {card.back_image_path && (
                            <img src={`/uploads/${card.back_image_path}`} className="h-20 rounded-md border border-white/10" onClick={(e)=>{e.stopPropagation(); window.open(e.target.src)}}/>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// --- Action Menu Component ---
const ActionMenu = ({ isOpen, onClose, onDelete, onEdit }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-surface w-full max-w-sm rounded-xl border border-white/10 overflow-hidden" onClick={e=>e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 text-center font-bold text-white">Card Actions</div>
                <button onClick={onEdit} className="w-full p-4 text-left text-white hover:bg-white/5 border-b border-white/5">Edit Details</button>
                <button onClick={onDelete} className="w-full p-4 text-left text-red-400 hover:bg-red-500/10">Delete Card</button>
                <button onClick={onClose} className="w-full p-4 text-center text-slate-500 hover:bg-white/5">Cancel</button>
            </div>
        </div>
    );
};

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); // For Details
  const [actionCard, setActionCard] = useState(null); // For Long Press Menu
  
  const initialForm = {
    name: '', bank_name: '', card_network: 'Visa', card_type: 'Credit',
    card_number_last4: '', cvv: '', expiry_date: '', owner_name: '',
    limit: '', statement_date: '', payment_due_date: '', color_theme: 'gradient-1'
  };
  const [form, setForm] = useState(initialForm);
  const [frontImg, setFrontImg] = useState(null);
  const [backImg, setBackImg] = useState(null);

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/api/cards/');
      setCards(res.data);
    } catch (e) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    // Convert numbers properly
    Object.keys(form).forEach(key => {
        if(key === 'limit') formData.append(key, parseFloat(form[key]) || 0);
        else if(key === 'statement_date' || key === 'payment_due_date') {
            if(form[key]) formData.append(key, parseInt(form[key]));
        } else {
            formData.append(key, form[key]);
        }
    });
    if (frontImg) formData.append('front_image', frontImg);
    if (backImg) formData.append('back_image', backImg);

    try {
      await api.post('/api/cards/', formData);
      setShowAddModal(false);
      setForm(initialForm); setFrontImg(null); setBackImg(null);
      fetchCards();
    } catch (err) {
      alert("Failed to add card. Check if file is too large or inputs are valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if(actionCard && confirm("Delete this card permanently?")) {
        await api.delete(`/api/cards/${actionCard.id}`);
        fetchCards();
        setActionCard(null);
    }
  };

  const longPressProps = useLongPress(
    (e) => {
        const cardId = e.target.closest('[data-card-id]')?.dataset.cardId;
        const card = cards.find(c => c.id == cardId);
        if(card) setActionCard(card);
    },
    (e) => {
        const cardId = e.target.closest('[data-card-id]')?.dataset.cardId;
        const card = cards.find(c => c.id == cardId);
        if(card) setSelectedCard(card);
    },
    { delay: 600, shouldPreventDefault: true }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Wallet</h2>
        <Button onClick={() => setShowAddModal(true)} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
          <Plus size={24} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
            <div key={card.id} data-card-id={card.id} {...longPressProps} className="relative select-none touch-manipulation">
                <VirtualCard card={card} />
                {/* Eye Icon Overlay for Quick View */}
                {(card.front_image_path || card.back_image_path) && (
                    <div className="absolute top-4 right-4 bg-black/40 p-1.5 rounded-full backdrop-blur-md border border-white/10 z-10 pointer-events-none">
                        <Eye size={14} className="text-white/80"/>
                    </div>
                )}
            </div>
        ))}
      </div>

      {/* Modals */}
      <CardDetailModal card={selectedCard} isOpen={!!selectedCard} onClose={() => setSelectedCard(null)} />
      
      <ActionMenu 
        isOpen={!!actionCard} 
        onClose={() => setActionCard(null)} 
        onDelete={handleDelete}
        onEdit={() => alert("Edit Coming Soon")}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Card">
         <form onSubmit={handleCreate} className="space-y-4">
             {/* Same Form as before, but ensure type='number' handles inputs properly */}
             <div className="grid grid-cols-2 gap-4">
                <Input label="Card Nickname" placeholder="HDFC Regalia" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
                <Input label="Bank Name" placeholder="HDFC" value={form.bank_name} onChange={e=>setForm({...form, bank_name: e.target.value})} required />
            </div>
            {/* ... Rest of form inputs from previous Cards.jsx ... */}
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
                <Input label="Statement (Day)" type="number" max="31" value={form.statement_date} onChange={e=>setForm({...form, statement_date: e.target.value})} />
                <Input label="Payment Due (Day)" type="number" max="31" value={form.payment_due_date} onChange={e=>setForm({...form, payment_due_date: e.target.value})} />
            </div>

             <div className="space-y-1">
                 <label className="text-xs text-slate-400">Card Color</label>
                 <div className="flex gap-2">
                     {['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'].map(theme => (
                         <div key={theme} onClick={() => setForm({...form, color_theme: theme})} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${form.color_theme === theme ? 'border-white' : 'border-transparent'} bg-gradient-to-br ${theme === 'gradient-1' ? 'from-purple-900 to-blue-900' : theme === 'gradient-2' ? 'from-slate-900 to-black' : theme === 'gradient-3' ? 'from-red-900 to-rose-900' : theme === 'gradient-4' ? 'from-emerald-900 to-teal-900' : 'from-yellow-700 to-orange-800'}`}/>
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