/**
 * Sample records for the frontend-only patient dashboard. Replace this module
 * with authenticated API requests when a backend is available.
 */
function dateOffset(days) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const demoAppointments = [
  {
    id: 'demo-appointment-001',
    reference: 'DEMO-APT-001',
    doctor: { name: 'Sample provider (demo)' },
    hospital: { name: 'Demo Community Clinic' },
    location: 'Demo location',
    date: dateOffset(4),
    time: '10:00 AM',
    status: 'confirmed',
    createdAt: dateOffset(-2),
  },
  {
    id: 'demo-appointment-002',
    reference: 'DEMO-APT-002',
    doctor: { name: 'Sample provider (demo)' },
    hospital: { name: 'Demo Community Clinic' },
    location: 'Demo location',
    date: dateOffset(-12),
    time: '02:30 PM',
    status: 'completed',
    createdAt: dateOffset(-20),
  },
]

const demoTokens = [
  {
    id: 'demo-token-001',
    reference: 'DEMO-TOKEN-001',
    tokenNumber: 'D-014',
    hospital: 'Demo Community Clinic',
    department: 'General services (demo)',
    status: 'waiting',
    createdAt: dateOffset(0),
  },
]

export function getPatientDemoRecords() {
  // Return fresh arrays so UI consumers cannot mutate the shared fixtures.
  return {
    appointments: demoAppointments.map((record) => ({ ...record, doctor: { ...record.doctor }, hospital: { ...record.hospital } })),
    tokens: demoTokens.map((record) => ({ ...record })),
  }
}

const upcomingStatuses = new Set(['scheduled', 'upcoming', 'confirmed', 'pending'])
const activeTokenStatuses = new Set(['active', 'waiting', 'in progress', 'in-progress', 'queued'])

export function isUpcomingPatientAppointment(appointment, today = dateOffset(0)) {
  const status = String(appointment?.status ?? '').toLowerCase()
  const date = String(appointment?.date ?? appointment?.appointmentDate ?? '')
  return upcomingStatuses.has(status) && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today
}

export function calculatePatientDashboardStats({ appointments = [], tokens = [] } = {}) {
  const safeAppointments = Array.isArray(appointments) ? appointments : []
  const safeTokens = Array.isArray(tokens) ? tokens : []
  const today = dateOffset(0)
  return {
    totalAppointments: safeAppointments.length,
    upcomingAppointments: safeAppointments.filter((appointment) => isUpcomingPatientAppointment(appointment, today)).length,
    completedAppointments: safeAppointments.filter((appointment) => String(appointment?.status ?? '').toLowerCase() === 'completed').length,
    activeTokens: safeTokens.filter((token) => activeTokenStatuses.has(String(token?.status ?? '').toLowerCase())).length,
  }
}

export function getRecentPatientActivity({ appointments = [], tokens = [] } = {}) {
  const appointmentActivity = (Array.isArray(appointments) ? appointments : []).map((appointment) => ({
    id: `appointment-${appointment?.id ?? appointment?.reference ?? 'unknown'}`,
    type: 'appointment',
    title: String(appointment?.status ?? '').toLowerCase() === 'completed' ? 'Demo appointment completed' : 'Demo appointment scheduled',
    detail: appointment?.reference ?? appointment?.id ?? 'Appointment reference unavailable',
    date: appointment?.createdAt ?? appointment?.date ?? appointment?.appointmentDate ?? '',
  }))
  const tokenActivity = (Array.isArray(tokens) ? tokens : []).map((token) => ({
    id: `token-${token?.id ?? token?.reference ?? 'unknown'}`,
    type: 'token',
    title: 'Demo queue token created',
    detail: token?.tokenNumber ?? token?.number ?? token?.reference ?? 'Token reference unavailable',
    date: token?.createdAt ?? '',
  }))
  return [...appointmentActivity, ...tokenActivity]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5)
}
