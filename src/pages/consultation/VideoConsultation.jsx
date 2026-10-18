import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, CalendarDays, Camera, CameraOff, CheckCircle2, Clock3, Mic, MicOff, ShieldAlert, Stethoscope, Video, VideoOff } from 'lucide-react'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { endDemoConsultation, getConsultationForAppointment, isVideoConsultationEligible, listEligibleConsultationAppointments, startDemoConsultation } from '../../services/consultationDemoService.js'
import { getAppointmentById } from '../../services/appointmentDemoService.js'

function formatAppointmentDate(value) {
  if (!value) return 'Date not provided'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? 'Date not provided' : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}

function formatDuration(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function mediaErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'Camera or microphone permission was denied. Allow access in your browser settings and try again.'
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return 'No compatible camera or microphone was found on this device.'
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return 'The camera or microphone is already in use or could not be started.'
  return 'The local camera preview could not start. Check device availability and browser permissions.'
}

export default function VideoConsultation() {
  const { appointmentId } = useParams()
  const { user } = useAuth()
  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const mountedRef = useRef(true)
  const sessionActiveRef = useRef(false)
  const mediaRequestRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [appointment, setAppointment] = useState(null)
  const [eligibleAppointments, setEligibleAppointments] = useState([])
  const [session, setSession] = useState(null)
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [mediaMessage, setMediaMessage] = useState('Camera and microphone stay off until you explicitly request a local preview.')
  const [hasMedia, setHasMedia] = useState(false)
  const [hasVideoTrack, setHasVideoTrack] = useState(false)
  const [hasAudioTrack, setHasAudioTrack] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setLoading(true)
    setError('')
    if (!user?.id) {
      sessionActiveRef.current = false
      setAppointment(null); setSession(null); setEligibleAppointments([]); setLoading(false)
      return
    }
    if (!appointmentId) {
      sessionActiveRef.current = false
      setAppointment(null); setSession(null)
      setEligibleAppointments(listEligibleConsultationAppointments(user.id))
      setLoading(false)
      return
    }
    const record = getAppointmentById(appointmentId, user.id)
    setAppointment(record)
    setEligibleAppointments([])
    const existingSession = record ? getConsultationForAppointment(appointmentId, user.id) : null
    setSession(existingSession)
    sessionActiveRef.current = existingSession?.status === 'active'
    setJoined(false)
    setLoading(false)
  }, [appointmentId, user?.id])

  useEffect(() => {
    if (session?.status !== 'active') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [session?.status, session?.startedAt])

  useEffect(() => { sessionActiveRef.current = session?.status === 'active' }, [session?.status])

  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) videoRef.current.srcObject = mediaStreamRef.current
  }, [hasMedia, joined, cameraEnabled])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      sessionActiveRef.current = false
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [])

  const appointmentIsEligible = isVideoConsultationEligible(appointment)
  const providerName = appointment?.doctor?.name ?? appointment?.doctorName ?? appointment?.hospital?.name ?? appointment?.hospitalName ?? 'Provider not listed'
  const hospitalName = appointment?.hospital?.name ?? appointment?.hospitalName ?? 'Not provided'
  const startedAt = Date.parse(session?.startedAt ?? '')
  const elapsedSeconds = session?.status === 'active' && !Number.isNaN(startedAt)
    ? Math.max(0, Math.floor((now - startedAt) / 1000))
    : session?.durationSeconds ?? 0

  const startSession = () => {
    if (busy || !appointment) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = startDemoConsultation(appointment.id, user)
      setSession(result.session)
      sessionActiveRef.current = true
      setJoined(true)
      setNotice(result.persisted ? 'Demo session started in this browser. No remote participant is connected.' : 'Demo session started for this tab only because browser storage is unavailable.')
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'The demo consultation could not start.')
    } finally { setBusy(false) }
  }

  const joinSession = () => {
    setJoined(true)
    setNotice('You opened the active demo session on this device. This does not connect a doctor or another participant.')
    setError('')
  }

  const enableLocalPreview = async () => {
    if (mediaRequestRef.current || session?.status !== 'active' || !joined) return
    mediaRequestRef.current = true
    setError('')
    setMediaMessage('Requesting local camera and microphone access…')
    const getMedia = navigator.mediaDevices?.getUserMedia
    if (typeof getMedia !== 'function') {
      setMediaMessage('This browser does not provide camera and microphone access. The demo session can continue without a preview.')
      setError('Media devices are unavailable in this browser or connection.')
      mediaRequestRef.current = false
      return
    }
    try {
      const stream = await getMedia.call(navigator.mediaDevices, { video: true, audio: true })
      if (!mountedRef.current || !sessionActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        if (mountedRef.current) setMediaMessage('The demo session ended before camera permission completed. No local preview was started.')
        return
      }
      if (!stream.getTracks().length) throw new Error('No media tracks were returned.')
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = stream
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      setHasMedia(videoTracks.length + audioTracks.length > 0); setHasVideoTrack(videoTracks.length > 0); setHasAudioTrack(audioTracks.length > 0)
      setCameraEnabled(videoTracks.some((track) => track.enabled)); setMicrophoneEnabled(audioTracks.some((track) => track.enabled))
      setMediaMessage('Local preview only. Your video and audio are not sent to a doctor or any external service.')
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (mediaError) {
      setHasMedia(false); setHasVideoTrack(false); setHasAudioTrack(false); setCameraEnabled(false); setMicrophoneEnabled(false)
      setMediaMessage('No local preview is active. You can continue the demo session without camera or microphone access.')
      setError(mediaErrorMessage(mediaError))
    } finally { mediaRequestRef.current = false }
  }

  const toggleMicrophone = () => {
    const next = !microphoneEnabled
    mediaStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = next })
    setMicrophoneEnabled(next)
  }

  const toggleCamera = () => {
    const next = !cameraEnabled
    mediaStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = next })
    setCameraEnabled(next)
  }

  const stopLocalMedia = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setHasMedia(false); setHasVideoTrack(false); setHasAudioTrack(false); setCameraEnabled(false); setMicrophoneEnabled(false)
    setMediaMessage('Camera and microphone are off.')
  }

  const endSession = () => {
    if (!session || session.status !== 'active' || busy) return
    setBusy(true); setError(''); sessionActiveRef.current = false
    try {
      stopLocalMedia()
      const result = endDemoConsultation(session.id, user?.id)
      setSession(result.session); setJoined(false)
      setNotice(result.persisted ? 'Demo session ended and added to your consultation history.' : 'Demo session ended for this tab and added to its in-memory history.')
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'The demo session could not end.')
    } finally { setBusy(false) }
  }

  if (loading) return <main className="patient-dashboard-page consultation-page"><p className="consultation-empty" role="status">Loading consultation details…</p></main>

  return (
    <main className="patient-dashboard-page consultation-page">
      <div className="patient-dashboard-shell">
        <Sidebar role="patient" title="Consultations" />
        <div className="patient-dashboard-content">
          <header className="patient-welcome consultation-welcome">
            <div><span className="eyebrow">VIDEO VISIT · DEMO</span><h1>{appointmentId ? 'Video consultation' : 'Choose a consultation'}</h1><p>Review an eligible online appointment and start a local demo session.</p></div>
            <Link className="button button-outline" to="/consultation/history"><Activity size={16} aria-hidden="true" /> Consultation history</Link>
          </header>
          <p className="consultation-demo-banner"><strong>DEMO ONLY:</strong> This page does not connect to a doctor or another participant. Local media preview stays on this device and is never transmitted.</p>

          {!appointmentId ? (
            <section className="consultation-select-panel" aria-labelledby="eligible-appointments-title">
              <div className="patient-section-heading"><div><span className="eyebrow">ONLINE APPOINTMENTS</span><h2 id="eligible-appointments-title">Eligible appointments</h2></div></div>
              {eligibleAppointments.length ? <div className="consultation-appointment-list">{eligibleAppointments.map((item) => <article className="consultation-appointment-card" key={item.id}>
                <div><span className="eyebrow">{item.reference ?? item.id}</span><h3>{item.doctor?.name ?? item.doctorName ?? item.hospital?.name ?? 'Provider not listed'}</h3><p>{item.hospital?.name ?? 'Hospital not listed'} · {formatAppointmentDate(item.date)} · {item.time ?? 'Time not provided'}</p></div>
                <Link className="button button-primary" to={`/consultation/${encodeURIComponent(item.reference ?? item.id)}`}>Open consultation</Link>
              </article>)}</div> : <div className="consultation-empty"><CalendarDays size={25} aria-hidden="true"/><h2>No eligible online appointments</h2><p>Book an upcoming appointment with consultation type Online. Only appointments belonging to your demo account are listed.</p><Link className="button button-outline" to="/appointments/book">Book an appointment</Link></div>}
            </section>
          ) : !appointment ? (
            <section className="consultation-empty" role="alert"><ShieldAlert size={25} aria-hidden="true"/><h2>Appointment not found</h2><p>This appointment is not available to your demo account. Check the link or return to your appointments.</p><Link className="button button-primary" to="/appointments"><ArrowLeft size={16} aria-hidden="true"/> My appointments</Link></section>
          ) : !appointmentIsEligible && !session ? (
            <section className="consultation-empty"><ShieldAlert size={25} aria-hidden="true"/><h2>No eligible video consultation</h2><p>This appointment may be in-person, cancelled, completed, or in the past. Choose an upcoming online appointment linked to your demo account.</p><Link className="button button-primary" to={`/appointments/${encodeURIComponent(appointment.reference ?? appointment.id)}`}>View appointment details</Link></section>
          ) : (
            <div className="consultation-workspace">
              <section className="consultation-appointment-summary" aria-labelledby="selected-appointment-title">
                <span className="eyebrow">SELECTED APPOINTMENT · DEMO</span><h2 id="selected-appointment-title">{appointment.reference ?? appointment.id}</h2>
                <dl className="consultation-details">
                  <div><dt><Stethoscope size={15} aria-hidden="true"/> Provider</dt><dd>{providerName}</dd></div>
                  <div><dt>Hospital or clinic</dt><dd>{hospitalName}</dd></div>
                  <div><dt><CalendarDays size={15} aria-hidden="true"/> Appointment</dt><dd>{formatAppointmentDate(appointment.date)} · {appointment.time ?? 'Time not provided'}</dd></div>
                  <div><dt>Patient</dt><dd>{user?.fullName || 'Signed-in demo patient'}</dd></div>
                  <div><dt>Consultation type</dt><dd>Online · DEMO</dd></div>
                  <div><dt>Appointment status</dt><dd>{appointment.status ?? 'Not provided'}</dd></div>
                  <div><dt>Consultation status</dt><dd><span className={`consultation-status status-${session?.status ?? 'ready'}`}>{session?.status === 'active' ? 'Active demo session' : session?.status === 'ended' ? 'Ended' : 'Ready'}</span></dd></div>
                  {session && <div><dt><Clock3 size={15} aria-hidden="true"/> Duration</dt><dd>{formatDuration(elapsedSeconds)}{session.status === 'active' ? ' · running' : ''}</dd></div>}
                </dl>
                {error && <p className="consultation-feedback error" role="alert">{error}</p>}
                {notice && <p className="consultation-feedback" role="status">{notice}</p>}
                <div className="consultation-actions">
                  {!session && <button className="button button-primary" type="button" onClick={startSession} disabled={busy}><Video size={17} aria-hidden="true"/> {busy ? 'Starting…' : 'Start Consultation'}</button>}
                  {session?.status === 'active' && !joined && <button className="button button-primary" type="button" onClick={joinSession}><Video size={17} aria-hidden="true"/> Join Consultation</button>}
                  {session?.status === 'active' && <button className="button button-danger" type="button" onClick={endSession} disabled={busy}><CheckCircle2 size={17} aria-hidden="true"/> {busy ? 'Ending…' : 'End Consultation'}</button>}
                  {session?.status === 'ended' && <Link className="button button-outline" to="/consultation/history">View consultation history</Link>}
                  <Link className="button button-outline" to={`/appointments/${encodeURIComponent(appointment.reference ?? appointment.id)}`}>Appointment details</Link>
                </div>
              </section>

              <section className="consultation-media-panel" aria-labelledby="local-preview-title">
                <div className="consultation-media-heading"><span className="consultation-video-icon"><Video size={19} aria-hidden="true"/></span><div><span className="eyebrow">LOCAL DEVICE</span><h2 id="local-preview-title">Camera preview</h2></div></div>
                <div className={`consultation-video-stage${cameraEnabled ? ' has-video' : ''}`}>
                  {hasMedia && hasVideoTrack && cameraEnabled && joined ? <video ref={videoRef} autoPlay playsInline muted aria-label="Local camera preview for this demo session"/> : <div className="consultation-video-placeholder"><CameraOff size={31} aria-hidden="true"/><strong>{!hasVideoTrack && hasMedia ? 'No camera track is available' : hasMedia ? 'Camera preview is paused' : 'No video preview'}</strong><span>There is no remote video feed in this demo.</span></div>}
                  <span className="consultation-local-badge">LOCAL PREVIEW</span>
                </div>
                <p className="consultation-media-message" role="status">{mediaMessage}</p>
                {session?.status === 'active' && joined && <div className="consultation-media-controls">
                  {!hasMedia ? <button className="button button-outline" type="button" onClick={enableLocalPreview}><Camera size={16} aria-hidden="true"/> Enable camera and microphone</button> : <>
                    {hasAudioTrack && <button className="button button-outline" type="button" onClick={toggleMicrophone} aria-pressed={!microphoneEnabled} aria-label={microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}>{microphoneEnabled ? <Mic size={16} aria-hidden="true"/> : <MicOff size={16} aria-hidden="true"/>}{microphoneEnabled ? 'Mute mic' : 'Unmute mic'}</button>}
                    {hasVideoTrack && <button className="button button-outline" type="button" onClick={toggleCamera} aria-pressed={!cameraEnabled} aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>{cameraEnabled ? <Video size={16} aria-hidden="true"/> : <VideoOff size={16} aria-hidden="true"/>}{cameraEnabled ? 'Turn camera off' : 'Turn camera on'}</button>}
                    <span className="consultation-track-status"><Mic size={14} aria-hidden="true"/> Mic {hasAudioTrack ? microphoneEnabled ? 'on' : 'muted' : 'unavailable'} · <Camera size={14} aria-hidden="true"/> Camera {hasVideoTrack ? cameraEnabled ? 'on' : 'off' : 'unavailable'}</span>
                    {(!hasVideoTrack || !hasAudioTrack) && <button className="button button-outline" type="button" onClick={enableLocalPreview}>Retry media access</button>}
                  </>}
                </div>}
                {session?.status !== 'active' && <p className="consultation-media-hint"><Activity size={15} aria-hidden="true"/> Start a demo session before enabling local preview. No media permission is requested on page load.</p>}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
