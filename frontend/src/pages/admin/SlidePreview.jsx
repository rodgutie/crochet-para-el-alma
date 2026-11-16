import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HeroSlide, heroSectionClass } from '../../components/HeroCarousel'

// Virtual device viewports. The slide is rendered inside an iframe of this
// size (so the site's real CSS media queries apply) and then scaled to fit.
const DEVICES = {
  desktop: { label: 'Escritorio', w: 1280, h: 900 },
  mobile: { label: 'Móvil', w: 390, h: 844 },
}

const FRAME_HTML =
  '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'

// Show the final composition immediately (no entrance animations while typing).
const PREVIEW_OVERRIDES = `
  html, body { margin: 0; overflow: hidden; }
  .hero2-reveal { animation: none !important; opacity: 1 !important; transform: none !important; }
  .hero2-media, .hero2-arch img { animation: none !important; }
`

function cloneSiteStyles(doc) {
  doc.head.querySelectorAll('[data-site-style]').forEach((n) => n.remove())
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    const copy = node.cloneNode(true)
    copy.setAttribute('data-site-style', '')
    doc.head.appendChild(copy)
  })
  const extra = doc.createElement('style')
  extra.setAttribute('data-site-style', '')
  extra.textContent = PREVIEW_OVERRIDES
  doc.head.appendChild(extra)
}

/**
 * Live preview of a hero slide exactly as the homepage renders it (arch image,
 * text, button). `position` is the slide's index in the carousel, used to
 * resolve image_side "auto" (alternates by position).
 */
export default function SlidePreview({ slide, position = 0 }) {
  const [device, setDevice] = useState('desktop')
  const [mountNode, setMountNode] = useState(null)
  const [boxWidth, setBoxWidth] = useState(0)
  const [contentH, setContentH] = useState(0)
  const boxRef = useRef(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setBoxWidth(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = DEVICES[device]
  const maxHeight = device === 'mobile' ? 520 : Infinity
  const scale = boxWidth ? Math.min(boxWidth / w, maxHeight / h) : 0
  const shownWidth = w * scale
  // Crop to the hero's real height (it is shorter than the virtual viewport).
  const frameH = contentH ? Math.min(h, contentH) : h

  // Track the hero's rendered height inside the iframe.
  useEffect(() => {
    if (!mountNode) return
    const section = mountNode.querySelector('section')
    if (!section) return
    const measure = () => setContentH(Math.ceil(section.getBoundingClientRect().height))
    measure()
    const Obs = mountNode.ownerDocument.defaultView?.ResizeObserver
    if (!Obs) return
    const ro = new Obs(measure)
    ro.observe(section)
    return () => ro.disconnect()
  }, [mountNode])

  function handleLoad(e) {
    const doc = e.target.contentDocument
    if (!doc) return
    cloneSiteStyles(doc)
    setMountNode(doc.body)
  }

  return (
    <div>
      <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {Object.entries(DEVICES).map(([key, d]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={device === key}
            onClick={() => {
              setMountNode(null)
              setContentH(0)
              setDevice(key)
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--border-soft)',
              background: device === key ? 'var(--ink-navy)' : 'transparent',
              color: device === key ? '#fff' : 'var(--text-body)',
              fontSize: '0.8rem',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div ref={boxRef} style={{ width: '100%' }}>
        <div
          style={{
            width: shownWidth,
            height: frameH * scale,
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: 12,
            border: '1px solid var(--border-soft)',
            background: '#fff',
            visibility: scale ? 'visible' : 'hidden',
          }}
        >
          <iframe
            key={device}
            title="Vista previa de la diapositiva"
            srcDoc={FRAME_HTML}
            onLoad={handleLoad}
            style={{
              width: w,
              height: h,
              border: 0,
              display: 'block',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {mountNode &&
        createPortal(
          <section className={heroSectionClass(slide, position)}>
            <HeroSlide slide={slide} />
          </section>,
          mountNode
        )}
    </div>
  )
}
