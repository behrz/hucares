import { useUser } from '../store/userStore'
import { storage } from '../utils/localStorage'
import { getGroupLeaderboard, getGroupStats } from '../utils/mockData'

interface GroupScoresProps {
  weekStartDate: string
}

interface LeaderboardEntry {
  username: string
  score: number
  hasCheckedIn: boolean
  checkInDate?: string
  isCurrentUser?: boolean
}

export default function GroupScores({ weekStartDate }: GroupScoresProps) {
  const user = useUser()
  
  if (!user?.currentGroupId) {
    return (
      <div className="card p-6">
        <div className="text-center text-gray-500">
          <p>Join a group to see friends' scores! 👥</p>
        </div>
      </div>
    )
  }

  const group = storage.getGroupById(user.currentGroupId)
  const leaderboard: LeaderboardEntry[] = getGroupLeaderboard(user.currentGroupId, weekStartDate)
  const stats = getGroupStats(user.currentGroupId, weekStartDate)
  
  // Add user's score to leaderboard if they've checked in
  const userCheckIn = storage.getCheckInByWeek(weekStartDate, user.id)
  if (userCheckIn) {
    const userEntry = {
      username: `${user.username} (You)`,
      score: userCheckIn.huCaresScore,
      hasCheckedIn: true,
      checkInDate: userCheckIn.submittedAt,
      isCurrentUser: true
    }
    
    // Insert user entry in correct position
    const userIndex = leaderboard.findIndex(entry => entry.score <= userCheckIn.huCaresScore)
    if (userIndex === -1) {
      leaderboard.push(userEntry)
    } else {
      leaderboard.splice(userIndex, 0, userEntry)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 25) return 'text-celebration-600'
    if (score >= 20) return 'text-primary-600'
    if (score >= 15) return 'text-secondary-600'
    if (score >= 10) return 'text-green-600'
    return 'text-gray-600'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 25) return '🌟'
    if (score >= 20) return '✨'
    if (score >= 15) return '🎉'
    if (score >= 10) return '👍'
    return '💪'
  }

  return (
    <div className="space-y-6">
      {/* Group Info */}
      <div className="card p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {group?.name || 'Your Group'}
          </h3>
          <p className="text-gray-600 text-sm">
            {group?.description || 'Weekly check-ins with your friends'}
          </p>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.checkedInCount}/{stats.totalMembers}
            </div>
            <div className="text-xs text-gray-600">Checked In</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-600">
              {Math.round(stats.participationRate)}%
            </div>
            <div className="text-xs text-gray-600">Participation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-celebration-600">
              {stats.averageScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.highestScore}
            </div>
            <div className="text-xs text-gray-600">Highest</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          This Week's Scores
        </h4>
        
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={`${entry.username}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.isCurrentUser 
                  ? 'bg-primary-50 border-2 border-primary-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  index === 0 ? 'bg-celebration-200 text-celebration-800' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-200 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className={`font-medium ${entry.isCurrentUser ? 'text-primary-800' : 'text-gray-800'}`}>
                    {entry.username}
                  </div>
                  {entry.hasCheckedIn && entry.checkInDate && (
                    <div className="text-xs text-gray-500">
                      {new Date(entry.checkInDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                {entry.hasCheckedIn ? (
                  <>
                    <span className="text-lg mr-2">{getScoreEmoji(entry.score)}</span>
                    <span className={`text-xl font-bold ${getScoreColor(entry.score)}`}>
                      {entry.score}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm italic">Not yet</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No check-ins yet this week</p>
            <p className="text-sm mt-1">Be the first to check in! 🌟</p>
          </div>
        )}
      </div>

      {/* Encouragement Messages */}
      <div className="card p-4">
        <div className="text-center">
          {stats.checkedInCount === stats.totalMembers ? (
            <p className="text-celebration-600 font-medium">
              🎉 Everyone checked in this week! Amazing group! 🎉
            </p>
          ) : (
            <p className="text-gray-600">
              {stats.totalMembers - stats.checkedInCount} friend{stats.totalMembers - stats.checkedInCount === 1 ? '' : 's'} still need to check in this week
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 