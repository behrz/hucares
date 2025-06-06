import { useState } from 'react'
import { storage, generateId, CheckInData } from '../utils/localStorage'
import { useUser, useUserStore } from '../store/userStore'

interface CheckInFormProps {
  onComplete: (data: { productive: number; satisfied: number; body: number; care: number }) => void
}

const questions = [
  {
    id: 'productive',
    label: 'How productive did you feel this week?',
    description: 'Rate your sense of accomplishment and progress',
    emoji: '⚡',
    color: 'primary'
  },
  {
    id: 'satisfied',
    label: 'How satisfied were you with your week?',
    description: 'Rate your overall contentment and fulfillment',
    emoji: '😊',
    color: 'secondary'
  },
  {
    id: 'body',
    label: 'How good did you feel physically?',
    description: 'Rate your physical energy and well-being',
    emoji: '💪',
    color: 'celebration'
  },
  {
    id: 'care',
    label: 'How much did you care about things outside yourself?',
    description: 'Rate your connection to others and the world around you',
    emoji: '❤️',
    color: 'pink'
  }
]

export default function CheckInForm({ onComplete }: CheckInFormProps) {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const user = useUser()
  const markCheckInCompleted = useUserStore(state => state.markCheckInCompleted)

  const handleScoreSelect = async (score: number) => {
    const questionId = questions[currentQuestion].id
    const newResponses = { ...responses, [questionId]: score }
    setResponses(newResponses)

    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      // Survey complete - save to localStorage
      setIsSubmitting(true)
      
      setTimeout(async () => {
        const checkInData = {
          productive: newResponses.productive,
          satisfied: newResponses.satisfied,
          body: newResponses.body,
          care: newResponses.care
        }

        // Save to localStorage if user exists
        if (user) {
          const huCaresScore = checkInData.productive + checkInData.satisfied + checkInData.body - checkInData.care
          
          const checkIn: CheckInData = {
            id: generateId(),
            userId: user.id,
            groupId: user.currentGroupId || 'default-group',
            weekStartDate: storage.getCurrentWeekStart(),
            productive: checkInData.productive,
            satisfied: checkInData.satisfied,
            body: checkInData.body,
            care: checkInData.care,
            huCaresScore: huCaresScore,
            submittedAt: new Date().toISOString()
          }

          const success = storage.saveCheckIn(checkIn)
          
          if (success) {
            // Mark user as having completed check-in this week
            markCheckInCompleted()
            
            // Call parent completion handler
            onComplete(checkInData)
          } else {
            console.error('Failed to save check-in data')
            // Still call completion handler even if save failed
            onComplete(checkInData)
          }
        } else {
          // No user, just call completion handler
          onComplete(checkInData)
        }
        
        setIsSubmitting(false)
      }, 300)
    }
  }

  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="card p-8 animate-fade-in">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{currentQ.emoji}</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {currentQ.label}
        </h2>
        <p className="text-gray-600">
          {currentQ.description}
        </p>
      </div>

      {/* Score Selection */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>Not at all</span>
          <span>Extremely</span>
        </div>
        <div className="grid grid-cols-10 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <button
              key={score}
              onClick={() => handleScoreSelect(score)}
              className={`
                aspect-square rounded-lg border-2 font-semibold text-lg transition-all duration-200
                hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${responses[currentQ.id] === score
                  ? `bg-${currentQ.color}-500 border-${currentQ.color}-500 text-white shadow-lg`
                  : `border-gray-300 hover:border-${currentQ.color}-400 hover:bg-${currentQ.color}-50`
                }
              `}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Saving your check-in...</p>
          </div>
        ) : (
          <p>Click a number from 1 (lowest) to 10 (highest)</p>
        )}
      </div>
    </div>
  )
} 