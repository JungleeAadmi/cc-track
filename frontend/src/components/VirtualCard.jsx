import React from 'react';

const VirtualCard = ({ card, onClick, isMasked = false }) => {
  const themes = {
    'gradient-1': 'from-purple-900 to-blue-900',
    'gradient-2': 'from-slate-900 to-black',
    'gradient-3': 'from-red-900 to-rose-900',
    'gradient-4': 'from-emerald-900 to-teal-900',
    'gradient-5': 'from-yellow-700 to-orange-800',
    'gradient-6': 'from-pink-900 to-fuchsia-900',
    'gradient-7': 'from-cyan-900 to-blue-800',
    'gradient-8': 'from-indigo-900 to-violet-900'
  };

  const gradient = themes[card.color_theme] || themes['gradient-1'];

  const formatCardNumber = (num) => {
    if(!num) return '•••• •••• •••• ••••';
    if(isMasked) {
        // Show only last 4, mask rest with stars
        return `•••• •••• •••• ${num.slice(-4)}`;
    }
    return num.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div 
      className={`relative w-full aspect-[1.58/1] rounded-2xl p-6 bg-gradient-to-br ${gradient} shadow-2xl border border-white/10 text-white overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-300 select-none`}
      onClick={onClick}
    >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 md:mb-8">
            <span className="font-bold tracking-wider opacity-90 uppercase text-sm md:text-base">{card.bank_name}</span>
            <div className="italic font-serif font-bold text-lg md:text-xl opacity-80">{card.card_network}</div>
        </div>

        <div className="w-10 h-8 md:w-12 md:h-9 bg-gradient-to-tr from-yellow-200 to-yellow-500 rounded-md mb-4 md:mb-6 opacity-80 shadow-inner flex items-center justify-center">
            <div className="w-full h-[1px] bg-black/20"></div>
        </div>

        <div className="text-lg md:text-2xl font-mono tracking-widest mb-4 drop-shadow-md whitespace-nowrap overflow-hidden">
            {formatCardNumber(card.card_number)}
        </div>

        <div className="flex justify-between items-end mt-auto">
            <div>
                <div className="text-[8px] md:text-[10px] uppercase opacity-60">Card Holder</div>
                <div className="font-medium tracking-wide uppercase text-xs md:text-sm">{card.owner_name}</div>
            </div>
            <div className="text-right">
                <div className="text-[8px] md:text-[10px] uppercase opacity-60">Expires</div>
                <div className="font-mono text-sm">{card.expiry_date}</div>
            </div>
        </div>
    </div>
  );
};

export default VirtualCard;