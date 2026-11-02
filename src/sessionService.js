import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

// Save a completed focus session to the cloud
export const saveFocusSession = async (durationMinutes) => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      userId: user.uid,
      duration: durationMinutes,
      completedAt: new Date().toISOString()
    });
    return { id: docRef.id, duration: durationMinutes };
  } catch (error) {
    console.error("Error saving focus session: ", error);
    return null;
  }
};

// Fetch all focus sessions for the logged-in user to compute stats
export const fetchUserSessions = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, 'sessions'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((document) => {
      sessions.push({ id: document.id, ...document.data() });
    });
    return sessions;
  } catch (error) {
    console.error("Error fetching sessions: ", error);
    return [];
  }
};