import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY && !process.env.FIREBASE_API_KEY.includes("FakeKey") 
    ? process.env.FIREBASE_API_KEY 
    : "AIzaSyBcdq0631ujc4JDdq4KMX4ggUewzFXEOsA",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "traveloop-21307.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "traveloop-21307",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "traveloop-21307.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "176828060174",
  appId: process.env.FIREBASE_APP_ID || "1:176828060174:web:b327228e10d00366d6625f",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://traveloop-21307-default-rtdb.firebaseio.com",
};

console.log("[Firebase Config] Initializing with project ID:", firebaseConfig.projectId, "API Key:", firebaseConfig.apiKey);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
