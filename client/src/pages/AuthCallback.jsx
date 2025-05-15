import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice'
import authService from '../services/authService'

const AuthCallback = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      if (!code) {
        navigate('/login')
        return
      }

      try {
        dispatch(loginStart())
        const userData = await authService.handleGoogleCallback(code)
        dispatch(loginSuccess(userData))
        navigate('/')
      } catch (error) {
        dispatch(loginFailure(error.message))
        navigate('/login')
      }
    }

    handleCallback()
  }, [dispatch, navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl font-semibold">Authenticating...</div>
    </div>
  )
}

export default AuthCallback