import { demoHospitals, findHospital } from './directoryDemoData.js'
import { getPatientDemoRecords } from './patientDemoData.js'

const STORAGE_KEY = 'mediroute.demo.tokens.v1'
const tokenStatuses = new Set(['waiting', 'called', 'completed', 'cancelled'])
const transitions = { waiting: new Set(['called', 'cancelled']), called: new Set(['completed', 'cancelled']), completed: new Set(), cancelled: new Set() }
const safeIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/
let memoryRecords = []
let usingMemoryFallback = false

function readStoredRecords() {
  if (typeof window === 'undefined' || usingMemoryFallback) return memoryRecords
  try {
    const records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(records)) return memoryRecords
    return records.filter((record) => record && typeof record.id === 'string' && typeof record.reference === 'string' && typeof record.patientId === 'string')
  } catch { return memoryRecords }
}

function writeRecords(records) {
  memoryRecords = records
  try {
    if (typeof window === 'undefined') { usingMemoryFallback = true; return false }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    usingMemoryFallback = false
    return true
  } catch { usingMemoryFallback = true; return false }
}

function legacyTokens() {
  return getPatientDemoRecords().tokens.map((token) => ({
    ...token,
    patientId: 'demo-patient',
    hospitalId: demoHospitals.find((hospital) => hospital.name === token.hospital)?.id ?? '',
    estimatedPosition: 3,
    isDemo: true,
  }))
}

function everyToken() {
  const saved = readStoredRecords()
  const savedKeys = new Set(saved.flatMap((token) => [token.id, token.reference]))
  return [...saved, ...legacyTokens().filter((token) => !savedKeys.has(token.id) && !savedKeys.has(token.reference))]
}

function forPatient(patientId) {
  return patientId ? everyToken().filter((token) => token.patientId === patientId) : []
}

function publicToken(token) {
  if (!token) return null
  const { patientId, ...safeToken } = token
  return safeToken
}

function createUniqueSuffix() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeReference(value) {
  const input = typeof value === 'string' ? value.trim() : ''
  const reference = input.startsWith('MR-TOKEN:') ? input.slice('MR-TOKEN:'.length) : input
  return safeIdPattern.test(reference) ? reference : ''
}

export function listPatientTokens(patientId, status = 'all') {
  const records = forPatient(patientId)
  return records
    .filter((token) => status === 'all' || String(token.status).toLowerCase() === status)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .map(publicToken)
}

export function getTokenById(id, patientId) {
  if (typeof id !== 'string' || !id) return null
  return publicToken(forPatient(patientId).find((token) => token.id === id || token.reference === id) ?? null)
}

export function validateTokenReference(value, patientId, { allowAnyPatient = false } = {}) {
  const reference = normalizeReference(value)
  if (!reference) return null
  const records = allowAnyPatient ? everyToken() : forPatient(patientId)
  return publicToken(records.find((token) => token.reference === reference || token.id === reference) ?? null)
}

export function listHospitalTokens(hospitalId, { department = 'all', status = 'all' } = {}) {
  if (!findHospital(hospitalId)) return []
  return everyToken()
    .filter((token) => token.hospitalId === hospitalId)
    .filter((token) => department === 'all' || token.department === department)
    .filter((token) => status === 'all' || String(token.status).toLowerCase() === status)
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
    .map(publicToken)
}

export function createToken({ hospitalId, department } = {}, patient) {
  if (!patient?.id || patient.role !== 'patient') throw new Error('Sign in with a patient demo account to create a queue token.')
  const hospital = findHospital(hospitalId)
  if (!hospital) throw new Error('Choose a valid sample hospital or clinic.')
  const departments = Array.isArray(hospital.departments) ? hospital.departments : []
  const requestedDepartment = typeof department === 'string' ? department.trim() : ''
  if (departments.length && !departments.includes(requestedDepartment)) throw new Error('Choose a department listed for this sample hospital.')
  if (departments.length && !requestedDepartment) throw new Error('Choose a department.')
  const selectedDepartment = requestedDepartment || 'Not specified (demo)'

  const existing = forPatient(patient.id)
  const hasActiveDuplicate = existing.some((token) => token.hospitalId === hospital.id && token.department === selectedDepartment && ['waiting', 'called'].includes(String(token.status).toLowerCase()))
  if (hasActiveDuplicate) throw new Error('You already have an active demo token for this hospital and department.')

  const allTokens = everyToken()
  const latestNumber = allTokens.reduce((latest, token) => Math.max(latest, Number(String(token.tokenNumber ?? '').match(/(\d+)$/)?.[1] ?? 0)), 0)
  const queuePosition = allTokens.filter((token) => token.hospitalId === hospital.id && token.department === selectedDepartment && ['waiting', 'called'].includes(String(token.status).toLowerCase())).length + 1
  const suffix = createUniqueSuffix()
  const token = {
    id: `token-${suffix}`,
    reference: `MR-${suffix.toUpperCase()}`,
    patientId: patient.id,
    hospitalId: hospital.id,
    tokenNumber: `D-${String(latestNumber + 1).padStart(3, '0')}`,
    hospital: hospital.name,
    department: selectedDepartment,
    estimatedPosition: queuePosition,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    isDemo: true,
  }
  const records = readStoredRecords()
  records.push(token)
  const persisted = writeRecords(records)
  return { token: publicToken(token), persisted }
}

export function updateTokenStatus(id, nextStatus, actor) {
  if (!actor?.id || !['admin', 'representative'].includes(actor.role)) throw new Error('Only an admin or medical representative demo role can update queue status.')
  const status = String(nextStatus ?? '').toLowerCase()
  if (!tokenStatuses.has(status)) throw new Error('Choose a supported queue status.')
  const current = everyToken().find((token) => token.id === id || token.reference === id)
  if (!current) throw new Error('This queue token could not be found.')
  if (!transitions[String(current.status).toLowerCase()]?.has(status)) throw new Error(`A token with status ${current.status} cannot be changed to ${status}.`)

  const records = readStoredRecords()
  const index = records.findIndex((token) => token.id === current.id || token.reference === current.reference)
  const updated = { ...current, status, updatedAt: new Date().toISOString() }
  const next = index < 0 ? [...records, updated] : records.map((token, itemIndex) => itemIndex === index ? updated : token)
  const persisted = writeRecords(next)
  return { token: publicToken(updated), persisted }
}
