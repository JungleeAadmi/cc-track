import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="auth-bg">
      <form onSubmit={submit} className="auth-card">
        <h2>Welcome Back</h2>
        <p className="muted">Sign in to your account</p>

        {error && <div className="error-box">{error}</div>}

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className="primary-btn">Sign In</button>

        <p className="muted center-text">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
