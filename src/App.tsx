import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ClientsPage from './pages/Clients';
import ClientDetailPage from './pages/ClientDetail';
import PlansPage from './pages/Plans';

function RedirectClientDetail() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  return <Navigate to={`/quadras/${companyPublicId}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/quadras" element={<ClientsPage />} />
        <Route
          path="/quadras/:companyPublicId"
          element={<ClientDetailPage />}
        />
        <Route path="/planos" element={<PlansPage />} />
        <Route path="/clientes" element={<Navigate to="/quadras" replace />} />
        <Route
          path="/clientes/:companyPublicId"
          element={<RedirectClientDetail />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
