import { useState } from 'react'
import { useUser, useUserStore, useUserLoading, useUserError } from '../store/userStore'
import { Group as ApiGroup } from '../utils/api'

interface GroupCreateProps {
  onSuccess: (group: ApiGroup) => void
  onCancel: () => void
}

export default function GroupCreate({ onSuccess, onCancel }: GroupCreateProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [localError, setLocalError] = useState('')
  
  const user = useUser()
  const createGroup = useUserStore(state => state.createGroup)
  const isLoading = useUserLoading()
  const globalError = useUserError()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setLocalError('You must be logged in to create a group')
      return
    }

    if (!formData.name.trim()) {
      setLocalError('Group name is required')
      return
    }

    setLocalError('')

    try {
      const success = await createGroup(
        formData.name.trim(), 
        formData.description.trim() || undefined
      )
      
      if (success) {
        // For now, we'll create a mock group object for the success callback
        // In a real implementation, the createGroup would return the created group
        const mockGroup: ApiGroup = {
          id: 'temp-id',
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          accessCode: 'TEMP123',
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          maxMembers: 20
        }
        
        onSuccess(mockGroup)
      }
    } catch (error) {
      console.error('Create group error:', error)
      setLocalError('An error occurred while creating the group.')
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (localError) setLocalError('')
  }

  // Show error from either local state or global store
  const displayError = localError || globalError

  return (
    <div className="card p-8 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Create Your Group
        </h2>
        <p className="text-gray-600">
          Start a new HuCares group for your friends and family
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            id="groupName"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input-field"
            placeholder="e.g., Family Circle, Best Friends, Work Squad"
            maxLength={50}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Choose a name that represents your group
          </p>
        </div>

        <div>
          <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="groupDescription"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input-field resize-none"
            placeholder="What brings your group together?"
            rows={3}
            maxLength={200}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Help members understand the group's purpose
          </p>
        </div>

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{displayError}</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">✨ What happens next:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• You'll get a unique access code to share</li>
            <li>• Friends can join using this code</li>
            <li>• You'll be the group admin</li>
            <li>• Start weekly check-ins together!</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!formData.name.trim() || isLoading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Group 🎉'
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 btn-outline disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
} 