import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const FOCAL_Y = { top: 'top', center: 'center', bottom: 'bottom' }
const FOCAL_X = { left: 'left', center: 'center', right: 'right' }

const AUTOPLAY_MS = 7000
const SWIPE_PX = 40

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Editorial split hero. Text panel + arch-shaped image; the image side
 * alternates (or is forced per slide via `image_side`). Driven by the
 * /api/hero slides the admin dashboard manages.
 */
export default function HeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const touchStart = useRef(null)

  const count = slides.length

  const goTo = useCallback(
    (i) => {
      if (count === 0) return
      setIndex((i + count) % count)
    },
    [count]
  )

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [index, count, paused, reducedMotion])

  if (count === 0) {
    return (
      <section className="hero-empty">
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>Portada</p>
          <h1 style={{ fontSize: '2rem', maxWidth: 560, margin: '0 auto' }}>
            Todavía no hay imágenes en el banner principal
          </h1>
          <p style={{ marginTop: 12 }}>Agrega la primera desde el panel de administración.</p>
        </div>
      </section>
    )
  }

  const current = Math.min(index, count - 1)
  const slide = slides[current]
  const side =
    slide.image_side && slide.image_side !== 'auto' ? slide.image_side : current % 2 === 0 ? 'right' : 'left'
  const accent = slide.accent === 'navidad' ? ' hero2--navidad' : ''
  const objectPosition = `${FOCAL_X[slide.focal_x] || 'center'} ${FOCAL_Y[slide.focal_point] || 'center'}`
  const external = /^https?:\/\//i.test(slide.cta_link || '')

  function onTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(current + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      className={`hero2 hero2--img-${side}${accent}`}
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* key restarts Ken Burns + text stagger on every slide change */}
      <div className="hero2-slide" key={`slide-${current}`}>
        <div className="hero2-media">
          <div className="hero2-arch">
            <img src={slide.image_url} alt="" style={{ objectPosition, transformOrigin: objectPosition }} />
          </div>
        </div>

        <div className="hero2-text">
          {slide.eyebrow && (
            <p className="eyebrow hero2-eyebrow hero2-reveal" style={{ '--i': 0 }}>{slide.eyebrow}</p>
          )}
          <h1 className="font-display hero2-title hero2-reveal" style={{ '--i': 1 }}>{slide.headline}</h1>
          {slide.subtext && <p className="hero2-sub hero2-reveal" style={{ '--i': 2 }}>{slide.subtext}</p>}
          {slide.cta_text && (
            <div className="hero2-reveal hero2-cta-wrap" style={{ '--i': 3 }}>
              {external ? (
                <a href={slide.cta_link} target="_blank" rel="noopener noreferrer" className="btn-primary hero2-cta">
                  {slide.cta_text}
                </a>
              ) : (
                <Link to={slide.cta_link || '#'} className="btn-primary hero2-cta">
                  {slide.cta_text}
                </Link>
              )}
            </div>
          )}

          {count > 1 && (
            <div className="hero2-controls">
              <button className="hero2-arrow" onClick={() => goTo(current - 1)} aria-label="Anterior">‹</button>
              <div className="hero2-dots">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Ir a la diapositiva ${i + 1}`}
                    aria-current={i === current}
                    className={`hero2-dot${i === current ? ' is-active' : ''}`}
                  />
                ))}
              </div>
              <button className="hero2-arrow" onClick={() => goTo(current + 1)} aria-label="Siguiente">›</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
