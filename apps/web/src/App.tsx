import { Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { DomainsPage } from './pages/DomainsPage';
import { DomainDetailPage } from './pages/DomainDetailPage';
import { ApisPage } from './pages/ApisPage';
import { ApiDetailPage } from './pages/ApiDetailPage';
import { MappingPage } from './pages/MappingPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/service-domains" element={<DomainsPage />} />
      <Route path="/service-domains/:id" element={<DomainDetailPage />} />
      <Route path="/apis" element={<ApisPage />} />
      <Route path="/apis/:id" element={<ApiDetailPage />} />
      <Route path="/mapping" element={<MappingPage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
