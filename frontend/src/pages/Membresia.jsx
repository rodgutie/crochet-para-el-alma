import { useEffect } from 'react'

// Membership is handled by a third-party platform. This page redirects
// out rather than hosting membership content/checkout itself.
const MEMBERSHIP_EXTERNAL_URL = 'https://klouser.app/group/7386/p/46265'

export default function Membresia() {
  useEffect(() => {
    window.location.href = MEMBERSHIP_EXTERNAL_URL
  }, [])

  return (
    <section className="section container" style={{ textAlign: 'center' }}>
      <p>Redirigiendo a la membresía…</p>
      <a href={MEMBERSHIP_EXTERNAL_URL} className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
        Continuar
      </a>
    </section>
  )
}
