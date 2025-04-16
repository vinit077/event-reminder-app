// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiGODA5H3QaZdXqeBVhEjiovsyQIAg2OQ",
  authDomain: "event-reminder-72665.firebaseapp.com",
  projectId: "event-reminder-72665",
  storageBucket: "event-reminder-72665.firebasestorage.app",
  messagingSenderId: "563063341750",
  appId: "1:563063341750:web:1e874c73cea3b888349c17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);