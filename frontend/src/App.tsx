import { useState } from 'react'
import CheckInForm from './components/CheckInForm'
import WelcomeScreen from './components/WelcomeScreen'
import ScoreDisplay from './components/ScoreDisplay'
import AuthForm from './components/AuthForm'
import UserProfile from './components/UserProfile'
import GroupJoin from './components/GroupJoin'
import InstallPrompt from './components/InstallPrompt'
import ToastContainer from './components/ToastContainer'
import { useIsUserLoggedIn, useUser, useCanCheckInThisWeek } from './store/userStore'
import { initializeMockData } from './utils/mockData'
import { useEffect } from 'react'

function App() {
  const isLoggedIn = useIsUserLoggedIn()
  const user = useUser()
  const canCheckIn = useCanCheckInThisWeek()
  
  const [currentStep, setCurrentStep] = useState<'welcome' | 'checkin' | 'results'>('welcome')
  const [checkInData, setCheckInData] = useState<{
    productive: number
    satisfied: number
    body: number
    care: number
  } | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showGroupJoin, setShowGroupJoin] = useState(false)

  // Initialize mock data on app start
  useEffect(() => {
    initializeMockData()
  }, [])

  const handleUserSetupComplete = () => {
    // User setup is complete, check if they need to join a group
    if (!user?.currentGroupId) {
      setShowGroupJoin(true)
    } else {
      setCurrentStep('welcome')
    }
  }

  const handleGroupJoinSuccess = (_groupName: string) => {
    setShowGroupJoin(false)
    setCurrentStep('welcome')
    // You could show a success message here
  }

  const handleGroupJoinSkip = () => {
    setShowGroupJoin(false)
    setCurrentStep('welcome')
  }

  const handleStartCheckIn = () => {
    setCurrentStep('checkin')
  }

  const handleCheckInComplete = (data: { productive: number; satisfied: number; body: number; care: number }) => {
    setCheckInData(data)
    setCurrentStep('results')
  }

  const handleStartOver = () => {
    setCurrentStep('welcome')
    setCheckInData(null)
  }

  // Show user setup if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              <span className="celebration-gradient bg-clip-text text-transparent">
                HuCares
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Celebrate life together with weekly wellness check-ins
            </p>
          </header>
          
          <main className="max-w-2xl mx-auto">
            <AuthForm onComplete={handleUserSetupComplete} />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 relative">
          {user && (
            <button
              onClick={() => setShowProfile(true)}
              className="absolute top-0 right-0 p-2 text-gray-500 hover:text-primary-600 transition-colors"
              title="View Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <span className="celebration-gradient bg-clip-text text-transparent">
              HuCares
            </span>
          </h1>
          <p className="text-gray-600 text-lg">
            Celebrate life together with weekly wellness check-ins
          </p>
          {user && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm">
                Welcome back, <span className="font-medium text-primary-600">{user.username}</span>! 👋
              </p>
              {!canCheckIn && (
                <p className="text-celebration-600 text-xs mt-1">
                  ✨ You've already checked in this week!
                </p>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto">
          {currentStep === 'welcome' && (
            <WelcomeScreen 
              onStartCheckIn={handleStartCheckIn} 
              canCheckIn={canCheckIn}
              username={user?.username || 'Friend'}
            />
          )}
          
          {currentStep === 'checkin' && (
            <CheckInForm onComplete={handleCheckInComplete} />
          )}
          
          {currentStep === 'results' && checkInData && (
            <ScoreDisplay 
              data={checkInData} 
              onStartOver={handleStartOver}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500">
          <p>Built with ❤️ for celebrating life's moments</p>
        </footer>
        
        {/* Profile Modal */}
        {showProfile && (
          <UserProfile onClose={() => setShowProfile(false)} />
        )}
        
        {/* Group Join Modal */}
        {showGroupJoin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-md w-full">
              <GroupJoin 
                onJoinSuccess={handleGroupJoinSuccess}
                onSkip={handleGroupJoinSkip}
              />
            </div>
          </div>
                 )}
        </div>
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    )
  }

export default App 