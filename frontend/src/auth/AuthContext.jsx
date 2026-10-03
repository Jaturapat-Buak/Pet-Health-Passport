import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenKey } from '../api/client.js';

const AuthContext = createContext(null);

export function homeForRole(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'vet') return '/vet/dashboard';
  return '/dashboard';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('pet-session-expired', handleExpired);
    if (!sessionStorage.getItem(tokenKey)) {
      setLoading(false);
      return () => window.removeEventListener('pet-session-expired', handleExpired);
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => sessionStorage.removeItem(tokenKey))
      .finally(() => setLoading(false));
    return () => window.removeEventListener('pet-session-expired', handleExpired);
  }, []);

  async function signIn(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem(tokenKey, data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    sessionStorage.setItem(tokenKey, data.token);
    setUser(data.user);
    return data.user;
  }

  function signOut() {
    sessionStorage.removeItem(tokenKey);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
