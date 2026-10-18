import { useEffect, useId, useRef, useState } from 'react'
import { Camera, CameraOff, ShieldAlert } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

const tokenPattern = /^MR-TOKEN:([A-Za-z0-9][A-Za-z0-9_-]{0,63})$/

function getCameraErrorMessage(error) {
  // html5-qrcode can reject with a string that includes the original browser
  // error instead of preserving the DOMException name.
  const details = `${error?.name ?? ''} ${error?.message ?? error ?? ''}`.toLowerCase()
  if (/notallowederror|permission denied|permission was denied/.test(details)) {
    return 'Camera permission was denied. Allow camera access in your browser and try again.'
  }
  if (/notfounderror|requested device not found|no camera/.test(details)) {
    return 'No camera was found on this device.'
  }
  if (/notreadableerror|could not start video source|device in use/.test(details)) {
    return 'The camera is unavailable or already in use. Close other camera apps and try again.'
  }
  if (/overconstrainederror|constraint/.test(details)) {
    return 'This device could not use the requested camera settings. Try another camera or device.'
  }
  return 'The camera could not start. Check browser permission and use a secure connection (HTTPS or localhost).'
}

export default function QRScanner({ onTokenScanned, className = '' }) {
  const regionId = `qr-reader-${useId().replace(/:/g, '')}`
  const scannerRef = useRef(null)
  const cameraStartedRef = useRef(false)
  const mountedRef = useRef(true)
  const callbackRef = useRef(onTokenScanned)
  const [starting, setStarting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('Camera access starts only after you press the button.')
  const [error, setError] = useState('')
  const [manualReference, setManualReference] = useState('')

  useEffect(() => {
    callbackRef.current = onTokenScanned
  }, [onTokenScanned])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const scanner = scannerRef.current
      if (!scanner) return
      scanner.stop().catch(() => {}).finally(() => {
        cameraStartedRef.current = false
        try { scanner.clear() } catch { /* Already cleared. */ }
      })
    }
  }, [])

  const stopCamera = async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    setStarting(false)
    setScanning(false)
    try {
      if (cameraStartedRef.current) await scanner.stop()
    } catch {
      // The camera may already have stopped after a successful scan.
    } finally {
      cameraStartedRef.current = false
      try { scanner.clear() } catch { /* The scanner container may already be cleared. */ }
      if (scannerRef.current === scanner) scannerRef.current = null
    }
  }

  const startCamera = async () => {
    if (starting || scanning) return
    setError('')
    setMessage('Requesting camera access…')
    setStarting(true)
    const scanner = new Html5Qrcode(regionId)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
        async (decodedText) => {
          if (!mountedRef.current) return
          const match = tokenPattern.exec(decodedText.trim())
          if (!match) {
            setError('This QR code is not a MediRoute token reference. Keep scanning or try another code.')
            return
          }
          setError('')
          setMessage(`Token reference ${match[1]} scanned. The backend must verify its status.`)
          callbackRef.current?.(match[1])
          await stopCamera()
        },
        () => {},
      )
      cameraStartedRef.current = true
      if (!mountedRef.current) {
        await scanner.stop().catch(() => {})
        try { scanner.clear() } catch { /* Component was removed during setup. */ }
        return
      }
      setStarting(false)
      setScanning(true)
      setMessage('Camera is active. Point it at a MediRoute token QR code.')
    } catch (scanError) {
      cameraStartedRef.current = false
      try { scanner.clear() } catch { /* Ignore incomplete scanner setup cleanup. */ }
      if (scannerRef.current === scanner) scannerRef.current = null
      if (!mountedRef.current) return
      setStarting(false)
      setScanning(false)
      setError(getCameraErrorMessage(scanError))
      setMessage('Camera is not active.')
    }
  }

  const submitManualReference = (event) => {
    event.preventDefault()
    const input = manualReference.trim()
    const qrMatch = tokenPattern.exec(input)
    const reference = qrMatch?.[1] ?? input
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(reference)) {
      setError('Enter a token ID or reference using letters, numbers, hyphens, or underscores.')
      setMessage('Manual lookup was not submitted.')
      return
    }
    setError('')
    setMessage(`Looking up demo token ${reference}…`)
    callbackRef.current?.(reference)
    if (scanning) void stopCamera()
  }

  return (
    <section className={`qr-scanner-card ${className}`.trim()} aria-label="QR token scanner">
      <div className="qr-scanner-header"><span className="data-card-icon"><Camera size={20} aria-hidden="true" /></span><div><h2>Scan a queue token</h2><p>Only MediRoute token references are accepted.</p></div></div>
      <div id={regionId} className="qr-reader-region" aria-live="polite" />
      <p className="scanner-message" role="status">{message}</p>
      {error && <p className="scanner-error" role="alert"><ShieldAlert size={16} aria-hidden="true" /> {error}</p>}
      <div className="card-actions">
        {!scanning ? <button className="button button-primary" type="button" onClick={startCamera} disabled={starting}><Camera size={16} aria-hidden="true" /> {starting ? 'Starting camera…' : 'Start camera'}</button> : <button className="button button-outline" type="button" onClick={stopCamera}><CameraOff size={16} aria-hidden="true" /> Stop camera</button>}
      </div>
      <form className="qr-manual-lookup" onSubmit={submitManualReference}>
        <label htmlFor={`${regionId}-manual`}>Manual token ID or reference</label>
        <div><input id={`${regionId}-manual`} value={manualReference} onChange={(event) => setManualReference(event.target.value)} autoComplete="off" maxLength={72} placeholder="Example: DEMO-TOKEN-001"/><button className="button button-outline" type="submit" disabled={!manualReference.trim()}>Look up</button></div>
      </form>
      <p className="helper-text">A successful scan returns a token reference only. A real token and queue status must be validated by the MediRoute backend.</p>
    </section>
  )
}
