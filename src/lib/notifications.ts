import { supabase } from './supabase';

// Request notification permission on app start
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

// Show browser notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    try {
      new Notification(title, options);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }
};

// Subscribe to notifications
export const subscribeToNotifications = (userId: string) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        const notification = payload.new;
        
        // Show browser notification
        showNotification('Nieuwe onderhoudsmelding', {
          body: `Nieuwe melding voor verdeler ${notification.verdeler_id}`,
          icon: '/vite.svg', // You can replace this with your app's icon
          tag: notification.id, // Prevents duplicate notifications
          data: notification,
          requireInteraction: true
        });

        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);
      }
    )
    .subscribe();
};