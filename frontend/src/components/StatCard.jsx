import React from 'react';
import { Card } from './ui';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <Card className="flex items-center gap-4 hover:bg-slate-800/50 transition-colors border border-white/5">
    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
      <Icon className={colorClass.replace('text-', '')} size={24} /> 
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </Card>
);

export default StatCard;