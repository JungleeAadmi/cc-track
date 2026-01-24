import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/users/me').then(res => setUser(res.data));
  }, []);

  if (!user) return null;

  return (
    <div className="page">
      <h1>Settings</h1>
      <p>Username: {user.username}</p>
      <p>Currency: {user.currency}</p>
    </div>
  );
}
