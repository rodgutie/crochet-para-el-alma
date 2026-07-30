import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MEMBERSHIP_URL = 'https://klouser.app/group/crochet-para-el-alma'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/clases', label: 'Clases' },
  { to: '/blog', label: 'Blog' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="container nav-container">
        <Link to="/" className="font-display nav-brand">
          Crochet <span style={{ fontStyle: 'normal' }}>para el Alma</span>
        </Link>

        {/* Desktop nav — hidden below 768px via CSS */}
        <nav className="nav-links">
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

        {/* Desktop actions — hidden below 768px via CSS */}
        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/mi-cuenta" style={{ fontSize: '0.9rem' }}>
                Hola, {user.name.split(' ')[0]}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/hero" style={{ fontSize: '0.9rem' }}>
                  Panel de administración
                </Link>
              )}
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

        {/* Hamburger — visible below 768px via CSS */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              style={({ isActive }) => ({
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
            onClick={closeMenu}
          >
            Membresía
          </a>
          {user ? (
            <>
              <Link to="/mi-cuenta" onClick={closeMenu}>
                Hola, {user.name.split(' ')[0]}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/hero" onClick={closeMenu}>
                  Panel de administración
                </Link>
              )}
              <button
                className="nav-mobile-btn"
                onClick={() => { logout(); closeMenu() }}
              >
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu}>
              Entrar
            </Link>
          )}
          <Link to="/tienda" onClick={closeMenu}>
            🛍 Carrito
          </Link>
        </div>
      )}
    </header>
  )
}
