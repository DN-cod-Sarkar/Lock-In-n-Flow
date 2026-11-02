import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
// 1. Import the new asynchronous Reader and Eraser from the store
import { loadFlowHistory, deleteSessionFromDrive } from '../store';

export default function Explore() {
  // 2. We use React State to hold the data once the hard drive gives it to us. 
  // The <any[]> tag fixes your second TypeScript error!
  const [history, setHistory] = useState<any[]>([]);

  // 3. useFocusEffect triggers every single time you tap the History tab
  useFocusEffect(
    useCallback(() => {
      const fetchHistory = async () => {
        const data = await loadFlowHistory(); // Tell the hard drive to load the data
        setHistory(data); // Inject it into the UI
      };
      fetchHistory();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to permanently delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteSessionFromDrive(id); // Delete from physical storage
            const updatedData = await loadFlowHistory(); // Fetch the new, updated list
            setHistory(updatedData); // Refresh the screen
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Flow History</Text>
      
      {history.length === 0 ? (
        <Text style={styles.emptyText}>No tasks yet. Go lock in!</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.taskText}>{item.task}</Text>
                <Text style={styles.timeText}>{item.timestamp}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A192F', // Navy
    padding: 24,
    paddingTop: 60,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E6F1FF', // Off-White
    marginBottom: 20,
  },
  emptyText: {
    color: '#8892B0', // Slate
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#112240',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#233554',
  },
  cardContent: {
    flex: 1,
  },
  taskText: {
    color: '#E6F1FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeText: {
    color: '#8892B0',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)', // Faint coral red background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B', // Solid coral red border
  },
  deleteText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});