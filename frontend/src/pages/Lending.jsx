import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Lending() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/lending/')
      .then(r => setItems(r.data || []));
  }, []);

  return (
    <>
      <h1>Lending</h1>

      {items.length === 0 && <p>No lending records.</p>}

      {items.map(l => {
        const returned = l.returned_amount || 0;
        const pending = l.total_amount - returned;

        return (
          <div key={l.id} className="card">
            <strong>{l.borrower_name}</strong>
            <p>Total: {formatMoney(l.total_amount)}</p>
            <p>Returned: {formatMoney(returned)}</p>
            <p>Pending: {formatMoney(pending)}</p>

            <p className="muted">
              Partial returns & proofs coming next.
            </p>
          </div>
        );
      })}
    </>
  );
}
