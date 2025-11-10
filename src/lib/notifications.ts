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
  const maintenanceChannel = supabase
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
          icon: '/vite.svg',
          tag: notification.id,
          data: notification,
          requireInteraction: true
        });

        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(console.error);
      }
    )
    .subscribe();

  return maintenanceChannel;
};

// Subscribe to verdeler testing notifications (for testers)
export const subscribeToTestingNotifications = (userId: string, userRole: string) => {
  // Only testers and admins should receive testing notifications
  if (userRole !== 'tester' && userRole !== 'admin') {
    return null;
  }

  const testingChannel = supabase
    .channel('testing_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'verdeler_testing_notifications'
      },
      async (payload) => {
        const notification = payload.new;

        try {
          // Fetch distributor and project details
          const { data: distributor } = await supabase
            .from('distributors')
            .select('distributor_id, kast_naam, project:projects(project_number, client_name)')
            .eq('id', notification.distributor_id)
            .single();

          if (distributor) {
            const projectInfo = distributor.project as any;
            const title = 'Verdeler klaar voor testen';
            const body = `${distributor.distributor_id} - ${distributor.kast_naam || 'Naamloos'}\nProject: ${projectInfo?.project_number || 'Onbekend'}`;

            // Show browser notification
            showNotification(title, {
              body,
              icon: '/vite.svg',
              tag: notification.id,
              data: notification,
              requireInteraction: true
            });

            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(console.error);
          }
        } catch (error) {
          console.error('Error processing testing notification:', error);
        }
      }
    )
    .subscribe();

  return testingChannel;
};