import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const navItems = [
  { to: '/dispatch', label: 'Live Dispatch Board' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/jobs', label: 'Jobs' },
];

export default function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Taxi Operator</h2>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <strong>{user?.name ?? user?.email ?? 'Operator'}</strong>
          </div>
          <button onClick={logout} className="btn danger" type="button">
            Logout
          </button>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
