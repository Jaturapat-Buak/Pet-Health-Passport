import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { PetCollection } from '../components/PetCollection.jsx';

const roleNames = { owner: 'Pet owner', vet: 'Veterinarian', admin: 'Administrator' };

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="dashboard-heading">
        <p className="eyebrow">{roleNames[user.role]}</p>
        <h1>Welcome, {user.name}</h1>
      </div>
      {user.role === 'owner' && (
        <section className="dashboard-pets" aria-labelledby="your-pets-title">
          <div className="section-heading-row">
            <h2 id="your-pets-title">Your pets</h2>
            <Link to="/pets">View all</Link>
          </div>
          <PetCollection limit={3} />
        </section>
      )}
        <section className="account-section" aria-labelledby="account-title">
          <h2 id="account-title">Account</h2>
          <dl className="account-details">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd>{roleNames[user.role]}</dd></div>
          </dl>
        </section>
    </AppShell>
  );
}
