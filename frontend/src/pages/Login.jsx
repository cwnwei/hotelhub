import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { createPageUrl } from '@/utils'
import { useAuth } from '@/lib/AuthContext'

export default function Login() {
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const loggedInUser = await login(email, password)
    setSubmitting(false)
    if (loggedInUser) {
      // Redirect based on user role
      if (loggedInUser.role === 'admin' || loggedInUser.role === 'staff') {
        navigate('/Dashboard')
      } else {
        // Guest or other roles go to home
        navigate('/')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl("")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-light text-xl text-slate-900">HotelHub</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="mt-1 block w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            {authError && authError.type === 'invalid_credentials' && (
              <div className="text-sm text-red-600">{authError.message}</div>
            )}
            <div>
              <button
                type="submit"
                className="w-full bg-primary text-white px-4 py-2 rounded-md"
                disabled={submitting}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
