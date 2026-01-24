import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    api.get("/cards").then(r => setCards(r.data));
  }, []);

  return (
    <>
      <h1>My Cards</h1>
      {cards.length === 0 ? "No cards" : cards.map(c => <div key={c.id}>{c.name}</div>)}
    </>
  );
}
