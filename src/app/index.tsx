import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, LayoutAnimation, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { createTask, deleteTask, fetchTasks, updateTaskFields } from '../taskService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedCompleteButton = ({ onComplete }: { onComplete: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }).start(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onComplete();
    });
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.completeBtn} onPress={handlePress} activeOpacity={1}>
        <Text style={styles.completeBtnText}>Mark Complete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function TasksScreen() {
  const router = useRouter(); 
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [pastTasks, setPastTasks] = useState<any[]>([]);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('30');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [newTaskComment, setNewTaskComment] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState(''); 
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // --- NEW: SMOOTH SWIPE GESTURE LOGIC ---
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Only capture horizontal swipes so vertical scrolling still works perfectly
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          router.push('/settings'); // Swipe Right goes to Settings
        } else if (gestureState.dx < -50) {
          router.push('/calendar'); // Swipe Left goes to Calendar
        }
      }
    })
  ).current;

  const loadAndCleanTasks = async () => {
    const allTasks = await fetchTasks();
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const active: any[] = [];
    const past: any[] = [];
    for (const task of allTasks) {
      if (task.status === 'completed') {
        const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt);
        if (taskDate < tenDaysAgo) {
          await deleteTask(task.id); 
        } else {
          past.push(task);
        }
      } else {
        active.push(task);
      }
    }
    setActiveTasks(active);
    setPastTasks(past);
  };

  useFocusEffect(useCallback(() => { loadAndCleanTasks(); }, []));

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return alert("Camera access needed!");
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!res.canceled) setAttachedImage(res.assets[0].uri);
  };

  const openGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!res.canceled) setAttachedImage(res.assets[0].uri);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await createTask({
      title: newTaskTitle, expectedDuration: parseInt(newTaskDuration) || 30, priority: newTaskPriority,
      tags: newTaskTags ? newTaskTags.split(',').map(t => t.trim()) : ['#General'], 
      description: newTaskComment, attachmentUri: attachedImage, status: 'pending', 
      interruptionShield: false, scheduledDate: newTaskDate, scheduledTime: newTaskTime
    });
    setModalVisible(false); setNewTaskTitle(''); setNewTaskDuration('30'); setNewTaskPriority('Medium');
    setNewTaskTags(''); setNewTaskComment(''); setNewTaskDate(new Date().toISOString().split('T')[0]);
    setNewTaskTime(''); setAttachedImage(null); loadAndCleanTasks();
  };
  const markTaskComplete = async (id: string) => {
    await updateTaskFields(id, { status: 'completed', updatedAt: new Date().toISOString() });
    loadAndCleanTasks();
  };

  const toggleTaskActiveState = async (task: any) => {
    const newStatus = task.status === 'active' ? 'pending' : 'active';
    await updateTaskFields(task.id, { status: newStatus, updatedAt: new Date().toISOString() });
    loadAndCleanTasks();
  };

  const removeTask = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await deleteTask(id);
    loadAndCleanTasks();
  };

  const renderTask = (task: any, isCompleted: boolean) => (
    <View key={task.id} style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}>
      <View style={styles.taskHeader}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => !isCompleted && toggleTaskActiveState(task)}>
            <Ionicons name={isCompleted || task.status === 'active' ? "checkbox" : "square-outline"} size={24} color={isCompleted || task.status === 'active' ? "#64FFDA" : "#8892B0"} />
          </TouchableOpacity>
          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>{task.title}</Text>
        </View>
        {task.priority && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        )}
      </View>
      <View style={styles.taskDetails}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color="#8892B0" />
            <Text style={styles.dateText}>{task.expectedDuration || 30}m</Text>
          </View>
          {!isCompleted && (
            <View style={[styles.statusBadge, task.status === 'active' ? styles.statusBadgeActive : styles.statusBadgePending]}>
              <Text style={task.status === 'active' ? styles.statusTextActive : styles.statusTextPending}>
                {task.status === 'active' ? 'ACTIVE' : 'PENDING'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.actionRow}>
        {!isCompleted ? (
          <AnimatedCompleteButton onComplete={() => markTaskComplete(task.id)} />
        ) : (
          <Text style={styles.completedStatusText}>STATUS: COMPLETED</Text>
        )}
        <TouchableOpacity onPress={() => removeTask(task.id)}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.mainHeader}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="menu" size={32} color="#64FFDA" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitleMain}>Lock-In n Flow</Text>
          <Text style={styles.headerTitleSub}>we remember, you decide</Text>
        </View>
        <TouchableOpacity style={styles.calendarIconBox} onPress={() => router.push('/calendar')}>
          <Ionicons name="calendar" size={20} color="#64FFDA" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Goals & Tasks</Text>
        {activeTasks.length === 0 ? (
          <Text style={styles.emptyText}>No active goals. Add one below.</Text>
        ) : (
          activeTasks.map(task => renderTask(task, false))
        )}
        {pastTasks.length > 0 && (
          <View style={styles.pastSection}>
            <Text style={styles.sectionTitle}>Past Tasks (Last 10 Days)</Text>
            {pastTasks.map(task => renderTask(task, true))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#0A192F" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Intention</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Target</Text>
              <TextInput style={styles.input} placeholder="e.g., Finalize Expo Presentation" placeholderTextColor="#495670" value={newTaskTitle} onChangeText={setNewTaskTitle} />
              
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput style={[styles.input, { marginBottom: 0 }]} placeholderTextColor="#495670" value={newTaskDate} onChangeText={setNewTaskDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Time (HH:MM)</Text>
                  <TextInput style={[styles.input, { marginBottom: 0 }]} placeholder="e.g. 14:30" placeholderTextColor="#495670" value={newTaskTime} onChangeText={setNewTaskTime} />
                </View>
              </View>

              <Text style={styles.label}>Duration (min)</Text>
              <TextInput style={styles.input} placeholder="30" placeholderTextColor="#495670" keyboardType="numeric" value={newTaskDuration} onChangeText={setNewTaskDuration} />

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g., College, Math" placeholderTextColor="#495670" value={newTaskTags} onChangeText={setNewTaskTags} />

              <Text style={styles.label}>Comments / Context</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Add context to remember..." placeholderTextColor="#495670" multiline value={newTaskComment} onChangeText={setNewTaskComment} />

              <Text style={styles.label}>Attachments</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={openCamera}>
                  <Ionicons name="camera-outline" size={24} color="#64FFDA" />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={openGallery}>
                  <Ionicons name="image-outline" size={24} color="#64FFDA" />
                  <Text style={styles.uploadBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              {attachedImage && <Image source={{ uri: attachedImage }} style={{ width: '100%', height: 150, borderRadius: 12, marginBottom: 20 }} />}

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {['Low', 'Medium', 'High'].map((p) => (
                  <TouchableOpacity key={p} style={[styles.priorityBadgeModal, newTaskPriority === p && styles.priorityBadgeActive]} onPress={() => setNewTaskPriority(p)}>
                    <Text style={[styles.priorityText, newTaskPriority === p && styles.priorityTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTask}>
                <Text style={styles.saveBtnText}>Commit to Vault</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F', paddingHorizontal: 20, paddingTop: 60 },
  mainHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  headerTitleBox: { alignItems: 'center' },
  headerTitleMain: { fontSize: 24, fontWeight: 'bold', color: '#E6F1FF' },
  headerTitleSub: { fontSize: 12, color: '#8892B0', fontStyle: 'italic' },
  calendarIconBox: { backgroundColor: '#112240', padding: 10, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#64FFDA', marginBottom: 16 },
  pastSection: { marginTop: 40, opacity: 0.8 },
  emptyText: { color: '#8892B0', fontStyle: 'italic', marginBottom: 20 },
  taskCard: { backgroundColor: '#112240', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#233554' },
  taskCardCompleted: { borderColor: '#20454E', backgroundColor: '#0D1A2D' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#E6F1FF', marginLeft: 12, flexShrink: 1 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#8892B0' },
  priorityBadge: { borderColor: '#FFD166', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { color: '#FFD166', fontSize: 10, fontWeight: 'bold' },
  priorityTextActive: { color: '#0A192F', fontSize: 12, fontWeight: 'bold' },
  taskDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: '#8892B0', fontSize: 12, marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginLeft: 12 },
  statusBadgeActive: { borderColor: '#64FFDA', backgroundColor: 'rgba(100, 255, 218, 0.1)' },
  statusBadgePending: { borderColor: '#8892B0', backgroundColor: 'transparent' },
  statusTextActive: { color: '#64FFDA', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  statusTextPending: { color: '#8892B0', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#233554', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completeBtn: { backgroundColor: '#1B2E4B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  completeBtnText: { color: '#64FFDA', fontWeight: 'bold' },
  completedStatusText: { color: '#8892B0', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#64FFDA', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#64FFDA', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 25, 47, 0.9)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#112240', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 0, borderWidth: 1, borderColor: '#233554', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#E6F1FF' },
  label: { color: '#8892B0', fontSize: 14, marginBottom: 8, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#0A192F', borderWidth: 1, borderColor: '#233554', color: '#E6F1FF', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  priorityBadgeModal: { borderWidth: 1, borderColor: '#233554', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  priorityBadgeActive: { backgroundColor: '#64FFDA', borderColor: '#64FFDA' },
  saveBtn: { backgroundColor: '#64FFDA', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  saveBtnText: { color: '#0A192F', fontSize: 18, fontWeight: 'bold' },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#64FFDA', paddingVertical: 12, borderRadius: 12 },
  uploadBtnText: { color: '#64FFDA', fontWeight: 'bold' }
});