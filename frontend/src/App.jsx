import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.jsx';
import { AuthPage } from './pages/auth/AuthPage.jsx';
import { AppointmentFormPage } from './pages/owner/AppointmentFormPage.jsx';
import { AppointmentsPage } from './pages/owner/AppointmentsPage.jsx';
import { PetDetailPage } from './pages/owner/PetDetailPage.jsx';
import { PetFormPage } from './pages/owner/PetFormPage.jsx';
import { PetsPage } from './pages/owner/PetsPage.jsx';
import { RemindersPage } from './pages/owner/RemindersPage.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute roles={['owner']} />}>
            <Route path="/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:id" element={<PetDetailPage />} />
            <Route path="/pets/:id/edit" element={<PetFormPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/new" element={<AppointmentFormPage />} />
            <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['vet']} />}>
            <Route path="/vet/dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
