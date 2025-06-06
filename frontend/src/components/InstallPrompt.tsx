import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 10000) // Show after 10 seconds
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('🎉 HuCares PWA was installed!')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt')
    } else {
      console.log('❌ User dismissed the install prompt')
    }

    // Clear the saved prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    
    // Don't show again for this session
    sessionStorage.setItem('hucares-install-dismissed', 'true')
  }

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('hucares-install-dismissed')) {
    return null
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="card p-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">📱</span>
              <h3 className="font-semibold text-lg">Install HuCares</h3>
            </div>
            <p className="text-white/90 text-sm mb-3">
              Add HuCares to your home screen for the best experience! Get notifications, offline access, and quick check-ins.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-primary-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                Install App ✨
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white text-xl ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for manual install trigger
export const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const triggerInstall = () => {
    const event = new CustomEvent('manual-install-trigger')
    window.dispatchEvent(event)
  }

  return { canInstall, triggerInstall }
} 