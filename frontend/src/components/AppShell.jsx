import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" to={user.role === 'owner' ? '/dashboard' : `/${user.role}/dashboard`}>Pet Health Passport</Link>
          <nav className="app-nav" aria-label="Main navigation">
            <NavLink to={user.role === 'owner' ? '/dashboard' : `/${user.role}/dashboard`}>Dashboard</NavLink>
            {user.role === 'owner' && <NavLink to="/pets">Pets</NavLink>}
            {user.role === 'owner' && <NavLink to="/appointments">Appointments</NavLink>}
            {user.role === 'owner' && <NavLink to="/reminders">Reminders</NavLink>}
          </nav>
          <div className="header-actions">
            <span className="header-user">{user.name}</span>
            <button className="text-button" type="button" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="dashboard-body">{children}</main>
    </div>
  );
}
