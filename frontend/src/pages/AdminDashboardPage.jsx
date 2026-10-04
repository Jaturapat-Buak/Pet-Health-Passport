import { getAdminDashboard } from '../api/dashboard.js';
import { AppShell } from '../components/AppShell.jsx';
import { DashboardLoadState, DashboardRow, DashboardSection, DashboardStats, formatDateTime } from '../components/DashboardParts.jsx';
import { useDashboard } from './useDashboard.js';

const roleNames = { owner: 'Pet owner', vet: 'Veterinarian', admin: 'Administrator' };

export function AdminDashboardPage() {
  const { data, status, retry } = useDashboard(getAdminDashboard);
  return <AppShell>
    <div className="dashboard-heading"><p className="eyebrow">Administrator</p><h1>System overview</h1></div>
    {status !== 'ready' ? <DashboardLoadState status={status} retry={retry} /> : <>
      <DashboardStats items={[
        ['Users', data.stats.users], ['Pets', data.stats.pets],
        ['Vaccinations', data.stats.vaccinations], ['Appointments', data.stats.appointments]
      ]} />
      <div className="dashboard-columns">
        <DashboardSection title="Recent users">
          {data.recent_users.length ? <div className="dashboard-list">{data.recent_users.map((item) =>
            <DashboardRow key={item.id} title={item.name} detail={`${item.email} · ${roleNames[item.role] ?? item.role}`} date={formatDateTime(item.created_at)} />
          )}</div> : <p className="muted">No users yet.</p>}
        </DashboardSection>
        <DashboardSection title="Recent pets">
          {data.recent_pets.length ? <div className="dashboard-list">{data.recent_pets.map((item) =>
            <DashboardRow key={item.id} title={item.name} detail={`${item.species} · ${item.owner_name}`} date={formatDateTime(item.created_at)} />
          )}</div> : <p className="muted">No pets yet.</p>}
        </DashboardSection>
      </div>
      <DashboardSection title="Recent activity">
        {data.recent_activity.length ? <div className="dashboard-list">{data.recent_activity.map((item, index) =>
          <DashboardRow key={`${item.type}-${index}`} title={item.title} detail={`${item.type} · ${item.pet_name} · ${item.owner_name}`} date={formatDateTime(item.created_at)} />
        )}</div> : <p className="muted">No activity yet.</p>}
      </DashboardSection>
    </>}
  </AppShell>;
}
