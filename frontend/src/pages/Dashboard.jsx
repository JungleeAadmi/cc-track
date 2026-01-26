import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card } from '../components/ui';
import { CreditCard, ArrowRightLeft, Banknote, Repeat, Wallet, Loader2 } from 'lucide-react';
import { Money } from '../components/ui';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="bg-surface border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
      <Icon className={colorClass.replace('text-', '')} size={24} /> 
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/dashboard/');
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard Load Error", err);
        setError("Failed to load data. Is backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>;
  if (error) return <div className="text-center text-red-400 p-4 border border-red-900/30 rounded-xl bg-red-900/10">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          icon={CreditCard} 
          label="Total Cards" 
          value={stats.card_count} 
          colorClass="text-blue-500 bg-blue-500/10" 
        />
        <StatCard 
          icon={ArrowRightLeft} 
          label="Transactions" 
          value={stats.transaction_count} 
          colorClass="text-purple-500 bg-purple-500/10" 
        />
        <StatCard 
          icon={Banknote} 
          label="Active Lendings" 
          value={stats.active_lending_count} 
          colorClass="text-orange-500 bg-orange-500/10" 
        />
         <StatCard 
          icon={Banknote} 
          label="Pending Returns" 
          value={<Money amount={stats.pending_lending_amount}/>} 
          colorClass="text-red-500 bg-red-500/10" 
        />
        <StatCard 
          icon={Repeat} 
          label="Monthly Subs" 
          value={<Money amount={stats.monthly_subs}/>} 
          colorClass="text-pink-500 bg-pink-500/10" 
        />
        <StatCard 
          icon={Wallet} 
          label="Last Salary" 
          value={<Money amount={stats.last_salary}/>} 
          colorClass="text-green-500 bg-green-500/10" 
        />
      </div>
    </div>
  );
};

export default Dashboard;