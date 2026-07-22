import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/mi-cuenta')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section container" style={{ maxWidth: 420 }}>
      <p className="eyebrow">Entrar</p>
      <h1 style={{ fontSize: '1.8rem', marginTop: 8 }}>Bienvenida de nuevo</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'grid', gap: 14 }}>
        <input
          type="email"
          placeholder="Correo"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        {error && <p style={{ color: '#b3261e', fontSize: '0.85rem' }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ justifySelf: 'start' }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
        ¿No tienes cuenta? <Link to="/registro" style={{ color: 'var(--clay-deep)', fontWeight: 500 }}>Regístrate</Link>
      </p>
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
