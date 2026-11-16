const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FIELD_LABELS = {
  image_url: 'Imagen',
  headline: 'Texto principal',
  subtext: 'Subtexto',
  eyebrow: 'Etiqueta superior',
  cta_text: 'Texto del botón',
  cta_link: 'Enlace del botón',
  focal_point: 'Posición vertical',
  focal_x: 'Posición horizontal',
  image_side: 'Lado de la imagen',
  accent: 'Estilo de color',
  order: 'Orden',
}

const KNOWN_DETAILS = {
  'Could not validate credentials': 'Tu sesión expiró. Vuelve a iniciar sesión en el panel e inténtalo de nuevo.',
  'Not authenticated': 'Tu sesión expiró. Vuelve a iniciar sesión en el panel e inténtalo de nuevo.',
  'Admin access required': 'Esta acción es solo para administradoras.',
  'Slide not found': 'Esta diapositiva ya no existe (puede que se haya eliminado). Recarga la página.',
  'Invalid email or password': 'Correo o contraseña incorrectos.',
  'Email already registered': 'Ese correo ya tiene una cuenta.',
}

export const NETWORK_ERROR =
  'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.'

const STATUS_MESSAGES = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión en el panel e inténtalo de nuevo.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No se encontró lo que buscabas.',
  413: 'El archivo es demasiado grande.',
}

/** Turns a FastAPI `detail` (string, or the 422 array of objects) into plain Spanish. */
export function detailToMessage(detail, status) {
  if (typeof detail === 'string' && detail.trim()) return KNOWN_DETAILS[detail] || detail
  if (Array.isArray(detail) && detail.length) {
    const parts = detail.map((d) => {
      // Our own validators raise Spanish ValueErrors; pydantic prefixes them.
      if (typeof d.msg === 'string' && d.msg.startsWith('Value error, ')) return d.msg.slice('Value error, '.length)
      const field = FIELD_LABELS[d.loc?.[d.loc.length - 1]]
      let what = 'el valor no es válido.'
      if (d.type === 'missing') what = 'este dato es obligatorio.'
      else if (d.type === 'literal_error') what = 'el valor elegido no es válido.'
      return field ? `${field}: ${what}` : `Hay un dato incorrecto: ${what}`
    })
    return [...new Set(parts)].join(' ')
  }
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.'
  return 'No se pudo completar la acción. Inténtalo de nuevo.'
}

async function errorFromResponse(res) {
  let detail
  try {
    detail = (await res.json()).detail
  } catch (_) {
    /* no JSON body */
  }
  return new Error(detailToMessage(detail, res.status))
}

/** fetch() that turns a network failure ("Failed to fetch") into a Spanish message. */
async function safeFetch(url, options) {
  try {
    return await fetch(url, options)
  } catch (_) {
    throw new Error(NETWORK_ERROR)
  }
}

function getToken() {
  return localStorage.getItem('cpa_token')
}

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await safeFetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) throw await errorFromResponse(res)

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

  const res = await safeFetch(`${API_URL}/api/media/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) throw await errorFromResponse(res)

  const { path } = await res.json()
  return { path, url: `${API_URL}/api/media/${path}` }
}

// Upload an image to the public R2 images bucket.
// Returns { url } — a direct public CDN URL (or proxy URL in local dev).
export async function uploadImage(file, folder = 'products') {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await safeFetch(`${API_URL}/api/images/upload?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) throw await errorFromResponse(res)

  return res.json() // { url }
}

// Separate helper for video upload (multipart/form-data, not JSON)
export async function uploadLessonVideo(productId, lessonId, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await safeFetch(`${API_URL}/api/courses/${productId}/lessons/${lessonId}/upload-video`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) throw await errorFromResponse(res)
  return res.json()
}

// Build the HLS stream URL for a lesson (token embedded as query param for hls.js)
export function lessonStreamUrl(productId, lessonId) {
  const token = getToken()
  return `${API_URL}/api/courses/${productId}/lessons/${lessonId}/stream?token=${token}`
}
