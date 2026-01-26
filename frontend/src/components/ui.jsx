import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePrivacy } from '../context/PrivacyContext';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }) => (
  <div className={cn("bg-surface border border-slate-800 rounded-xl p-4 shadow-sm", className)}>
    {children}
  </div>
);

export const Button = ({ children, variant = "primary", className, isLoading, ...props }) => {
  const variants = {
    primary: "bg-primary hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };
  return (
    <button 
      className={cn(
        "px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef(({ label, className, error, type = "text", ...props }, ref) => (
  <div className="w-full min-w-0">
    {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full h-12 bg-black/40 border border-slate-700 rounded-xl px-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
        // Force appearance to fix mobile date input sizing
        type === "date" && "appearance-none", 
        error && "border-red-500 focus:ring-red-500/50",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));

export const FileInput = ({ label, onChange, ...props }) => (
  <div className="w-full min-w-0">
     {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-black/40 hover:bg-slate-800/50 transition-colors group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-slate-400 group-hover:text-white transition-colors"><span className="font-semibold">Click to upload</span></p>
            <p className="text-xs text-slate-500">PDF or Images (Max 25MB)</p>
        </div>
        <input type="file" className="hidden" onChange={onChange} {...props} />
    </label>
  </div>
);

export const Money = ({ amount, prefix = "₹" }) => {
    const { isPrivacyMode } = usePrivacy();
    if (isPrivacyMode) return <span className="tracking-widest">****</span>;
    return <span>{prefix}{parseFloat(amount || 0).toLocaleString()}</span>;
};