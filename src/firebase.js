// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuNWz-u1hoqOWhe_Ia9LhkwWbul73mB2w",
  authDomain: "planora-16eda.firebaseapp.com",
  projectId: "planora-16eda",
  storageBucket: "planora-16eda.firebasestorage.app",
  messagingSenderId: "143661503686",
  appId: "1:143661503686:web:e3ed9ce7907ce2d87433c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);