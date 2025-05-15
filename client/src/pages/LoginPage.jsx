import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice'
import authService from '../services/authService'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/')
    }
  }, [isAuthenticated, navigate, location])

  const handleGoogleLogin = async () => {
    try {
      dispatch(loginStart())
      const { url } = await authService.getGoogleAuthUrl()
      window.location.href = url
    } catch (error) {
      dispatch(loginFailure(error.message))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Mailstackz
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage