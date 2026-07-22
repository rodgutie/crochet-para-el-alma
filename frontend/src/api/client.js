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
}
