import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];

export default function Signup() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    currency: 'USD',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/signup', form);

      // Auto-login
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('password', form.password);
      const res = await axios.post('/api/token', fd);

      localStorage.setItem('token', res.data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <form onSubmit={submit} className="auth-card">
        <h2>Create Account</h2>
        <p className="muted">Start tracking your finances</p>

        {error && <div className="error-box">{error}</div>}

        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          required
        />

        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />

        <select
          value={form.currency}
          onChange={e => setForm({ ...form, currency: e.target.value })}
        >
          {CURRENCIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button className="primary-btn" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>

        <p className="muted center-text">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
