import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import ClientsPage from './pages/Clients';
import ClientDetailPage from './pages/ClientDetail';
import PlansPage from './pages/Plans';

export default function App() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/clientes" element={<ClientsPage />} />
        <Route path="/clientes/:companyPublicId" element={<ClientDetailPage />} />
        <Route path="/planos" element={<PlansPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
