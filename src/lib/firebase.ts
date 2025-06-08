
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import getAuth
// Firebase Messaging needs to be imported for side effects if you use it directly on client,
// but usually it's initialized in a dedicated messaging file.
// import 'firebase/messaging'; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCYHqcCjJlzLMaTcEtOM8tH-aulQzgSCZ8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="astral-ash.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID="astral-ash",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="astral-ash.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="927167691540",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID="1:927167691540:web:81ceffbf84efb97363a001",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-PZD29VJXCN"
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
