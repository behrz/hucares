import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState {
  toasts: Toast[]
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

type ToastStore = ToastState & ToastActions

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    const newToast = { ...toast, id }
    
    set({ toasts: [...get().toasts, newToast] })
    
    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(toast => toast.id !== id) })
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

// Helper hooks for different toast types
export const useToast = () => {
  const addToast = useToastStore(state => state.addToast)
  
  return {
    success: (message: string, duration?: number) => 
      addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => 
      addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => 
      addToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => 
      addToast({ message, type: 'warning', duration }),
    custom: (toast: Omit<Toast, 'id'>) => addToast(toast),
  }
}

export const useToasts = () => useToastStore(state => state.toasts)
export const useRemoveToast = () => useToastStore(state => state.removeToast) 