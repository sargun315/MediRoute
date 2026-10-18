import { useId } from 'react'
import { Printer, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const isSafeReference = (value) => /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)

export default function QRCodeDisplay({ tokenReference, tokenNumber, tokenId, token, title = 'Your queue token', className = '' }) {
  const id = useId().replace(/:/g, '')
  const referenceValue = tokenReference ?? token?.reference
  const reference = typeof referenceValue === 'string' ? referenceValue.trim() : ''
  const number = tokenNumber ?? token?.tokenNumber
  const internalId = tokenId ?? token?.id
  const valid = isSafeReference(reference)
  const qrSvgId = `token-qr-${id}`

  const download = () => {
    const svg = document.getElementById(qrSvgId)
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeName = String(number ?? 'token').replace(/[^A-Za-z0-9_-]/g, '-')
    anchor.href = url
    anchor.download = `${safeName}-qr.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className={`qr-display-card ${className}`.trim()} aria-labelledby={`qr-title-${id}`}>
      <div className="qr-print-area">
        <span className="data-card-icon"><QrCode size={20} aria-hidden="true" /></span>
        <h2 id={`qr-title-${id}`}>{title}</h2>
        {valid ? (
          <>
            <div className="qr-code-frame"><QRCodeSVG id={qrSvgId} value={`MR-TOKEN:${reference}`} size={196} level="M" marginSize={2} title={`QR code for token ${number ?? reference}`} /></div>
            {number && <p className="qr-reference">Token number: <strong>{number}</strong></p>}
            {internalId && <p className="qr-reference">Token ID: <strong>{internalId}</strong></p>}
            <p className="qr-reference">Token reference: <strong>{reference}</strong></p>
            <p className="helper-text">This code contains only the token reference. Token validation needs the MediRoute backend.</p>
          </>
        ) : <p className="inline-message" role="status">Enter a token reference using letters, numbers, hyphens, or underscores to show its QR code.</p>}
      </div>
      {valid && <div className="qr-display-actions no-print"><button className="button button-outline" type="button" onClick={download}><QrCode size={16} aria-hidden="true" /> Download QR (SVG)</button><button className="button button-outline" type="button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print QR code</button></div>}
    </section>
  )
}
