import { thaiValue } from '../i18n.js';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../api/dashboard.js';
import { AppShell } from '../components/AppShell.jsx';
import { DashboardLoadState, DashboardRow, DashboardSection, DashboardStats, formatDateTime } from '../components/DashboardParts.jsx';
import { useDashboard } from './useDashboard.js';

const roleNames = { owner: 'เจ้าของสัตว์เลี้ยง', vet: 'สัตวแพทย์', admin: 'ผู้ดูแลระบบ' };

export function AdminDashboardPage() {
  const { data, status, retry } = useDashboard(getAdminDashboard);
  return <AppShell>
    <div className="dashboard-heading"><p className="eyebrow">Administrator</p><h1>System Overview</h1></div>
    <div className="admin-shortcuts"><Link className="primary-link" to="/admin/users">จัดการผู้ใช้และบทบาท</Link><Link className="secondary-link" to="/pets">จัดการสัตว์เลี้ยงและประวัติ</Link><Link className="secondary-link" to="/appointments">จัดการนัดหมาย</Link></div>
    {status !== 'ready' ? <DashboardLoadState status={status} retry={retry} /> : <>
      <DashboardStats items={[
        ['Users', data.stats.users, '/admin/users'], ['Pets', data.stats.pets, '/pets'],
        ['Vaccinations', data.stats.vaccinations], ['Appointments', data.stats.appointments, '/appointments']
      ]} />
      <div className="dashboard-columns">
        <DashboardSection title="Recent Users">
          {data.recent_users.length ? <div className="dashboard-list">{data.recent_users.map((item) =>
            <DashboardRow key={item.id} to="/admin/users" title={item.name} detail={`${item.email} · ${roleNames[item.role] ?? item.role}`} date={formatDateTime(item.created_at)} />
          )}</div> : <p className="muted">ยังไม่มีผู้ใช้</p>}
        </DashboardSection>
        <DashboardSection title="Recent Pets">
          {data.recent_pets.length ? <div className="dashboard-list">{data.recent_pets.map((item) =>
            <DashboardRow key={item.id} to={`/pets/${item.id}`} title={item.name} detail={`${thaiValue(item.species)} · ${item.owner_name}`} date={formatDateTime(item.created_at)} />
          )}</div> : <p className="muted">ยังไม่มีสัตว์เลี้ยง</p>}
        </DashboardSection>
      </div>
      <DashboardSection title="Recent Activity">
        {data.recent_activity.length ? <div className="dashboard-list">{data.recent_activity.map((item, index) =>
          <DashboardRow key={`${thaiValue(item.type)}-${index}`} title={item.title} detail={`${thaiValue(item.type)} · ${item.pet_name} · ${item.owner_name}`} date={formatDateTime(item.created_at)} />
        )}</div> : <p className="muted">ยังไม่มีความเคลื่อนไหว</p>}
      </DashboardSection>
    </>}
  </AppShell>;
}
