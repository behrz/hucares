import { useState } from 'react'
import { useUser, useUserStore, useUserLoading, useUserError } from '../store/userStore'
import { Group as ApiGroup } from '../utils/api'
import GroupCreate from './GroupCreate'
import GroupSuccess from './GroupSuccess'

interface GroupJoinProps {
  onJoinSuccess: (groupName: string) => void
  onSkip: () => void
}

export default function GroupJoin({ onJoinSuccess, onSkip }: GroupJoinProps) {
  const [view, setView] = useState<'join' | 'create' | 'success'>('join')
  const [accessCode, setAccessCode] = useState('')
  const [localError, setLocalError] = useState('')
  const [createdGroup, setCreatedGroup] = useState<ApiGroup | null>(null)

  const user = useUser()
  const joinGroup = useUserStore(state => state.joinGroup)
  const isLoading = useUserLoading()
  const globalError = useUserError()

  const handleJoinGroup = async (code: string) => {
    if (!user || !code.trim()) return
    
    setLocalError('')

    try {
      const success = await joinGroup(code.trim())
      
      if (success) {
        // Get the group name from the store or use a default
        onJoinSuccess('your group') // We could improve this by getting the actual group name
      }
    } catch (error) {
      console.error('Join group error:', error)
      setLocalError('Failed to join group. Please try again.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (accessCode.trim()) {
      handleJoinGroup(accessCode.trim().toUpperCase())
    }
  }

  const handleGroupCreated = (group: ApiGroup) => {
    setCreatedGroup(group)
    setView('success')
  }

  const handleCreateCancel = () => {
    setView('join')
  }

  const handleSuccessContinue = () => {
    if (createdGroup) {
      onJoinSuccess(createdGroup.name)
    }
  }

  // Show error from either local state or global store
  const displayError = localError || globalError

  // Render different views
  if (view === 'create') {
    return <GroupCreate onSuccess={handleGroupCreated} onCancel={handleCreateCancel} />
  }

  if (view === 'success' && createdGroup) {
    return <GroupSuccess group={createdGroup} onContinue={handleSuccessContinue} />
  }

  return (
    <div className="card p-8 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-2xl">👥</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Join a Group
        </h2>
        <p className="text-gray-600">
          Connect with friends and family for weekly check-ins together
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Access Code
          </label>
          <input
            type="text"
            id="accessCode"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="input-field"
            placeholder="e.g., ABC123"
            maxLength={10}
            disabled={isLoading}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ask your group admin for the access code
          </p>
        </div>

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!accessCode.trim() || isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining group...
            </span>
          ) : (
            'Join Group 🎉'
          )}
        </button>
      </form>

      <div className="border-t pt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">💡</span>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">How to get an access code</h4>
              <p className="text-xs text-blue-700">
                Ask a friend who's already in a group to share their access code with you, 
                or create a new group to get your own code to share.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-6 space-y-3">
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <button
          onClick={() => setView('create')}
          disabled={isLoading}
          className="w-full btn-secondary disabled:opacity-50"
        >
          Create New Group ✨
        </button>
        
        <button
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700 text-sm"
          disabled={isLoading}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
} 