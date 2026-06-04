// frontend/public/sw.js
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
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type,
      timestamp: data.timestamp
    },
    requireInteraction: true,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // If they clicked "View Details" button or the notification itself
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});