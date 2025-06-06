interface WelcomeScreenProps {
  onStartCheckIn: () => void
  canCheckIn: boolean
  username: string
}

export default function WelcomeScreen({ onStartCheckIn, canCheckIn, username }: WelcomeScreenProps) {
  return (
    <div className="card p-8 text-center animate-fade-in">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-3xl">🌟</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {canCheckIn ? `Ready for your weekly check-in, ${username}?` : `Great job this week, ${username}!`}
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          {canCheckIn 
            ? 'Take a moment to reflect on your week and celebrate the journey. Answer 4 simple questions to calculate your HuCares score and connect with friends.'
            : 'You\'ve already completed your check-in this week! Come back next Monday for another reflection.'
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-medium text-gray-800 mb-3">This week we'll explore:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
            How productive you felt
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></span>
            Your satisfaction level
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-celebration-500 rounded-full mr-2"></span>
            Physical well-being
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
            Care for others
          </div>
        </div>
      </div>

      <button 
        onClick={onStartCheckIn}
        disabled={!canCheckIn}
        className={`text-lg px-8 py-4 animate-slide-up ${
          canCheckIn 
            ? 'btn-primary' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
        }`}
      >
        {canCheckIn ? 'Start My Check-In ✨' : 'Check-In Complete 🎉'}
      </button>

      <p className="text-xs text-gray-500 mt-4">
        {canCheckIn 
          ? 'Takes about 2 minutes • Your responses help celebrate our community'
          : 'You can submit one check-in per week • Next check-in available Monday'
        }
      </p>
    </div>
  )
} 