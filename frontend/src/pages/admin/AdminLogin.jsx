import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
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
      const user = await login(email, password)
      if (user.role !== 'admin') {
        setError('Esta cuenta no tiene permisos de administración')
        return
      }
      navigate('/admin/hero')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--espresso)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--cream)',
          padding: 40,
          borderRadius: 'var(--radius-card)',
          width: 360,
          display: 'grid',
          gap: 14,
        }}
      >
        <p className="eyebrow">Panel de administración</p>
        <h1 style={{ fontSize: '1.5rem' }}>Crochet para el Alma</h1>

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
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar al panel'}
        </button>
      </form>
    </div>
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
