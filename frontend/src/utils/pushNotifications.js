const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL;

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

export async function subscribeAdminToPush(user) {
  // Only admin can subscribe
  if (user?.role !== 'admin') return;
  
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  // Check if already subscribed (from backend)
  try {
    const statusRes = await fetch(`${API_URL}/push/status`, {
      credentials: 'include'
    });
    const { isSubscribed } = await statusRes.json();
    
    if (isSubscribed) {
      console.log('Already subscribed to push notifications');
      return;
    }
  } catch (error) {
    console.error('Failed to check subscription status:', error);
  }
  
  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return;
  }
  
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    // Send subscription to backend
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('✅ Successfully subscribed to push notifications!');
    } else {
      console.error('Failed to save subscription on server');
    }
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}