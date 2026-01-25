import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import Modal from '../components/Modal';
import { Plus, Repeat, Pencil, Trash2 } from 'lucide-react';

const Subscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'Monthly', renewal_date: '' });

  useEffect(() => { fetchSubs(); }, []);
  const fetchSubs = async () => { try { const res = await api.get('/api/subscriptions/'); setSubs(res.data); } catch(e) {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if(isEditing) await api.put(`/api/subscriptions/${editId}`, form);
        else await api.post('/api/subscriptions/', form);
        
        setForm({ name: '', amount: '', frequency: 'Monthly', renewal_date: '' }); setShowModal(false); setIsEditing(false); setEditId(null);
        fetchSubs();
    } catch(e) {}
  };

  const handleEdit = (s) => { 
      setForm({ 
          name: s.name, 
          amount: s.amount, 
          frequency: s.frequency || 'Monthly', 
          renewal_date: s.renewal_date ? s.renewal_date.split('T')[0] : ''
      }); 
      setIsEditing(true); setEditId(s.id); setShowModal(true); 
  };
  
  const handleDelete = async (id) => { if(confirm("Delete sub?")) { await api.delete(`/api/subscriptions/${id}`); fetchSubs(); } };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        <Button onClick={() => {setIsEditing(false); setForm({name:'',amount:'',frequency:'Monthly',renewal_date:''}); setShowModal(true)}} className="rounded-full w-10 h-10 p-0 flex items-center justify-center"><Plus size={24}/></Button>
      </div>

      <div className="space-y-2">
        {subs.map(sub => (
          <div key={sub.id} className="bg-surface border border-white/5 p-3 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Repeat size={18} /></div>
              <div>
                  <p className="font-medium text-white">{sub.name}</p>
                  <p className="text-xs text-slate-500">{sub.frequency} • {sub.renewal_date ? `Renew: ${new Date(sub.renewal_date).toLocaleDateString()}` : 'No date'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <p className="font-bold text-slate-200">₹{sub.amount}</p>
                <div className="flex gap-2">
                    <button onClick={() => handleEdit(sub)} className="text-slate-400 hover:text-white"><Pencil size={14}/></button>
                    <button onClick={() => handleDelete(sub.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
            </div>
          </div>
        ))}
        {subs.length > 0 && <div className="flex justify-between px-4 py-2 border-t border-white/10 mt-4"><span className="text-slate-400">Total Monthly:</span><span className="font-bold text-white">₹{subs.reduce((acc, curr) => acc + curr.amount, 0)}</span></div>}
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={isEditing ? "Edit Sub" : "New Sub"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Cost" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Frequency</label>
                  <select className="w-full h-11 bg-black/40 border border-slate-700 rounded-xl px-4 text-white" value={form.frequency} onChange={e=>setForm({...form, frequency: e.target.value})}>
                      <option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Half-Yearly</option><option>Yearly</option>
                  </select>
              </div>
              <Input label="Renewal Date" type="date" value={form.renewal_date} onChange={e => setForm({...form, renewal_date: e.target.value})} />
          </div>
          <Button type="submit" className="w-full">{isEditing ? "Update" : "Add"}</Button>
        </form>
      </Modal>
    </div>
  );
};
export default Subscriptions;