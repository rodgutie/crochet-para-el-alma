import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/admin/hero', label: 'Banner principal' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/accesos', label: 'Accesos' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="font-display admin-sidebar-title">
          Panel · Crochet para el Alma
        </p>
        <nav className="admin-sidebar-nav">
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

        <div className="admin-sidebar-footer">
          <p>{user?.email}</p>
          <button onClick={handleLogout} className="admin-logout-btn">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
