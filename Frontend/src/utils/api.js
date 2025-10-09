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
  getUrl: async (id) => (await api.get(`/pdf/${id}/url`)).data.url,
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
  uploadByUrl: async ({ url, title, author, imageUrl }) => {
    const payload = { url }
    if (title) payload.title = title
    if (author) payload.author = author
    if (imageUrl) payload.imageUrl = imageUrl
    const { data } = await api.post('/pdf/from-url', payload)
    return data.pdf || data
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
  },
  delete: async (id) => {
    const { data } = await api.delete(`/pdf/${id}`)
    return data
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
  create: async (note) => (await api.post('/notes', note)).data,
  update: async (id, note) => (await api.put(`/notes/${id}`, note)).data,
  delete: async (id) => (await api.delete(`/notes/${id}`)).data
}

export const quizApi = {
  generate: async (payload) => (await api.post('/quiz/generate', payload)).data,
  submit: async (payload) => (await api.post('/quiz/submit', payload)).data,
  getAttempts: async (pdfId) => {
    const params = pdfId ? { pdfId } : {}
    return (await api.get('/quiz/attempts', { params })).data.attempts
  },
  getAttempt: async (id) => (await api.get(`/quiz/attempts/${id}`)).data.attempt,
  getQuiz: async (id) => (await api.get(`/quiz/quiz/${id}`)).data.quiz,
  getQuizzes: async (pdfId) => {
    const params = pdfId ? { pdfId } : {}
    return (await api.get('/quiz/quizzes', { params })).data.quizzes
  }
}

export const authApi = {
  signup: async (payload) => (await api.post('/auth/signup', payload)).data,
  login: async (payload) => (await api.post('/auth/login', payload)).data,
  logout: async () => (await api.post('/auth/logout')).data,
  refresh: async () => (await api.post('/auth/refresh')).data,
  me: async () => (await api.get('/auth/me')).data,
}

export const chatApi = {
  getHistory: async ({ pdfId, limit = 50 } = {}) => {
    const params = {}
    if (pdfId) params.pdfId = pdfId
    if (limit) params.limit = limit
    return (await api.get('/chat', { params })).data
  },
  send: async ({ content, pdfId, conversationHistory = [] }) => {
    return (await api.post('/chat/send', { content, pdfId, conversationHistory })).data
  },
}

export const analyticsApi = {
  overview: async () => (await api.get('/analytics/overview')).data,
  topicMastery: async () => (await api.get('/analytics/topic-mastery')).data,
  pdfInsights: async () => (await api.get('/analytics/pdf-insights')).data,
  timeSpent: async () => (await api.get('/analytics/time-spent')).data,
  recommendations: async () => (await api.get('/analytics/recommendations')).data,
}

export const keyFeaturesApi = {
  get: async (pdfId) => (await api.get(`/key-features/${pdfId}`)).data,
  generate: async (pdfId) => (await api.post(`/key-features/generate/${pdfId}`)).data,
}

export const aiBuddyApi = {
  // Get all chat sessions
  getSessions: async (type = null) => {
    const params = type ? { type } : {}
    return (await api.get('/aibuddy/sessions', { params })).data
  },
  
  // Create new chat session
  createSession: async (type, pdfId = null, title = null) => {
    const payload = { type }
    if (pdfId) payload.pdfId = pdfId
    if (title) payload.title = title
    return (await api.post('/aibuddy/sessions', payload)).data
  },
  
  // Get or create session for a specific PDF
  getPDFSession: async (pdfId) => {
    return (await api.get(`/aibuddy/sessions/pdf/${pdfId}`)).data
  },
  
  // Get messages for a session
  getMessages: async (sessionId, limit = 50) => {
    return (await api.get(`/aibuddy/sessions/${sessionId}/messages`, { 
      params: { limit } 
    })).data
  },
  
  // Send message in a session
  sendMessage: async (sessionId, content, useRAG = true) => {
    return (await api.post(`/aibuddy/sessions/${sessionId}/messages`, {
      content,
      useRAG
    })).data
  },
  
  // Update session title
  updateSession: async (sessionId, title) => {
    return (await api.patch(`/aibuddy/sessions/${sessionId}`, { title })).data
  },
  
  // Delete session
  deleteSession: async (sessionId) => {
    return (await api.delete(`/aibuddy/sessions/${sessionId}`)).data
  }
}

export default api
