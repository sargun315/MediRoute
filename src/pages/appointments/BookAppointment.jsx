import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeCheck, CalendarDays, Clock3, Hospital, Stethoscope } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { demoDoctors, demoHospitals, findDoctor, findHospital } from '../../services/directoryDemoData.js'
import { createAppointment } from '../../services/appointmentDemoService.js'

const timeSlots = ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM']
function localToday() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

export default function BookAppointment() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const initialDoctor = findDoctor(params.get('doctorId'))
  const initialHospital = initialDoctor ? findHospital(initialDoctor.hospitalId) : findHospital(params.get('hospitalId'))
  const [doctorId, setDoctorId] = useState(initialDoctor?.id ?? '')
  const [hospitalId, setHospitalId] = useState(initialHospital?.id ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [consultationType, setConsultationType] = useState('In-person')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [booking, setBooking] = useState(null)
  const [storageNotice, setStorageNotice] = useState('')
  const doctor = useMemo(() => findDoctor(doctorId), [doctorId])
  const hospital = useMemo(() => findHospital(hospitalId), [hospitalId])

  const validate = () => {
    const next = {}
    if (!doctor && !hospital) next.provider = 'Choose a doctor or a hospital/clinic.'
    if (doctorId && !doctor) next.doctor = 'Choose a valid sample doctor.'
    if (hospitalId && !hospital) next.hospital = 'Choose a valid sample hospital.'
    if (!date) next.date = 'Choose an appointment date.'
    else if (date < localToday()) next.date = 'Past appointment dates are not available.'
    if (!time || !timeSlots.includes(time)) next.time = 'Choose one of the sample time slots.'
    if (!['In-person', 'Online'].includes(consultationType)) next.consultationType = 'Choose a consultation type.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitting || !validate()) return
    setSubmitting(true); setMessage('')
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180))
      const result = createAppointment({ doctor, hospital, date, time, consultationType }, user)
      setBooking(result.appointment)
      setStorageNotice(result.persisted ? '' : 'Browser storage is unavailable. This demo booking may not remain after refresh.')
      setReason('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The demo appointment could not be saved.')
    } finally { setSubmitting(false) }
  }

  const changeDoctor = (event) => {
    const nextDoctor = findDoctor(event.target.value)
    setDoctorId(nextDoctor?.id ?? '')
    if (nextDoctor) setHospitalId(findHospital(nextDoctor.hospitalId)?.id ?? '')
    setErrors((current) => ({ ...current, doctor: undefined, provider: undefined }))
  }

  if (booking) return <main className="appointment-page"><section className="appointment-confirmation" aria-labelledby="booking-success-title"><span className="appointment-success-icon"><BadgeCheck size={27}/></span><span className="eyebrow">DEMO BOOKING CREATED</span><h1 id="booking-success-title">Your demo appointment is saved</h1><p>This is a frontend demo record only. It does not contact a clinic or confirm a real appointment.</p><dl className="appointment-confirm-details"><div><dt>Appointment ID</dt><dd>{booking.reference}</dd></div><div><dt>Doctor</dt><dd>{booking.doctor?.name ?? 'Not selected'}</dd></div><div><dt>Hospital or clinic</dt><dd>{booking.hospital?.name ?? 'Not provided'}</dd></div><div><dt>Date and time</dt><dd>{booking.date} · {booking.time}</dd></div><div><dt>Consultation type</dt><dd>{booking.consultationType}</dd></div><div><dt>Booking status</dt><dd><span className="appointment-demo-status">DEMO · {booking.status}</span></dd></div></dl>{storageNotice && <p className="appointment-feedback error" role="status">{storageNotice}</p>}<div className="appointment-actions"><Link className="button button-primary" to={`/appointments/${encodeURIComponent(booking.reference)}`}>View appointment</Link><Link className="button button-outline" to="/appointments">My appointments</Link><Link className="appointment-text-link" to="/patient/dashboard">Patient dashboard</Link></div></section></main>

  return <main className="appointment-page"><div className="appointment-shell"><header className="appointment-page-heading"><span className="eyebrow">PATIENT SERVICES · DEMO</span><h1>Book an appointment</h1><p>Submit a sample appointment request using the fictional provider directory.</p></header><p className="appointment-demo-note" role="note">Demo only: sample time slots are not live availability. Submitting does not reserve a real appointment.</p>
    <div className="appointment-form-layout"><form className="appointment-form-card" onSubmit={submit} noValidate>
      <fieldset className="appointment-fieldset"><legend><Stethoscope size={17}/> Choose a provider</legend><div className="appointment-fields-grid">
        <div className="appointment-field"><label htmlFor="booking-doctor">Doctor <span>(optional if hospital is selected)</span></label><select id="booking-doctor" value={doctorId} onChange={changeDoctor}><option value="">Choose a sample doctor</option>{demoDoctors.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.specialization}</option>)}</select>{errors.doctor && <span className="appointment-field-error" role="alert">{errors.doctor}</span>}</div>
        <div className="appointment-field"><label htmlFor="booking-hospital">Hospital or clinic <span>(optional if doctor is selected)</span></label><select id="booking-hospital" value={hospitalId} onChange={(event) => { const nextHospital = findHospital(event.target.value); setHospitalId(nextHospital?.id ?? ''); if (nextHospital && doctor?.hospitalId !== nextHospital.id) setDoctorId(''); setErrors((current) => ({ ...current, hospital: undefined, provider: undefined })) }}><option value="">Choose a sample hospital/clinic</option>{demoHospitals.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}</select>{errors.hospital && <span className="appointment-field-error" role="alert">{errors.hospital}</span>}</div>
      </div>{errors.provider && <p className="appointment-field-error" role="alert">{errors.provider}</p>}</fieldset>
      {(doctor || hospital) && <section className="appointment-selected-provider" aria-live="polite"><h2><Hospital size={17}/> Selected sample provider</h2><p><strong>{doctor?.name ?? hospital?.name}</strong>{doctor && ` · ${doctor.specialization}`}</p><p>{hospital?.name ?? doctor?.hospital ?? 'Hospital not listed'} · {doctor?.location ?? hospital?.location ?? 'Location not provided'}</p>{doctor?.consultationFee && <p>Consultation fee: {doctor.consultationFee} (demo)</p>}</section>}
      <fieldset className="appointment-fieldset"><legend><CalendarDays size={17}/> Appointment details</legend><div className="appointment-fields-grid"><div className="appointment-field"><label htmlFor="booking-date">Date</label><input id="booking-date" type="date" value={date} min={localToday()} onChange={(event) => { setDate(event.target.value); setErrors((current) => ({ ...current, date: undefined })) }} required aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'booking-date-error' : undefined}/>{errors.date && <span id="booking-date-error" className="appointment-field-error" role="alert">{errors.date}</span>}</div>
        <div className="appointment-field"><label htmlFor="booking-time">Available time slot <span>(sample)</span></label><select id="booking-time" value={time} onChange={(event) => { setTime(event.target.value); setErrors((current) => ({ ...current, time: undefined })) }} required aria-invalid={Boolean(errors.time)}><option value="">Choose a sample time</option>{timeSlots.map((slot) => <option key={slot}>{slot}</option>)}</select>{errors.time && <span className="appointment-field-error" role="alert">{errors.time}</span>}</div>
        <div className="appointment-field"><label htmlFor="booking-type">Consultation type</label><select id="booking-type" value={consultationType} onChange={(event) => setConsultationType(event.target.value)}><option>In-person</option><option>Online</option></select></div>
        <div className="appointment-field appointment-field-full"><label htmlFor="booking-reason">Reason for visit <span>(optional; not stored)</span></label><textarea id="booking-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} rows={3} placeholder="Do not include private or sensitive medical details."/><small>This demo does not save the reason you enter.</small></div>
      </div></fieldset>
      {message && <p className="appointment-feedback error" role="alert">{message}</p>}
      <button className="button button-primary appointment-submit" type="submit" disabled={submitting}>{submitting ? <><span className="appointment-spinner" aria-hidden="true"/> Saving demo booking…</> : <><CalendarDays size={16}/> Create demo booking</>}</button>
    </form><aside className="appointment-side-note"><Clock3 size={22}/><h2>Before you submit</h2><p>Provider details, time slots, fees, and availability are sample content. Please contact a provider directly for current information.</p><Link to="/doctors">Browse sample doctors</Link><Link to="/hospitals">Browse sample hospitals</Link></aside></div>
  </div></main>
}
