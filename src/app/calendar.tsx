import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchTasks } from '../taskService';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [displayMonth, setDisplayMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      const loadTasks = async () => {
        const fetched = await fetchTasks();
        setTasks(fetched);
      };
      loadTasks();
    }, [])
  );

  const changeMonth = (offset: number) => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + offset, 1));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = [];
  const daysInMonth = getDaysInMonth(displayMonth.getFullYear(), displayMonth.getMonth());
  const firstDay = getFirstDayOfMonth(displayMonth.getFullYear(), displayMonth.getMonth());

  // Padding for empty cells before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dString = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dayNum: i, fullDate: dString });
  }

  // Filter tasks strictly for the selected date
  const filteredTasks = tasks.filter(task => {
    const taskDate = task.scheduledDate || (task.createdAt ? task.createdAt.split('T')[0] : '');
    return taskDate === selectedDate;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Month Navigator */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
          <Ionicons name="chevron-back" size={24} color="#64FFDA" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
          <Ionicons name="chevron-forward" size={24} color="#64FFDA" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map((day, idx) => (
            <Text key={idx} style={styles.dayNameText}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {days.map((dayObj, index) => {
            if (!dayObj) return <View key={index} style={styles.dayCell} />;
            
            const isSelected = dayObj.fullDate === selectedDate;
            const hasTask = tasks.some(t => (t.scheduledDate || t.createdAt?.split('T')[0]) === dayObj.fullDate);

            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.dayCell, isSelected && styles.dayCellActive]}
                onPress={() => setSelectedDate(dayObj.fullDate)}
              >
                <Text style={[styles.dayNum, isSelected && styles.textActive]}>{dayObj.dayNum}</Text>
                {hasTask && <View style={[styles.taskDot, isSelected && { backgroundColor: '#0A192F' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Timeline View */}
      <View style={styles.timelineHeaderRow}>
        <Text style={styles.selectedDateTitle}>
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#233554" />
            <Text style={styles.emptyText}>No intentions scheduled.</Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{task.scheduledTime || '--:--'}</Text>
                <Text style={styles.durationText}>{task.expectedDuration}m</Text>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSub}>
                  {task.status === 'completed' ? 'SECURED' : (task.status === 'active' ? 'ACTIVE' : 'PENDING')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { padding: 10, backgroundColor: '#112240', borderRadius: 12, borderWidth: 1, borderColor: '#233554' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#E6F1FF' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  monthBtn: { padding: 5 },
  monthText: { fontSize: 18, fontWeight: 'bold', color: '#64FFDA' },
  calendarContainer: { backgroundColor: '#112240', marginHorizontal: 20, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#233554', marginBottom: 20 },
  dayNamesRow: { flexDirection: 'row', marginBottom: 10 },
  dayNameText: { flex: 1, textAlign: 'center', color: '#8892B0', fontSize: 12, fontWeight: 'bold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, padding: 2 },
  dayCellActive: { backgroundColor: '#64FFDA' },
  dayNum: { color: '#E6F1FF', fontSize: 14, fontWeight: 'bold' },
  textActive: { color: '#0A192F' },
  taskDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#64FFDA', marginTop: 2 },
  timelineHeaderRow: { paddingHorizontal: 20, marginBottom: 15 },
  selectedDateTitle: { color: '#8892B0', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  timelineContainer: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.8 },
  emptyText: { color: '#8892B0', marginTop: 16, fontStyle: 'italic' },
  taskItem: { flexDirection: 'row', marginBottom: 20 },
  timeColumn: { width: 60, alignItems: 'center', marginRight: 12 },
  timeText: { color: '#64FFDA', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  durationText: { color: '#8892B0', fontSize: 10, marginBottom: 8 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#233554', borderRadius: 1 },
  taskContent: { flex: 1, backgroundColor: '#112240', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#233554' },
  taskTitle: { color: '#E6F1FF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  taskSub: { color: '#8892B0', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }
});