// frontend/src/utils/pushNotifications.js
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL;

export async function subscribeAdminToPush(user) {
  if (user?.role !== 'admin'&& user?.role !== 'mom') {
    console.log('Only admin and mom can subscribe');
    return;
  }
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    
    // Send to backend (will handle multiple devices)
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

// Check online status and re-subscribe if needed
window.addEventListener('online', () => {
  console.log('Device is online, reconnecting...');
  // Re-check subscription when device comes online
  if (window.user?.role === 'admin') {
    subscribeAdminToPush(window.user);
  }
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}