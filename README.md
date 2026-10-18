# MediRoute

MediRoute is a React healthcare coordination **demo**. It demonstrates public provider directories, demo patient accounts, appointment booking, queue token references, and a local-only consultation preview. Provider and visit records are sample data; no hospital, pharmacy, doctor, or appointment is verified by a connected service.

## Technology and project layout

- React 19, React Router, and Vite 8
- Plain CSS, Lucide React icons, `html5-qrcode`, and `qrcode.react`
- The runnable Vite application and npm scripts are in `frontend/`.
- Shared application source is in the sibling `src/` directory. `frontend/vite.config.js` allows and resolves these imports without copying that source tree.

```text
MediRoute/
├── frontend/                 # Vite app, package.json, entry point, public assets
│   ├── src/main.jsx          # React root and shared stylesheet imports
│   └── vite.config.js        # React plugin, dependency aliases, shared-src access
├── src/
│   ├── components/           # Navbar, footer, cards, QR, chatbot, sidebar
│   ├── context/              # Demo authentication context
│   ├── pages/                # Public, patient, directory, appointment, token, consultation pages
│   ├── routes/               # Route table, demo role guards, placeholders
│   ├── services/             # Demo fixtures and browser-storage adapters
│   ├── styles/               # Global and responsive CSS
│   └── utils/                # Role and storage constants
└── README.md
```

## Requirements and setup

Use a Node.js version supported by Vite 8 (Node.js 20.19+ or 22.12+), then run commands from `frontend/`:

```powershell
cd MediRoute/frontend
npm ci
npm run dev
```

Vite prints the local URL. To create and serve a production build:

```powershell
npm run build
npm run preview
```

Available checks:

```powershell
npm run lint
npm run build
```

The repository has no backend and no configured API client. No environment variables are required to run the current demo. The existing root `.env.example` is empty. Do not put secret keys in `VITE_*` values: Vite exposes those values to browser code. A future backend URL can be configured as a public base URL, but it is not consumed by the current application.

## Features and implementation status

| Area | Current behavior | Data / status |
| --- | --- | --- |
| Home, About, Contact | Public pages; contact validates and reports a demo submission | Frontend only; no email delivery |
| Login, Register, Logout | Demo accounts, role selection, route redirects, profile/session restore | AuthContext and `localStorage`; not real authentication |
| Patient dashboard/profile | Demo account details, appointment/token counts, activity, profile editing | Sample fixtures plus browser demo records |
| Doctor, hospital, pharmacy directories | Search, filters, detail routes and sample records | `directoryDemoData.js`; not verified provider data |
| Appointments | Booking, list/search/filter, detail and eligible cancellation | `appointmentDemoService.js`; browser storage and fixtures |
| QR token and queue | Demo token generation, QR reference, scanner/manual lookup, queue status pages | `tokenDemoService.js`; browser storage and sample records; no live queue |
| Video consultation | Online appointment eligibility, local session history, optional local camera/mic preview | `consultationDemoService.js`; no remote participant or media transmission |
| Medical Representative | Routes are protected, but dashboard, doctor directory and visit history source files are empty; those routes show placeholders | Not implemented |
| Admin | Routes are protected, but dashboard and management source files are empty; those routes show placeholders | Not implemented |
| Navbar, Footer, Sidebar, Chatbot | Shared navigation, role-specific dashboard links, and static FAQ responses | Frontend only; chatbot is not an AI service |

The QR scanner requests camera access only after the user starts scanning. QR contents are looked up against available demo data; a real authorization decision must be made by the backend. The consultation preview is local to the browser. A real call needs signaling and WebRTC or a video provider.

## Demo accounts

The Login page displays the available sample accounts and shared demo passcode. Use those account choices for role-specific navigation. Registration creates a browser-local demo profile. The shared passcode is public demo behavior, not a credential and not suitable for deployment.

## Browser storage and privacy

The demo stores data under `mediroute.*` localStorage keys:

- Auth profile/session: account ID, name, email, role, and optional profile phone/city. Passwords are not saved.
- Appointment records: account ID, reference, provider, date/time, consultation type, and status. The optional visit-reason field is deliberately not persisted.
- Queue tokens: account ID, token reference/number, hospital, department, status, and timestamps.
- Consultation sessions: account ID, appointment reference, status, timestamps, and duration. Camera/audio recordings are not created or stored.

Names, contact details, appointment metadata, token metadata, and consultation metadata are still personal or potentially sensitive information. Browser storage is accessible to scripts running on the origin and is not an access-control boundary. Use fictional data only. Do not put real patient data in this demo. Frontend role checks and owner filters can be bypassed and are not production authorization.

## Backend readiness and production requirements

