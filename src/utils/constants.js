export const USER_ROLES = Object.freeze({
  PATIENT: 'patient',
  REPRESENTATIVE: 'representative',
  ADMIN: 'admin',
})

export const ROLE_LABELS = Object.freeze({
  [USER_ROLES.PATIENT]: 'Patient',
  [USER_ROLES.REPRESENTATIVE]: 'Medical Representative',
  [USER_ROLES.ADMIN]: 'Admin',
})

export const ROLE_DASHBOARDS = Object.freeze({
  [USER_ROLES.PATIENT]: '/patient/dashboard',
  [USER_ROLES.REPRESENTATIVE]: '/mr/dashboard',
  [USER_ROLES.ADMIN]: '/admin',
})

export const AUTH_STORAGE_KEYS = Object.freeze({
  SESSION: 'mediroute.demo.session.v1',
  ACCOUNTS: 'mediroute.demo.accounts.v1',
})

// This public, shared passcode is only for the local frontend demo.
export const DEMO_PASSCODE = 'Demo1234!'

export const DEMO_ACCOUNTS = Object.freeze([
  Object.freeze({ id: 'demo-patient', fullName: 'Demo Patient', email: 'patient@mediroute.demo', role: USER_ROLES.PATIENT }),
  Object.freeze({ id: 'demo-representative', fullName: 'Demo Representative', email: 'representative@mediroute.demo', role: USER_ROLES.REPRESENTATIVE }),
  Object.freeze({ id: 'demo-admin', fullName: 'Demo Admin', email: 'admin@mediroute.demo', role: USER_ROLES.ADMIN }),
])

/** Navigation only. Browser role checks are not security controls. */
export function getDashboardPath(role) {
  return ROLE_DASHBOARDS[role] ?? '/'
}

export function canRoleAccessPath(role, pathname = '') {
  const path = pathname.replace(/\/$/, '') || '/'
  const allowedPrefixes = {
    [USER_ROLES.PATIENT]: ['/patient', '/appointments', '/tokens', '/consultation'],
    [USER_ROLES.REPRESENTATIVE]: ['/mr', '/appointments'],
    [USER_ROLES.ADMIN]: ['/admin', '/queue'],
  }
  return (allowedPrefixes[role] ?? []).some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
