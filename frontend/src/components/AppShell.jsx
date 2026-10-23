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
          <Link className="brand app-brand" to={user.role === 'owner' ? '/dashboard' : `/${user.role}/dashboard`}><span className="auth-header-icon" aria-hidden="true">P</span>Pet Health Passport</Link>
          <span className="header-user">{user.name} <small>({user.role === 'vet' ? 'สัตวแพทย์' : user.role === 'owner' ? 'เจ้าของสัตว์เลี้ยง' : 'ผู้ดูแลระบบ'})</small></span>
          <nav className="app-nav" aria-label="เมนูหลัก">
            <NavLink to={user.role === 'owner' ? '/dashboard' : `/${user.role}/dashboard`}>หน้าหลัก</NavLink>
            {['owner', 'admin'].includes(user.role) && <NavLink to="/pets">สัตว์เลี้ยง</NavLink>}
            {user.role === 'vet' && <NavLink to="/vet/pets">สัตว์เลี้ยงในความดูแล</NavLink>}
            <NavLink to="/appointments">นัดหมาย</NavLink>
            {user.role === 'admin' && <NavLink to="/admin/users">จัดการผู้ใช้</NavLink>}
            {user.role === 'owner' && <NavLink to="/reminders">แจ้งเตือน</NavLink>}
          </nav>
          <div className="header-actions">
            <button className="text-button sign-out-button" type="button" onClick={handleSignOut}>ออกจากระบบ</button>
          </div>
        </div>
      </header>
      <main className="dashboard-body">{children}</main>
    </div>
  );
}
