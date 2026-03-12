import axios from 'axios'
import { BASE_URL } from './config'
import { store } from '../redux/store'
import { logout } from '../redux/slices/authSlice'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token
apiClient.interceptors.request.use(config => {
  const token = store.getState().auth.token || localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default apiClient
