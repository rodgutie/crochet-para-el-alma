import { useState } from 'react'

export default function Contacto() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Wiring to a real contact endpoint / email service comes in a later phase.
    setSent(true)
  }

  return (
    <section className="section container" style={{ maxWidth: 560 }}>
      <p className="eyebrow">Contacto</p>
      <h1 style={{ fontSize: '2rem', marginTop: 8 }}>Escríbeme</h1>

      {sent ? (
        <p style={{ marginTop: 20 }}>Gracias por tu mensaje, te responderé pronto.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'grid', gap: 14 }}>
          <input type="text" placeholder="Nombre" required style={inputStyle} />
          <input type="email" placeholder="Correo" required style={inputStyle} />
          <textarea placeholder="Mensaje" rows={5} required style={inputStyle} />
          <button type="submit" className="btn-primary" style={{ justifySelf: 'start' }}>
            Enviar mensaje
          </button>
        </form>
      )}
    </section>
  )
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid var(--border-soft)',
  background: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
}
