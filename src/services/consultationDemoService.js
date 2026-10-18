import { getAppointmentById, listAppointments } from './appointmentDemoService.js'

const STORAGE_KEY = 'mediroute.demo.consultations.v1'
const eligibleAppointmentStatuses = new Set(['scheduled', 'upcoming', 'confirmed', 'pending'])
let memoryRecords = []
let useMemoryFallback = false

function readRecords() {
  if (typeof window === 'undefined' || useMemoryFallback) return memoryRecords
  try {
    const records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(records)
      ? records.filter((record) => record && typeof record.id === 'string' && typeof record.patientId === 'string' && typeof record.appointmentId === 'string')
      : memoryRecords
  } catch {
    return memoryRecords
  }
}

function saveRecords(records) {
  memoryRecords = records
  try {
    if (typeof window === 'undefined') { useMemoryFallback = true; return false }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    useMemoryFallback = false
    return true
  } catch {
    useMemoryFallback = true
    return false
  }
}

function createUniqueId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function localToday() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isVideoConsultationEligible(appointment) {
  const status = String(appointment?.status ?? '').toLowerCase()
  const date = String(appointment?.date ?? appointment?.appointmentDate ?? '')
  return String(appointment?.consultationType ?? '').toLowerCase() === 'online'
    && eligibleAppointmentStatuses.has(status)
    && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && date >= localToday()
}

function scopedAppointment(appointmentId, patientId) {
  return patientId ? getAppointmentById(appointmentId, patientId) : null
}

function scopedSession(appointmentId, patientId) {
  if (!scopedAppointment(appointmentId, patientId)) return null
  return readRecords().find((record) => record.patientId === patientId && (record.appointmentId === appointmentId || record.appointmentReference === appointmentId)) ?? null
}

function publicSession(session, appointment = null) {
  if (!session) return null
  const safeSession = Object.fromEntries(Object.entries(session).filter(([key]) => key !== 'patientId'))
  if (!appointment) return safeSession
  const safeAppointment = Object.fromEntries(Object.entries(appointment).filter(([key]) => key !== 'patientId'))
  return { ...safeSession, appointment: safeAppointment }
}

function withCurrentDuration(session) {
  if (!session || session.status !== 'active') return session
  const start = Date.parse(session.startedAt)
  return { ...session, durationSeconds: Number.isNaN(start) ? 0 : Math.max(0, Math.floor((Date.now() - start) / 1000)) }
}

/** Returns online, non-terminal appointments belonging to this demo patient. */
export function listEligibleConsultationAppointments(patientId) {
  return listAppointments(patientId).filter(isVideoConsultationEligible)
}

/** Returns one patient's session for an appointment, never a global record. */
export function getConsultationForAppointment(appointmentId, patientId) {
  const appointment = scopedAppointment(appointmentId, patientId)
  if (!appointment) return null
  const session = scopedSession(appointmentId, patientId)
  return session ? publicSession(withCurrentDuration(session), appointment) : null
}

export function listConsultationHistory(patientId) {
  if (!patientId) return []
  return readRecords()
    .filter((record) => record.patientId === patientId)
    .map((record) => ({ record, appointment: getAppointmentById(record.appointmentId, patientId) }))
    .filter(({ appointment }) => Boolean(appointment))
    .sort((a, b) => String(b.record.startedAt).localeCompare(String(a.record.startedAt)))
    .map(({ record, appointment }) => publicSession(withCurrentDuration(record), appointment))
}

export function startDemoConsultation(appointmentId, patient) {
  if (!patient?.id || patient.role !== 'patient') throw new Error('Sign in with a patient demo account to start a consultation.')
  const appointment = scopedAppointment(appointmentId, patient.id)
  if (!appointment) throw new Error('This appointment is not available for your demo account.')
  if (!isVideoConsultationEligible(appointment)) throw new Error('This appointment is not eligible for a video consultation. Choose an upcoming online appointment.')

  const existing = scopedSession(appointment.id, patient.id)
  if (existing?.status === 'active') throw new Error('A demo consultation is already active for this appointment. Join it to continue.')
  if (existing) throw new Error('This demo consultation has already ended and cannot be restarted.')

  const session = {
    id: `demo-consultation-${createUniqueId()}`,
    patientId: patient.id,
    appointmentId: appointment.id,
    appointmentReference: appointment.reference ?? appointment.id,
    status: 'active',
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: 0,
    isDemo: true,
  }
  const records = readRecords()
  records.push(session)
  return { session: publicSession(session, appointment), persisted: saveRecords(records) }
}

export function endDemoConsultation(sessionId, patientId) {
  const current = readRecords().find((record) => record.patientId === patientId && record.id === sessionId)
  if (!current) throw new Error('This consultation session was not found for your demo account.')
  if (current.status !== 'active') throw new Error('This consultation session has already ended.')
  const started = Date.parse(current.startedAt)
  const endedAt = new Date().toISOString()
  const durationSeconds = Number.isNaN(started) ? 0 : Math.max(0, Math.floor((Date.parse(endedAt) - started) / 1000))
  const updated = { ...current, status: 'ended', endedAt, durationSeconds }
  const records = readRecords().map((record) => record.id === current.id && record.patientId === patientId ? updated : record)
  const appointment = getAppointmentById(current.appointmentId, patientId)
  return { session: publicSession(updated, appointment), persisted: saveRecords(records) }
}
