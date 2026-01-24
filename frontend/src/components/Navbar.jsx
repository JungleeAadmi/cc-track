import React from 'react';

// A simple mobile top bar if needed, though Layout.jsx handles most navigation
const Navbar = () => {
  return (
    <nav className="md:hidden w-full bg-surface border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
      <div className="flex items-center gap-2">
        <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 rounded-lg"
            onError={(e) => { e.target.src = '/android-chrome-192x192.png'; }}
        />
        <span className="font-bold text-white tracking-tight">CC-Track</span>
      </div>
    </nav>
  );
};

export default Navbar;