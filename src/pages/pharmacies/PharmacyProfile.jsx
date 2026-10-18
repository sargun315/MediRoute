import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock3, MapPin, Pill } from 'lucide-react'
import { findPharmacy } from '../../services/directoryDemoData.js'

function validDirectionsUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null } catch { return null }
}

export default function PharmacyProfile() {
  const { id } = useParams(); const pharmacy = findPharmacy(id)
  if (!pharmacy) return <main className="directory-page"><section className="directory-not-found"><h1>Pharmacy listing not found</h1><p>This sample listing may have been removed or the link may be incorrect.</p><Link className="button button-primary" to="/pharmacies"><ArrowLeft size={16}/> Back to pharmacies</Link></section></main>
  const directionsUrl = validDirectionsUrl(pharmacy.directionsUrl)
  return <main className="directory-page"><article className="provider-profile"><Link className="back-link" to="/pharmacies"><ArrowLeft size={16}/> Back to pharmacies</Link><header className="provider-profile-heading"><span className="profile-provider-icon"><Pill size={25}/></span><div><span className="eyebrow">SAMPLE PHARMACY PROFILE</span><h1>{pharmacy.name}</h1><p><MapPin size={15}/>{pharmacy.location || 'Location not provided'}</p></div></header><p className="directory-demo-note">Fictional sample information. This listing does not show medicine stock or provide prescription services.</p><dl className="provider-profile-details"><div><dt>Address</dt><dd>{pharmacy.address || 'Not provided'}</dd></div><div><dt>Location</dt><dd>{pharmacy.city || pharmacy.location || 'Not provided'}</dd></div><div><dt>Contact (demo)</dt><dd>{pharmacy.contact || 'Not provided'}</dd></div><div><dt><Clock3 size={14}/> Opening hours (sample)</dt><dd>{pharmacy.openingHours || 'Not provided'}</dd></div></dl>{directionsUrl && <p className="provider-profile-actions"><a className="button button-outline" href={directionsUrl} target="_blank" rel="noreferrer">Open directions</a></p>}</article></main>
}
