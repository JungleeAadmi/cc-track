import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();

  const nav = (to, label) => (
    <Link
      to={to}
      className={loc.pathname === to ? 'nav active' : 'nav'}
    >
      {label}
    </Link>
  );

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      <header className="header">
        <strong>CC-Track</strong>
        <nav>
          {nav('/dashboard', 'Dashboard')}
          {nav('/transactions', 'Transactions')}
          {nav('/lending', 'Lending')}
          {nav('/subscriptions', 'Subscriptions')}
          {nav('/settings', 'Settings')}
          <button onClick={logout} className="link-btn">Logout</button>
        </nav>
      </header>

      <OfflineBanner />

      <main className="main">
        <Outlet />
      </main>
    </>
  );
}

function OfflineBanner() {
  if (navigator.onLine) return null;
  return (
    <div className="offline-banner">
      You are offline. Some actions are disabled.
    </div>
  );
}
