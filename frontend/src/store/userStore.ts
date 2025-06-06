import { create } from 'zustand'
import { api, User as ApiUser, Group as ApiGroup } from '../utils/api'

// Map API types to local types for compatibility
interface UserProfile {
  id: string
  username: string
  email?: string
  createdAt: string
  lastCheckInDate?: string
  currentGroupId?: string
}

interface UserState {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  currentGroup: ApiGroup | null
}

interface UserActions {
  initializeUser: () => Promise<void>
  createUser: (username: string, password: string, email?: string) => Promise<boolean>
  loginUser: (username: string, password: string) => Promise<boolean>
  updateUser: (updates: Partial<UserProfile>) => Promise<boolean>
  logoutUser: () => Promise<void>
  clearUser: () => void
  setCurrentGroup: (groupId: string) => Promise<boolean>
  markCheckInCompleted: () => Promise<boolean>
  loadUserGroups: () => Promise<ApiGroup[]>
  joinGroup: (accessCode: string) => Promise<boolean>
  createGroup: (name: string, description?: string) => Promise<boolean>
}

type UserStore = UserState & UserActions

// Helper function to convert API user to UserProfile
const mapApiUserToProfile = (apiUser: ApiUser, currentGroupId?: string): UserProfile => ({
  id: apiUser.id,
  username: apiUser.username,
  email: apiUser.email,
  createdAt: apiUser.createdAt,
  currentGroupId,
})

