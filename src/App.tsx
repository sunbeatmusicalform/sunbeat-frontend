import { Routes, Route, Navigate } from 'react-router'
import Landing from './pages/Landing'
import Home from './pages/Home'
import FormsIndex from './pages/FormsIndex'
import EngineFormPage from './pages/EngineFormPage'
import PeoplePage from './pages/PeoplePage'
import { clearanceConfig } from './forms/clearance'
import { companyConfig } from './forms/company'
import Portal from './portal/Portal'
import PortalIndex from './portal/PortalIndex'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/intake" element={<Navigate to="/intake/atabaque" replace />} />
      <Route path="/intake/:workspace" element={<Home />} />
      <Route path="/forms" element={<FormsIndex />} />
      <Route path="/clearance" element={<EngineFormPage config={clearanceConfig} />} />
      <Route path="/clearance/:workspace" element={<EngineFormPage config={clearanceConfig} />} />
      <Route path="/people" element={<PeoplePage />} />
      <Route path="/people/:workspace" element={<PeoplePage />} />
      <Route path="/company" element={<EngineFormPage config={companyConfig} />} />
      <Route path="/company/:workspace" element={<EngineFormPage config={companyConfig} />} />
      <Route path="/portal" element={<PortalIndex />} />
      <Route path="/portal/:workspace" element={<Portal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
