import { useState } from 'react'
import { useUser, useUserStore, useUserError } from '../store/userStore'
import { storage } from '../utils/localStorage'
import NotificationSettings from './NotificationSettings'
import Analytics from './Analytics'

interface UserProfileProps {
  onClose: () => void
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const user = useUser()
  const updateUser = useUserStore(state => state.updateUser)
  const logoutUser = useUserStore(state => state.logoutUser)
  const clearUser = useUserStore(state => state.clearUser)
  const error = useUserError()
  
  const [isEditing, setIsEditing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  })

  if (!user) return null

  const handleSave = async () => {
    const success = await updateUser({
      username: editData.username,
      email: editData.email || undefined
    })
    
    if (success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      username: user.username,
      email: user.email || ''
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out? Your data will be saved.')) {
      logoutUser()
      onClose()
    }
  }

  const handleClearData = () => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete ALL your data including:
• Your profile and account
• All check-in history (${checkInCount} check-ins)
• Group memberships
• All progress and analytics

This action CANNOT be undone.

Type "DELETE" to confirm:`
    
    const userInput = prompt(confirmMessage)
    
    if (userInput === 'DELETE') {
      clearUser()
      onClose()
      alert('✅ All data has been permanently deleted.')
    } else if (userInput !== null) {
      alert('❌ Data deletion cancelled. You must type exactly "DELETE" to confirm.')
    }
  }

  const exportData = () => {
    const data = storage.exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hucares-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const checkInCount = storage.getUserCheckIns(user.id).length
  const memberSince = new Date(user.createdAt).toLocaleDateString()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">🔥 PROFILE WITH LOGOUT 🔥</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Profile Stats */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">{checkInCount}</div>
                <div className="text-xs text-gray-600">Check-ins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600">
                  {Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 7))}
                </div>
                <div className="text-xs text-gray-600">Weeks</div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                  className="input-field"
                  minLength={3}
                  maxLength={20}
                />
              ) : (
                <p className="text-gray-800 font-medium">{user.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="your@email.com"
                />
              ) : (
                <p className="text-gray-600">{user.email || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <p className="text-gray-600">{memberSince}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {isEditing ? (
              <div className="flex space-x-2">
                <button onClick={handleSave} className="btn-primary flex-1">
                  Save Changes
                </button>
                <button onClick={handleCancel} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full btn-primary"
              >
                Edit Profile
              </button>
            )}
            
            <button 
              onClick={() => setShowAnalytics(true)} 
              className="w-full btn-outline"
            >
              Your Analytics 📈
            </button>
            
            <button onClick={exportData} className="w-full btn-outline">
              Export Data 📊
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)} 
              className="w-full btn-outline"
            >
              Notification Settings 🔔
            </button>
            
            <div className="pt-2 border-t">
              <button 
                onClick={handleLogout} 
                className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded mb-2 hover:bg-blue-600"
                style={{ backgroundColor: '#3b82f6' }}
              >
                🚪 LOGOUT BUTTON (DEBUG) 🚪
              </button>
              
              <button 
                onClick={handleClearData} 
                className="w-full text-red-600 hover:text-red-700 text-sm py-2"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Modal */}
      {showAnalytics && (
        <Analytics onClose={() => setShowAnalytics(false)} />
      )}
      
      {/* Notification Settings Modal */}
      {showNotifications && (
        <NotificationSettings onClose={() => setShowNotifications(false)} />
      )}
    </div>
  )
} 