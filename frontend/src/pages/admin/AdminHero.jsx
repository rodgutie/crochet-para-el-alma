import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import MediaUpload from '../../components/MediaUpload'
import SlidePreview from './SlidePreview'

const EMPTY_SLIDE = {
  order: 0,
  image_url: '',
  headline: '',
  subtext: '',
  cta_text: '',
  cta_link: '',
  active: true,
  focal_point: 'center',
  focal_x: 'center',
  eyebrow: '',
  image_side: 'auto',
  accent: 'none',
  show_desktop: true,
  show_mobile: true,
  image_fit: 'cover',
  image_scale: 100,
}

function deviceLabel(slide) {
  const d = slide.show_desktop !== false
  const m = slide.show_mobile !== false
  return d && m ? 'Ambos' : d ? 'Escritorio' : 'Móvil'
}

function sizeHint(form) {
  const d = form.show_desktop !== false
  const m = form.show_mobile !== false
  if (d && m) return 'Usa una imagen que se vea bien en ambos, o crea dos diapositivas, una para cada dispositivo'
  if (d) return 'Tamaño recomendado: 2400 × 1000 px (horizontal)'
  return 'Tamaño recomendado: 1080 × 1620 px (vertical)'
}

export default function AdminHero() {
  const [slides, setSlides] = useState([])
  const [editing, setEditing] = useState(null) // slide being edited, or null
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function refresh() {
    setLoading(true)
    try {
      const data = await api.heroSlidesAdmin()
      setSlides(data.sort((a, b) => a.order - b.order))
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSave(slide) {
    if (slide.id) {
      await api.updateHeroSlide(slide.id, slide)
    } else {
      await api.createHeroSlide({ ...slide, order: slides.length })
    }
    setEditing(null)
    refresh()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta imagen del banner?')) return
    try {
      await api.deleteHeroSlide(id)
      refresh()
    } catch (err) {
      setLoadError(err.message)
    }
  }

  const activeSlides = slides.filter((s) => s.active)
  const missing = []
  if (!activeSlides.some((s) => s.show_desktop !== false)) missing.push('Escritorio')
  if (!activeSlides.some((s) => s.show_mobile !== false)) missing.push('Móvil')

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

      {loadError && <p style={{ color: '#b3261e', marginTop: 16 }}>{loadError}</p>}

      {!loading && slides.length > 0 && missing.length > 0 && (
        <div
          role="alert"
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#fff4e0',
            border: '1px solid #e8c27a',
            color: '#6b4a00',
            fontSize: '0.88rem',
          }}
        >
          Atención: no hay ninguna diapositiva activa que se vea en {missing.join(' ni en ')}. En{' '}
          {missing.length > 1 ? 'esos dispositivos' : 'ese dispositivo'} no se mostrará el banner.
        </div>
      )}

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
                <p style={{ fontWeight: 500 }}>
                  {slide.headline || '(sin texto)'}
                  <span
                    style={{
                      marginLeft: 10,
                      padding: '2px 9px',
                      borderRadius: 999,
                      border: '1px solid var(--border-soft)',
                      background: 'var(--cream-deep)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      verticalAlign: 'middle',
                    }}
                  >
                    {deviceLabel(slide)}
                  </span>
                </p>
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
          position={editing.id ? Math.max(0, slides.findIndex((x) => x.id === editing.id)) : slides.length}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function SlideEditorModal({ slide, position, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_SLIDE, ...slide }))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function update(field, value) {
    setSaveError('')
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setSaveError('')
    if (!(form.image_url || '').trim()) {
      setSaveError('Falta la imagen: sube una o pega su URL.')
      return
    }
    if (!form.show_desktop && !form.show_mobile) {
      setSaveError('Selecciona al menos Móvil o Escritorio')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(43,29,20,0.45)',
        overflowY: 'auto',
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        className="slide-editor"
        style={{ background: 'var(--cream)', borderRadius: 'var(--radius-card)', margin: '0 auto' }}
      >
        <div className="slide-editor-form">
        <h2 style={{ fontSize: '1.2rem' }}>{slide.id ? 'Editar imagen' : 'Nueva imagen del banner'}</h2>

        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          <div style={labelStyle}>
            Imagen del banner
            <MediaUpload
              value={form.image_url}
              onChange={(url) => update('image_url', url)}
              folder="hero"
              label="Subir imagen"
              previewHeight={110}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 4 }}>
              <label style={checkStyle}>
                <input
                  type="checkbox"
                  checked={!!form.show_desktop}
                  onChange={(e) => update('show_desktop', e.target.checked)}
                />
                Mostrar en Escritorio
              </label>
              <label style={checkStyle}>
                <input
                  type="checkbox"
                  checked={!!form.show_mobile}
                  onChange={(e) => update('show_mobile', e.target.checked)}
                />
                Mostrar en Móvil
              </label>
            </div>
            {!form.show_desktop && !form.show_mobile ? (
              <p role="alert" style={{ color: '#b3261e', fontSize: '0.8rem', fontWeight: 400, margin: 0 }}>
                Selecciona al menos Móvil o Escritorio
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.8, margin: 0 }}>{sizeHint(form)}</p>
            )}
            <label style={{ ...labelStyle, marginTop: 6 }}>
              URL de imagen (alternativa)
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => update('image_url', e.target.value.trim())}
                placeholder="/images/hero-1.jpeg o https://..."
                style={inputStyle}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Ajuste de la imagen
            <select
              value={form.image_fit || 'cover'}
              onChange={(e) => update('image_fit', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="cover">Llenar (puede recortar)</option>
              <option value="contain">Mostrar completa (sin recortar)</option>
            </select>
          </label>

          <div style={labelStyle}>
            <label htmlFor="hero-image-scale">Tamaño de la imagen</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                id="hero-image-scale"
                type="range"
                min={50}
                max={150}
                step={1}
                value={form.image_scale ?? 100}
                onChange={(e) => update('image_scale', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 44, textAlign: 'right', fontWeight: 400 }}>{form.image_scale ?? 100}%</span>
              <button
                type="button"
                className="btn-outline"
                onClick={() => update('image_scale', 100)}
                disabled={(form.image_scale ?? 100) === 100}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Restablecer
              </button>
            </div>
          </div>

          <label style={labelStyle}>
            Posición de la imagen
            <select
              value={form.focal_point || 'center'}
              onChange={(e) => update('focal_point', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="top">Arriba</option>
              <option value="center">Centro</option>
              <option value="bottom">Abajo</option>
            </select>
          </label>

          <label style={labelStyle}>
            Posición horizontal de la imagen
            <select
              value={form.focal_x || 'center'}
              onChange={(e) => update('focal_x', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </label>

          <label style={labelStyle}>
            Lado de la imagen
            <select
              value={form.image_side || 'auto'}
              onChange={(e) => update('image_side', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="auto">Automático (alterna)</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
            </select>
          </label>

          <label style={labelStyle}>
            Estilo de color
            <select
              value={form.accent || 'none'}
              onChange={(e) => update('accent', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="none">Normal</option>
              <option value="navidad">Navidad (rojo y verde suaves)</option>
            </select>
          </label>

          <label style={labelStyle}>
            Etiqueta superior (eyebrow)
            <input type="text" value={form.eyebrow || ''} onChange={(e) => update('eyebrow', e.target.value)} placeholder="NAVIDAD 2026" style={inputStyle} />
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

        <div className="slide-editor-footer">
          {saveError && (
            <p role="alert" style={{ color: '#b3261e', fontSize: '0.85rem', margin: '0 0 10px' }}>{saveError}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onCancel} className="btn-outline" disabled={saving}>Cancelar</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
        </div>

        <div className="slide-editor-preview">
          <p className="eyebrow" style={{ marginBottom: 10 }}>Vista previa en el sitio</p>
          <SlidePreview slide={form} position={position} />
          <p style={{ fontSize: '0.78rem', marginTop: 10, opacity: 0.75 }}>
            Así se verá la diapositiva en la portada. Se actualiza mientras escribes.
          </p>
        </div>
      </div>
    </div>
  )
}

const checkStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 400 }
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
