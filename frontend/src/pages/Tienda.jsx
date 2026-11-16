import { useEffect, useState } from 'react'
import { api } from '../api/client'
import Reveal from '../components/Reveal'

const TYPE_LABELS = {
  physical: 'Hecho a Mano',
  digital: 'Descargables',
  course: 'Curso',
}

const PROMO_IMAGES = ['/images/temp1.jpeg', '/images/temp2.jpeg', '/images/temp3.jpeg']

const NAVIDAD_IMAGES = [
  ['/images/navidad-gnomos.jpg', 'Gnomos tejidos de Navidad'],
  ['/images/navidad-monica-gnomos.jpg', 'Mónica con gnomos tejidos'],
]
const ACCESORIOS_IMAGES = [
  ['/images/aretes-rosa-turquesa.jpg', 'Aretes rosa y turquesa'],
  ['/images/aretes-turquesa.jpg', 'Aretes turquesa'],
  ['/images/aretes-hojas.jpg', 'Aretes de hojas'],
]
const BOLSOS_IMAGES = [
  ['/images/bolso-flor-aro.jpg', 'Bolso flor con aro'],
  ['/images/bolso-flor-tijeras.jpg', 'Bolso flor con tijeras'],
  ['/images/bolso-flor-borla.jpg', 'Bolso flor con borla'],
]

function VisualBlock({ eyebrow, title, images, layout }) {
  return (
    <Reveal as="section" className="tienda-block">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-heading" style={{ marginTop: 10 }}>{title}</h2>
      <div className={layout}>
        {images.map(([src, alt]) => (
          <div key={src} className="tienda-img">
            <img src={src} alt={alt} loading="lazy" />
          </div>
        ))}
      </div>
    </Reveal>
  )
}

export default function Tienda() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api
      .products()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'all' ? products : products.filter((p) => p.type === filter)

  return (
    <section className="section container">
      <p className="eyebrow">Tienda</p>
      <h1 style={{ fontSize: '2rem', marginTop: 8 }}>Piezas, patrones y cursos</h1>
      <p style={{ marginTop: 12, maxWidth: 560 }}>
        Piezas tejidas a mano, patrones descargables y cursos para seguir aprendiendo a tu ritmo.
      </p>

      {/* Promotional banner — temporary placeholder while real products are added */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        {PROMO_IMAGES.map((src) => (
          <div
            key={src}
            style={{
              width: '100%',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              background: 'var(--cream-deep)',
            }}
          >
            <img
              src={src}
              alt=""
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </div>
        ))}
      </div>

      <VisualBlock eyebrow="Temporada" title="Navidad" images={NAVIDAD_IMAGES} layout="tienda-pair" />
      <VisualBlock eyebrow="Detalles" title="Accesorios" images={ACCESORIOS_IMAGES} layout="tienda-row" />
      <VisualBlock eyebrow="Colección flor" title="Bolsos" images={BOLSOS_IMAGES} layout="tienda-row" />

      <div className="filter-pills">
        {['all', 'physical', 'digital', 'course'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid var(--border-soft)',
              background: filter === t ? 'var(--ink-navy)' : 'transparent',
              color: filter === t ? '#fff' : 'var(--text-body)',
              fontSize: '0.85rem',
            }}
          >
            {t === 'all' ? 'Todo' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ marginTop: 32 }}>Cargando…</p>
      ) : visible.length === 0 ? (
        <p style={{ marginTop: 32 }}>
          Todavía no hay productos aquí. Se agregarán pronto desde el panel de administración.
        </p>
      ) : (
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {visible.map((product) => (
            <div key={product.id} className="card">
              <div
                style={{
                  height: 200,
                  background: 'var(--cream-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-body)',
                }}
              >
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  'Sin foto'
                )}
              </div>
              <div style={{ padding: 18 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.06em',
                    color: 'var(--clay-deep)',
                    textTransform: 'uppercase',
                  }}
                >
                  {TYPE_LABELS[product.type]}
                </span>
                <h3 style={{ fontSize: '1.05rem', marginTop: 6 }}>{product.name}</h3>
                <p style={{ fontSize: '0.85rem', marginTop: 6, opacity: 0.8 }}>
                  {product.description?.slice(0, 90)}
                  {product.description?.length > 90 ? '…' : ''}
                </p>
                <p style={{ marginTop: 12, fontWeight: 500 }}>
                  {product.currency} {Number(product.price).toFixed(2)}
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12, width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                  disabled
                  title="El carrito y checkout se activan en la Fase 4"
                >
                  Comprar (próximamente)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
