import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const EMPTY_PRODUCT = {
  type: 'physical',
  name: '',
  description: '',
  price: 0,
  currency: 'USD',
  images: [],
  active: true,
  stock: 0,
  digital_file_url: '',
}

const TYPE_LABELS = {
  physical: 'Físico',
  digital: 'Digital',
  course: 'Curso',
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function refresh() {
    setLoading(true)
    try {
      const data = await api.productsAdmin()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSave(product) {
    setError('')
    try {
      // Send only the fields relevant to the chosen type, so we don't
      // persist stray stock/file values from switching type mid-edit.
      const payload = {
        type: product.type,
        name: product.name,
        description: product.description,
        price: Number(product.price) || 0,
        currency: product.currency || 'USD',
        images: product.images,
        active: product.active,
        stock: product.type === 'physical' ? Number(product.stock) || 0 : null,
        digital_file_url: product.type === 'digital' ? product.digital_file_url : null,
      }
      if (product.id) {
        await api.updateProduct(product.id, payload)
      } else {
        await api.createProduct(payload)
      }
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    try {
      await api.deleteProduct(id)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const visibleProducts = filter === 'all' ? products : products.filter((p) => p.type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Productos</p>
          <h1 style={{ fontSize: '1.6rem', marginTop: 6 }}>Tienda</h1>
        </div>
        <button className="btn-primary" onClick={() => setEditing(EMPTY_PRODUCT)}>
          + Agregar producto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        {['all', 'physical', 'digital', 'course'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: '1px solid var(--border-soft)',
              background: filter === t ? 'var(--ink-navy)' : 'transparent',
              color: filter === t ? '#fff' : 'var(--text-body)',
              fontSize: '0.85rem',
            }}
          >
            {t === 'all' ? 'Todos' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#b3261e', marginTop: 16 }}>{error}</p>}

      {loading ? (
        <p style={{ marginTop: 24 }}>Cargando…</p>
      ) : visibleProducts.length === 0 ? (
        <p style={{ marginTop: 24 }}>No hay productos en esta categoría todavía.</p>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
          {visibleProducts.map((product) => (
            <div key={product.id} className="card" style={{ display: 'flex', gap: 18, padding: 16, alignItems: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  background: 'var(--cream-deep)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  color: 'var(--text-body)',
                }}
              >
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  'Sin foto'
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <p style={{ fontWeight: 500 }}>{product.name || '(sin nombre)'}</p>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 10px',
                      borderRadius: 999,
                      background: 'var(--cream-deep)',
                      color: 'var(--clay-deep)',
                    }}
                  >
                    {TYPE_LABELS[product.type]}
                  </span>
                  {!product.active && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--clay-deep)' }}>Oculto</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: 4 }}>
                  {product.currency} {Number(product.price).toFixed(2)}
                  {product.type === 'physical' && ` · Stock: ${product.stock ?? 0}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(product)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    borderRadius: 999,
                    border: '1.5px solid #b3261e',
                    color: '#b3261e',
                    background: 'transparent',
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ProductEditorModal product={editing} onCancel={() => setEditing(null)} onSave={handleSave} />}
    </div>
  )
}

function ProductEditorModal({ product, onCancel, onSave }) {
  const [form, setForm] = useState({ ...product, images: product.images?.length ? product.images : [''] })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateImage(index, value) {
    setForm((f) => {
      const images = [...f.images]
      images[index] = value
      return { ...f, images }
    })
  }

  function addImageField() {
    setForm((f) => ({ ...f, images: [...f.images, ''] }))
  }

  function handleSubmit() {
    onSave({ ...form, images: form.images.filter((i) => i.trim() !== '') })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43,29,20,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--cream)',
          borderRadius: 'var(--radius-card)',
          padding: 32,
          width: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.2rem' }}>{product.id ? 'Editar producto' : 'Nuevo producto'}</h2>

        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          <label style={labelStyle}>
            Tipo de producto
            <select value={form.type} onChange={(e) => update('type', e.target.value)} style={inputStyle}>
              <option value="physical">Físico</option>
              <option value="digital">Digital (descargable)</option>
              <option value="course">Curso</option>
            </select>
          </label>

          <label style={labelStyle}>
            Nombre
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              style={{ ...inputStyle, fontWeight: 400, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Precio
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Moneda
              <input type="text" value={form.currency} onChange={(e) => update('currency', e.target.value)} style={inputStyle} />
            </label>
          </div>

          {form.type === 'physical' && (
            <label style={labelStyle}>
              Existencias (stock)
              <input type="number" min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} style={inputStyle} />
            </label>
          )}

          {form.type === 'digital' && (
            <label style={labelStyle}>
              Enlace de descarga (PDF, patrón, etc.)
              <input
                type="text"
                value={form.digital_file_url || ''}
                onChange={(e) => update('digital_file_url', e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                Subida directa de archivos y entrega automática tras la compra se agregan en la Fase 4/5.
              </span>
            </label>
          )}

          {form.type === 'course' && (
            <p style={{ fontSize: '0.85rem', background: 'var(--cream-deep)', padding: 12, borderRadius: 8 }}>
              Este producto se crea como contenedor del curso. La gestión de lecciones, videos y
              materiales se agrega en la Fase 3.
            </p>
          )}

          <div>
            <p style={labelStyle}>Imágenes (URLs)</p>
            {form.images.map((img, i) => (
              <input
                key={i}
                type="text"
                value={img}
                onChange={(e) => updateImage(i, e.target.value)}
                placeholder="https://…"
                style={{ ...inputStyle, marginBottom: 8 }}
              />
            ))}
            <button
              type="button"
              onClick={addImageField}
              style={{ background: 'none', border: 'none', color: 'var(--clay-deep)', fontSize: '0.85rem', padding: 0 }}
            >
              + Agregar otra imagen
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
            Visible en la tienda
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 26 }}>
          <button onClick={onCancel} className="btn-outline">Cancelar</button>
          <button onClick={handleSubmit} className="btn-primary">Guardar</button>
        </div>
      </div>
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
