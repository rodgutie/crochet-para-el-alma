import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

const kenBurnsStyle = `
@keyframes kenBurns {
  from { transform: scale(1); }
  to   { transform: scale(1.08); }
}
`

const FOCAL_POSITION = {
  top: 'center top',
  center: 'center center',
  bottom: 'center bottom',
}

/**
 * Full-bleed hero carousel, driven entirely by the /api/hero slides
 * the admin dashboard manages. Falls back to a friendly empty state
 * if no slides exist yet (e.g. right after setup, before photos are added).
 */
export default function HeroCarousel({ slides = [], loading = false }) {
  const [index, setIndex] = useState(0)

  const goTo = useCallback(
    (i) => {
      if (slides.length === 0) return
      setIndex((i + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => goTo(index + 1), 6000)
    return () => clearInterval(timer)
  }, [index, slides.length, goTo])

  if (loading) {
    return (
      <section
        className="hero-section"
        style={{ background: 'var(--espresso)' }}
      />
    )
  }

  if (slides.length === 0) {
    return (
      <section
        style={{
          background: 'var(--cream-deep)',
          minHeight: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
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

  const slide = slides[index]
  const objectPosition = FOCAL_POSITION[slide.focal_point] || 'center center'

  return (
    <section
      className="hero-section"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--espresso)',
      }}
    >
      <style>{kenBurnsStyle}</style>
      <img
        key={`hero-img-${index}`}
        src={slide.image_url}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          opacity: 0.85,
          animation: 'kenBurns 9s ease-in-out forwards',
          transformOrigin: objectPosition,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'linear-gradient(180deg, rgba(43,29,20,0.15), rgba(43,29,20,0.45))',
        }}
      />

      <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '0 24px', maxWidth: 780 }}>
        <h1
          className="font-display"
          style={{ color: '#fff', fontSize: 'clamp(1.35rem, 5vw, 2.75rem)', lineHeight: 1.3 }}
        >
          {slide.headline}
        </h1>
        {slide.subtext && (
          <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8, fontSize: 'clamp(0.85rem, 3vw, 1.05rem)' }}>{slide.subtext}</p>
        )}
        {slide.cta_text && (
          <Link to={slide.cta_link || '#'} className="btn-primary" style={{ marginTop: 26, display: 'inline-block' }}>
            {slide.cta_text}
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Anterior"
            style={carouselArrowStyle('left')}
          >
            ‹
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Siguiente"
            style={carouselArrowStyle('right')}
          >
            ›
          </button>

          <div style={{ position: 'absolute', bottom: 22, display: 'flex', gap: 8, left: '50%', transform: 'translateX(-50%)' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                style={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.2s ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function carouselArrowStyle(side) {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 20,
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.85)',
    color: 'var(--espresso)',
    fontSize: '1.4rem',
    lineHeight: '40px',
    textAlign: 'center',
    padding: 0,
  }
}