// Helper function to get current week start (Monday)
const getCurrentWeekStart = (): string => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  currentGroup: null,

  // Initialize user from API on app start
  initializeUser: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Check if we have a valid token
      if (!api.auth.isAuthenticated()) {
        set({ user: null, isLoading: false })
        return
      }

      // Get current user from API
      const response = await api.auth.getCurrentUser()
      
      if (response.success && response.data) {
        // Get user's groups to find current group
        const groupsResponse = await api.groups.getUserGroups()
        const groups = groupsResponse.success ? groupsResponse.data || [] : []
        
        // For now, use the first group as current group
        const currentGroup = groups.length > 0 ? groups[0] : null
        
        const userProfile = mapApiUserToProfile(response.data, currentGroup?.id)
        
        set({ 
          user: userProfile,
          currentGroup,
          isLoading: false 
        })
      } else {
        set({ 
          user: null,
          error: response.error || 'Failed to load user profile', 
          isLoading: false 
        })
      }
    } catch (error) {
      console.error('Initialize user error:', error)
      set({ 
        user: null,
        error: 'Failed to load user profile', 
        isLoading: false 
      })
    }
  },

  // Create a new user with username and password
  createUser: async (username: string, password: string, email?: string) => {
    if (!username.trim() || !password.trim()) {
      set({ error: 'Username and password are required' })
      return false
    }

    // Validate username (3-20 characters, alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      set({ error: 'Username must be 3-20 characters (letters, numbers, underscore only)' })
      return false
    }

    // Validate password (minimum 8 characters)
    if (password.length < 8) {
      set({ error: 'Password must be at least 8 characters long' })
      return false
    }

    set({ isLoading: true, error: null })

    try {
      const response = await api.auth.register(username.trim(), password, email?.trim())
      
      if (response.success && response.data) {
        const userProfile = mapApiUserToProfile(response.data.user)
        
        set({ 
          user: userProfile, 
          error: null,
          isLoading: false
        })
        return true
      } else {
        set({ 
          error: response.error || 'Failed to create account',
          isLoading: false
        })
        return false
      }
    } catch (error) {
      console.error('Create user error:', error)
      set({ 
        error: 'Failed to create account',
        isLoading: false
      })
      return false
    }
  },

  // Login existing user
  loginUser: async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      set({ error: 'Username and password are required' })
      return false
    }

    set({ isLoading: true, error: null })

    try {
      const response = await api.auth.login(username.trim(), password)
      
      if (response.success && response.data) {
        // Get user's groups after login
        const groupsResponse = await api.groups.getUserGroups()
        const groups = groupsResponse.success ? groupsResponse.data || [] : []
        const currentGroup = groups.length > 0 ? groups[0] : null
        
        const userProfile = mapApiUserToProfile(response.data.user, currentGroup?.id)
        
        set({ 
          user: userProfile,
          currentGroup,
          error: null,
          isLoading: false
        })
        return true
      } else {
        set({ 
          error: response.error || 'Login failed',
          isLoading: false
        })
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      set({ 
        error: 'Login failed',
        isLoading: false
      })
      return false
    }
  },

  // Update user profile (not fully supported by API yet)
  updateUser: async (updates: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) {
      set({ error: 'No user to update' })
      return false
    }

    // For now, just update local state
    // TODO: Implement user profile update API endpoint
    const updatedUser = { ...user, ...updates }
    set({ 
      user: updatedUser, 
      error: null 
    })
    return true
  },

  // Logout user
  logoutUser: async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      set({ 
        user: null, 
        currentGroup: null,
        error: null 
      })
    }
  },

  // Clear user data (destructive)
  clearUser: () => {
    set({ 
      user: null, 
      currentGroup: null,
      error: null 
    })
  },

  // Load user's groups
  loadUserGroups: async () => {
    try {
      const response = await api.groups.getUserGroups()
      
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to load groups:', response.error)
        return []
      }
    } catch (error) {
      console.error('Load groups error:', error)
      return []
    }
  },

  // Set current group for user
  setCurrentGroup: async (groupId: string) => {
    try {
      const response = await api.groups.getGroup(groupId)
      
      if (response.success && response.data) {
        const { updateUser } = get()
        const success = await updateUser({ currentGroupId: groupId })
        
        if (success) {
          set({ currentGroup: response.data })
          return true
        }
      }
      
      set({ error: 'Failed to set current group' })
      return false
    } catch (error) {
      console.error('Set current group error:', error)
      set({ error: 'Failed to set current group' })
      return false
    }
  },

  // Join a group with access code
  joinGroup: async (accessCode: string) => {
    if (!accessCode.trim()) {
      set({ error: 'Access code is required' })
      return false
    }

    set({ isLoading: true, error: null })

    try {
      const response = await api.groups.joinGroup(accessCode.trim())
      
      if (response.success && response.data) {
        // Set as current group
        set({ 
          currentGroup: response.data,
          isLoading: false 
        })
        
        // Update user's current group
        const { updateUser } = get()
        await updateUser({ currentGroupId: response.data.id })
        
        return true
      } else {
        set({ 
          error: response.error || 'Failed to join group',
          isLoading: false
        })
        return false
      }
    } catch (error) {
      console.error('Join group error:', error)
      set({ 
        error: 'Failed to join group',
        isLoading: false
      })
      return false
    }
  },

  // Create a new group
  createGroup: async (name: string, description?: string) => {
    if (!name.trim()) {
      set({ error: 'Group name is required' })
      return false
    }

    set({ isLoading: true, error: null })

    try {
      const response = await api.groups.createGroup(name.trim(), description?.trim())
      
      if (response.success && response.data) {
        // Set as current group
        set({ 
          currentGroup: response.data,
          isLoading: false 
        })
        
        // Update user's current group
        const { updateUser } = get()
        await updateUser({ currentGroupId: response.data.id })
        
        return true
      } else {
        set({ 
          error: response.error || 'Failed to create group',
          isLoading: false
        })
        return false
      }
    } catch (error) {
      console.error('Create group error:', error)
      set({ 
        error: 'Failed to create group',
        isLoading: false
      })
      return false
    }
  },

  // Mark check-in as completed for this week
  markCheckInCompleted: async () => {
    const { updateUser } = get()
    return updateUser({ 
      lastCheckInDate: getCurrentWeekStart()
    })
  },
}))

// Computed selectors (hooks)
export const useUser = () => useUserStore(state => state.user)
export const useCurrentGroup = () => useUserStore(state => state.currentGroup)
export const useUserLoading = () => useUserStore(state => state.isLoading)
export const useUserError = () => useUserStore(state => state.error)

// Helper hooks
export const useIsUserLoggedIn = () => {
  const user = useUser()
  return !!user && api.auth.isAuthenticated()
}

export const useCanCheckInThisWeek = () => {
  const user = useUser()
  if (!user) return false
  
  const currentWeek = getCurrentWeekStart()
  return user.lastCheckInDate !== currentWeek
}

// Initialize user on import
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid blocking the initial render
  setTimeout(() => {
    useUserStore.getState().initializeUser()
  }, 100)
} 