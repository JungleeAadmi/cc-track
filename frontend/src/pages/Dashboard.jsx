import { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, Plus } from 'lucide-react';

export default function Dashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        const res = await axios.get('/api/cards/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCards(res.data);
      } catch (err) {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800">My Wallet</h1>
          <button className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
            <Plus size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm">Total Available Limit</p>
            <h2 className="text-3xl font-bold mt-1">$12,450.00</h2>
            <div className="mt-4 flex gap-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs">Utilization: 12%</span>
            </div>
        </div>

        {/* Cards List */}
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Cards</h3>
            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                            No cards added yet.
                        </div>
                    ) : (
                        cards.map(card => (
                            <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-3 rounded-full">
                                        <CreditCard className="text-gray-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{card.name}</p>
                                        <p className="text-xs text-gray-500">{card.bank} • {card.network}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">${card.total_limit.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">Limit</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}