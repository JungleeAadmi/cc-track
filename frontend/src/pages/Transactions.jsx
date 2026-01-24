import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney, formatDate } from '../utils/format';

export default function Transactions() {
  const [txns, setTxns] = useState([]);

  useEffect(() => {
    api.get('/transactions/').then(r => setTxns(r.data || []));
  }, []);

  return (
    <>
      <h1>Transactions</h1>
      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {txns.map(t => (
            <tr key={t.id}>
              <td>{formatDate(t.date)}</td>
              <td>{t.description}</td>
              <td>{formatMoney(t.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
