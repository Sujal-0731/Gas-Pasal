// frontend/public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Anam Store', body: 'You have a notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log('Could not parse push data');
    }
  }
  
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '👁️ View'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Just close
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});