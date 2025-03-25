import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKkaKUK28WXwnxdl6i6-Gwa3IZDeAjshE",
  authDomain: "clicker-66580.firebaseapp.com",
  projectId: "clicker-66580",
  storageBucket: "clicker-66580.firebasestorage.app",
  messagingSenderId: "77556637399",
  appId: "1:77556637399:web:dad902f6f4b4378a239a92"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
