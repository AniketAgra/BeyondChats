import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
})

let accessToken = null
export function setAccessToken(token) {
  accessToken = token || null
}

// Attach Authorization header if we have a token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// On 401, try refresh once then retry original request
let isRefreshing = false
let pending = []
function subscribe(cb) { pending.push(cb) }
function onRefreshed(newToken) { pending.forEach((cb) => cb(newToken)); pending = [] }

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {}
    const path = (original.url || '')
    // Don't try to refresh if the refresh call itself failed
    if (error.response?.status === 401 && !original._retry && !path.includes('/auth/refresh')) {
      original._retry = true
      try {
        if (isRefreshing) {
          const newToken = await new Promise((resolve) => subscribe(resolve))
          setAccessToken(newToken)
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        }
        isRefreshing = true
        const { data } = await api.post('/auth/refresh')
        isRefreshing = false
        onRefreshed(data.accessToken)
        setAccessToken(data.accessToken)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (e) {
        isRefreshing = false
        pending = []
      }
    }
    return Promise.reject(error)
  }
)

export const pdfApi = {
  parse: async (file) => {
    const fd = new FormData();
    fd.append('file', file)
    const { data } = await api.post('/pdf/parse', fd)
    return data
  },
  summarize: async ({ file, text, pdfId }) => {
    const fd = new FormData()
    if (file) fd.append('file', file)
    if (text) fd.append('text', text)
    if (pdfId) fd.append('pdfId', pdfId)
    const { data } = await api.post('/pdf/summarize', fd)
    return data
  },
  list: async () => (await api.get('/pdf')).data.items,
  get: async (id) => (await api.get(`/pdf/${id}`)).data,
  upload: async (file, onProgress) => {
    const fd = new FormData()
    fd.append('pdf', file)
    const { data } = await api.post('/pdf/upload', fd, {
      onUploadProgress: (e) => {
        if (!onProgress) return
        const percent = e.total ? Math.round((e.loaded * 100) / e.total) : 0
        onProgress(percent)
      }
    })
    return data.pdf || data.data
  },
  __rawUpload: async (formData, onProgress) => {
    const { data } = await api.post('/pdf/upload', formData, {
      onUploadProgress: (e) => {
        if (!onProgress) return
        const percent = e.total ? Math.round((e.loaded * 100) / e.total) : 0
        onProgress(percent)
      }
    })
    return { data }
  }
}

export const ytApi = {
  suggest: async (topic) => {
    const { data } = await api.get('/youtube/suggest', { params: { topic } })
    return data.videos
  }
}

export const notesApi = {
  list: async (pdfId) => (await api.get('/notes', { params: { pdfId } })).data.items,
  create: async (note) => (await api.post('/notes', note)).data
}

export const quizApi = {
  generate: async (payload) => (await api.post('/quiz/generate', payload)).data,
  submit: async (payload) => (await api.post('/quiz/submit', payload)).data
}

export const authApi = {
  signup: async (payload) => (await api.post('/auth/signup', payload)).data,
  login: async (payload) => (await api.post('/auth/login', payload)).data,
  logout: async () => (await api.post('/auth/logout')).data,
  refresh: async () => (await api.post('/auth/refresh')).data,
  me: async () => (await api.get('/auth/me')).data,
}

export const chatApi = {
  list: async (pdfId) => (await api.get('/chat', { params: { pdfId } })).data.items,
  send: async ({ content, pdfId }) => (await api.post('/chat/send', { content, pdfId })).data.messages,
}

export const analyticsApi = {
  overview: async () => (await api.get('/analytics/overview')).data,
}

export default api
