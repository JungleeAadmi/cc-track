import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import { Plus } from 'lucide-react';

const Transactions = () => {
  const [txs, setTxs] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' });
  const [loading, setLoading] = useState(false);

  const fetchTxs = async () => {
    const res = await api.get('/api/transactions/');
    setTxs(res.data);
  };

  useEffect(() => { fetchTxs(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/api/transactions/', form);
    setForm({ description: '', amount: '', type: 'expense' }); // Reset
    setLoading(false);
    fetchTxs();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Transactions</h2>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <Input 
            label="Description" 
            value={form.description} 
            onChange={(e) => setForm({...form, description: e.target.value})} 
            required
          />
          <Input 
            label="Amount" 
            type="number" 
            value={form.amount} 
            onChange={(e) => setForm({...form, amount: e.target.value})} 
            required
          />
          <div className="w-full md:w-48">
             <label className="block text-sm font-medium text-slate-400 mb-1.5">Type</label>
             <select 
               className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none"
               value={form.type}
               onChange={(e) => setForm({...form, type: e.target.value})}
             >
               <option value="expense">Expense</option>
               <option value="credit">Credit</option>
             </select>
          </div>
          <Button type="submit" isLoading={loading} className="w-full md:w-auto"><Plus size={20}/> Add</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {txs.map(tx => (
          <Card key={tx.id} className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-white">{tx.description}</p>
              <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
            </div>
            <p className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-slate-200'}`}>
              {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Transactions;