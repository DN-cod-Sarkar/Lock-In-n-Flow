import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

// Helper to format Date object to DD-MM-YYYY in plain JavaScript
const formatDateToDDMMYYYY = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// NEW: Helper function to upload the image to Firebase Storage
const uploadImageAsync = async (uri) => {
  if (!uri) return null;
  try {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () { resolve(xhr.response); };
      xhr.onerror = function (e) { reject(new TypeError("Network request failed")); };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const fileRef = ref(storage, `task_attachments/img_${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob);
    
    blob.close();
    return await getDownloadURL(fileRef); // Returns the secure web link
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

export const createTask = async (taskData) => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // 1. If there is a local picture, upload it to the internet first
    let finalImageUrl = null;
    if (taskData.attachmentUri) {
      finalImageUrl = await uploadImageAsync(taskData.attachmentUri);
    }

    // 2. Save the task details along with the new secure image link
    const docRef = await addDoc(collection(db, 'tasks'), {
      userId: user.uid,
      title: taskData.title,
      status: 'pending',
      priority: taskData.priority || 'Medium',
      tags: taskData.tags || ['#General'],
      expectedDuration: taskData.expectedDuration || 30,
      description: taskData.description || '',
      attachmentName: taskData.attachmentName || null,
      attachmentUri: finalImageUrl, // <-- Saves the web link here!
      interruptionShield: taskData.interruptionShield || false,
      targetDate: taskData.targetDate || formatDateToDDMMYYYY(new Date()),
      startedAt: null,
      createdAt: new Date().toISOString(),
    });

    return { id: docRef.id, ...taskData, attachmentUri: finalImageUrl };
  } catch (error) {
    console.error("Error creating task: ", error);
    return null;
  }
};

export const fetchTasks = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((document) => {
      tasks.push({ id: document.id, ...document.data() });
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks: ", error);
    return [];
  }
};

export const updateTaskFields = async (taskId, fields) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, fields);
    return true;
  } catch (error) {
    console.error("Error updating task: ", error);
    return false;
  }
};

export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
    return true;
  } catch (error) {
    console.error("Error deleting task: ", error);
    return false;
  }
};
// Add this to your taskService.js file

export const addTask = async (taskData) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    return { id: docRef.id, ...taskData };
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};