// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Add this import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoPTy4SmYGaZxEvNQgoqI4IM-5kKNMzDA",
  authDomain: "uniapp-a0d91.firebaseapp.com",
  projectId: "uniapp-a0d91",
  storageBucket: "uniapp-a0d91.firebasestorage.app",
  messagingSenderId: "236333155052",
  appId: "1:236333155052:web:d0efdf0129df11f20edbc9",
  measurementId: "G-1RL187F8J4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app); // Now this will work