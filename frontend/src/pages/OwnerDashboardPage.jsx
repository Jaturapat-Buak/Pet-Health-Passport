import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerDashboard } from '../api/dashboard.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { AppShell } from '../components/AppShell.jsx';
import { DashboardLoadState, DashboardRow, DashboardSection, DashboardStats, formatDate, formatDateTime } from '../components/DashboardParts.jsx';
import { PetAvatar } from '../components/PetAvatar.jsx';
import { useDashboard } from './useDashboard.js';

const WeightChart = lazy(() => import('../components/WeightChart.jsx'));

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const { data, status, retry } = useDashboard(getOwnerDashboard);
  return <AppShell>
    <div className="dashboard-heading"><p className="eyebrow">Pet owner</p><h1>Welcome, {user.name}</h1></div>
    {status !== 'ready' ? <DashboardLoadState status={status} retry={retry} /> : <OwnerContent data={data} />}
  </AppShell>;
}

function OwnerContent({ data }) {
  const { stats, pets, appointments, vaccinations, medications, records, reminders, weights } = data;
  return <>
    <DashboardStats items={[
      ['Your pets', stats.pets, '/pets'], ['Upcoming visits', stats.upcoming_appointments, '/appointments'],
      ['Vaccines due in 30 days', stats.upcoming_vaccinations], ['Active medications', stats.active_medications]
    ]} />
    <div className="dashboard-columns">
      <DashboardSection title="Upcoming reminders" to="/reminders">
        {reminders.length ? <div className="dashboard-list">{reminders.map((item) => <DashboardRow key={item.id} title={item.title} detail={item.message} date={item.event_at ? formatDateTime(item.event_at) : formatDate(item.reminder_date)} to={item.target_url} />)}</div> : <p className="muted">No unread reminders in the next 30 days.</p>}
      </DashboardSection>
      <DashboardSection title="Upcoming appointments" to="/appointments">
        {appointments.length ? <div className="dashboard-list">{appointments.map((item) => <DashboardRow key={item.id} title={`${item.pet_name}: ${item.purpose}`} detail={item.clinic_name || 'Clinic not set'} date={formatDateTime(item.appointment_date)} to={`/appointments/${item.id}/edit`} />)}</div> : <p className="muted">No upcoming appointments.</p>}
      </DashboardSection>
      <DashboardSection title="Vaccinations due soon">
        {vaccinations.length ? <div className="dashboard-list">{vaccinations.map((item) => <DashboardRow key={item.id} title={item.vaccine_name} detail={item.pet_name} date={formatDate(item.next_due_date)} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">No vaccinations due in the next 30 days.</p>}
      </DashboardSection>
      <DashboardSection title="Active medications">
        {medications.length ? <div className="dashboard-list">{medications.map((item) => <DashboardRow key={item.id} title={item.medication_name} detail={`${item.pet_name}${item.dosage ? ` · ${item.dosage}` : ''}`} date={item.end_date ? `Ends ${formatDate(item.end_date)}` : 'Ongoing'} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">No active medications.</p>}
      </DashboardSection>
    </div>
    <DashboardSection title="Recent health records">
      {records.length ? <div className="dashboard-list">{records.map((item, index) => <DashboardRow key={`${item.pet_id}-${item.type}-${index}`} title={item.title} detail={`${item.pet_name} · ${item.type === 'medical' ? 'Medical visit' : item.type === 'weight' ? 'Weight' : 'Vaccination'}`} date={formatDate(item.record_date)} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">No health records yet.</p>}
    </DashboardSection>
    <Suspense fallback={<DashboardSection title="Weight history"><p className="muted">Loading chart...</p></DashboardSection>}>
      <WeightChart pets={pets} weights={weights} />
    </Suspense>
    <DashboardSection title="Your pets" to="/pets">
      {pets.length ? <div className="pet-grid">{pets.slice(0, 3).map((pet) => <Link className="pet-card" key={pet.id} to={`/pets/${pet.id}`}>
        <PetAvatar pet={pet} /><span className="pet-card-details"><strong>{pet.name}</strong><span>{[pet.species, pet.breed].filter(Boolean).join(' / ')}</span></span><span className="card-arrow" aria-hidden="true">&rarr;</span>
      </Link>)}</div> : <div className="empty-state"><h3>No pets yet</h3><p>Add your first pet to start their health passport.</p><Link className="primary-link" to="/pets/new">Add pet</Link></div>}
    </DashboardSection>
  </>;
}
