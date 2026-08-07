import { lazy, Suspense } from 'react'
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

const ConceptPage = lazy(() => import('./pages/ConceptPage'))
const AcademyPage = lazy(() => import('./pages/AcademyPage'))
const AcademyArticlePage = lazy(() => import('./pages/AcademyArticlePage'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/intake" element={<Navigate to="/intake/atabaque" replace />} />
      <Route path="/intake/:workspace" element={<Home />} />
      <Route path="/forms" element={<FormsIndex />} />
      <Route path="/clearance" element={<EngineFormPage config={clearanceConfig} workflowType="rights_clearance" />} />
      <Route path="/clearance/:workspace" element={<EngineFormPage config={clearanceConfig} workflowType="rights_clearance" />} />
      <Route path="/people" element={<PeoplePage />} />
      <Route path="/people/:workspace" element={<PeoplePage />} />
      <Route path="/company" element={<EngineFormPage config={companyConfig} workflowType="company_registry" />} />
      <Route path="/company/:workspace" element={<EngineFormPage config={companyConfig} workflowType="company_registry" />} />
      <Route path="/portal" element={<PortalIndex />} />
      <Route path="/portal/:workspace" element={<Portal />} />
      <Route path="/concept" element={<Suspense fallback={<div className="min-h-screen bg-[#00070c]" />}><ConceptPage /></Suspense>} />
      <Route path="/academy" element={<Suspense fallback={<div className="min-h-screen bg-[#000e14]" />}><AcademyPage /></Suspense>} />
      <Route path="/academy/:slug" element={<Suspense fallback={<div className="min-h-screen bg-[#000e14]" />}><AcademyArticlePage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
