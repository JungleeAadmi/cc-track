import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Lending() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/lending/').then(r => setItems(r.data || []));
  }, []);

  return (
    <>
      <h1>Lending</h1>
      {items.map(l => (
        <div key={l.id} className="card">
          <strong>{l.borrower_name}</strong>
          <p>{formatMoney(l.amount)}</p>
          <p>{l.is_returned ? 'Returned' : 'Pending'}</p>
        </div>
      ))}
    </>
  );
}
