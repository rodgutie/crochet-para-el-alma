const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('cpa_token')
}

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = 'Request failed'
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch (_) {
      /* no-op */
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: data }),
  me: () => apiRequest('/api/auth/me', { auth: true }),

  heroSlides: () => apiRequest('/api/hero'),
  heroSlidesAdmin: () => apiRequest('/api/hero/admin', { auth: true }),
  createHeroSlide: (data) => apiRequest('/api/hero', { method: 'POST', body: data, auth: true }),
  updateHeroSlide: (id, data) => apiRequest(`/api/hero/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteHeroSlide: (id) => apiRequest(`/api/hero/${id}`, { method: 'DELETE', auth: true }),

  products: () => apiRequest('/api/products'),
  product: (id) => apiRequest(`/api/products/${id}`),
  productsAdmin: () => apiRequest('/api/products/admin/all', { auth: true }),
  createProduct: (data) => apiRequest('/api/products', { method: 'POST', body: data, auth: true }),
  updateProduct: (id, data) => apiRequest(`/api/products/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteProduct: (id) => apiRequest(`/api/products/${id}`, { method: 'DELETE', auth: true }),

  // Course lessons — public (no video_key) and admin
  lessons: (productId) => apiRequest(`/api/courses/${productId}/lessons`),
  lessonsAdmin: (productId) => apiRequest(`/api/courses/${productId}/lessons/admin`, { auth: true }),
  createLesson: (productId, data) => apiRequest(`/api/courses/${productId}/lessons`, { method: 'POST', body: data, auth: true }),
  updateLesson: (productId, lessonId, data) => apiRequest(`/api/courses/${productId}/lessons/${lessonId}`, { method: 'PUT', body: data, auth: true }),
  deleteLesson: (productId, lessonId) => apiRequest(`/api/courses/${productId}/lessons/${lessonId}`, { method: 'DELETE', auth: true }),
  reorderLessons: (productId, orderedIds) => apiRequest(`/api/courses/${productId}/lessons/reorder`, { method: 'POST', body: { ordered_ids: orderedIds }, auth: true }),

  // Entitlements (admin)
  entitlements: () => apiRequest('/api/admin/entitlements', { auth: true }),
  grantEntitlement: (data) => apiRequest('/api/admin/entitlements', { method: 'POST', body: data, auth: true }),
  revokeEntitlement: (id) => apiRequest(`/api/admin/entitlements/${id}`, { method: 'DELETE', auth: true }),

  // Users list (admin)
  usersAdmin: () => apiRequest('/api/auth/admin/users', { auth: true }),

  // Customer: own entitlements
  myEntitlements: () => apiRequest('/api/me/entitlements', { auth: true }),
}

// Upload any media file (images, PDFs, etc.) to R2 via the backend.
// Returns { path, url } where url is the full URL to use in <img src> / <a href>.
export async function uploadMedia(file, folder = 'general') {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/api/media/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    let detail = 'Upload failed'
    try { detail = (await res.json()).detail || detail } catch (_) { /* no-op */ }
    throw new Error(detail)
  }

  const { path } = await res.json()
  return { path, url: `${API_URL}/api/media/${path}` }
}

// Separate helper for video upload (multipart/form-data, not JSON)
export async function uploadLessonVideo(productId, lessonId, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_URL}/api/courses/${productId}/lessons/${lessonId}/upload-video`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    let detail = 'Upload failed'
    try { detail = (await res.json()).detail || detail } catch (_) { /* no-op */ }
    throw new Error(detail)
  }
  return res.json()
}

// Build the HLS stream URL for a lesson (token embedded as query param for hls.js)
export function lessonStreamUrl(productId, lessonId) {
  const token = getToken()
  return `${API_URL}/api/courses/${productId}/lessons/${lessonId}/stream?token=${token}`
}
