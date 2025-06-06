import { useUser } from '../store/userStore'
import { storage } from '../utils/localStorage'

interface HistoryViewProps {
  onClose: () => void
}

export default function HistoryView({ onClose }: HistoryViewProps) {
  const user = useUser()
  
  if (!user) return null

  const userCheckIns = storage.getUserCheckIns(user.id)
    .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())

  const totalCheckIns = userCheckIns.length
  const averageScore = totalCheckIns > 0 
    ? Math.round((userCheckIns.reduce((sum, ci) => sum + ci.huCaresScore, 0) / totalCheckIns) * 10) / 10
    : 0
  const highestScore = totalCheckIns > 0 ? Math.max(...userCheckIns.map(ci => ci.huCaresScore)) : 0
  const weekStreak = calculateWeekStreak(userCheckIns)

  const getScoreColor = (score: number) => {
    if (score >= 25) return 'text-celebration-600 bg-celebration-50'
    if (score >= 20) return 'text-primary-600 bg-primary-50'
    if (score >= 15) return 'text-secondary-600 bg-secondary-50'
    if (score >= 10) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 25) return '🌟'
    if (score >= 20) return '✨'
    if (score >= 15) return '🎉'
    if (score >= 10) return '👍'
    return '💪'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your HuCares History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{totalCheckIns}</div>
            <div className="text-xs text-gray-600">Total Check-ins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">{averageScore}</div>
            <div className="text-xs text-gray-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-celebration-600">{highestScore}</div>
            <div className="text-xs text-gray-600">Highest Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{weekStreak}</div>
            <div className="text-xs text-gray-600">Week Streak</div>
          </div>
        </div>

        {/* Check-in History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Check-ins</h3>
          
          {userCheckIns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No check-ins yet</p>
              <p className="text-sm mt-1">Complete your first check-in to start tracking your journey! 🌟</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-800">
                        Week of {storage.formatWeekRange(checkIn.weekStartDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(checkIn.submittedAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getScoreColor(checkIn.huCaresScore)}`}>
                      <span className="text-lg mr-1">{getScoreEmoji(checkIn.huCaresScore)}</span>
                      <span className="font-bold">{checkIn.huCaresScore}</span>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">⚡</span>
                      <div>
                        <div className="text-gray-600">Productive</div>
                        <div className="font-medium">{checkIn.productive}/10</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">😊</span>
                      <div>
                        <div className="text-gray-600">Satisfied</div>
                        <div className="font-medium">{checkIn.satisfied}/10</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">💪</span>
                      <div>
                        <div className="text-gray-600">Body</div>
                        <div className="font-medium">{checkIn.body}/10</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">❤️</span>
                      <div>
                        <div className="text-gray-600">Care</div>
                        <div className="font-medium">{checkIn.care}/10</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center">
          <button onClick={onClose} className="btn-primary">
            Close History
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate week streak
function calculateWeekStreak(checkIns: any[]): number {
  if (checkIns.length === 0) return 0

  const sortedCheckIns = checkIns.sort((a, b) => 
    new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
  )

  let streak = 0
  const currentWeek = storage.getCurrentWeekStart()
  let expectedWeek = new Date(currentWeek)

  for (const checkIn of sortedCheckIns) {
    const checkInWeek = new Date(checkIn.weekStartDate)
    
    if (checkInWeek.getTime() === expectedWeek.getTime()) {
      streak++
      expectedWeek.setDate(expectedWeek.getDate() - 7) // Go back one week
    } else {
      break
    }
  }

  return streak
} 