import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, ArrowRightLeft, 
  Banknote, Repeat, Settings, LogOut, Wallet, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center p-2 min-w-[70px] transition-colors ${
        isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
      }`
    }
  >
    <Icon size={24} strokeWidth={2} />
    <span className="text-[10px] mt-1 font-medium whitespace-nowrap">{label}</span>
  </NavLink>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:flex-row bg-background">
      
      {/* Top Header (Mobile & Desktop) */}
      <div className="md:hidden fixed top-0 w-full bg-surface/80 backdrop-blur-md border-b border-white/5 z-50 p-4 flex items-center gap-3">
         <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" onError={(e)=>e.target.src='/android-chrome-192x192.png'}/>
         <div>
            <h1 className="font-bold text-white text-lg leading-none">CC-Track</h1>
            {user && <p className="text-xs text-slate-400">@{user.username}</p>}
         </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-white/5 h-screen sticky top-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg" onError={(e)=>e.target.src='/android-chrome-192x192.png'}/>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CC-Track</h1>
            {user && <p className="text-xs text-slate-400 font-mono">@{user.username}</p>}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
           <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <LayoutDashboard size={20} /> Dashboard
           </NavLink>
           <NavLink to="/transactions" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <ArrowRightLeft size={20} /> Transactions
           </NavLink>
           <NavLink to="/cards" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <CreditCard size={20} /> Cards
           </NavLink>
           <NavLink to="/lending" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <Banknote size={20} /> Lending
           </NavLink>
           <NavLink to="/subscriptions" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <Repeat size={20} /> Subs
           </NavLink>
           <NavLink to="/salary" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <Wallet size={20} /> Salary
           </NavLink>
           <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5'}`}>
             <Settings size={20} /> Settings
           </NavLink>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full rounded-xl transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen pt-20 md:pt-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Scrollable) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-white/5 z-50 pb-safe">
        <div className="flex overflow-x-auto no-scrollbar py-2 px-2 gap-2">
          <NavItem to="/" icon={LayoutDashboard} label="Home" />
          <NavItem to="/transactions" icon={ArrowRightLeft} label="Txns" />
          <NavItem to="/cards" icon={CreditCard} label="Cards" />
          <NavItem to="/lending" icon={Banknote} label="Lend" />
          <NavItem to="/salary" icon={Wallet} label="Salary" />
          <NavItem to="/subscriptions" icon={Repeat} label="Subs" />
          <NavItem to="/settings" icon={Settings} label="Set" />
        </div>
      </div>
    </div>
  );
};

export default Layout;