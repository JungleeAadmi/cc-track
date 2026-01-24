import React, { useEffect, useState } from 'react';
import api from '../api';
import { Card, Button, Input } from '../components/ui';
import { Trash2, Plus, CreditCard } from 'lucide-react';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCards = async () => {
    const res = await api.get('/api/cards/');
    setCards(res.data);
  };

  useEffect(() => { fetchCards(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!newCard) return;
    setLoading(true);
    await api.post('/api/cards/', { name: newCard });
    setNewCard('');
    setLoading(false);
    fetchCards();
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this card?")) return;
    await api.delete(`/api/cards/${id}`);
    fetchCards();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Cards</h2>
      </div>

      <Card className="p-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input 
            placeholder="Card Name (e.g. HDFC Regalia)" 
            value={newCard} 
            onChange={(e) => setNewCard(e.target.value)} 
          />
          <Button type="submit" isLoading={loading}><Plus size={20}/></Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.id} className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 h-40 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-start">
              <CreditCard className="text-slate-400" size={32} />
              <button 
                onClick={() => handleDelete(card.id)}
                className="text-slate-500 hover:text-red-400 p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Card Name</p>
              <h3 className="text-xl font-semibold text-white mt-1">{card.name}</h3>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;