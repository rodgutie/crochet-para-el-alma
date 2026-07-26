import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireCustomer, RequireAdmin } from './components/ProtectedRoute'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Tienda from './pages/Tienda'
import Clases from './pages/Clases'
import Blog from './pages/Blog'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import Register from './pages/Register'
import MiCuenta from './pages/MiCuenta'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminHero from './pages/admin/AdminHero'
import AdminProducts from './pages/admin/AdminProducts'
import AdminLessons from './pages/admin/AdminLessons'
import AdminEntitlements from './pages/admin/AdminEntitlements'
import CoursePlayer from './pages/CoursePlayer'

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin: no public navbar/footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="hero" element={<AdminHero />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="cursos/:productId/lecciones" element={<AdminLessons />} />
          <Route path="accesos" element={<AdminEntitlements />} />
        </Route>

        {/* Public site */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/tienda" element={<PublicLayout><Tienda /></PublicLayout>} />
        <Route path="/clases" element={<PublicLayout><Clases /></PublicLayout>} />
        <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
        <Route path="/contacto" element={<PublicLayout><Contacto /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/registro" element={<PublicLayout><Register /></PublicLayout>} />
        <Route
          path="/mi-cuenta"
          element={
            <PublicLayout>
              <RequireCustomer>
                <MiCuenta />
              </RequireCustomer>
            </PublicLayout>
          }
        />
        <Route
          path="/mi-cuenta/cursos/:id"
          element={
            <RequireCustomer>
              <CoursePlayer />
            </RequireCustomer>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
