import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './auth/AuthContext.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AdminUsersPage } from './pages/AdminUsersPage.jsx';
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
import { SharedPetsPage } from './pages/vet/SharedPetsPage.jsx';
import { SharedPetDetailPage } from './pages/vet/SharedPetDetailPage.jsx';

export default function App() {
  useEffect(() => {
    const invalid = (event) => {
      const field = event.target;
      if (typeof field.setCustomValidity !== 'function') return;
      field.setCustomValidity('');
      const { validity } = field;
      if (validity.valueMissing) field.setCustomValidity('กรุณากรอกข้อมูลในช่องนี้');
      else if (validity.typeMismatch && field.type === 'email') field.setCustomValidity('กรุณากรอกอีเมลให้ถูกต้อง');
      else if (validity.typeMismatch && field.type === 'url') field.setCustomValidity('กรุณากรอกลิงก์ให้ถูกต้อง');
      else if (validity.tooShort) field.setCustomValidity(`กรุณากรอกอย่างน้อย ${field.minLength} ตัวอักษร`);
      else if (validity.rangeUnderflow) field.setCustomValidity(`กรุณากรอกค่าตั้งแต่ ${field.min} ขึ้นไป`);
      else if (validity.rangeOverflow) field.setCustomValidity(`กรุณากรอกค่าไม่เกิน ${field.max}`);
      else if (!validity.valid) field.setCustomValidity('กรุณากรอกข้อมูลให้ถูกต้อง');
    };
    const clear = (event) => event.target.setCustomValidity?.('');
    document.addEventListener('invalid', invalid, true);
    document.addEventListener('input', clear, true);
    document.addEventListener('change', clear, true);
    return () => {
      document.removeEventListener('invalid', invalid, true);
      document.removeEventListener('input', clear, true);
      document.removeEventListener('change', clear, true);
    };
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute roles={['owner']} />}>
            <Route path="/dashboard" element={<OwnerDashboardPage />} />
            </Route>
          <Route element={<ProtectedRoute roles={['owner', 'admin']} />}>
            <Route path="/pets" element={<PetsPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:id" element={<PetDetailPage />} />
            <Route path="/pets/:id/edit" element={<PetFormPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['owner']} />}>
            <Route path="/reminders" element={<RemindersPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['owner', 'vet', 'admin']} />}>
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['vet', 'admin']} />}>
            <Route path="/appointments/new" element={<AppointmentFormPage />} />
            <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['vet']} />}>
            <Route path="/vet/dashboard" element={<DashboardPage />} />
            <Route path="/vet/pets" element={<SharedPetsPage />} />
            <Route path="/vet/pets/:id" element={<SharedPetDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
