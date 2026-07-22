import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin/hero', label: 'Banner principal' },
  { to: '/admin/productos', label: 'Productos' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          background: 'var(--espresso)',
          color: 'var(--parchment)',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <p className="font-display" style={{ color: 'var(--parchment)', fontSize: '1.15rem', marginBottom: 32 }}>
          Panel · Crochet para el Alma
        </p>
        <nav style={{ display: 'grid', gap: 4 }}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.9rem',
                background: isActive ? 'rgba(234,217,194,0.12)' : 'transparent',
                color: isActive ? 'var(--parchment)' : 'rgba(234,217,194,0.7)',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: '0.85rem', opacity: 0.75 }}>
          <p>{user?.email}</p>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--parchment)', padding: 0, marginTop: 8, textDecoration: 'underline' }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, background: 'var(--cream)', padding: 40 }}>
        <Outlet />
      </main>
    </div>
  )
}
