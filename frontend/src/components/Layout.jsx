import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowRightLeft, 
  Banknote, 
  Repeat, 
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center p-2 w-full transition-colors ${
        isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
      }`
    }
  >
    <Icon size={24} strokeWidth={2} />
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </NavLink>
);

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:flex-row">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          {/* Sidebar Logo */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 rounded-md" 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/android-chrome-192x192.png';
            }}
          />
          <h1 className="text-xl font-bold text-white tracking-tight">CC-Track</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <LayoutDashboard size={20} /> Dashboard
           </NavLink>
           <NavLink to="/transactions" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <ArrowRightLeft size={20} /> Transactions
           </NavLink>
           <NavLink to="/cards" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <CreditCard size={20} /> Cards
           </NavLink>
           <NavLink to="/lending" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Banknote size={20} /> Lending
           </NavLink>
           <NavLink to="/subscriptions" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Repeat size={20} /> Subs
           </NavLink>
           <NavLink to="/salary" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Wallet size={20} /> Salary
           </NavLink>
           <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
             <Settings size={20} /> Settings
           </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 hover:text-red-300 w-full rounded-lg transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-800 z-50 px-2 pb-safe">
        <div className="flex justify-between items-center">
          <NavItem to="/" icon={LayoutDashboard} label="Home" />
          <NavItem to="/transactions" icon={ArrowRightLeft} label="Txns" />
          <NavItem to="/lending" icon={Banknote} label="Lend" />
          <NavItem to="/settings" icon={Settings} label="Set" />
        </div>
      </div>
    </div>
  );
};

export default Layout;