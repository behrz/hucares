import { useState } from 'react'
import { Group as ApiGroup } from '../utils/api'

interface GroupSuccessProps {
  group: ApiGroup
  onContinue: () => void
}

export default function GroupSuccess({ group, onContinue }: GroupSuccessProps) {
  const [copied, setCopied] = useState(false)

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(group.accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = group.accessCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareInvite = () => {
    const message = `Hey! I just created a HuCares group called "${group.name}" for our weekly wellness check-ins. Join me with access code: ${group.accessCode}

HuCares helps us stay connected through weekly check-ins and celebrate life together! 🌟`

    if (navigator.share) {
      navigator.share({
        title: `Join my HuCares group: ${group.name}`,
        text: message,
        url: window.location.origin
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(message)
      alert('Invitation copied to clipboard!')
    }
  }

  const generateInviteLink = () => {
    return `${window.location.origin}?join=${group.accessCode}`
  }

  return (
    <div className="card p-8 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 celebration-gradient rounded-full flex items-center justify-center">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Group Created Successfully!
        </h2>
        <p className="text-gray-600">
          Your HuCares group is ready for weekly check-ins
        </p>
      </div>

      {/* Group Info */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-1">{group.name}</h3>
        {group.description && (
          <p className="text-gray-600 text-sm mb-3">{group.description}</p>
        )}
        
        {/* Access Code */}
        <div className="bg-white rounded-lg p-3 border-2 border-dashed border-primary-300">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Share this access code:</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold text-primary-600 font-mono tracking-wider">
                {group.accessCode}
              </span>
              <button
                onClick={copyAccessCode}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Copy access code"
              >
                {copied ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Copied! ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-800 text-center">Invite Your Friends</h4>
        
        <button
          onClick={shareInvite}
          className="w-full btn-primary"
        >
          Share Invitation 📤
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyAccessCode}
            className="btn-outline text-sm"
          >
            {copied ? 'Copied! ✓' : 'Copy Code 📋'}
          </button>
          
          <button
            onClick={() => {
              const link = generateInviteLink()
              navigator.clipboard.writeText(link)
              alert('Invite link copied!')
            }}
            className="btn-outline text-sm"
          >
            Copy Link 🔗
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-800 mb-2">How to invite friends:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Share the access code: <span className="font-mono font-semibold">{group.accessCode}</span></li>
          <li>2. Friends visit HuCares and join with the code</li>
          <li>3. Start weekly check-ins together!</li>
          <li>4. Celebrate each other's journey 🌟</li>
        </ol>
      </div>

      {/* Admin Badge */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-celebration-100 text-celebration-800">
          <span className="mr-1">👑</span>
          You're the group admin
        </span>
      </div>

      <button
        onClick={onContinue}
        className="w-full btn-primary"
      >
        Start Using HuCares! ✨
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can always find your access code in group settings
      </p>
    </div>
  )
} 