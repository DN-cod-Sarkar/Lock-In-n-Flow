import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: "AIzaSyBXMhiqGTVQJUNXicULtb9sn5AqWH4MTuw",
  authDomain: "lock-in-n-flow.firebaseapp.com",
  projectId: "lock-in-n-flow",
  storageBucket: "lock-in-n-flow.firebasestorage.app",
  messagingSenderId: "538996003376",
  appId: "1:538996003376:web:51c2d66daa11b1e9f753f5",
  measurementId: "G-C76K3E2L72"
};

// Initialize the Cloud Connection
const app = initializeApp(firebaseConfig);

// Export the Authentication and Database modules so your React screens can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);