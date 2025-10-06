import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' })

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

export default api
