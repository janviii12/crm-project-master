import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../lib/axiosInstance';

// Re-send an unchanged subscription to the server at most once a day
const RESYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SYNC_KEY_PREFIX = 'pushSubscriptionSynced_';

// The VAPID public key never changes at runtime, so fetch it once per page load
let publicKeyPromise: Promise<string> | null = null;
const getPublicKey = () => {
  if (!publicKeyPromise) {
    publicKeyPromise = axiosInstance
      .get('/api/push/public-key')
      .then((response) => response.data.publicKey as string)
      .catch((error) => {
        publicKeyPromise = null;
        throw error;
      });
  }
  return publicKeyPromise;
};

const readSync = (userId: string) => {
  try {
    const raw = localStorage.getItem(SYNC_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as { endpoint: string; at: number }) : null;
  } catch {
    return null;
  }
};

const writeSync = (userId: string, endpoint: string) => {
  try {
    localStorage.setItem(SYNC_KEY_PREFIX + userId, JSON.stringify({ endpoint, at: Date.now() }));
  } catch {
    // Storage unavailable: we'll just sync again next time
  }
};

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check if service worker is registered and user is subscribed
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking push subscription:', error);
        }
      }
    };

    checkSubscription();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Pass the logged-in user's id to skip the server call when this browser is already registered for them
  const subscribe = useCallback(async (userId?: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      // Request permission first
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      }

      // Reuse the browser's existing subscription; only create one if there is none
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const publicKey = await getPublicKey();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }

      // Skip the server call if this exact subscription was sent recently
      const lastSync = userId ? readSync(userId) : null;
      const recentlySynced = lastSync
        && lastSync.endpoint === subscription.endpoint
        && Date.now() - lastSync.at < RESYNC_INTERVAL_MS;

      if (!recentlySynced) {
        // Send subscription to server
        await axiosInstance.post('/api/push/subscribe', {
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(subscription.getKey('auth')!)
            }
          }
        });
        if (userId) {
          writeSync(userId, subscription.endpoint);
        }
        console.log('Successfully subscribed to push notifications');
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await axiosInstance.post('/api/push/unsubscribe');
        try {
          Object.keys(localStorage)
            .filter((key) => key.startsWith(SYNC_KEY_PREFIX))
            .forEach((key) => localStorage.removeItem(key));
        } catch {
          // Storage unavailable: nothing to clear
        }
        setIsSubscribed(false);
        console.log('Successfully unsubscribed from push notifications');
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }

    return false;
  }, []);

  return {
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe
  };
};

// Utility functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
