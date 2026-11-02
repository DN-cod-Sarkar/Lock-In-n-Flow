import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lock_in_flow_history';

// 1. The Reader
export const loadFlowHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Storage Read Error:", error);
    return [];
  }
};

// 2. The Writer (This is the missing function!)
export const saveNewSession = async (newSession) => {
  try {
    const currentHistory = await loadFlowHistory();
    const updatedHistory = [newSession, ...currentHistory]; 
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Storage Write Error:", error);
  }
};

// 3. The Eraser
export const deleteSessionFromDrive = async (id) => {
  try {
    const currentHistory = await loadFlowHistory();
    const updatedHistory = currentHistory.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Storage Delete Error:", error);
  }
};