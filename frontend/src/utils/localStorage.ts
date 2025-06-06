// Types for HuCares data structures
export interface CheckInData {
  id: string
  userId: string
  groupId: string
  weekStartDate: string // ISO date string for Monday of the week
  productive: number
  satisfied: number
  body: number
  care: number
  huCaresScore: number
  submittedAt: string // ISO date string
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  createdAt: string
  currentGroupId?: string
  lastCheckInDate?: string
}

export interface GroupData {
  id: string
  name: string
  description?: string
  accessCode: string
  memberIds: string[]
  createdAt: string
  isActive: boolean
}

export interface FriendData {
  id: string
  username: string
  groupId: string
  lastCheckInScore?: number
  lastCheckInDate?: string
}

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'hucares_user_profile',
  CHECK_INS: 'hucares_check_ins',
  GROUPS: 'hucares_groups',
  FRIENDS: 'hucares_friends',
  CURRENT_WEEK: 'hucares_current_week',
} as const

// Utility functions
export const storage = {
  // Generic storage functions with error handling
  setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      return null
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  },

  clear(): boolean {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  },

  // User Profile functions
  saveUserProfile(profile: UserProfile): boolean {
    return this.setItem(STORAGE_KEYS.USER_PROFILE, profile)
  },

  getUserProfile(): UserProfile | null {
    return this.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE)
  },

  updateUserProfile(updates: Partial<UserProfile>): boolean {
    const current = this.getUserProfile()
    if (!current) return false
    
    const updated = { ...current, ...updates }
    return this.saveUserProfile(updated)
  },

  // Check-in functions
  saveCheckIn(checkIn: CheckInData): boolean {
    const checkIns = this.getCheckIns()
    const updated = [...checkIns, checkIn]
    return this.setItem(STORAGE_KEYS.CHECK_INS, updated)
  },

  getCheckIns(): CheckInData[] {
    return this.getItem<CheckInData[]>(STORAGE_KEYS.CHECK_INS) || []
  },

  getCheckInByWeek(weekStartDate: string, userId: string): CheckInData | null {
    const checkIns = this.getCheckIns()
    return checkIns.find(ci => 
      ci.weekStartDate === weekStartDate && ci.userId === userId
    ) || null
  },

  getUserCheckIns(userId: string): CheckInData[] {
    const checkIns = this.getCheckIns()
    return checkIns.filter(ci => ci.userId === userId)
  },

  getGroupCheckInsByWeek(groupId: string, weekStartDate: string): CheckInData[] {
    const checkIns = this.getCheckIns()
    return checkIns.filter(ci => 
      ci.groupId === groupId && ci.weekStartDate === weekStartDate
    )
  },

  // Group functions
  saveGroup(group: GroupData): boolean {
    const groups = this.getGroups()
    const updated = [...groups, group]
    return this.setItem(STORAGE_KEYS.GROUPS, updated)
  },

  getGroups(): GroupData[] {
    return this.getItem<GroupData[]>(STORAGE_KEYS.GROUPS) || []
  },

  getGroupById(groupId: string): GroupData | null {
    const groups = this.getGroups()
    return groups.find(g => g.id === groupId) || null
  },

  getGroupByAccessCode(accessCode: string): GroupData | null {
    const groups = this.getGroups()
    return groups.find(g => g.accessCode === accessCode) || null
  },

  joinGroup(groupId: string, userId: string): boolean {
    const groups = this.getGroups()
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) return false
    
    const group = groups[groupIndex]
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId)
      groups[groupIndex] = group
      return this.setItem(STORAGE_KEYS.GROUPS, groups)
    }
    
    return true
  },

  // Friends functions
  saveFriend(friend: FriendData): boolean {
    const friends = this.getFriends()
    const existingIndex = friends.findIndex(f => f.id === friend.id)
    
    if (existingIndex >= 0) {
      friends[existingIndex] = friend
    } else {
      friends.push(friend)
    }
    
    return this.setItem(STORAGE_KEYS.FRIENDS, friends)
  },

  getFriends(): FriendData[] {
    return this.getItem<FriendData[]>(STORAGE_KEYS.FRIENDS) || []
  },

  getGroupFriends(groupId: string): FriendData[] {
    const friends = this.getFriends()
    return friends.filter(f => f.groupId === groupId)
  },

  // Week utilities
  getCurrentWeekStart(): string {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString()
  },

  getWeekStartFromDate(date: Date): string {
    const dayOfWeek = date.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(date)
    monday.setDate(date.getDate() + daysToMonday)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString()
  },

  formatWeekRange(weekStartDate: string): string {
    const start = new Date(weekStartDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  },

  // Data management
  exportAllData(): string {
    const data = {
      userProfile: this.getUserProfile(),
      checkIns: this.getCheckIns(),
      groups: this.getGroups(),
      friends: this.getFriends(),
      exportedAt: new Date().toISOString(),
    }
    
    return JSON.stringify(data, null, 2)
  },

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.userProfile) this.saveUserProfile(data.userProfile)
      if (data.checkIns) this.setItem(STORAGE_KEYS.CHECK_INS, data.checkIns)
      if (data.groups) this.setItem(STORAGE_KEYS.GROUPS, data.groups)
      if (data.friends) this.setItem(STORAGE_KEYS.FRIENDS, data.friends)
      
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  },

  clearAllData(): boolean {
    const keys = Object.values(STORAGE_KEYS)
    let success = true
    
    keys.forEach(key => {
      if (!this.removeItem(key)) {
        success = false
      }
    })
    
    return success
  }
}

// ID generation utility
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Access code generation utility
export const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
} 