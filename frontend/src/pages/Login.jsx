import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      navigate('/');
    } catch (err) {
      console.error("Auth Failure:", err);
      let msg = "Connection failed. Is the server running?";
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        if (status === 401) msg = "Incorrect username or password.";
        else if (status === 400 && data.detail) msg = data.detail;
        else if (status === 422) msg = "Please check your input format.";
        else if (status === 500) msg = "Server Internal Error. Check logs.";
        else if (status === 502) msg = "Server is starting... try again in 10s.";
        else if (data && data.detail) msg = data.detail;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-surface/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
          <div className="pt-8 pb-6 px-8 text-center border-b border-white/5 bg-white/5">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-black shadow-inner mb-4 ring-1 ring-white/10">
              <img src="/logo.png" className="w-16 h-16 object-contain drop-shadow-lg" alt="Logo" onError={(e) => { e.target.src = '/android-chrome-192x192.png'; }} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">CC-Track</h1>
            <p className="text-sm text-slate-400 font-medium">Finance Tracker</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-500" /></div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary transition-all" placeholder="Enter username" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-500" /></div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary transition-all" placeholder="••••••••" required />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 w-5 h-5" /></>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-1.5 font-semibold text-primary hover:text-red-400 transition-colors focus:outline-none">
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center"><p className="text-xs text-slate-600 font-medium tracking-wide">SECURE • SELF-HOSTED • PRIVATE</p></div>
      </div>
    </div>
  );
};

export default Login;