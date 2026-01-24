import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import { Trash2, Plus, Repeat } from 'lucide-react';

const Subscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '' });

  const fetchSubs = async () => {
    const res = await api.get('/api/subscriptions/');
    setSubs(res.data);
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/subscriptions/', form);
    setForm({ name: '', amount: '' });
    fetchSubs();
  };

  const handleDelete = async (id) => {
    await api.delete(`/api/subscriptions/${id}`);
    fetchSubs();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Subscriptions</h2>
      
      <Card>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <Input label="Name (Netflix, Spotify)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Monthly Cost" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Button type="submit" className="w-full md:w-auto"><Plus size={20}/> Add</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {subs.map(sub => (
          <Card key={sub.id} className="flex justify-between items-center py-3 hover:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                <Repeat size={18} />
              </div>
              <div>
                <p className="font-medium text-white">{sub.name}</p>
                <p className="text-xs text-slate-500">Monthly</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-bold text-slate-200">₹{sub.amount}</p>
              <button onClick={() => handleDelete(sub.id)} className="text-slate-600 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
          </Card>
        ))}
        {subs.length > 0 && (
            <div className="flex justify-between px-4 py-2 border-t border-slate-800 mt-4">
                <span className="text-slate-400">Total Monthly:</span>
                <span className="font-bold text-white">₹{subs.reduce((acc, curr) => acc + curr.amount, 0)}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;