import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [cfg, setCfg] = useState({ server_url: '', topic: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(r => setUser(r.data));

    api.get('/notifications/config')
      .then(r => setCfg(r.data))
      .catch(() => {}); // not configured yet
  }, []);

  const save = async () => {
    setLoading(true);
    setStatus('');
    try {
      await api.post('/notifications/config', cfg);
      setStatus('Saved successfully');
    } catch (e) {
      setStatus(e.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setLoading(true);
    setStatus('');
    try {
      await api.post('/notifications/test');
      setStatus('Test notification sent');
    } catch (e) {
      setStatus(e.response?.data?.detail || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <h1>Settings</h1>

      <div className="card">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Currency:</strong> {user.currency}</p>
      </div>

      <div className="card">
        <h3>Notifications (ntfy)</h3>

        <input
          placeholder="https://ntfy.yourdomain.com"
          value={cfg.server_url}
          onChange={e => setCfg({ ...cfg, server_url: e.target.value })}
        />

        <input
          placeholder="topic-name"
          value={cfg.topic}
          onChange={e => setCfg({ ...cfg, topic: e.target.value })}
        />

        <button className="primary-btn" onClick={save} disabled={loading}>
          Save
        </button>

        <button
          className="secondary-btn"
          onClick={test}
          disabled={loading || !cfg.server_url || !cfg.topic}
        >
          Test Notification
        </button>

        {status && <p className="muted">{status}</p>}
      </div>
    </>
  );
}
