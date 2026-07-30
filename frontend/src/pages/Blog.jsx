export default function Blog() {
  return (
    <section className="section container">
      <p className="eyebrow">Blog</p>
      <h1 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', marginTop: 8 }}>
        Historias, técnicas y proyectos
      </h1>
      <p style={{ marginTop: 12, maxWidth: 640 }}>
        Inspiración, tutoriales y reflexiones sobre el tejido y la vida creativa.
      </p>

      <div
        style={{
          marginTop: 32,
          width: '100%',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
          background: 'var(--cream-deep)',
        }}
      >
        <img
          src="/images/blog.jpeg"
          alt="Blog — Crochet para el Alma"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
    </section>
  )
}
