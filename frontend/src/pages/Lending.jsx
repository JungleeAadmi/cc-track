import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Lending() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/lending/').then(res => setItems(res.data));
  }, []);

  return (
    <div className="page">
      <h1>Lending</h1>
      {items.map(l => (
        <div key={l.id} className="card">
          <h3>{l.borrower_name}</h3>
          <p>{formatMoney(l.amount)}</p>
          <p>{l.is_returned ? 'Returned' : 'Pending'}</p>
        </div>
      ))}
    </div>
  );
}
