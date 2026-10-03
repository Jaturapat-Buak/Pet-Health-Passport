import { Navigate, Outlet } from 'react-router-dom';
import { homeForRole, useAuth } from '../auth/AuthContext.jsx';

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading" role="status">Loading your account...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;

  return <Outlet />;
}

