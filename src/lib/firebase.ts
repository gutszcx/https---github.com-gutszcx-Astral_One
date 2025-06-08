
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import getAuth
// Firebase Messaging needs to be imported for side effects if you use it directly on client,
// but usually it's initialized in a dedicated messaging file.
// import 'firebase/messaging'; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBtAHiliXkawyJMOgm_1K8gPS8Sni8C9lM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="astralone-c0bef.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID="astralone-c0bef",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="astralone-c0bef.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="765989449839",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID="1:765989449839:web:45d8d966e61c30f7a89d9a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XX1M4VJYKB"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app); // Initialize Auth

// Export the app instance, and other initialized services as needed
export { app, db, auth };
