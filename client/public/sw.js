// Service Worker for Web Push Notifications and PWA functionality

const CACHE_NAME = 'gpt-do-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Task',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192x192.png'
      }
    ],
    requireInteraction: data.priority === 'high',
    tag: data.tag || 'gpt-do-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    // Open app and navigate to task
    event.waitUntil(
      clients.openWindow(`/?task=${event.notification.data?.taskId || ''}`)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    // Sync any pending tasks created while offline
    const pendingTasks = await getStoredTasks();
    
    for (const task of pendingTasks) {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
    }
    
    // Clear stored tasks after successful sync
    await clearStoredTasks();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getStoredTasks() {
  // Implementation to get tasks from IndexedDB
  return [];
}

async function clearStoredTasks() {
  // Implementation to clear synced tasks from IndexedDB
}