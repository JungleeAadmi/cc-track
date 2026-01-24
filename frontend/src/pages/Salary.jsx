import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import { Plus } from 'lucide-react';

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [form, setForm] = useState({ amount: '', notes: '' });

  const fetchSalary = async () => {
    const res = await api.get('/api/settings/salary');
    setSalaries(res.data);
  };

  useEffect(() => { fetchSalary(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/api/settings/salary', form);
    setForm({ amount: '', notes: '' });
    fetchSalary();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Salary Tracker</h2>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
          <Input label="Amount" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
          <Input label="Notes (Month/Year)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <Button type="submit" className="w-full md:w-auto"><Plus size={20}/> Add</Button>
        </form>
      </Card>

      <div className="space-y-2">
        {salaries.map(s => (
          <Card key={s.id} className="flex justify-between items-center py-3">
             <div>
               <p className="font-bold text-green-400 text-lg">₹{s.amount}</p>
               <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString()}</p>
             </div>
             <p className="text-sm text-slate-300">{s.notes}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Salary;