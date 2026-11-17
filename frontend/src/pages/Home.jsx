import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroCarousel, { isMobileViewport, slideVisibleOn } from '../components/HeroCarousel'
import Reveal from '../components/Reveal'
import { api } from '../api/client'
import { MEMBERSHIP_URL, CAMPAIGN_URL } from '../config/links'

export default function Home() {
  const [slides, setSlides] = useState([])
  const [heroReady, setHeroReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    api.heroSlides()
      .then((data) => {
        if (cancelled) return
        setSlides(data)

        // Only slides for this device count; preload the first of those.
        const visible = data.filter((s) => slideVisibleOn(s, isMobileViewport()))
        const firstImage = visible[0]?.image_url
        if (!firstImage) {
          setHeroReady(true)
          return
        }

        let settled = false
        const finish = () => {
          if (settled || cancelled) return
          settled = true
          setHeroReady(true)
        }

        // Warm the cache for the remaining slides so they don't pop in late.
        visible.slice(1).forEach((s) => {
          if (s.image_url) new Image().src = s.image_url
        })

        const img = new Image()
        img.onload = finish
        img.onerror = finish
        img.src = firstImage
        // A real (compressed) hero photo can take several seconds on a slow
        // connection — this is only a safety net against a hung/broken
        // request, not a normal-case budget, so it's generous on purpose.
        setTimeout(finish, 8000)
      })
      .catch(() => {
        if (!cancelled) {
          setSlides([])
          setHeroReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {heroReady ? <HeroCarousel slides={slides} /> : <div className="hero-section" />}

      {/* Founder bio */}
      <Reveal as="section" className="section">
        <div className="container grid-halves">
          <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', minHeight: 380 }}>
            <img src="/images/cpa-4.jpg" alt="Mónica" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <p className="eyebrow">Hola, soy Mónica</p>
            <h2 className="display-heading" style={{ marginTop: 14 }}>
              Descubrí el crochet de adulta. Hoy ayudo a otras mujeres a descubrir todo lo que son
              capaces de crear.
            </h2>
            <p style={{ marginTop: 24 }}>
              Nunca imaginé que un ovillo de hilo cambiaría mi vida. Empecé aprendiendo paso a paso,
              experimentando y equivocándome muchas veces. Hoy diseño mis propios proyectos y acompaño
              a una comunidad de mujeres que, como yo, encontraron en el crochet una forma de desarrollar
              su creatividad, aprender constantemente y regalarse un momento para ellas.
            </p>
            <a href={MEMBERSHIP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              Conoce la membresía
            </a>
          </div>
        </div>
      </Reveal>

      {/* Two feature cards */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid-halves-tight">
          <FeatureCard
            imageSrc="/images/navidad-gnomos.jpg"
            title="Tienda y cursos online"
            description="Descubre piezas únicas tejidas por mí y cursos online para seguir aprendiendo crochet desde donde estés, a tu propio ritmo."
            linkTo="/tienda"
            linkLabel="Explora la tienda →"
          />
          <FeatureCard
            imageSrc="/images/cpa-6.jpg"
            title="Clases presenciales y virtuales"
            description="Aprende conmigo en clases grupales presenciales o sesiones virtuales personalizadas. Juntas encontraremos la opción que mejor se adapte a tu nivel y objetivos."
            linkTo="/clases"
            linkLabel="Ver clases →"
          />
        </div>
      </Reveal>

      {/* Campaign */}
      <Reveal as="section" className="section campaign">
        <div className="container campaign-grid">
          <div className="campaign-visual">
            <div className="campaign-arch">
              <img src="/images/bolso-flor-aro.jpg" alt="Bolso flor tejido a crochet" loading="lazy" />
            </div>
            <div className="campaign-circle">
              <img src="/images/flor-macro.jpg" alt="Detalle de una flor tejida" loading="lazy" />
            </div>
          </div>
          <div>
            <p className="eyebrow">Membresía · Bolso flor</p>
            <h2 className="display-heading" style={{ marginTop: 14 }}>
              Aprende a tejer el bolso que todas quieren
            </h2>
            <ul className="campaign-bullets">
              <li>Patrón y video tutorial paso a paso, a tu ritmo.</li>
              <li>Una comunidad que te acompaña y celebra tus avances.</li>
              <li>Materiales sencillos y técnicas que puedes repetir en nuevos proyectos.</li>
            </ul>
            <a
              href={CAMPAIGN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-big"
              style={{ marginTop: 36 }}
            >
              Quiero unirme
            </a>
          </div>
        </div>
      </Reveal>

      {/* Value props */}
      <Reveal as="section" className="section section-alt">
        <div className="container grid-thirds">
          <ValueProp icon="🌿" title="Aprende sin miedo" description="Descubre nuevas técnicas paso a paso y gana la confianza para crear proyectos que antes parecían imposibles." />
          <ValueProp icon="♡" title="Nunca tejas sola" description="Aquí siempre encontrarás una comunidad que te acompaña, te inspira y celebra contigo cada avance." />
          <ValueProp icon="✧" title="Disfruta el proceso" description="Más que terminar un proyecto, descubrirás el placer de crear con tus manos y dedicarte un momento para ti." />
        </div>
      </Reveal>

      {/* CTA banner */}
      <Reveal as="section" className="section">
        <div className="container grid-halves">
          <div>
            <h2 className="display-heading">
              Un lugar al que siempre querrás volver para seguir creando.
            </h2>
            <p style={{ marginTop: 16 }}>
              Cada mes encontrarás nuevos proyectos, técnicas, patrones y retos que despertarán tu
              creatividad. Y lo mejor: formarás parte de una comunidad de mujeres que aprende,
              comparte y crece unida, una puntada a la vez.
            </p>
            <a href={MEMBERSHIP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: 22, display: 'inline-block' }}>
              Quiero ser parte
            </a>
          </div>
          <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', aspectRatio: '4 / 5', maxHeight: 560 }}>
            <img src="/images/navidad-monica-guirnalda.jpg" alt="Mónica con una guirnalda tejida" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </Reveal>

      {/* Podcast block */}
      <Reveal as="section" className="container" style={{ paddingBottom: 88 }}>
        <div
          style={{
            background: 'var(--espresso)',
            color: 'var(--parchment)',
            borderRadius: 'var(--radius-card)',
            padding: '32px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#1DB954',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}
            >
              ♪
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', opacity: 0.65, marginBottom: 4 }}>
                PODCAST EN SPOTIFY
              </p>
              <p className="font-display" style={{ color: 'var(--parchment)', fontSize: '1.15rem', marginBottom: 6 }}>
                Crochet para el Alma — Podcast
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.75, maxWidth: 520 }}>
                Un espacio para reconectarte, inspirarte y tejer con intención. Aquí hablamos de
                creatividad, bienestar y conexión a través del arte del crochet.
              </p>
            </div>
          </div>
          <a
            href="https://open.spotify.com/show/7rKPRxw5kYglnqLAfsvEhD"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            style={{ borderColor: 'var(--parchment)', color: 'var(--parchment)', whiteSpace: 'nowrap' }}
          >
            Escuchar
          </a>
        </div>
      </Reveal>
    </>
  )
}

function FeatureCard({ imageSrc, title, description, linkTo, linkLabel }) {
  return (
    <div className="card" style={{ position: 'relative', minHeight: 340 }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(43,29,20,0.75), rgba(43,29,20,0.05))',
        }}
      />
      <div style={{ position: 'relative', padding: 28, alignSelf: 'flex-end', marginTop: 'auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <h3 className="font-display" style={{ color: '#fff', fontSize: '1.4rem' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: 8, maxWidth: 340 }}>
          {description}
        </p>
        <Link to={linkTo} style={{ color: '#fff', marginTop: 14, fontWeight: 500, fontSize: '0.9rem' }}>
          {linkLabel}
        </Link>
      </div>
    </div>
  )
}

function ValueProp({ icon, title, description }) {
  return (
    <div>
      <div style={{ fontSize: '1.5rem', color: 'var(--clay)' }}>{icon}</div>
      <h3 style={{ fontSize: '1.2rem', marginTop: 14 }}>{title}</h3>
      <p style={{ marginTop: 8, fontSize: '0.92rem' }}>{description}</p>
    </div>
  )
}
