import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

export default function MiCuenta() {
  const { user } = useAuth()
  const [entitlements, setEntitlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.myEntitlements()
      .then(setEntitlements)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const courses  = entitlements.filter((e) => e.product_type === 'course')
  const digitals = entitlements.filter((e) => e.product_type === 'digital')

  return (
    <section className="section container">
      <p className="eyebrow">Mi cuenta</p>
      <h1 style={{ fontSize: '1.8rem', marginTop: 8 }}>Hola, {user?.name}</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>{user?.email}</p>

      {error && <p style={{ color: '#b3261e', marginTop: 16 }}>{error}</p>}

      {/* --- Courses --- */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 20 }}>Mis cursos</h2>
        {loading ? (
          <p>Cargando…</p>
        ) : courses.length === 0 ? (
          <p style={{ fontSize: '0.92rem', opacity: 0.75 }}>
            Todavía no tienes ningún curso.{' '}
            <Link to="/tienda" style={{ color: 'var(--clay-deep)' }}>Ver la tienda →</Link>
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {courses.map((e) => (
              <Link
                key={e.id}
                to={`/mi-cuenta/cursos/${e.product_id}`}
                style={{ display: 'block', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(43,29,20,0.08)', textDecoration: 'none' }}
              >
                <div
                  style={{
                    height: 140,
                    background: 'var(--cream-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {e.product_images?.[0]
                    ? <img src={e.product_images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sin imagen</span>
                  }
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink-navy)' }}>{e.product_name}</p>
                  {e.product_description && (
                    <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {e.product_description}
                    </p>
                  )}
                  <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--clay-deep)', fontWeight: 500 }}>
                    Ir al curso →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* --- Digital files --- */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 20 }}>Mis archivos digitales</h2>
        {loading ? (
          <p>Cargando…</p>
        ) : digitals.length === 0 ? (
          <p style={{ fontSize: '0.92rem', opacity: 0.75 }}>
            Todavía no tienes archivos descargables.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {digitals.map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(43,29,20,0.07)' }}>
                <p style={{ fontWeight: 500 }}>{e.product_name}</p>
                <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>
                  Descarga disponible en la Fase 5
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
