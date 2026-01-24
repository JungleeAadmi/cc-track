import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input, Button, Card } from '../components/ui';

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
      console.error("Auth Error:", err);
      // Detailed Error Handling
      if (err.response) {
        // Backend returned a response code (4xx, 5xx)
        if (err.response.status === 422) {
            setError("Invalid input format."); 
        } else if (err.response.status === 502) {
            setError("Server is starting up... please wait 10s and try again.");
        } else {
            // Try to show backend specific message
            setError(err.response.data?.detail || `Error: ${err.response.statusText}`);
        }
      } else if (err.request) {
        // Request made but no response (Network Error / Server Down)
        setError("Cannot connect to server. Is the backend running?");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <img 
          src="/logo.png" 
          className="w-20 h-20 mx-auto mb-4 rounded-xl shadow-lg" 
          alt="Logo" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = '/android-chrome-192x192.png';
          }}
        />
        <h1 className="text-3xl font-bold text-white tracking-tight">CC-Track</h1>
        <p className="text-slate-400 mt-2">Personal Finance & Lending Tracker</p>
      </div>

      <Card className="w-full max-w-sm bg-surface/50 backdrop-blur-sm border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </div>
          )}
          
          <Button type="submit" className="w-full" isLoading={loading}>
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-slate-400 hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;