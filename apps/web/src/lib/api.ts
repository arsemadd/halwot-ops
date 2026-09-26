import axios from 'axios'

export const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

let csrfInitialized = false

export const ensureCsrf = async () => {
  if (csrfInitialized) return
  await api.get('/sanctum/csrf-cookie')
  csrfInitialized = true
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthCheck = url.includes('/api/v1/me') || url.includes('/login')
    if (
      error.response?.status === 401
      && !window.location.pathname.startsWith('/login')
      && !isAuthCheck
    ) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.message) return data.message
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0]
      if (firstKey && data.errors[firstKey]?.[0]) return data.errors[firstKey][0]
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
