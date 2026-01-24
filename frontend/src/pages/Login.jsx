import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('password', password);
      const res = await axios.post('/api/token', fd);
      localStorage.setItem('token', res.data.access_token);
      window.location.href = '/dashboard';
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="center">
      <form onSubmit={submit} className="card">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button>Sign In</button>
      </form>
    </div>
  );
}
