import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney, formatDate } from '../utils/format';

export default function Salary() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/income/salary/').then(r => setItems(r.data || []));
  }, []);

  return (
    <>
      <h1>Salary</h1>
      {items.map(s => (
        <div key={s.id} className="card">
          <p>{formatDate(s.date)}</p>
          <p>{formatMoney(s.amount)}</p>
        </div>
      ))}
    </>
  );
}
