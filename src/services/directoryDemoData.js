// Fictional sample records for directory UI development. Replace this module
// with an API service when a verified provider data source is available.
export const demoHospitals = [
  { id: 'demo-community-clinic', name: 'Demo Community Clinic', city: 'Demo City', location: 'Demo City', address: 'Demo address for interface testing', contact: 'Demo contact only', departments: ['General services (demo)'], facilities: ['Sample reception area'], openingHours: 'Sample hours; confirm directly', directionsUrl: null },
  { id: 'sample-hospital-1', name: 'Sample Community Hospital', city: 'Sample City', location: 'Sample City', address: '100 Example Road, Sample City (sample address)', contact: '000-000-0101 (demo)', departments: ['General Medicine', 'Cardiology', 'Pediatrics'], facilities: ['Reception desk (sample)', 'Accessible entrance (sample)'], openingHours: 'Hours vary; confirm with the provider (sample)', directionsUrl: null },
  { id: 'sample-hospital-2', name: 'Demo Care Hospital', city: 'Example Town', location: 'Example Town', address: '25 Placeholder Avenue, Example Town (sample address)', contact: '000-000-0102 (demo)', departments: ['Orthopedics', 'Dermatology', 'General Medicine'], facilities: ['Waiting area (sample)', 'Parking area (sample)'], openingHours: 'Hours vary; confirm with the provider (sample)', directionsUrl: null },
]

export const demoDoctors = [
  { id: 'sample-doctor-1', name: 'Dr. Sample One (demo)', specialization: 'General Medicine', qualification: 'Sample qualification (demo)', experience: 'Sample experience (demo)', hospitalId: 'sample-hospital-1', hospital: 'Sample Community Hospital', city: 'Sample City', location: 'Sample City', consultationFee: 'Demo fee: 450', availability: 'Availability to be confirmed (sample)' },
  { id: 'sample-doctor-2', name: 'Dr. Sample Two (demo)', specialization: 'Cardiology', qualification: 'Sample qualification (demo)', experience: 'Sample experience (demo)', hospitalId: 'sample-hospital-1', hospital: 'Sample Community Hospital', city: 'Sample City', location: 'Sample City', consultationFee: 'Demo fee: 600', availability: 'Availability to be confirmed (sample)' },
  { id: 'sample-doctor-3', name: 'Dr. Example Three (demo)', specialization: 'Orthopedics', qualification: 'Sample qualification (demo)', experience: 'Sample experience (demo)', hospitalId: 'sample-hospital-2', hospital: 'Demo Care Hospital', city: 'Example Town', location: 'Example Town', consultationFee: 'Demo fee: 500', availability: 'Availability to be confirmed (sample)' },
]

export const demoPharmacies = [
  { id: 'sample-pharmacy-1', name: 'Sample Community Pharmacy', city: 'Sample City', location: 'Sample City', address: '12 Example Street, Sample City (sample address)', contact: '000-000-0201 (demo)', openingHours: 'Hours vary; confirm directly (sample)', directionsUrl: null },
  { id: 'sample-pharmacy-2', name: 'Demo Care Pharmacy', city: 'Example Town', location: 'Example Town', address: '8 Placeholder Lane, Example Town (sample address)', contact: '000-000-0202 (demo)', openingHours: 'Hours vary; confirm directly (sample)', directionsUrl: null },
]

export const findDoctor = (id) => demoDoctors.find((item) => item.id === id) ?? null
export const findHospital = (id) => demoHospitals.find((item) => item.id === id) ?? null
export const findPharmacy = (id) => demoPharmacies.find((item) => item.id === id) ?? null
