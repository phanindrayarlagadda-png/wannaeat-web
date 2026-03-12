import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import AppRouter from './router'
import { setCredentials } from './redux/slices/authSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    // Rehydrate auth from localStorage on app start
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch(setCredentials({ user, token }))
      } catch {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
  }, [dispatch])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
