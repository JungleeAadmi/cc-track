import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCards = async () => {
      try {
        const res = await api.get('/cards/');
        setCards(res.data || []);
      } catch (err) {
        console.error('Failed to load cards:', err);
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Failed to load cards'
        );
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <h1>My Cards</h1>
        <p>Loading cards…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>My Cards</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>My Cards</h1>

      {cards.length === 0 ? (
        <p>No cards added yet.</p>
      ) : (
        <div className="grid">
          {cards.map(card => (
            <div key={card.id} className="card">
              <h3>{card.name}</h3>
              <p>{card.bank} • {card.network}</p>
              <p>Spent: {formatMoney(card.spent)}</p>
              <p>Available: {formatMoney(card.available)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