There is no backend in this workspace. `src/services/api.js` is empty and no page makes an HTTP API request. `axios`, `react-hook-form`, and `recharts` are declared but no source file imports them; the current pages use local form state and hand-built dashboard views. They were left in place during this audit to avoid changing dependency behavior outside the integration fixes. The Vite starter `frontend/src/App.css`, `frontend/src/index.css`, and React/Vite sample SVG assets are also unreferenced. The app must continue to be treated as a demo until the following are implemented and verified.

Proposed FastAPI endpoints (a future contract, not implemented or connected):

```text
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me

GET   /api/patients/me
PATCH /api/patients/me

GET   /api/doctors
GET   /api/doctors/{doctor_id}
GET   /api/hospitals
GET   /api/hospitals/{hospital_id}
GET   /api/pharmacies
GET   /api/pharmacies/{pharmacy_id}

POST  /api/appointments
GET   /api/appointments
GET   /api/appointments/{appointment_id}
PATCH /api/appointments/{appointment_id}/cancel

POST  /api/tokens
GET   /api/tokens/{token_id}
GET   /api/hospitals/{hospital_id}/queue
PATCH /api/tokens/{token_id}/status

GET   /api/mr/doctors
POST  /api/mr/visits
GET   /api/mr/visits

GET   /api/admin/dashboard
GET   /api/admin/users
GET   /api/admin/doctors
GET   /api/admin/hospitals
```

Consultation history and session lifecycle endpoints, plus an authenticated signaling channel, should be added when the real consultation service is designed. The endpoint list above is a proposal only; no API response or database connection is currently available.

Suggested PostgreSQL entities and relationships:

- `users` with normalized unique email, password hash, verified contact data and role assignments
- `patients` and `patient_profiles`, `doctors`, `hospitals`, `pharmacies`, plus provider/hospital and department association tables
- `appointments` referencing a patient and provider/hospital, with server-validated availability and status history
- `queue_tokens` referencing a patient, hospital and department, with unique references and audited status changes
- `consultation_sessions` referencing an appointment and participants, with lifecycle timestamps and provider/session identifiers (never persist media recordings by default)
- Audit events, consent records, notification delivery records, and appropriate foreign keys, constraints, indexes, and retention policies

Production work also requires server-side authentication and authorization on every protected request, secure password hashing, short-lived session/token handling, CSRF protections where applicable, rate limiting, input validation, TLS, secret management, audit logging, backups, privacy/retention controls, and security review. Never trust a role or patient ID supplied by the browser.

## Phase 11 audit and verification

Checks run from `frontend/` during the audit:

- `npm run build`: passed; 94 modules transformed. Vite reports that the initial JavaScript chunk is 879.07 kB (240.22 kB gzip), above its 500 kB advisory threshold. This warning is documented and was not suppressed.
- `npm run lint`: passed with no diagnostics.
- `npm ls --depth=0`: passed; installed top-level dependencies are present.
- No project test runner or test script is configured. Browser smoke checks were performed for public routes, role redirects, directory searches and detail states, patient profile editing, appointment booking/cancellation, token generation/lookup/queue status, contact form feedback, and chatbot FAQ behavior. These checks use demo records, not real services.
- Invalid provider/appointment/token route states and camera permission denial were checked. Camera denial was simulated; a physical camera and real QR scan were not verified. Registration route rendering was checked, but a complete registration flow was not part of the browser smoke run.
- Route smoke checks at desktop and mobile widths found no browser page/console errors or horizontal overflow in the checked pages. Tablet-specific visual review and real-device testing were not performed.

The detailed feature boundary remains: admin and Medical Representative pages are placeholders; remote video, email delivery, live hospital queue, and server-backed identity/booking are not implemented.

## Known limitations and roadmap

- The frontend is a prototype; all booking, account, queue and consultation state is local to one browser.
- Demo listings, fees, opening hours, contact details, queue position, and appointments are sample records, not verified availability.
- There is no real email delivery, notification, payments, live queue feed, remote video call, or server-side role enforcement.
- Admin and Medical Representative pages are placeholders because their existing page source files are empty.
- The build currently emits a large-chunk warning for the 879 kB initial JavaScript chunk. Route-level lazy loading moves page code and the 375 kB QR-scanner dependency into on-demand chunks. Source-map inspection traced much of the remaining initial chunk to `lucide-react`: the installed package directory contains the 1.2 MB CommonJS bundle but none of its advertised ESM `.mjs` files, so the bundler cannot tree-shake that package in this installation. Reinstalling/restoring the published ESM artifacts (or replacing the icon package after review) is needed to fully address the warning. The warning was not suppressed.

Recommended next development work is to agree on the backend contract and privacy/security requirements, implement the FastAPI/PostgreSQL service, then replace each demo adapter with authenticated API calls and integration tests. Do not expose real patient data before that work is complete.
