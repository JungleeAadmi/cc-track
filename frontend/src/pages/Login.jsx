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
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <img src="/logo.png" className="w-16 h-16 mx-auto mb-4" alt="Logo" onError={(e)=>e.target.style.display='none'}/>
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
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <Button type="submit" className="w-full" isLoading={loading}>
            {isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
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