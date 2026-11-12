import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { homeForRole, useAuth } from '../../auth/AuthContext.jsx';

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, signIn, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page-loading" role="status">กำลังโหลดบัญชีของคุณ...</div>;
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);

    try {
      const nextUser = isRegister
        ? await register(data.get('name'), data.get('email'), data.get('password'))
        : await signIn(data.get('email'), data.get('password'));
      navigate(homeForRole(nextUser.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <header className="auth-header">
        <Link to="/login" className="auth-header-brand">
          <span className="auth-header-icon" aria-hidden="true">P</span>
          <span>Pet Health Passport</span>
        </Link>
      </header>
      <div className="auth-card">
      <section className="auth-intro">
        <div className="auth-intro-copy">
          <h1>Pet Health Passport</h1>
          <p>ดูแลทุกเรื่องสุขภาพของเพื่อนตัวน้อย<br />บันทึกและติดตามได้ในที่เดียว</p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <h2>{isRegister ? 'Create an account' : 'Sign in'}</h2>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                ชื่อผู้ใช้งาน
                <input name="name" placeholder="ชื่อของคุณ" autoComplete="name" maxLength="120" required />
              </label>
            )}
            <label>
              อีเมล
              <input name="email" type="email" placeholder="เช่น name@example.com" autoComplete="email" maxLength="255" required />
            </label>
            <label>
              รหัสผ่าน
              <input name="password" type="password" placeholder={isRegister ? 'อย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่านของคุณ'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'กรุณารอสักครู่...' : isRegister ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <Link className="auth-switch" to={isRegister ? '/login' : '/register'}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5.2" /></svg>
            {isRegister ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
          </Link>
        </div>
      </section>
      </div>
    </main>
  );
}
