import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEYS, DEMO_ACCOUNTS, DEMO_PASSCODE, USER_ROLES } from '../utils/constants.js'

const AuthContext = createContext(null)
const validRoles = new Set(Object.values(USER_ROLES))
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeProfile(value) {
  if (!value || typeof value !== 'object') return null
  const fullName = typeof value.fullName === 'string' ? value.fullName.trim() : ''
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  const id = typeof value.id === 'string' ? value.id.trim() : ''
  if (!id || !fullName || !emailPattern.test(email) || !validRoles.has(value.role)) return null
  const phone = typeof value.phone === 'string' ? value.phone.trim().slice(0, 30) : ''
  const city = typeof value.city === 'string' ? value.city.trim().slice(0, 80) : ''
  return { id, fullName, email, phone, city, role: value.role, isDemo: true }
}

function readJson(key) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    try { window.localStorage.removeItem(key) } catch { /* Storage may be disabled. */ }
    return null
  }
}

function readAccounts() {
  const stored = readJson(AUTH_STORAGE_KEYS.ACCOUNTS)
  if (stored === null) return []
  if (!Array.isArray(stored)) {
    try { window.localStorage.removeItem(AUTH_STORAGE_KEYS.ACCOUNTS) } catch { /* Storage may be disabled. */ }
    return []
  }
  const builtInById = new Map(DEMO_ACCOUNTS.map((account) => [account.id, account]))
  const builtInEmails = new Set(DEMO_ACCOUNTS.map((account) => account.email))
  const seenEmails = new Set()
  const seenIds = new Set()
  return stored.map(normalizeProfile).filter((profile) => {
    if (!profile || seenEmails.has(profile.email) || seenIds.has(profile.id)) return false
    const builtIn = builtInById.get(profile.id)
    if (builtIn && builtIn.role !== profile.role) return false
    if (!builtIn && builtInEmails.has(profile.email)) return false
    seenEmails.add(profile.email)
    seenIds.add(profile.id)
    return true
  })
}

function readSession() {
  const stored = readJson(AUTH_STORAGE_KEYS.SESSION)
  const profile = normalizeProfile(stored?.user)
  if (!profile && stored && typeof window !== 'undefined') {
    try { window.localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION) } catch { /* Ignore unavailable storage. */ }
  }
  return profile
}

function writeJson(key, value) {
  try {
    if (typeof window === 'undefined') return false
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function removeStoredSession() {
  try {
    if (typeof window === 'undefined') return true
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION)
    return true
  } catch {
    return false
  }
}

function createDemoId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)
  const [accounts, setAccounts] = useState(readAccounts)
  const [storageWarning, setStorageWarning] = useState('')

  const login = useCallback(({ email, password } = {}) => {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!emailPattern.test(normalizedEmail)) throw new Error('Enter a valid email address.')
    if (password !== DEMO_PASSCODE) throw new Error(`Use the shared demo passcode: ${DEMO_PASSCODE}`)

    const profile = [...accounts, ...DEMO_ACCOUNTS].find((account) => account.email === normalizedEmail)
    if (!profile) throw new Error('No demo account uses that email. Choose a sample account or register a demo profile first.')

    const safeUser = normalizeProfile(profile)
    setUser(safeUser)
    const saved = writeJson(AUTH_STORAGE_KEYS.SESSION, { version: 1, user: safeUser })
    setStorageWarning(saved ? '' : 'Browser storage is unavailable. This demo session will last only until you leave or refresh this tab.')
    return safeUser
  }, [accounts])

  const register = useCallback(({ fullName, email, role } = {}) => {
    const safeName = typeof fullName === 'string' ? fullName.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (safeName.length < 2) throw new Error('Enter your full name.')
    if (!emailPattern.test(normalizedEmail)) throw new Error('Enter a valid email address.')
    if (!validRoles.has(role)) throw new Error('Choose a supported demo role.')
    const knownAccounts = [...DEMO_ACCOUNTS, ...accounts]
    if (knownAccounts.some((account) => account.email === normalizedEmail)) throw new Error('A demo account already uses this email. Try signing in instead.')

    // Password and phone inputs are intentionally not included in the saved profile.
    const profile = { id: createDemoId(), fullName: safeName, email: normalizedEmail, role, isDemo: true }
    const nextAccounts = [...accounts, profile]
    setAccounts(nextAccounts)
    const accountsSaved = writeJson(AUTH_STORAGE_KEYS.ACCOUNTS, nextAccounts)
    setUser(profile)
    const sessionSaved = writeJson(AUTH_STORAGE_KEYS.SESSION, { version: 1, user: profile })
    setStorageWarning(accountsSaved && sessionSaved ? '' : 'Browser storage is unavailable. This demo account or session may not remain after refresh.')
    return profile
  }, [accounts])

  const updateProfile = useCallback(({ fullName, email, phone = '', city = '' } = {}) => {
    if (!user) throw new Error('Sign in to update a demo profile.')
    const safeName = typeof fullName === 'string' ? fullName.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const safePhone = typeof phone === 'string' ? phone.trim() : ''
    const safeCity = typeof city === 'string' ? city.trim() : ''
    if (safeName.length < 2) throw new Error('Enter a full name with at least 2 characters.')
    if (!emailPattern.test(normalizedEmail)) throw new Error('Enter a valid email address.')
    if (safePhone && (!/^\+?[\d\s().-]{7,30}$/.test(safePhone) || safePhone.replace(/\D/g, '').length < 7)) throw new Error('Enter a valid phone number, or leave it blank.')
    if (safeCity.length > 80) throw new Error('City must be 80 characters or fewer.')
    const duplicate = [...DEMO_ACCOUNTS, ...accounts].some((account) => account.id !== user.id && account.email === normalizedEmail)
    if (duplicate) throw new Error('Another demo account already uses this email address.')

    const nextUser = { ...user, fullName: safeName, email: normalizedEmail, phone: safePhone, city: safeCity }
    const isKnownAccount = accounts.some((account) => account.id === user.id) || DEMO_ACCOUNTS.some((account) => account.id === user.id)
    const nextAccounts = isKnownAccount
      ? [...accounts.filter((account) => account.id !== user.id), nextUser]
      : accounts
    const accountSaved = nextAccounts === accounts ? true : writeJson(AUTH_STORAGE_KEYS.ACCOUNTS, nextAccounts)
    const sessionSaved = writeJson(AUTH_STORAGE_KEYS.SESSION, { version: 1, user: nextUser })
    setAccounts(nextAccounts)
    setUser(nextUser)
    setStorageWarning(accountSaved && sessionSaved ? '' : 'Browser storage is unavailable. These profile changes may not remain after refresh.')
    return nextUser
  }, [accounts, user])

  const logout = useCallback(() => {
    setUser(null)
    setStorageWarning(removeStoredSession() ? '' : 'The session ended in this tab, but browser storage could not be cleared.')
  }, [])

  const value = useMemo(() => ({
    user,
    accounts,
    isAuthenticated: Boolean(user),
    isDemo: true,
    storageWarning,
    login,
    register,
    updateProfile,
    logout,
  }), [user, accounts, storageWarning, login, register, updateProfile, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.')
  return context
}
