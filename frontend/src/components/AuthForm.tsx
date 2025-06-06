import { useState } from 'react'
import { useUserStore, useUserError, useUserLoading } from '../store/userStore'

interface AuthFormProps {
  onComplete: () => void
}

export default function AuthForm({ onComplete }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  
  const createUser = useUserStore(state => state.createUser)
  const loginUser = useUserStore(state => state.loginUser)
  const isLoading = useUserLoading()
  const error = useUserError()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) return
    
    let success = false
    
    try {
      if (mode === 'login') {
        success = await loginUser(username, password)
      } else {
        success = await createUser(username, password, email || undefined)
      }
      
      if (success) {
        onComplete()
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  return (
    <div className="card p-8 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-2xl">
            {mode === 'login' ? '🔐' : '👋'}
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {mode === 'login' ? 'Welcome Back!' : 'Join HuCares!'}
        </h2>
        <p className="text-gray-600">
          {mode === 'login' 
            ? 'Log in to continue your wellness journey' 
            : 'Create your account to get started'
          }
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔐 Log In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ✨ Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'login' ? 'Username' : 'Choose a username'} *
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder={mode === 'login' ? 'Enter your username' : 'Create your username'}
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]{3,20}"
            required
            disabled={isLoading}
            autoComplete="username"
          />
          {mode === 'signup' && (
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters, numbers, and underscore only
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder={mode === 'login' ? 'Enter your password' : 'Create a secure password'}
            minLength={8}
            required
            disabled={isLoading}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {mode === 'signup' && (
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters long
            </p>
          )}
        </div>

        {mode === 'signup' && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              disabled={isLoading}
              autoComplete="email"
            />
            <p className="text-xs text-gray-500 mt-1">
              For notifications and account recovery (optional)
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!username.trim() || !password.trim() || isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'login' ? 'Logging in...' : 'Creating account...'}
            </span>
          ) : (
            mode === 'login' ? '🔐 Log In' : '✨ Create Account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          {mode === 'login' ? 'Secure login to your HuCares account' : 'Your account will be securely stored'}
        </p>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-primary-600 hover:text-primary-700 text-sm mt-2 underline"
          disabled={isLoading}
        >
          {mode === 'login' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Log in"
          }
        </button>
      </div>
    </div>
  )
} 