import { useAuth } from '../context/AuthContext'

export default function MiCuenta() {
  const { user } = useAuth()

  return (
    <section className="section container">
      <p className="eyebrow">Mi cuenta</p>
      <h1 style={{ fontSize: '1.8rem', marginTop: 8 }}>Hola, {user?.name}</h1>
      <p style={{ marginTop: 12 }}>{user?.email}</p>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: '1.2rem' }}>Mis cursos</h2>
        <p style={{ marginTop: 8, fontSize: '0.92rem' }}>
          Todavía no has comprado ningún curso. La librería de cursos y archivos descargables se
          activa en la Fase 3 del proyecto.
        </p>
      </div>
    </section>
  )
}
