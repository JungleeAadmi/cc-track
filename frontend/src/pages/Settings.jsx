import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/users/me').then(r => setUser(r.data));
  }, []);

  if (!user) return null;

  return (
    <>
      <h1>Settings</h1>
      <p>Username: {user.username}</p>
      <p>Currency: {user.currency}</p>
    </>
  );
}
