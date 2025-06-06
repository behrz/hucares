import { useState, useEffect } from 'react'
import { notificationManager, NotificationConfig, requestNotificationPermission } from '../utils/notifications'

interface NotificationSettingsProps {
  onClose: () => void
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [config, setConfig] = useState<NotificationConfig>(notificationManager.getConfig())
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isEnabling, setIsEnabling] = useState(false)

  useEffect(() => {
    setPermission(Notification.permission)
  }, [])

  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    
    const granted = await requestNotificationPermission()
    
    if (granted) {
      setPermission('granted')
      setConfig(notificationManager.getConfig())
    }
    
    setIsEnabling(false)
  }

  const handleConfigChange = (updates: Partial<NotificationConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    notificationManager.updateConfig(updates)
  }

  const handleTimeChange = (time: string) => {
    handleConfigChange({ timeOfDay: time })
  }

  const testNotification = () => {
    notificationManager.showNotification({
      title: 'Test Notification 🧪',
      body: 'This is how your HuCares notifications will look!',
      tag: 'test'
    })
  }

  const isNotificationSupported = 'Notification' in window

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {!isNotificationSupported ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">Notifications Not Supported</h3>
                <p className="text-sm text-yellow-700">
                  Your browser doesn't support notifications. Try using a modern browser like Chrome, Firefox, or Safari.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Permission Status */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">Permission Status</h3>
              
              {permission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🚫</span>
                    <div>
                      <h4 className="font-medium text-red-800 mb-1">Notifications Blocked</h4>
                      <p className="text-sm text-red-700 mb-2">
                        Notifications are currently blocked. To enable them:
                      </p>
                      <ol className="text-sm text-red-700 list-decimal list-inside space-y-1">
                        <li>Click the 🔒 or 🛡️ icon in your address bar</li>
                        <li>Change notifications from "Block" to "Allow"</li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {permission === 'default' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🔔</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 mb-1">Enable Notifications</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Get weekly check-in reminders and friend activity updates!
                      </p>
                      <button
                        onClick={handleEnableNotifications}
                        disabled={isEnabling}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {isEnabling ? 'Requesting...' : 'Enable Notifications ✨'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {permission === 'granted' && config.enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✅</span>
                      <div>
                        <h4 className="font-medium text-green-800">Notifications Enabled</h4>
                        <p className="text-sm text-green-700">You'll receive HuCares notifications!</p>
                      </div>
                    </div>
                    <button
                      onClick={testNotification}
                      className="btn-outline text-xs"
                    >
                      Test 🧪
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Types */}
            {permission === 'granted' && config.enabled && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-4">Notification Types</h3>
                  
                  <div className="space-y-4">
                    {/* Weekly Reminders */}
                    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">📅</span>
                        <div>
                          <h4 className="font-medium text-gray-800">Weekly Reminders</h4>
                          <p className="text-sm text-gray-600">
                            Get reminded to complete your weekly check-in
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.weeklyReminder}
                          onChange={(e) => handleConfigChange({ weeklyReminder: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </div>

                    {/* Friend Activity */}
                    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">👥</span>
                        <div>
                          <h4 className="font-medium text-gray-800">Friend Activity</h4>
                          <p className="text-sm text-gray-600">
                            Know when friends complete their check-ins
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.friendActivity}
                          onChange={(e) => handleConfigChange({ friendActivity: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </div>

                    {/* Achievements */}
                    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🏆</span>
                        <div>
                          <h4 className="font-medium text-gray-800">Achievements</h4>
                          <p className="text-sm text-gray-600">
                            Celebrate milestones and streaks
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.achievements}
                          onChange={(e) => handleConfigChange({ achievements: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reminder Time */}
                {config.weeklyReminder && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-3">Reminder Time</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time of day for weekly reminders
                      </label>
                      <input
                        type="time"
                        value={config.timeOfDay}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="input-field"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Reminders are sent on Tuesdays at this time
                      </p>
                    </div>
                  </div>
                )}

                {/* Disable All */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleConfigChange({ enabled: false })}
                    className="w-full text-red-600 hover:text-red-700 text-sm py-2"
                  >
                    Disable All Notifications
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t">
          <button onClick={onClose} className="w-full btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
} 