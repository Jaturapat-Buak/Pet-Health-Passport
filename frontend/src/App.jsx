import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AuthPage } from './pages/auth/AuthPage.jsx';
import { PetDetailPage } from './pages/owner/PetDetailPage.jsx';
import { PetFormPage } from './pages/owner/PetFormPage.jsx';
import { PetsPage } from './pages/owner/PetsPage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute roles={['owner']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:id" element={<PetDetailPage />} />
            <Route path="/pets/:id/edit" element={<PetFormPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['vet']} />}>
            <Route path="/vet/dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
