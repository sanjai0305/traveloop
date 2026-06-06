import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore
} from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcdq0631ujc4JDdq4KMX4ggUewzFXEOsA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "traveloop-21307.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "traveloop-21307",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "traveloop-21307.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "176828060174",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:176828060174:web:b327228e10d00366d6625f",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://traveloop-21307-default-rtdb.firebaseio.com",
};

// Initialize Firebase App with safety fallback
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase App initialization failed, attempting fallback getApp():", e);
  try {
    const { getApp } = await import("firebase/app");
    app = getApp();
  } catch (err2) {
    console.error("Critical: Firebase App failed to initialize:", err2);
  }
}

// Initialize Firestore with fallback for offline cache conflicts & single-tab webview environments (like Capacitor)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  console.warn("Firestore multi-tab persistent cache failed. Retrying with basic persistent cache...", error);
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({}),
    });
  } catch (error2) {
    console.warn("Firestore persistent cache failed. Retrying with default settings...", error2);
    try {
      db = initializeFirestore(app, {});
    } catch (error3) {
      console.warn("Firestore initializeFirestore failed. Falling back to getFirestore().", error3);
      db = getFirestore(app);
    }
  }
}

// Initialize Realtime Database, Storage, and Auth with safety try-catch
let rtdb;
try {
  rtdb = getDatabase(app);
} catch (e) {
  console.error("Failed to initialize Realtime Database:", e);
}

let storage;
try {
  storage = getStorage(app);
} catch (e) {
  console.error("Failed to initialize Storage:", e);
}

let auth;
try {
  auth = getAuth(app);
} catch (e) {
  console.error("Failed to initialize Auth:", e);
}

export { app, db, rtdb, storage, auth };
