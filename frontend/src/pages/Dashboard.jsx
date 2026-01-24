import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cards/')
      .then(r => setCards(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>My Cards</h1>
      {loading && <p>Loading…</p>}
      {!loading && cards.length === 0 && <p>No cards added yet.</p>}
      <div className="grid">
        {cards.map(c => (
          <div key={c.id} className="card">
            <h3>{c.name}</h3>
            <p>{c.bank} • {c.network}</p>
            <p>Spent: {formatMoney(c.spent)}</p>
            <p>Available: {formatMoney(c.available)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
