export default function Blog() {
  return (
    <section className="section">
      <div className="container grid-halves">
        <div>
          <p className="eyebrow">Blog</p>
          <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', marginTop: 8 }}>
            Historias, técnicas y proyectos
          </h1>
        </div>
        <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', minHeight: 300 }}>
          <img
            src="/images/blog.jpeg"
            alt="Blog — Crochet para el Alma"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>
    </section>
  )
}
