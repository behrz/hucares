// HuCares Service Worker
const CACHE_NAME = 'hucares-v1.0.0'
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🎉 HuCares Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully')
        return self.skipWaiting()
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 HuCares Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Serving from cache:', event.request.url)
          return cachedResponse
        }

        console.log('🌐 Fetching from network:', event.request.url)
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response for caching
            const responseToCache = response.clone()

            // Cache new resources dynamically
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

// Background Sync for offline check-ins
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  if (event.tag === 'background-checkin') {
    event.waitUntil(
      // Process any pending check-ins when back online
      syncOfflineCheckIns()
    )
  }
})

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your weekly HuCares check-in! 🌟',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'hucares-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'checkin',
        title: 'Check In Now ✨'
      },
      {
        action: 'later',
        title: 'Remind Later'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('HuCares Weekly Check-in', options)
  )
})

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action)
  
  event.notification.close()

  if (event.action === 'checkin') {
    // Open app to check-in page
    event.waitUntil(
      clients.openWindow('/?action=checkin')
    )
  } else if (event.action === 'later') {
    // Schedule reminder for later (could implement with setTimeout or external service)
    console.log('⏰ Reminder scheduled for later')
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Helper function for offline sync
async function syncOfflineCheckIns() {
  try {
    // This would sync with your backend when available
    console.log('🔄 Syncing offline check-ins...')
    
    // For now, just log - in a real app this would:
    // 1. Get pending check-ins from IndexedDB
    // 2. Send them to the backend API
    // 3. Clear them from local storage
    
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Failed to sync offline check-ins:', error)
    throw error
  }
}

// Installation prompt helper
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('💡 Install prompt available')
  // Store the event for later use
  self.deferredPrompt = event
}) 