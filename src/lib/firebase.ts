import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBS4uWx5CeU5aqV1FcZU05tSghJgYQMVbE",
  authDomain: "ar-hotels-8f287.firebaseapp.com",
  projectId: "ar-hotels-8f287",
  storageBucket: "ar-hotels-8f287.firebasestorage.app",
  messagingSenderId: "332453265960",
  appId: "1:332453265960:web:01b12f815370f4e6286b1d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
