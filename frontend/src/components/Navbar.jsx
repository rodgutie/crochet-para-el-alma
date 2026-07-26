import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MEMBERSHIP_URL = 'https://klouser.app/group/7386/p/46265'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/clases', label: 'Clases' },
  { to: '/blog', label: 'Blog' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--cream)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76 }}
      >
        <Link to="/" className="font-display" style={{ fontSize: '1.35rem', fontStyle: 'italic' }}>
          Crochet <span style={{ fontStyle: 'normal' }}>para el Alma</span>
        </Link>

        <nav style={{ display: 'flex', gap: 28 }} className="nav-links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                fontSize: '0.9rem',
                color: isActive ? 'var(--clay-deep)' : 'var(--text-body)',
                fontWeight: isActive ? 500 : 400,
              })}
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={MEMBERSHIP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.9rem', color: 'var(--text-body)', fontWeight: 400 }}
          >
            Membresía
          </a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {user ? (
            <>
              <Link to="/mi-cuenta" style={{ fontSize: '0.9rem' }}>
                Hola, {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--text-body)' }}
              >
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Entrar
            </Link>
          )}
          <Link to="/tienda" aria-label="Carrito" style={{ fontSize: '1.1rem' }}>
            🛍
          </Link>
        </div>
      </div>
    </header>
  )
}
