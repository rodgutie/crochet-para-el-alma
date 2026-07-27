export default function Clases() {
  return (
    <section className="section container">
      <p className="eyebrow">Clases</p>
      <h1 style={{ fontSize: '2rem', marginTop: 8 }}>Clases presenciales y virtuales</h1>
      <p style={{ marginTop: 12, maxWidth: 560 }}>
        Aprende crochet a tu ritmo, en grupo o en sesiones personalizadas. Contáctame para compartirte información de horarios e inversión.
      </p>
      <a
        href="https://wa.me/50671084054"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 20,
          padding: '14px 30px',
          fontSize: '0.95rem',
          fontWeight: 500,
          color: '#fff',
          background: '#25D366',
          borderRadius: 'var(--radius-pill)',
          textDecoration: 'none',
        }}
      >
        💬 Escríbeme por WhatsApp
      </a>
    </section>
  )
}
