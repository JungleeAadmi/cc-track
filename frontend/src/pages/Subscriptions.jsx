import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney, formatDate } from '../utils/format';

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    api.get('/subscriptions/').then(r => setSubs(r.data || []));
  }, []);

  return (
    <>
      <h1>Subscriptions</h1>
      {subs.map(s => (
        <div key={s.id} className="card">
          <strong>{s.name}</strong>
          <p>{formatMoney(s.amount)}</p>
          <p>Next: {formatDate(s.next_due_date)}</p>
        </div>
      ))}
    </>
  );
}
