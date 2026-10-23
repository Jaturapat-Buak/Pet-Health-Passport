import { Link } from 'react-router-dom';

export const formatDate = (value) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'UTC' })
  .format(new Date(`${String(value).slice(0, 10)}T12:00:00Z`));
export const formatDateTime = (value) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  .format(new Date(value));

export function DashboardStats({ items }) {
  return <div className="dashboard-stats">{items.map(([label, value, to]) =>  <div className="dashboard-stat" key={label}>
    <span>{label}</span><strong>{value}</strong>{to && <Link to={to}>ดูทั้งหมด</Link>}
  </div>)}</div>;
}

export function DashboardSection({ title, to, children, className = '' }) {
  return <section className={`dashboard-section ${className}`} aria-label={title}>
    <div className="section-heading-row"><h2>{title}</h2>{to && <Link to={to}>ดูทั้งหมด</Link>}</div>
    {children}
  </section>;
}

export function DashboardRow({ title, detail, date, to }) {
  const content = <><span><strong>{title}</strong><small>{detail}</small></span><time>{date}</time></>;
  return to ? <Link className="dashboard-row" to={to}>{content}</Link> : <div className="dashboard-row">{content}</div>;
}

export function DashboardLoadState({ status, retry }) {
  if (status === 'loading') return <p className="muted" role="status">กำลังโหลดหน้าหลัก...</p>;
  if (status === 'error') return <div className="inline-error" role="alert"><p>ไม่สามารถโหลดหน้าหลักได้</p>
    <button className="secondary-button" type="button" onClick={retry}>ลองใหม่</button></div>;
  return null;
}
