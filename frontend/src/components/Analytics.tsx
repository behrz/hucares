import { useState, useMemo } from 'react'
import { useUser } from '../store/userStore'
import { storage } from '../utils/localStorage'

interface AnalyticsProps {
  onClose: () => void
}

interface TrendData {
  week: string
  score: number
  productive: number
  satisfied: number
  body: number
  care: number
}

interface Insights {
  bestWeek: { week: string; score: number }
  consistentDays: string[]
  improvementAreas: string[]
  strengths: string[]
  averageScore: number
  trend: 'improving' | 'stable' | 'declining'
}

export default function Analytics({ onClose }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'insights' | 'goals'>('trends')
  
  const user = useUser()
  if (!user) return null

  const checkIns = storage.getUserCheckIns(user.id)
  
  // Prepare trend data
  const trendData: TrendData[] = useMemo(() => {
    return checkIns
      .sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime())
      .map(checkIn => ({
        week: new Date(checkIn.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: checkIn.productive + checkIn.satisfied + checkIn.body - checkIn.care,
        productive: checkIn.productive,
        satisfied: checkIn.satisfied,
        body: checkIn.body,
        care: checkIn.care
      }))
  }, [checkIns])

  // Generate insights
  const insights: Insights = useMemo(() => {
    if (checkIns.length === 0) {
      return {
        bestWeek: { week: 'N/A', score: 0 },
        consistentDays: [],
        improvementAreas: [],
        strengths: [],
        averageScore: 0,
        trend: 'stable'
      }
    }

    const scores = trendData.map(d => d.score)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    // Find best week
    const bestWeek = trendData.reduce((best, current) => 
      current.score > best.score ? current : best
    , trendData[0])

    // Calculate averages for each metric
    const avgProductive = trendData.reduce((sum, d) => sum + d.productive, 0) / trendData.length
    const avgSatisfied = trendData.reduce((sum, d) => sum + d.satisfied, 0) / trendData.length
    const avgBody = trendData.reduce((sum, d) => sum + d.body, 0) / trendData.length
    const avgCare = trendData.reduce((sum, d) => sum + d.care, 0) / trendData.length

    // Determine strengths (scores above 7)
    const strengths = []
    if (avgProductive >= 7) strengths.push('Productivity')
    if (avgSatisfied >= 7) strengths.push('Life Satisfaction')
    if (avgBody >= 7) strengths.push('Physical Wellness')
    if (avgCare <= 3) strengths.push('Self-Care Balance')

    // Determine improvement areas (scores below 6)
    const improvementAreas = []
    if (avgProductive < 6) improvementAreas.push('Productivity')
    if (avgSatisfied < 6) improvementAreas.push('Life Satisfaction')
    if (avgBody < 6) improvementAreas.push('Physical Wellness')
    if (avgCare > 4) improvementAreas.push('Work-Life Balance')

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (scores.length >= 3) {
      const recent = scores.slice(-3)
      const earlier = scores.slice(0, -3)
      if (earlier.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
        const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
        if (recentAvg > earlierAvg + 2) trend = 'improving'
        else if (recentAvg < earlierAvg - 2) trend = 'declining'
      }
    }

    return {
      bestWeek,
      consistentDays: [], // Could analyze check-in timing patterns
      improvementAreas,
      strengths,
      averageScore,
      trend
    }
  }, [trendData, checkIns])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      default: return '➡️'
    }
  }

  const renderTrendChart = () => {
    if (trendData.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <span className="text-4xl mb-4 block">📊</span>
          <h3 className="font-medium text-gray-800 mb-2">No Data Yet</h3>
          <p className="text-gray-600 text-sm">Complete a few weekly check-ins to see your trends!</p>
        </div>
      )
    }

    const maxScore = Math.max(...trendData.map(d => d.score))
    const minScore = Math.min(...trendData.map(d => d.score))
    const range = Math.max(maxScore - minScore, 10) // Minimum range of 10

    return (
      <div className="space-y-6">
        {/* Score Trend Line */}
        <div className="bg-white rounded-lg p-4 border">
          <h3 className="font-medium text-gray-800 mb-4">HuCares Score Trend</h3>
          <div className="relative h-32 flex items-end justify-between">
            {trendData.map((point, index) => {
              const height = ((point.score - minScore) / range) * 100
              const isLast = index === trendData.length - 1
              return (
                <div key={point.week} className="flex flex-col items-center">
                  <div 
                    className={`w-6 rounded-t transition-all duration-300 ${
                      point.score >= 20 ? 'bg-green-500' :
                      point.score >= 15 ? 'bg-yellow-500' :
                      point.score >= 10 ? 'bg-orange-500' : 'bg-red-500'
                    } ${isLast ? 'shadow-lg' : ''}`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                    title={`Score: ${point.score}`}
                  />
                  <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                    {point.week}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <span>Min: {minScore}</span>
            <span>Max: {maxScore}</span>
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="grid grid-cols-2 gap-4">
                   {['productive', 'satisfied', 'body', 'care'].map(metric => {
           const latest = trendData[trendData.length - 1]
           const average = trendData.reduce((sum, d) => {
             const value = metric === 'productive' ? d.productive :
                          metric === 'satisfied' ? d.satisfied :
                          metric === 'body' ? d.body :
                          metric === 'care' ? d.care : 0
             return sum + value
           }, 0) / trendData.length
           const isInverted = metric === 'care'
            
                       return (
             <div key={metric} className="bg-gray-50 rounded-lg p-3">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-medium text-gray-700 capitalize">{metric}</span>
                 <span className="text-lg font-bold text-gray-800">
                   {metric === 'productive' ? latest.productive :
                    metric === 'satisfied' ? latest.satisfied :
                    metric === 'body' ? latest.body :
                    metric === 'care' ? latest.care : latest.score}
                 </span>
               </div>
               <div className="text-xs text-gray-600">
                 Avg: {average.toFixed(1)} {isInverted ? '(lower is better)' : ''}
               </div>
             </div>
           )
          })}
        </div>
      </div>
    )
  }

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Overall Trend */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{getTrendIcon(insights.trend)}</span>
          <h3 className="font-semibold text-gray-800">Overall Trend</h3>
        </div>
        <p className="text-gray-700">
          Your wellness journey is {insights.trend}! 
          Average score: <span className="font-semibold">{insights.averageScore.toFixed(1)}</span>
        </p>
      </div>

      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💪</span>
            <h3 className="font-semibold text-green-800">Your Strengths</h3>
          </div>
          <div className="space-y-1">
            {insights.strengths.map((strength, index) => (
              <p key={index} className="text-green-700 text-sm">✓ {strength}</p>
            ))}
          </div>
        </div>
      )}

      {/* Growth Areas */}
      {insights.improvementAreas.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🎯</span>
            <h3 className="font-semibold text-blue-800">Growth Opportunities</h3>
          </div>
          <div className="space-y-1">
            {insights.improvementAreas.map((area, index) => (
              <p key={index} className="text-blue-700 text-sm">→ Focus on {area}</p>
            ))}
          </div>
        </div>
      )}

      {/* Best Week */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">🌟</span>
          <h3 className="font-semibold text-yellow-800">Best Week</h3>
        </div>
        <p className="text-yellow-700">
          Week of {insights.bestWeek.week} with a score of {insights.bestWeek.score}!
          What made that week special?
        </p>
      </div>

      {/* Personalized Tips */}
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">💡</span>
          <h3 className="font-semibold text-purple-800">Personalized Tips</h3>
        </div>
        <div className="space-y-2 text-sm text-purple-700">
          {insights.trend === 'declining' && (
            <p>• Consider what changed recently - reflect on your routine</p>
          )}
          {insights.improvementAreas.includes('Physical Wellness') && (
            <p>• Try adding 10 minutes of movement to your daily routine</p>
          )}
          {insights.improvementAreas.includes('Life Satisfaction') && (
            <p>• Schedule one small thing you enjoy each day</p>
          )}
          {insights.improvementAreas.includes('Productivity') && (
            <p>• Break large tasks into smaller, manageable steps</p>
          )}
          {insights.improvementAreas.includes('Work-Life Balance') && (
            <p>• Set boundaries - schedule time for yourself</p>
          )}
          <p>• Keep celebrating your progress - every step counts! 🌟</p>
        </div>
      </div>
    </div>
  )

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-4xl mb-4 block">🎯</span>
        <h3 className="font-medium text-gray-800 mb-2">Goal Tracking</h3>
        <p className="text-gray-600 text-sm">Coming soon! Set weekly goals and track your progress.</p>
      </div>
      
      {/* Sample Goals Preview */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-4 opacity-50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Maintain score above 15</span>
            <span className="text-sm text-gray-500">0/4 weeks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 opacity-50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Check in every week</span>
            <span className="text-sm text-gray-500">{checkIns.length}/52 weeks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-secondary-600 h-2 rounded-full" style={{ width: `${Math.min((checkIns.length / 52) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your Analytics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'insights', label: 'Insights', icon: '💡' },
            { id: 'goals', label: 'Goals', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'trends' && renderTrendChart()}
          {activeTab === 'insights' && renderInsights()}
          {activeTab === 'goals' && renderGoals()}
        </div>
      </div>
    </div>
  )
} 