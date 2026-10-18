import { getPatientDemoRecords } from './patientDemoData.js'

const STORAGE_KEY = 'mediroute.demo.appointments.v1'
const cancellableStatuses = new Set(['scheduled', 'upcoming', 'confirmed', 'pending'])
let memoryRecords = []
let usingMemoryFallback = false

function readStoredRecords() {
  if (typeof window === 'undefined' || usingMemoryFallback) return memoryRecords
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return memoryRecords
    return value.filter((record) => record && typeof record.id === 'string' && typeof record.patientId === 'string' && typeof record.date === 'string')
  } catch {
    return memoryRecords
  }
}

function saveRecords(records) {
  memoryRecords = records
  try {
    if (typeof window === 'undefined') { usingMemoryFallback = true; return false }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    usingMemoryFallback = false
    return true
  } catch {
    usingMemoryFallback = true
    return false
  }
}

function legacyRecords(patientId) {
  if (patientId !== 'demo-patient') return []
  return getPatientDemoRecords().appointments.map((appointment) => ({
    ...appointment,
    patientId,
    consultationType: 'In-person',
    providerType: 'hospital',
    isDemo: true,
  }))
}

function allForPatient(patientId) {
  if (!patientId) return []
  const stored = readStoredRecords().filter((record) => record.patientId === patientId)
  const legacy = legacyRecords(patientId)
  const ids = new Set(stored.map((record) => record.reference ?? record.id))
  return [...stored, ...legacy.filter((record) => !ids.has(record.reference ?? record.id))]
}

function todayLocal() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function createUniqueId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function isAppointmentCancellable(appointment) {
  return Boolean(appointment) && cancellableStatuses.has(String(appointment.status ?? '').toLowerCase()) && String(appointment.date ?? '') >= todayLocal()
}

export function filterAppointments(appointments, status = 'all') {
  const records = Array.isArray(appointments) ? appointments : []
  if (status === 'upcoming') return records.filter((item) => isAppointmentCancellable(item))
  if (status === 'completed') return records.filter((item) => String(item.status).toLowerCase() === 'completed')
  if (status === 'cancelled') return records.filter((item) => ['cancelled', 'canceled'].includes(String(item.status).toLowerCase()))
  return records
}

/** Demo-only data adapter. Replace these methods with authenticated API calls for production. */
export function listAppointments(patientId, status = 'all') {
  return filterAppointments(allForPatient(patientId), status).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}

export function getAppointmentById(id, patientId) {
  return allForPatient(patientId).find((item) => item.id === id || item.reference === id) ?? null
}

export function createAppointment(input, patient) {
  if (!patient?.id || patient.role !== 'patient') throw new Error('Sign in with a patient demo account to book an appointment.')
  const { doctor, hospital, date, time, consultationType } = input ?? {}
  if (!doctor && !hospital) throw new Error('Choose a doctor or hospital listing.')
  if (date < todayLocal()) throw new Error('Choose today or a future appointment date.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !time) throw new Error('Choose a valid date and time.')
  if (!['In-person', 'Online'].includes(consultationType)) throw new Error('Choose a consultation type.')

  const providerKey = doctor?.id ?? hospital?.id
  const duplicate = allForPatient(patient.id).some((item) => item.date === date && item.time === time && item.providerId === providerKey && isAppointmentCancellable(item))
  if (duplicate) throw new Error('You already have a demo appointment for this provider at that time.')

  const unique = createUniqueId()
  const appointment = {
    id: `demo-appointment-${unique}`,
    reference: `DEMO-APT-${unique.toUpperCase()}`,
    patientId: patient.id,
    doctor: doctor ? { id: doctor.id, name: doctor.name, specialization: doctor.specialization, qualification: doctor.qualification } : null,
    hospital: hospital ? { id: hospital.id, name: hospital.name } : (doctor?.hospital ? { name: doctor.hospital } : null),
    providerId: providerKey,
    providerType: doctor ? 'doctor' : 'hospital',
    location: doctor?.location ?? hospital?.location ?? hospital?.city ?? 'Location not provided',
    date,
    time,
    consultationType,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isDemo: true,
  }
  const records = readStoredRecords()
  records.push(appointment)
  const persisted = saveRecords(records)
  return { appointment, persisted }
}

export function cancelAppointment(id, patientId) {
  const current = getAppointmentById(id, patientId)
  if (!current) throw new Error('This appointment could not be found for your demo account.')
  if (!isAppointmentCancellable(current)) throw new Error('This appointment can no longer be cancelled.')
  const stored = readStoredRecords()
  const index = stored.findIndex((item) => item.patientId === patientId && (item.id === id || item.reference === id))
  const next = index < 0
    ? [...stored, { ...current, patientId, status: 'cancelled', updatedAt: new Date().toISOString() }]
    : stored.map((item, itemIndex) => itemIndex === index ? { ...item, status: 'cancelled', updatedAt: new Date().toISOString() } : item)
  const persisted = saveRecords(next)
  return { appointment: index < 0 ? next[next.length - 1] : next[index], persisted }
}
