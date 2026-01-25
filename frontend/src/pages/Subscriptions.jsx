import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import Modal from '../components/Modal';
import useLongPress from '../hooks/useLongPress';
import { Plus, Repeat } from 'lucide-react';

const ActionMenu = ({ isOpen, onClose, onDelete, onEdit }) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
            <div className="bg-surface w-full max-w-sm rounded-xl border border-white/10 overflow-hidden" onClick={e=>e.stopPropagation()}>
                <button onClick={onEdit} className="w-full p-4 text-left text-white hover:bg-white/5 border-b border-white/5">Edit Subscription</button>
                <button onClick={onDelete} className="w-full p-4 text-left text-red-400 hover:bg-red-500/10 border-b border-white/5">Delete Subscription</button>
                <button onClick={onClose} className="w-full p-4 text-center text-slate-500 hover:bg-white/5">Cancel</button>
            </div>
        </div>
    );
};

const Subscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [actionSub, setActionSub] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({ name: '', amount: '' });

  useEffect(() => { fetchSubs(); }, []);
  const fetchSubs = async () => { try { const res = await api.get('/api/subscriptions/'); setSubs(res.data); } catch(e) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if(isEditing) await api.put(`/api/subscriptions/${actionSub.id}`, form);
        else await api.post('/api/subscriptions/', form);
        
        setForm({ name: '', amount: '' }); setShowModal(false); setIsEditing(false); setActionSub(null);
        fetchSubs();
    } catch(e) {}
  };

  const handleEdit = () => { setForm({ name: actionSub.name, amount: actionSub.amount }); setIsEditing(true); setShowModal(true); setActionSub(null); };
  const handleDelete = async () => { if(confirm("Delete sub?")) { await api.delete(`/api/subscriptions/${actionSub.id}`); fetchSubs(); setActionSub(null); } };

  const longPressProps = useLongPress(
    (e) => { const s = subs.find(i => i.id == e.target.closest('[data-sub-id]')?.dataset.subId); if(s) setActionSub(s); },
    () => {}, { delay: 800 }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        <Button onClick={() => {setIsEditing(false); setForm({name:'',amount:''}); setShowModal(true)}} className="rounded-full w-10 h-10 p-0 flex items-center justify-center"><Plus size={24}/></Button>
      </div>

      <div className="space-y-2">
        {subs.map(sub => (
          <div key={sub.id} data-sub-id={sub.id} {...longPressProps} className="bg-surface border border-white/5 p-3 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors select-none touch-manipulation">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Repeat size={18} /></div>
              <div><p className="font-medium text-white">{sub.name}</p><p className="text-xs text-slate-500">Monthly</p></div>
            </div>
            <div className="flex items-center gap-4"><p className="font-bold text-slate-200">₹{sub.amount}</p></div>
          </div>
        ))}
        {subs.length > 0 && <div className="flex justify-between px-4 py-2 border-t border-white/10 mt-4"><span className="text-slate-400">Total Monthly:</span><span className="font-bold text-white">₹{subs.reduce((acc, curr) => acc + curr.amount, 0)}</span></div>}
      </div>

      <ActionMenu isOpen={!!actionSub} onClose={()=>setActionSub(null)} onDelete={handleDelete} onEdit={handleEdit} />

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={isEditing ? "Edit Sub" : "New Sub"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name (Netflix, Spotify)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Monthly Cost" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Button type="submit" className="w-full">{isEditing ? "Update" : "Add"}</Button>
        </form>
      </Modal>
    </div>
  );
};
export default Subscriptions;