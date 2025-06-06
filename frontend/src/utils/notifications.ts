// Notification utilities for HuCares
export interface NotificationConfig {
  enabled: boolean
  weeklyReminder: boolean
  friendActivity: boolean
  achievements: boolean
  timeOfDay: string // 24h format like "18:00"
  daysBeforeWeekEnd: number
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: false,
  weeklyReminder: true,
  friendActivity: true,
  achievements: true,
  timeOfDay: "18:00", // 6 PM
  daysBeforeWeekEnd: 2 // Tuesday (if week ends Sunday)
}

class NotificationManager {
  private config: NotificationConfig

  constructor() {
    this.config = this.loadConfig()
  }

  // Load configuration from localStorage
  private loadConfig(): NotificationConfig {
    try {
      const saved = localStorage.getItem('hucares_notifications')
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  }

  // Save configuration to localStorage
  private saveConfig(): void {
    localStorage.setItem('hucares_notifications', JSON.stringify(this.config))
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    
    if (granted) {
      this.config.enabled = true
      this.saveConfig()
      
      // Show welcome notification
      this.showNotification({
        title: 'HuCares Notifications Enabled! 🎉',
        body: "You'll receive weekly check-in reminders and friend activity updates.",
        icon: '/icon-192.png',
        tag: 'welcome'
      })
    }

    return granted
  }

  // Show a notification
  showNotification(options: {
    title: string
    body: string
    icon?: string
    tag?: string
    requireInteraction?: boolean
    actions?: Array<{ action: string; title: string }>
  }): void {
    if (!this.config.enabled || Notification.permission !== 'granted') {
      return
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false
    })

    // Auto-close after 10 seconds if not require interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000)
    }

    // Handle notification clicks
    notification.onclick = () => {
      window.focus()
      if (options.tag === 'weekly-reminder') {
        window.location.hash = '#checkin'
      }
      notification.close()
    }
  }

  // Schedule weekly check-in reminder
  scheduleWeeklyReminder(): void {
    if (!this.config.enabled || !this.config.weeklyReminder) {
      return
    }

    // Clear existing reminder
    this.clearScheduledNotifications('weekly-reminder')

    // Calculate when to show reminder
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const targetDay = 2 // Tuesday (2 days before Friday end of week)
    
    let daysUntilReminder = targetDay - dayOfWeek
    if (daysUntilReminder <= 0) {
      daysUntilReminder += 7 // Next week
    }

    const [hours, minutes] = this.config.timeOfDay.split(':').map(Number)
    const reminderTime = new Date(now)
    reminderTime.setDate(now.getDate() + daysUntilReminder)
    reminderTime.setHours(hours, minutes, 0, 0)

    const msUntilReminder = reminderTime.getTime() - now.getTime()

    if (msUntilReminder > 0) {
      setTimeout(() => {
        this.showWeeklyReminder()
        // Schedule next week's reminder
        this.scheduleWeeklyReminder()
      }, msUntilReminder)

      console.log(`📅 Weekly reminder scheduled for ${reminderTime.toLocaleString()}`)
    }
  }

  // Show weekly check-in reminder
  private showWeeklyReminder(): void {
    // Check if user already checked in this week
    const user = JSON.parse(localStorage.getItem('hucares_user_profile') || 'null')
    if (!user) return

    const currentWeek = this.getCurrentWeekStart()
    if (user.lastCheckInDate === currentWeek) {
      return // Already checked in this week
    }

    this.showNotification({
      title: 'Time for your HuCares check-in! 🌟',
      body: 'Take 2 minutes to reflect on your week and connect with friends.',
      tag: 'weekly-reminder',
      requireInteraction: true,
      actions: [
        { action: 'checkin', title: 'Check In Now ✨' },
        { action: 'later', title: 'Remind Later' }
      ]
    })
  }

  // Notify about friend activity
  notifyFriendActivity(friendName: string, score: number): void {
    if (!this.config.enabled || !this.config.friendActivity) {
      return
    }

    const emoji = score >= 25 ? '🌟' : score >= 20 ? '✨' : score >= 15 ? '🎉' : '👍'
    
    this.showNotification({
      title: `${friendName} checked in! ${emoji}`,
      body: `They got a HuCares score of ${score}. Check out the group leaderboard!`,
      tag: 'friend-activity'
    })
  }

  // Notify about achievements
  notifyAchievement(achievement: string): void {
    if (!this.config.enabled || !this.config.achievements) {
      return
    }

    this.showNotification({
      title: 'Achievement Unlocked! 🏆',
      body: achievement,
      tag: 'achievement',
      requireInteraction: true
    })
  }

  // Update configuration
  updateConfig(updates: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()

    // Reschedule reminders if needed
    if (updates.weeklyReminder !== undefined || updates.timeOfDay) {
      this.scheduleWeeklyReminder()
    }
  }

  // Get current configuration
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  // Clear scheduled notifications
  private clearScheduledNotifications(tag: string): void {
    // Note: In a real app with service workers, you'd clear scheduled notifications
    // For now, we rely on the timeout-based scheduling
    console.log(`Clearing notifications with tag: ${tag}`)
  }

  // Helper: Get current week start (Monday)
  private getCurrentWeekStart(): string {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString()
  }

  // Check if notifications are supported
  static isSupported(): boolean {
    return 'Notification' in window
  }

  // Get permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager()

// Convenience functions
export const requestNotificationPermission = () => notificationManager.requestPermission()
export const scheduleWeeklyReminder = () => notificationManager.scheduleWeeklyReminder()
export const notifyFriendActivity = (name: string, score: number) => 
  notificationManager.notifyFriendActivity(name, score)
export const notifyAchievement = (achievement: string) => 
  notificationManager.notifyAchievement(achievement)

// Initialize on import (if browser supports it)
if (typeof window !== 'undefined' && NotificationManager.isSupported()) {
  // Auto-schedule reminders if notifications are already enabled
  if (notificationManager.getConfig().enabled) {
    scheduleWeeklyReminder()
  }
} 