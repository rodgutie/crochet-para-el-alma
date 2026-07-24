import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, uploadLessonVideo } from '../../api/client'
import MediaUpload from '../../components/MediaUpload'

const EMPTY_LESSON = { title: '', duration_seconds: '', attachments: [] }

const STATUS_BADGE = {
  none:       { label: 'Sin video',     bg: 'var(--cream-deep)',  color: 'var(--text-body)' },
  processing: { label: 'Procesando…',  bg: '#fff3cd',            color: '#856404' },
  ready:      { label: 'Video listo',   bg: '#d1e7dd',            color: '#0a3622' },
  error:      { label: 'Error',         bg: '#f8d7da',            color: '#58151c' },
}

export default function AdminLessons() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)

  async function refresh() {
    setLoading(true)
    try {
      setLessons(await api.lessonsAdmin(productId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [productId])

  async function handleSave(lesson) {
    setError('')
    try {
      const payload = {
        order: lesson.order ?? 0,
        title: lesson.title,
        attachments: lesson.attachments,
        duration_seconds: lesson.duration_seconds ? Number(lesson.duration_seconds) : null,
      }
      if (lesson.id) {
        await api.updateLesson(productId, lesson.id, payload)
      } else {
        await api.createLesson(productId, payload)
      }
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(lessonId) {
    if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return
    try {
      await api.deleteLesson(productId, lessonId)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function move(index, direction) {
    const updated = [...lessons]
    const target = index + direction
    if (target < 0 || target >= updated.length) return
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    setLessons(updated)
    try {
      await api.reorderLessons(productId, updated.map((l) => l.id))
    } catch (err) {
      setError(err.message)
      refresh()
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/productos')}
        style={{ background: 'none', border: 'none', color: 'var(--clay-deep)', fontSize: '0.85rem', padding: 0, marginBottom: 16 }}
      >
        ← Volver a Productos
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Lecciones del curso</p>
          <h1 style={{ fontSize: '1.6rem', marginTop: 6 }}>Gestionar lecciones</h1>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...EMPTY_LESSON, order: lessons.length })}>
          + Agregar lección
        </button>
      </div>

      {error && <p style={{ color: '#b3261e', marginTop: 16 }}>{error}</p>}

      {loading ? (
        <p style={{ marginTop: 24 }}>Cargando…</p>
      ) : lessons.length === 0 ? (
        <p style={{ marginTop: 24 }}>Este curso no tiene lecciones todavía.</p>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={index}
              total={lessons.length}
              productId={productId}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onEdit={() => setEditing(lesson)}
              onDelete={() => handleDelete(lesson.id)}
              onUploadDone={refresh}
              onError={setError}
            />
          ))}
        </div>
      )}

      {editing && (
        <LessonEditorModal
          lesson={editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual lesson row (handles its own upload state)
// ---------------------------------------------------------------------------

function LessonRow({ lesson, index, total, productId, onMoveUp, onMoveDown, onEdit, onDelete, onUploadDone, onError }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const badge = STATUS_BADGE[lesson.video_status] || STATUS_BADGE.none

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadLessonVideo(productId, lesson.id, file)
      onUploadDone()
    } catch (err) {
      onError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="card" style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'center' }}>
      {/* Reorder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button onClick={onMoveUp}  disabled={index === 0}           style={arrowBtn} title="Subir">▲</button>
        <button onClick={onMoveDown} disabled={index === total - 1}  style={arrowBtn} title="Bajar">▼</button>
      </div>

      {/* Number */}
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink-navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
        {index + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <p style={{ fontWeight: 500 }}>{lesson.title || '(sin título)'}</p>
          <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <p style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 3 }}>
          {lesson.duration_seconds ? `${Math.floor(lesson.duration_seconds / 60)} min` : 'Duración sin definir'}
          {lesson.attachments?.length > 0 ? ` · ${lesson.attachments.length} adjunto(s)` : ''}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || lesson.video_status === 'processing'}
          className="btn-outline"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          title="Subir video"
        >
          {uploading ? 'Subiendo…' : lesson.video_status === 'processing' ? 'Procesando…' : '↑ Video'}
        </button>
        <button onClick={onEdit} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
          Editar
        </button>
        <button
          onClick={onDelete}
          style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 999, border: '1.5px solid #b3261e', color: '#b3261e', background: 'transparent' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit modal (title, duration, attachments — no video_key field)
// ---------------------------------------------------------------------------

function LessonEditorModal({ lesson, onCancel, onSave }) {
  const [form, setForm] = useState({
    ...lesson,
    attachments: lesson.attachments?.length ? lesson.attachments : [''],
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateAttachment(index, value) {
    setForm((f) => {
      const attachments = [...f.attachments]
      attachments[index] = value
      return { ...f, attachments }
    })
  }

  function handleSubmit() {
    onSave({ ...form, attachments: form.attachments.filter((a) => a.trim() !== '') })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(43,29,20,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-card)', padding: 32, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem' }}>{lesson.id ? 'Editar lección' : 'Nueva lección'}</h2>

        <div style={{ marginTop: 20, display: 'grid', gap: 14 }}>
          <label style={labelStyle}>
            Título de la lección
            <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Duración (segundos)
            <input
              type="number"
              min="0"
              value={form.duration_seconds || ''}
              onChange={(e) => update('duration_seconds', e.target.value)}
              placeholder="ej. 720 = 12 min"
              style={inputStyle}
            />
          </label>

          <div>
            <p style={labelStyle}>Adjuntos (PDFs / materiales de la lección)</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {form.attachments.map((att, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--cream-deep)', borderRadius: 10 }}>
                  <p style={{ fontSize: '0.78rem', opacity: 0.6, marginBottom: 8 }}>Adjunto {i + 1}</p>
                  <MediaUpload
                    value={att}
                    onChange={(url) => updateAttachment(i, url)}
                    folder="attachments"
                    accept=".pdf,.doc,.docx,.zip,.pptx"
                    label="Subir PDF / material"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, attachments: [...f.attachments, ''] }))}
              style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--clay-deep)', fontSize: '0.85rem', padding: 0 }}
            >
              + Agregar adjunto
            </button>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: '0.82rem', opacity: 0.65 }}>
          Para subir el video, guarda la lección y usa el botón "↑ Video" en la lista.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
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
const arrowBtn = {
  background: 'none',
  border: '1px solid var(--border-soft)',
  borderRadius: 4,
  padding: '1px 6px',
  fontSize: '0.65rem',
  color: 'var(--text-body)',
  cursor: 'pointer',
}
