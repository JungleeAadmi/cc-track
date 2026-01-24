import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card } from '../components/ui';
import { CreditCard, ArrowRightLeft, HandCoins, Repeat, Wallet } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <Card className="flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
      <Icon className={colorClass.replace('text-', '')} size={24} /> 
      {/* Hack: Extract color from class string logic or just use specific colors. 
         Let's simplify: Tailwind classes need to be explicit usually. */}
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/dashboard/');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{/* Pulse Skeletons */}</div>;
  if (!stats) return <div className="text-center text-red-400">Failed to load data</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
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
          icon={HandCoins} 
          label="Active Lendings" 
          value={stats.active_lending_count} 
          colorClass="text-orange-500 bg-orange-500/10" 
        />
         <StatCard 
          icon={HandCoins} 
          label="Pending Returns" 
          value={`₹${stats.pending_lending_amount}`} 
          colorClass="text-red-500 bg-red-500/10" 
        />
        <StatCard 
          icon={Repeat} 
          label="Monthly Subs" 
          value={`₹${stats.monthly_subs}`} 
          colorClass="text-pink-500 bg-pink-500/10" 
        />
        <StatCard 
          icon={Wallet} 
          label="Last Salary" 
          value={`₹${stats.last_salary}`} 
          colorClass="text-green-500 bg-green-500/10" 
        />
      </div>
    </div>
  );
};

export default Dashboard;