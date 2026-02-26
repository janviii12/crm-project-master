// Service Worker for Push Notifications
const CACHE_NAME = 'crm-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};

  if (event.data) {
    const textData = event.data.text();
    try {
      data = JSON.parse(textData); // Try to parse as JSON
      console.log('PUSH EVENT TRIGGERED:', data);
    } catch (e) {
      console.error('Error parsing push data as JSON:', e);
      data = {
        title: "New Notification",
        body: textData // Fallback for plain text
      };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo-grow.png',
    badge: data.badge || '/logo-grow.png',
    data: data.data || {},
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  try {
    event.waitUntil(
      self.registration.showNotification(data.title || 'CRM Notification', options)
    );
    console.log('Notification shown successfully');
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no suitable window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (optional, for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement any background sync logic here
  console.log('Performing background sync...');
}
