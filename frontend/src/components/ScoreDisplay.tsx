import { useState } from 'react'
import GroupScores from './GroupScores'
import HistoryView from './HistoryView'
import ShareScore from './ShareScore'
import { storage } from '../utils/localStorage'

interface ScoreDisplayProps {
  data: {
    productive: number
    satisfied: number
    body: number
    care: number
  }
  onStartOver: () => void
}

export default function ScoreDisplay({ data, onStartOver }: ScoreDisplayProps) {
  const huCaresScore = data.productive + data.satisfied + data.body - data.care
  const currentWeek = storage.getCurrentWeekStart()
  const [showHistory, setShowHistory] = useState(false)
  const [showShare, setShowShare] = useState(false)
  
  const getScoreMessage = (score: number) => {
    if (score >= 25) return { text: "Absolutely Incredible! 🌟", color: "text-celebration-600", bg: "bg-celebration-50" }
    if (score >= 20) return { text: "Amazing Week! ✨", color: "text-primary-600", bg: "bg-primary-50" }
    if (score >= 15) return { text: "Great Job! 🎉", color: "text-secondary-600", bg: "bg-secondary-50" }
    if (score >= 10) return { text: "Solid Week! 👍", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 5) return { text: "Keep Going! 💪", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { text: "Every Step Counts! 🌱", color: "text-purple-600", bg: "bg-purple-50" }
  }

  const scoreMessage = getScoreMessage(huCaresScore)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Score Card */}
      <div className="card p-8 text-center">
        <div className="mb-6">
          <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center ${scoreMessage.bg} border-4 border-current ${scoreMessage.color}`}>
            <div className="text-center">
              <div className="text-4xl font-bold">{huCaresScore}</div>
              <div className="text-xs uppercase tracking-wide">HuCares</div>
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${scoreMessage.color}`}>
            {scoreMessage.text}
          </h2>
          <p className="text-gray-600">
            Your HuCares score for this week
          </p>
        </div>

        <div className="celebration-gradient rounded-lg p-6 text-white mb-6">
          <h3 className="text-xl font-semibold mb-2">Score Breakdown</h3>
          <p className="text-sm opacity-90 mb-4">
            Productive + Satisfied + Body Feeling - Care for Others
          </p>
          <div className="text-2xl font-mono">
            {data.productive} + {data.satisfied} + {data.body} - {data.care} = {huCaresScore}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week's Reflection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-primary-50 rounded-lg">
            <div className="text-2xl mr-3">⚡</div>
            <div>
              <div className="font-medium text-gray-800">Productivity</div>
              <div className="text-sm text-gray-600">You rated: {data.productive}/10</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-secondary-50 rounded-lg">
            <div className="text-2xl mr-3">😊</div>
            <div>
              <div className="font-medium text-gray-800">Satisfaction</div>
              <div className="text-sm text-gray-600">You rated: {data.satisfied}/10</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-celebration-50 rounded-lg">
            <div className="text-2xl mr-3">💪</div>
            <div>
              <div className="font-medium text-gray-800">Physical Feeling</div>
              <div className="text-sm text-gray-600">You rated: {data.body}/10</div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-pink-50 rounded-lg">
            <div className="text-2xl mr-3">❤️</div>
            <div>
              <div className="font-medium text-gray-800">Care for Others</div>
              <div className="text-sm text-gray-600">You rated: {data.care}/10</div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Scores */}
      <GroupScores weekStartDate={currentWeek} />

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        <div className="space-x-4">
          <button 
            onClick={() => setShowShare(true)}
            className="btn-primary"
          >
            Share with Friends 🎉
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="btn-outline"
          >
            View History 📊
          </button>
        </div>
        
        <button 
          onClick={onStartOver}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Take Another Check-In
        </button>
      </div>

      {/* Motivational Message */}
      <div className="text-center p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
        <p className="text-gray-700 italic">
          "Every check-in is a celebration of your journey. Keep going! 🌟"
        </p>
      </div>
      
      {/* History Modal */}
      {showHistory && (
        <HistoryView onClose={() => setShowHistory(false)} />
      )}
      
      {/* Share Modal */}
      {showShare && (
        <ShareScore data={data} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
} 