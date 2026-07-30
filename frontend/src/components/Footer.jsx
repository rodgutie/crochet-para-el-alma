import { Link } from 'react-router-dom'

const MEMBERSHIP_URL = 'https://klouser.app/group/crochet-para-el-alma'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--espresso)', color: 'var(--parchment)', padding: '64px 0 24px' }}>
      <div
        className="container"
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40 }}
      >
        <div>
          <h3 className="font-display" style={{ color: 'var(--parchment)', fontSize: '1.3rem', marginBottom: 12 }}>
            Crochet <span style={{ fontStyle: 'italic' }}>para el Alma</span>
          </h3>
          <p style={{ maxWidth: 320, fontSize: '0.9rem', opacity: 0.85 }}>
            Tejer como práctica meditativa. Un espacio creado por Mónica Guzmán para reconectar
            con la calma, una puntada a la vez.
          </p>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 14 }}>EXPLORA</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10, fontSize: '0.9rem' }}>
            <li><Link to="/tienda">Tienda</Link></li>
            <li><a href={MEMBERSHIP_URL} target="_blank" rel="noopener noreferrer">Membresía</a></li>
            <li><Link to="/clases">Clases</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', opacity: 0.7, marginBottom: 14 }}>CONECTA</p>
          <div style={{ display: 'flex', gap: 14, fontSize: '1.1rem' }}>
            <a href="#" aria-label="Instagram">◯</a>
            <a href="#" aria-label="Correo">✉</a>
          </div>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: '1px solid rgba(234,217,194,0.15)',
          marginTop: 40,
          paddingTop: 20,
          fontSize: '0.8rem',
          opacity: 0.6,
        }}
      >
        © {new Date().getFullYear()} Crochet para el Alma · Hecho con amor y lana
      </div>
    </footer>
  )
}
