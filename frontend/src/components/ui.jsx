import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Card ---
export const Card = ({ children, className }) => (
  <div className={cn("bg-surface border border-slate-800 rounded-xl p-4 shadow-sm", className)}>
    {children}
  </div>
);

// --- Button ---
export const Button = ({ children, variant = "primary", className, isLoading, ...props }) => {
  const variants = {
    primary: "bg-primary hover:bg-blue-600 text-white",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };

  return (
    <button 
      className={cn(
        "px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// --- Input ---
export const Input = React.forwardRef(({ label, className, error, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>}
    <input
      ref={ref}
      className={cn(
        "w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-slate-600 transition-all",
        error && "border-red-500 focus:ring-red-500/50",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));

export const FileInput = ({ label, onChange, ...props }) => (
  <div className="w-full">
     {label && <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>}
    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> proof</p>
            <p className="text-xs text-slate-500">IMG, PNG, JPG</p>
        </div>
        <input type="file" className="hidden" onChange={onChange} {...props} />
    </label>
  </div>
)