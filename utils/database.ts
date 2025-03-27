import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3QXqIQG4OP-lnP0deWrBmwpmWlZIPZMk",
  authDomain: "clicker-app2.firebaseapp.com",
  projectId: "clicker-app2",
  storageBucket: "clicker-app2.firebasestorage.app",
  messagingSenderId: "595166288420",
  appId: "1:595166288420:web:ad3b6cf83e13984f9bd6b1",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
