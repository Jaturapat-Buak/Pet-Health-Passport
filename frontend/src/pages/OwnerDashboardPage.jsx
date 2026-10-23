import { thaiValue } from '../i18n.js';
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
    <div className="dashboard-heading"><p className="eyebrow">Pet Owner</p><h1>Welcome, {user.name}</h1></div>
    {status !== 'ready' ? <DashboardLoadState status={status} retry={retry} /> : <OwnerContent data={data} />}
  </AppShell>;
}

function OwnerContent({ data }) {
  const { stats, pets, appointments, vaccinations, medications, records, reminders, weights } = data;
  return <>
    <DashboardStats items={[
      ['Your Pets', stats.pets, '/pets'], ['Upcoming Visits', stats.upcoming_appointments, '/appointments'],
      ['Vaccines Due in 30 Days', stats.upcoming_vaccinations], ['Active Medications', stats.active_medications]
    ]} />
    <div className="dashboard-columns">
      <DashboardSection title="Upcoming Reminders" to="/reminders">
        {reminders.length ? <div className="dashboard-list">{reminders.map((item) =>  <DashboardRow key={item.id} title={item.title} detail={item.message} date={item.event_at ? formatDateTime(item.event_at) : formatDate(item.reminder_date)} to={item.target_url} />)}</div> : <p className="muted">ไม่มีรายการแจ้งเตือนที่ยังไม่ได้อ่านในช่วง 30 วันข้างหน้า</p>}
      </DashboardSection>
      <DashboardSection title="Upcoming Appointments" to="/appointments">
        {appointments.length ? <div className="dashboard-list">{appointments.map((item) =>  <DashboardRow key={item.id} title={`${item.pet_name}: ${item.purpose}`} detail={item.clinic_name || 'ยังไม่ระบุคลินิก'} date={formatDateTime(item.appointment_date)} to="/appointments" />)}</div> : <p className="muted">ไม่มีนัดหมายที่กำลังจะมาถึง</p>}
      </DashboardSection>
      <DashboardSection title="Vaccinations Due Soon">
        {vaccinations.length ? <div className="dashboard-list">{vaccinations.map((item) =>  <DashboardRow key={item.id} title={item.vaccine_name} detail={item.pet_name} date={formatDate(item.next_due_date)} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">ไม่มีวัคซีนที่ถึงกำหนดในช่วง 30 วันข้างหน้า</p>}
      </DashboardSection>
      <DashboardSection title="Active Medications">
        {medications.length ? <div className="dashboard-list">{medications.map((item) =>  <DashboardRow key={item.id} title={item.medication_name} detail={`${item.pet_name}${item.dosage ? ` · ${item.dosage}` : ''}`} date={item.end_date ? `สิ้นสุด ${formatDate(item.end_date)}` : 'กำลังใช้'} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">ไม่มียาที่กำลังใช้</p>}
      </DashboardSection>
    </div>
    <DashboardSection title="Recent Health Records">
      {records.length ? <div className="dashboard-list">{records.map((item, index) =>  <DashboardRow key={`${item.pet_id}-${thaiValue(item.type)}-${index}`} title={item.title} detail={`${item.pet_name} · ${item.type === 'medical' ? 'การเข้ารับการรักษา' : item.type === 'weight' ? 'น้ำหนัก' : 'วัคซีน'}`} date={formatDate(item.record_date)} to={`/pets/${item.pet_id}`} />)}</div> : <p className="muted">ยังไม่มีประวัติสุขภาพ</p>}
    </DashboardSection>
    <Suspense fallback={<DashboardSection title="Weight History"><p className="muted">กำลังโหลดกราฟ...</p></DashboardSection>}>
      <WeightChart pets={pets} weights={weights} />
    </Suspense>
    <DashboardSection title="Your Pets" to="/pets">
      {pets.length ? <div className="pet-grid">{pets.slice(0, 3).map((pet) =>  <Link className="pet-card" key={pet.id} to={`/pets/${pet.id}`}>
        <PetAvatar pet={pet} /><span className="pet-card-details"><strong>{pet.name}</strong><span>{[thaiValue(pet.species), pet.breed].filter(Boolean).join(' / ')}</span></span><span className="card-arrow" aria-hidden="true">&rarr;</span>
      </Link>)}</div> : <div className="empty-state"><h3>ยังไม่มีสัตว์เลี้ยง</h3><p>เพิ่มสัตว์เลี้ยงตัวแรกเพื่อเริ่มบันทึกสมุดสุขภาพ</p><Link className="primary-link" to="/pets/new">เพิ่มสัตว์เลี้ยง</Link></div>}
    </DashboardSection>
  </>;
}
