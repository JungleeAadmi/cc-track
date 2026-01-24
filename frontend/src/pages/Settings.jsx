import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/users/me')
      .then(r => setUser(r.data));
  }, []);

  if (!user) return null;

  return (
    <>
      <h1>Settings</h1>

      <div className="card">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Currency:</strong> {user.currency}</p>
      </div>

      <div className="card">
        <strong>Notifications (ntfy)</strong>
        <p className="muted">
          Configuration & test notification coming next.
        </p>
      </div>
    </>
  );
}
