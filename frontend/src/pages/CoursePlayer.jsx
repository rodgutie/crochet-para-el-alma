import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { api, lessonStreamUrl } from '../api/client'

export default function CoursePlayer() {
  const { id: productId } = useParams()
  const navigate = useNavigate()

  const videoRef = useRef(null)
  const hlsRef  = useRef(null)

  const [product,        setProduct]        = useState(null)
  const [lessons,        setLessons]        = useState([])
  const [activeLesson,   setActiveLesson]   = useState(null)
  const [loadingMeta,    setLoadingMeta]    = useState(true)
  const [videoError,     setVideoError]     = useState('')

  // Load course metadata + lesson list
  useEffect(() => {
    async function load() {
      try {
        const [prod, lsns] = await Promise.all([
          api.product(productId),
          api.lessons(productId),
        ])
        setProduct(prod)
        setLessons(lsns)
        if (lsns.length > 0) setActiveLesson(lsns[0])
      } catch (err) {
        setVideoError(err.message)
      } finally {
        setLoadingMeta(false)
      }
    }
    load()
  }, [productId])

  // Mount / switch HLS player whenever activeLesson changes
  useEffect(() => {
    if (!activeLesson || !videoRef.current) return

    setVideoError('')

    const videoEl = videoRef.current
    const streamUrl = lessonStreamUrl(productId, activeLesson.id)

    // Destroy previous hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          const msg = data.response?.code === 403
            ? 'No tienes acceso a este curso.'
            : data.response?.code === 503
            ? 'El video todavía se está procesando — inténtalo en unos minutos.'
            : 'No se pudo cargar el video.'
          setVideoError(msg)
        }
      })

      hls.loadSource(streamUrl)
      hls.attachMedia(videoEl)
      hls.on(Hls.Events.MANIFEST_PARSED, () => videoEl.play().catch(() => {}))
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari: native HLS support
      videoEl.src = streamUrl
      videoEl.play().catch(() => {})
    } else {
      setVideoError('Tu navegador no soporta reproducción HLS.')
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [activeLesson, productId])

  if (loadingMeta) {
    return <div className="container section"><p>Cargando curso…</p></div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 72px)', background: '#111' }}>

      {/* ── Main panel: video + meta ── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Video */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            controls
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {videoError && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: 24, textAlign: 'center' }}>
              <p>{videoError}</p>
            </div>
          )}
        </div>

        {/* Lesson info */}
        <div style={{ padding: '24px 32px', background: '#1a1a1a', color: '#fff', flex: 1 }}>
          <button
            onClick={() => navigate('/mi-cuenta')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', padding: 0, marginBottom: 16, cursor: 'pointer' }}
          >
            ← Mis cursos
          </button>

          <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', marginBottom: 6 }}>
            {product?.name}
          </p>
          <h1 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-display)' }}>
            {activeLesson?.title || 'Selecciona una lección'}
          </h1>

          {activeLesson?.duration_seconds && (
            <p style={{ marginTop: 6, fontSize: '0.85rem', opacity: 0.6 }}>
              {Math.floor(activeLesson.duration_seconds / 60)} minutos
            </p>
          )}

          {/* Attachments */}
          {activeLesson?.attachments?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Materiales
              </p>
              {activeLesson.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginBottom: 8, fontSize: '0.88rem', color: 'var(--clay)', textDecoration: 'underline' }}
                >
                  Descargar material {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar: lesson list ── */}
      <div style={{ background: '#1e1e1e', borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
            Lecciones · {lessons.length}
          </p>
        </div>

        {lessons.length === 0 && (
          <p style={{ padding: 20, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
            Este curso aún no tiene lecciones.
          </p>
        )}

        {lessons.map((lesson, i) => {
          const isActive = lesson.id === activeLesson?.id
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLesson(lesson)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: isActive ? 'rgba(201,124,80,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--clay)' : '3px solid transparent',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: '0.72rem', color: isActive ? 'var(--clay)' : 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                {i + 1}
              </p>
              <p style={{ fontSize: '0.88rem', color: isActive ? '#fff' : 'rgba(255,255,255,0.75)', fontWeight: isActive ? 500 : 400, lineHeight: 1.4 }}>
                {lesson.title}
              </p>
              {lesson.duration_seconds && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                  {Math.floor(lesson.duration_seconds / 60)} min
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
