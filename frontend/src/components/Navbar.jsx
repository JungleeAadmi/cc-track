import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Navbar() {
  const loc = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const nav = (to, label) => (
    <Link
      to={to}
      className={loc.pathname === to ? 'nav active' : 'nav'}
    >
      {label}
    </Link>
  );

  return (
    <>
      <header className="header">
        <h3>CC-Track</h3>
        <nav>
          {nav('/dashboard', 'Dashboard')}
          {nav('/transactions', 'Transactions')}
          {nav('/lending', 'Lending')}
          {nav('/salary', 'Salary')}
          {nav('/subscriptions', 'Subscriptions')}
          {nav('/settings', 'Settings')}
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
