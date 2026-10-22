import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ProtectedRoute, {
  AdminOnlyRoute,
  SellerOnlyRoute,
} from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import ClientsPage from './pages/Clients';
import ClientDetailPage from './pages/ClientDetail';
import ProspectsPage from './pages/Prospects';
import ProspectDetailPage from './pages/ProspectDetail';
import PlansPage from './pages/Plans';
import CostsPage from './pages/Costs';
import RepresentativesPage from './pages/Representatives';
import RepresentativeDetailPage from './pages/RepresentativeDetail';
import CommissionsPage from './pages/Commissions';
import ProfilePage from './pages/Profile';
import DesignSystemPage from './pages/DesignSystem';
import MaintenancePage from './pages/Maintenance';

function RedirectLegacyQuadraDetail() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  return <Navigate to={`/clientes/${companyPublicId}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route
          path="/clientes/:companyPublicId"
          element={<ClientDetailPage />}
        />
        <Route element={<AdminOnlyRoute />}>
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/prospectos" element={<ProspectsPage />} />
          <Route
            path="/prospectos/:googlePlaceId"
            element={<ProspectDetailPage />}
          />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/custos" element={<CostsPage />} />
          <Route path="/manutencao" element={<MaintenancePage />} />
          <Route path="/design-system/*" element={<DesignSystemPage />} />
          <Route path="/representantes" element={<RepresentativesPage />} />
          <Route
            path="/representantes/:publicId"
            element={<RepresentativeDetailPage />}
          />
          <Route path="/quadras" element={<Navigate to="/clientes" replace />} />
          <Route
            path="/quadras/:companyPublicId"
            element={<RedirectLegacyQuadraDetail />}
          />
        </Route>
        <Route element={<SellerOnlyRoute />}>
          <Route path="/comissoes" element={<CommissionsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
