import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney, formatDate } from '../utils/format';

export default function Transactions() {
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    api.get('/transactions/')
      .then(r => setTxns(r.data || []));
  }, []);

  return (
    <>
      <h1>Transactions</h1>
      {txns.length === 0 && <p>No transactions yet.</p>}

      {txns.map(t => (
        <div key={t.id} className="card">
          <strong>{t.description}</strong>
          <p>{formatDate(t.date)}</p>
          <p>{formatMoney(t.amount)}</p>
        </div>
      ))}
    </>
  );
}
