
// src/lib/firebaseMessaging.ts
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './firebase'; // Your initialized Firebase app
import { saveUserPushToken, deleteUserPushToken } from './firebaseService'; // Server action
import type { User } from 'firebase/auth';

let messagingInstance: any = null; // To store messaging instance

export async function initializeFirebaseMessaging(currentUser: User | null, toast: (options: any) => void) {
  const supported = await isSupported();
  if (!supported || typeof window === 'undefined') {
    console.log("Firebase Messaging is not supported in this browser or environment.");
    return null;
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }

  // Handle foreground messages
  onMessage(messagingInstance, (payload) => {
    console.log('Message received in foreground.', payload);
    toast({
      title: payload.notification?.title || "Nova Notificação",
      description: payload.notification?.body || "Você tem uma nova atualização.",
      duration: 8000, // Show for longer
    });
    // You could display this message as a toast or in-app notification
  });


  if (currentUser) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
          console.error('VAPID key is not configured. Push notifications will not work.');
          toast({
            title: "Erro de Configuração",
            description: "As notificações push não puderam ser ativadas. Chave VAPID ausente.",
            variant: "destructive",
          });
          return null;
        }

        const currentToken = await getToken(messagingInstance, { vapidKey });
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          await saveUserPushToken(currentUser.uid, currentToken);
        } else {
          console.log('No registration token available. Request permission to generate one.');
          toast({
            title: "Permissão Necessária",
            description: "Não foi possível obter o token de notificação. Verifique as permissões.",
            variant: "default",
          });
        }
      } else {
        console.log('Unable to get permission to notify.');
        // Optionally, inform the user that they have denied permission
        // and how they can enable it later if they wish.
      }
    } catch (error) {
      console.error('An error occurred while retrieving token or requesting permission. ', error);
      toast({
        title: "Erro nas Notificações",
        description: "Não foi possível configurar as notificações push.",
        variant: "destructive",
      });
    }
  }
  return messagingInstance;
}

export async function deleteCurrentToken() {
  const supported = await isSupported();
  if (!supported || typeof window === 'undefined' || !messagingInstance) {
    console.log("Firebase Messaging not initialized or not supported.");
    return;
  }
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not configured.');
      return;
    }
    const currentToken = await getToken(messagingInstance, { vapidKey });
    if (currentToken) {
      // Note: Firebase SDK's deleteToken() is for deleting the *instance ID*, not just the token.
      // We primarily want to remove it from our backend.
      // The SDK doesn't have a simple "invalidate current token" for the client.
      // The token will eventually expire or become invalid if the app is uninstalled or permissions change.
      // For explicit "unsubscribe", we delete it from our server.
      await deleteUserPushToken(currentToken);
      console.log('Token marked for deletion from server-side storage.');
    }
  } catch (error) {
    console.error('Error handling token deletion:', error);
  }
}
