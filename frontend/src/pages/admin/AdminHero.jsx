import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const EMPTY_SLIDE = {
  order: 0,
  image_url: '',
  headline: '',
  subtext: '',
  cta_text: '',
  cta_link: '',
  active: true,
}

export default function AdminHero() {
  const [slides, setSlides] = useState([])
  const [editing, setEditing] = useState(null) // slide being edited, or null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const data = await api.heroSlidesAdmin()
      setSlides(data.sort((a, b) => a.order - b.order))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSave(slide) {
    setError('')
    try {
      if (slide.id) {
        await api.updateHeroSlide(slide.id, slide)
      } else {
        await api.createHeroSlide({ ...slide, order: slides.length })
      }
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta imagen del banner?')) return
    try {
      await api.deleteHeroSlide(id)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Banner principal</p>
          <h1 style={{ fontSize: '1.6rem', marginTop: 6 }}>Imágenes y texto del inicio</h1>
        </div>
        <button className="btn-primary" onClick={() => setEditing(EMPTY_SLIDE)}>
          + Agregar imagen
        </button>
      </div>

      {error && <p style={{ color: '#b3261e', marginTop: 16 }}>{error}</p>}

      {loading ? (
        <p style={{ marginTop: 24 }}>Cargando…</p>
      ) : slides.length === 0 ? (
        <p style={{ marginTop: 24 }}>Todavía no hay imágenes. Agrega la primera arriba.</p>
      ) : (
        <div style={{ marginTop: 28, display: 'grid', gap: 16 }}>
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="card"
              style={{ display: 'flex', gap: 20, padding: 16, alignItems: 'center' }}
            >
              <div
                style={{
                  width: 140,
                  height: 90,
                  borderRadius: 10,
                  background: 'var(--cream-deep)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {slide.image_url && (
                  <img src={slide.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500 }}>{slide.headline || '(sin texto)'}</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.75 }}>{slide.subtext}</p>
                {!slide.active && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clay-deep)' }}>Oculto en el sitio</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(slide)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
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

      {editing && (
        <SlideEditorModal
          slide={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function SlideEditorModal({ slide, onCancel, onSave }) {
  const [form, setForm] = useState(slide)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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
      }}
    >
      <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-card)', padding: 32, width: 460 }}>
        <h2 style={{ fontSize: '1.2rem' }}>{slide.id ? 'Editar imagen' : 'Nueva imagen del banner'}</h2>

        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          <label style={labelStyle}>
            URL de la imagen
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https://…"
              style={inputStyle}
            />
            <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
              Subida de archivos directa se agrega junto con las fotos reales.
            </span>
          </label>

          <label style={labelStyle}>
            Texto principal
            <input type="text" value={form.headline} onChange={(e) => update('headline', e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Subtexto
            <input type="text" value={form.subtext} onChange={(e) => update('subtext', e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Texto del botón
            <input type="text" value={form.cta_text} onChange={(e) => update('cta_text', e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Enlace del botón
            <input type="text" value={form.cta_link} onChange={(e) => update('cta_link', e.target.value)} placeholder="/clases" style={inputStyle} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
            Visible en el sitio
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 26 }}>
          <button onClick={onCancel} className="btn-outline">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
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
}
