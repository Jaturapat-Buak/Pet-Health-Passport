import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { homeForRole, useAuth } from '../../auth/AuthContext.jsx';

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, signIn, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="page-loading" role="status">Loading your account...</div>;
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
      setError(requestError.response?.data?.error ?? 'Could not connect to the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <Link className="brand" to="/">Pet Health Passport</Link>
        <div className="auth-intro-copy">
          <p className="eyebrow">Care in one place</p>
          <h1>Pet Health Passport</h1>
          <p>Every detail matters to the people who care for your pet.</p>
        </div>
        <span className="auth-mark" aria-hidden="true">P / H</span>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <p className="eyebrow">{isRegister ? 'Create an account' : 'Welcome back'}</p>
          <h2>{isRegister ? 'Join Pet Health Passport' : 'Sign in to your account'}</h2>
          <p className="form-subtitle">{isRegister ? 'Start with your details.' : 'Enter your details to continue.'}</p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                Name
                <input name="name" autoComplete="name" maxLength="120" required />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" autoComplete="email" maxLength="255" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to Pet Health Passport?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
