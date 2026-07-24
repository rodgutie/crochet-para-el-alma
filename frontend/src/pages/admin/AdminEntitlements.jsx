import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export default function AdminEntitlements() {
  const [entitlements, setEntitlements] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ user_id: '', product_id: '' })
  const [saving, setSaving] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [ents, usrs, prods] = await Promise.all([
        api.entitlements(),
        api.usersAdmin(),
        api.productsAdmin(),
      ])
      setEntitlements(ents)
      setUsers(usrs)
      // Only courses and digital products can have entitlements
      setProducts(prods.filter((p) => p.type === 'course' || p.type === 'digital'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleGrant(e) {
    e.preventDefault()
    if (!form.user_id || !form.product_id) return
    setSaving(true)
    setError('')
    try {
      await api.grantEntitlement(form)
      setForm({ user_id: '', product_id: '' })
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke(id) {
    if (!confirm('¿Revocar este acceso?')) return
    try {
      await api.revokeEntitlement(id)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const TYPE_LABELS = { course: 'Curso', digital: 'Digital' }

  return (
    <div>
      <p className="eyebrow">Accesos manuales</p>
      <h1 style={{ fontSize: '1.6rem', marginTop: 6, marginBottom: 4 }}>Dar acceso a producto</h1>
      <p style={{ fontSize: '0.87rem', opacity: 0.75, marginBottom: 28 }}>
        Asigna acceso a un curso o producto digital sin que el usuario pase por el checkout.
        En la Fase 4 esto se automotiza vía webhook de KelvIQ.
      </p>

      {/* Grant form */}
      <form onSubmit={handleGrant} style={{ display: 'grid', gap: 14, maxWidth: 480, background: 'var(--cream-deep)', padding: 24, borderRadius: 12 }}>
        <label style={labelStyle}>
          Usuario
          <select
            value={form.user_id}
            onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
            style={inputStyle}
            required
          >
            <option value="">— Seleccionar usuario —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Producto
          <select
            value={form.product_id}
            onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
            style={inputStyle}
            required
          >
            <option value="">— Seleccionar producto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{TYPE_LABELS[p.type]}] {p.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p style={{ color: '#b3261e', fontSize: '0.85rem' }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving} style={{ justifySelf: 'start' }}>
          {saving ? 'Guardando…' : 'Dar acceso'}
        </button>
      </form>

      {/* Entitlements list */}
      <h2 style={{ fontSize: '1.1rem', marginTop: 40, marginBottom: 16 }}>Accesos otorgados</h2>

      {loading ? (
        <p>Cargando…</p>
      ) : entitlements.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No hay accesos registrados todavía.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {entitlements.map((ent) => (
            <div
              key={ent.id}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}
            >
              <div>
                <p style={{ fontWeight: 500, fontSize: '0.92rem' }}>
                  {ent.user_name || ent.user_id}
                  <span style={{ opacity: 0.6, fontWeight: 400 }}> · {ent.user_email}</span>
                </p>
                <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 3 }}>
                  {ent.product_name || ent.product_id}
                  {ent.order_id ? ' · comprado' : ' · acceso manual'}
                  {' · '}
                  {new Date(ent.granted_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {!ent.order_id && (
                <button
                  onClick={() => handleRevoke(ent.id)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 999, border: '1.5px solid #b3261e', color: '#b3261e', background: 'transparent' }}
                >
                  Revocar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'grid', gap: 6, fontSize: '0.85rem', fontWeight: 500 }
const inputStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border-soft)',
  background: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: '0.92rem',
  fontWeight: 400,
  width: '100%',
}
