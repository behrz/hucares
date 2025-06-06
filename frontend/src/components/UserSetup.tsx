import { useState } from 'react'
import { useUserStore, useUserError } from '../store/userStore'

interface UserSetupProps {
  onComplete: () => void
}

export default function UserSetup({ onComplete }: UserSetupProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createUser = useUserStore(state => state.createUser)
  const error = useUserError()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) return
    
    setIsSubmitting(true)
    
    const success = await createUser(username.trim(), 'temp-password', email.trim() || undefined)
    
    if (success) {
      onComplete()
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="card p-8 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-2xl">👋</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to HuCares!
        </h2>
        <p className="text-gray-600">
          Let's set up your profile to get started with weekly check-ins
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Choose a username *
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder="Enter your username"
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]{3,20}"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            3-20 characters, letters, numbers, and underscore only
          </p>
        </div>

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
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            For notifications and account recovery (optional)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!username.trim() || isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating profile...
            </span>
          ) : (
            'Create My Profile ✨'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your data is stored locally on your device for privacy
        </p>
      </div>
    </div>
  )
} 