// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"; // THIS IS THE MISSING PIECE!
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_nQIKaQfMVcodfCIQRg6ouBlk-aZ2ydA",
  authDomain: "studybuddy-b4770.firebaseapp.com",
  databaseURL: "https://studybuddy-b4770-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "studybuddy-b4770",
  storageBucket: "studybuddy-b4770.firebasestorage.app",
  messagingSenderId: "787010900579",
  appId: "1:787010900579:web:24e8081027f2fca9199e56",
  measurementId: "G-S7W9LYRLQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database
export const database = getDatabase(app);