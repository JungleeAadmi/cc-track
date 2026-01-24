import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    api.get('/cards').then(res => setCards(res.data));
  }, []);

  return (
    <div className="page">
      <h1>My Cards</h1>
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
    </div>
  );
}
