import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MOBILE_QUERY } from '../config/breakpoints'

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


/** True when the viewport is in the "Móvil" range. */
export function isMobileViewport() {
  return typeof window !== 'undefined' && !!window.matchMedia?.(MOBILE_QUERY).matches
}

/** Legacy slides without the flags count as visible on both devices. */
export function slideVisibleOn(slide, mobile) {
  return mobile ? slide.show_mobile !== false : slide.show_desktop !== false
}

/** Re-evaluates when the window crosses the mobile breakpoint (resize/rotate). */
export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileViewport)
  useEffect(() => {
    const mq = window.matchMedia?.(MOBILE_QUERY)
    if (!mq) return
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

/** Section class: image side (forced or alternating by position) + accent. */
export function heroSectionClass(slide, index) {
  const side =
    slide.image_side && slide.image_side !== 'auto' ? slide.image_side : index % 2 === 0 ? 'right' : 'left'
  const accent = slide.accent === 'navidad' ? ' hero2--navidad' : ''
  return `hero2 hero2--img-${side}${accent}`
}

/**
 * The slide itself (image arch + text). Shared by the live carousel and the
 * admin editor preview so both always render identically. `controls` is the
 * optional dots/arrows block, rendered inside the text panel.
 */
export function HeroSlide({ slide, controls = null }) {
  const objectPosition = `${FOCAL_X[slide.focal_x] || 'center'} ${FOCAL_Y[slide.focal_point] || 'center'}`
  const external = /^https?:\/\//i.test(slide.cta_link || '')
  const fit = slide.image_fit === 'contain' ? 'contain' : 'cover'
  const scale = Math.min(150, Math.max(50, Number(slide.image_scale) || 100))
  const archStyle = { '--hero-fit': fit, '--hero-scale': scale / 100 }

  return (
    <div className="hero2-slide">
      <div className="hero2-media">
        <div className="hero2-arch" style={archStyle}>
          {slide.image_url && (fit === 'contain' || scale < 100) && (
            <img src={slide.image_url} alt="" aria-hidden="true" className="hero2-arch-bg" />
          )}
          {slide.image_url && (
            <img
              src={slide.image_url}
              alt=""
              className="hero2-img"
              style={{ objectPosition, transformOrigin: objectPosition }}
            />
          )}
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
        {controls}
      </div>
    </div>
  )
}

/**
 * Editorial split hero. Text panel + arch-shaped image; the image side
 * alternates (or is forced per slide via `image_side`). Driven by the
 * /api/hero slides the admin dashboard manages.
 */
export default function HeroCarousel({ slides: allSlides = [] }) {
  const mobile = useIsMobile()
  const slides = useMemo(() => allSlides.filter((s) => slideVisibleOn(s, mobile)), [allSlides, mobile])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const touchStart = useRef(null)

  const count = slides.length

  // Back to the first slide whenever the device changes.
  useEffect(() => setIndex(0), [mobile])

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

  // No visible slides on this device: no hero at all.
  if (count === 0) return null

  const current = Math.min(index, count - 1)
  const slide = slides[current]

  const controls = (
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
  )

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
      className={heroSectionClass(slide, current)}
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
      <HeroSlide key={`slide-${current}`} slide={slide} controls={count > 1 ? controls : null} />
    </section>
  )
}
