import { useState, useRef } from 'react'
import { useUser } from '../store/userStore'
import { storage } from '../utils/localStorage'

interface ShareScoreProps {
  data: {
    productive: number
    satisfied: number
    body: number
    care: number
  }
  onClose: () => void
}

export default function ShareScore({ data, onClose }: ShareScoreProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const user = useUser()
  const huCaresScore = data.productive + data.satisfied + data.body - data.care

  const getScoreMessage = (score: number) => {
    if (score >= 25) return { text: "Absolutely Incredible! 🌟", emoji: "🌟" }
    if (score >= 20) return { text: "Amazing Week! ✨", emoji: "✨" }
    if (score >= 15) return { text: "Great Job! 🎉", emoji: "🎉" }
    if (score >= 10) return { text: "Solid Week! 👍", emoji: "👍" }
    if (score >= 5) return { text: "Keep Going! 💪", emoji: "💪" }
    return { text: "Every Step Counts! 🌱", emoji: "🌱" }
  }

  const scoreMessage = getScoreMessage(huCaresScore)

  const generateScreenshot = async () => {
    if (!canvasRef.current || !user) return

    setIsGenerating(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      canvas.width = 600
      canvas.height = 800

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#fef7ed') // primary-50
      gradient.addColorStop(0.5, '#ffffff') // white
      gradient.addColorStop(1, '#f0f9ff') // secondary-50
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set text properties
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1f2937' // gray-800

      // HuCares title
      ctx.font = 'bold 48px Inter, sans-serif'
      ctx.fillStyle = '#ed7611' // primary-600
      ctx.fillText('HuCares', canvas.width / 2, 100)

      // Subtitle
      ctx.font = '20px Inter, sans-serif'
      ctx.fillStyle = '#6b7280' // gray-500
      ctx.fillText('Weekly Wellness Check-in', canvas.width / 2, 140)

      // Score circle background
      ctx.beginPath()
      ctx.arc(canvas.width / 2, 280, 120, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#ed7611'
      ctx.lineWidth = 8
      ctx.stroke()

      // HuCares score
      ctx.font = 'bold 72px Inter, sans-serif'
      ctx.fillStyle = '#ed7611'
      ctx.fillText(huCaresScore.toString(), canvas.width / 2, 300)

      ctx.font = '18px Inter, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('HuCares Score', canvas.width / 2, 330)

      // Score message
      ctx.font = 'bold 32px Inter, sans-serif'
      ctx.fillStyle = '#1f2937'
      ctx.fillText(scoreMessage.text, canvas.width / 2, 460)

      // Score breakdown
      ctx.font = '24px Inter, sans-serif'
      ctx.fillStyle = '#374151'
      const breakdown = `${data.productive} + ${data.satisfied} + ${data.body} - ${data.care}`
      ctx.fillText(breakdown, canvas.width / 2, 520)

      ctx.font = '16px Inter, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Productive + Satisfied + Body - Care', canvas.width / 2, 550)

      // User info
      if (user.username) {
        ctx.font = 'bold 24px Inter, sans-serif'
        ctx.fillStyle = '#1f2937'
        ctx.fillText(`${user.username}'s Week`, canvas.width / 2, 640)
      }

      // Date
      const date = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      ctx.font = '16px Inter, sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(date, canvas.width / 2, 680)

      // Call to action
      ctx.font = '18px Inter, sans-serif'
      ctx.fillStyle = '#ed7611'
      ctx.fillText('Join me on HuCares! 🌟', canvas.width / 2, 740)

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setScreenshotUrl(url)
        }
      }, 'image/png')

    } catch (error) {
      console.error('Failed to generate screenshot:', error)
    }

    setIsGenerating(false)
  }

  const shareToSocial = (platform: string) => {
    const text = `Just completed my weekly HuCares check-in! Score: ${huCaresScore} ${scoreMessage.emoji}\n\n${scoreMessage.text}\n\nJoin me in celebrating life's journey! 🌟`
    const url = window.location.origin

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    }

    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400')
    }
  }

  const copyToClipboard = async () => {
    const text = `🌟 HuCares Weekly Check-in Results 🌟

My score this week: ${huCaresScore}
${scoreMessage.text}

Breakdown:
⚡ Productive: ${data.productive}/10
😊 Satisfied: ${data.satisfied}/10  
💪 Body: ${data.body}/10
❤️ Care: ${data.care}/10

Join me on HuCares for weekly wellness check-ins! ${window.location.origin}`

    try {
      await navigator.clipboard.writeText(text)
      alert('Results copied to clipboard! 📋')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadScreenshot = () => {
    if (!screenshotUrl) return

    const link = document.createElement('a')
    link.download = `hucares-week-${new Date().toISOString().split('T')[0]}.png`
    link.href = screenshotUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareNatively = async () => {
    const text = `Just got my HuCares score: ${huCaresScore} ${scoreMessage.emoji} ${scoreMessage.text} Join me in celebrating life's journey!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My HuCares Score',
          text: text,
          url: window.location.origin
        })
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to clipboard
      await copyToClipboard()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Share Your Score</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Score Preview */}
        <div className="text-center mb-6 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
          <div className="text-4xl font-bold text-primary-600 mb-2">{huCaresScore}</div>
          <div className="text-lg font-medium text-gray-800">{scoreMessage.text}</div>
          <div className="text-sm text-gray-600 mt-2">
            {data.productive} + {data.satisfied} + {data.body} - {data.care}
          </div>
        </div>

        {/* Screenshot Section */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Create Visual Share</h3>
          {!screenshotUrl ? (
            <button
              onClick={generateScreenshot}
              disabled={isGenerating}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Screenshot 📸'
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <img src={screenshotUrl} alt="Score screenshot" className="w-full rounded-lg border" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={downloadScreenshot} className="btn-outline text-sm">
                  Download 💾
                </button>
                <button onClick={() => setScreenshotUrl(null)} className="btn-outline text-sm">
                  Regenerate 🔄
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Share Options */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Quick Share</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={shareNatively} className="btn-primary text-sm">
              Share 📤
            </button>
            <button onClick={copyToClipboard} className="btn-outline text-sm">
              Copy Text 📋
            </button>
          </div>
        </div>

        {/* Social Media */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Social Media</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => shareToSocial('twitter')}
              className="btn-outline text-sm bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              Twitter 🐦
            </button>
            <button 
              onClick={() => shareToSocial('facebook')}
              className="btn-outline text-sm bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              Facebook 📘
            </button>
            <button 
              onClick={() => shareToSocial('linkedin')}
              className="btn-outline text-sm bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              LinkedIn 💼
            </button>
            <button 
              onClick={() => shareToSocial('whatsapp')}
              className="btn-outline text-sm bg-green-50 hover:bg-green-100 text-green-700"
            >
              WhatsApp 💬
            </button>
          </div>
        </div>

        {/* Hidden canvas for screenshot generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
} 