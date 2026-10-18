import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  HeartPulse,
} from 'lucide-react'
import Chatbot from '../components/Chatbot.jsx'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardPath } from '../utils/constants.js'

// Load page-level code only when its route is opened. In particular, the QR
// scanner and camera dependencies no longer inflate the initial home bundle.
const About = lazy(() => import('../pages/About.jsx'))
const Contact = lazy(() => import('../pages/Contact.jsx'))
const Home = lazy(() => import('../pages/Home.jsx'))
const Login = lazy(() => import('../pages/auth/Login.jsx'))
const Register = lazy(() => import('../pages/auth/Register.jsx'))
const PatientDashboard = lazy(() => import('../pages/patient/PatientDashboard.jsx'))
const PatientProfile = lazy(() => import('../pages/patient/PatientProfile.jsx'))
const FindDoctors = lazy(() => import('../pages/doctors/FindDoctors.jsx'))
const DoctorProfile = lazy(() => import('../pages/doctors/DoctorProfile.jsx'))
const FindHospitals = lazy(() => import('../pages/hospitals/FindHospitals.jsx'))
const HospitalProfile = lazy(() => import('../pages/hospitals/HospitalProfile.jsx'))
const FindPharmacies = lazy(() => import('../pages/pharmacies/FindPharmacies.jsx'))
const PharmacyProfile = lazy(() => import('../pages/pharmacies/PharmacyProfile.jsx'))
const BookAppointment = lazy(() => import('../pages/appointments/BookAppointment.jsx'))
const MyAppointments = lazy(() => import('../pages/appointments/MyAppointments.jsx'))
const AppointmentDetails = lazy(() => import('../pages/appointments/AppointmentDetails.jsx'))
const GenerateToken = lazy(() => import('../pages/qr-token/GenerateToken.jsx'))
const ScanQR = lazy(() => import('../pages/qr-token/ScanQR.jsx'))
const MyTokens = lazy(() => import('../pages/qr-token/MyTokens.jsx'))
const TokenDetails = lazy(() => import('../pages/qr-token/TokenDetails.jsx'))
const HospitalQueue = lazy(() => import('../pages/qr-token/HospitalQueue.jsx'))
const VideoConsultation = lazy(() => import('../pages/consultation/VideoConsultation.jsx'))
const ConsultationHistory = lazy(() => import('../pages/consultation/ConsultationHistory.jsx'))

const protectedPages = [
  { path: '/patient/dashboard', roles: ['patient'], title: 'Patient dashboard', description: 'Welcome to your demo dashboard. Your appointments and queue tools will appear here in later phases.' },
  { path: '/patient/profile', roles: ['patient'], title: 'Patient profile', description: 'Your demo profile and preferences will appear here.' },
  { path: '/appointments/book', roles: ['patient'], title: 'Book an appointment', description: 'Choose a doctor and an available appointment time.' },
  { path: '/appointments', roles: ['patient', 'representative'], title: 'My appointments', description: 'Review demo appointment information.' },
  { path: '/appointments/:id', roles: ['patient', 'representative'], title: 'Appointment details', description: 'View the details and status of an appointment.' },
  { path: '/tokens/generate', roles: ['patient'], title: 'Generate a queue token', description: 'Create a demo token for a hospital visit.' },
  { path: '/tokens/scan', roles: ['patient', 'admin'], title: 'Scan a QR code', description: 'Scan a MediRoute demo token reference.' },
  { path: '/tokens', roles: ['patient'], title: 'My queue tokens', description: 'Review the queue tokens saved in this demo.' },
  { path: '/tokens/:id', roles: ['patient'], title: 'Token details', description: 'View token status and queue details.' },
  { path: '/queue', roles: ['admin', 'representative'], title: 'Hospital queue', description: 'View current demo queue information for a hospital.' },
  { path: '/consultation', roles: ['patient'], title: 'Video consultation', description: 'Video consultation requires a compatible backend or calling service.' },
  { path: '/consultation/:appointmentId', roles: ['patient'], title: 'Video consultation', description: 'Open a local demo session for an online appointment.' },
  { path: '/consultation/history', roles: ['patient'], title: 'Consultation history', description: 'Review previous consultations.' },
  { path: '/mr/dashboard', roles: ['representative'], title: 'Representative dashboard', description: 'Welcome to your medical representative demo dashboard.' },
  { path: '/mr/doctors', roles: ['representative'], title: 'Doctor directory', description: 'Browse the demo doctor directory for representative visits.' },
  { path: '/mr/visits', roles: ['representative'], title: 'Visit history', description: 'Review demo representative visit history.' },
  { path: '/admin', roles: ['admin'], title: 'Admin dashboard', description: 'Welcome to the MediRoute admin demo dashboard.' },
  { path: '/admin/users', roles: ['admin'], title: 'Manage users', description: 'Review and manage demo user records.' },
  { path: '/admin/doctors', roles: ['admin'], title: 'Manage doctors', description: 'Review and manage demo doctor records.' },
  { path: '/admin/hospitals', roles: ['admin'], title: 'Manage hospitals', description: 'Review and manage demo hospital records.' },
  { path: '/admin/tokens', roles: ['admin'], title: 'Manage tokens', description: 'Review demo queue tokens.' },
]

const protectedComponents = {
  '/patient/dashboard': PatientDashboard,
  '/patient/profile': PatientProfile,
  '/appointments/book': BookAppointment,
  '/appointments': MyAppointments,
  '/appointments/:id': AppointmentDetails,
  '/tokens/generate': GenerateToken,
  '/tokens/scan': ScanQR,
  '/tokens': MyTokens,
  '/tokens/:id': TokenDetails,
  '/queue': HospitalQueue,
  '/consultation': VideoConsultation,
  '/consultation/:appointmentId': VideoConsultation,
  '/consultation/history': ConsultationHistory,
}

function RoutePlaceholder({ title, description }) {
  return <main className="route-page"><div className="route-card"><span className="route-icon"><HeartPulse size={22} /></span><span className="eyebrow">MEDIROUTE</span><h1>{title}</h1><p>{description}</p><div className="phase-note">This page is part of the app navigation. Its feature will be implemented in a later phase.</div><Link className="button button-primary" to="/">Back to home <ArrowRight size={16} /></Link></div></main>
}

function RequireAuth({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />
  return <Outlet />
}

function NotFound() {
  const location = useLocation()
  return <RoutePlaceholder title="Page not found" description={`There is no MediRoute page at "${location.pathname}".`} />
}

function PageLoading() {
  return <main className="route-page" aria-busy="true" aria-live="polite"><p className="helper-text">Loading MediRoute page…</p></main>
}

function RouteContent() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<FindDoctors />} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />
        <Route path="/hospitals" element={<FindHospitals />} />
        <Route path="/hospitals/:id" element={<HospitalProfile />} />
        <Route path="/pharmacies" element={<FindPharmacies />} />
        <Route path="/pharmacies/:id" element={<PharmacyProfile />} />
        {protectedPages.map(({ path, roles, title, description }) => {
          const Page = protectedComponents[path]
          return <Route key={path} element={<RequireAuth allowedRoles={roles} />}>
            <Route path={path} element={Page ? <Page /> : <RoutePlaceholder title={title} description={description} />} />
          </Route>
        })}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <Footer />
      <Chatbot />
    </>
  )
}

export default function AppRoutes() {
  return <BrowserRouter><RouteContent /></BrowserRouter>
}
