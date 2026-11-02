import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchTasks } from '../taskService';

export default function FlowVaultScreen() {
  // --- BIOMETRIC SECURITY STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);

  // --- STATS STATE ---
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalDisruptions, setTotalDisruptions] = useState(0);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  // --- BIOMETRIC AUTH FUNCTION ---
  const handleBiometricAuth = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      alert('Biometrics not set up on this device. Bypassing security.');
      setIsUnlocked(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Flow Vault',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setIsUnlocked(true);
    }
  };

  // Calculate the last 90 days for the heatmap grid
  const generateHeatmapGrid = (tasks: any[]) => {
    const daysToTrack = 90; // Approx 3 months of data
    const today = new Date();
    const dateMap = new Map();

    // 1. Initialize empty grid for the last 90 days
    for (let i = daysToTrack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, count: 0, disruptions: 0 });
    }

    let completedCount = 0;
    let disruptionCount = 0;

    // 2. Map Firebase data onto the calendar
    tasks.forEach(task => {
      if (task.status === 'completed') {
        completedCount++;
        disruptionCount += (task.totalDisruptions || 0);

        // Fallback to today if your earlier tasks don't have timestamps yet
        const taskDateObj = task.updatedAt ? new Date(task.updatedAt) : new Date();
        const dateStr = taskDateObj.toISOString().split('T')[0];

        if (dateMap.has(dateStr)) {
          const dayData = dateMap.get(dateStr);
          dayData.count += 1;
          dateMap.set(dateStr, dayData);
        }
      }
    });

    setTotalCompleted(completedCount);
    setTotalDisruptions(disruptionCount);
    setHeatmapData(Array.from(dateMap.values()));
  };

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        const tasks = await fetchTasks();
        generateHeatmapGrid(tasks);
      };
      loadStats();
    }, [])
  );

  // Dynamic color calculation based on focus intensity
  const getIntensityColor = (count: number) => {
    if (count === 0) return '#112240'; // Empty Dark Blue
    if (count === 1) return '#20454E'; // Faded Mint
    if (count <= 3) return '#429A84';  // Medium Mint
    return '#64FFDA';                  // Max Brightness Mint
  };

  // --- SECURITY INTERCEPT: IF LOCKED, SHOW VAULT SCREEN ---
  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="lock-closed" size={80} color="#FF6B6B" />
        <Text style={{ color: '#E6F1FF', fontSize: 28, fontWeight: 'bold', marginTop: 20 }}>Zero-Trust Vault</Text>
        <Text style={{ color: '#8892B0', fontSize: 14, marginTop: 10, marginBottom: 40, textAlign: 'center' }}>
          Biometric authentication required to view your analytics and performance data.
        </Text>
        
        <TouchableOpacity 
          onPress={handleBiometricAuth} 
          style={{ backgroundColor: '#64FFDA', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Ionicons name="finger-print" size={24} color="#0A192F" />
          <Text style={{ color: '#0A192F', fontSize: 18, fontWeight: 'bold' }}>Scan to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- UNLOCKED: SHOW ACTUAL STATS ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={28} color="#64FFDA" />
        <Text style={styles.headerTitle}>Flow Vault</Text>
      </View>

      {/* High-Level Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{totalCompleted}</Text>
          <Text style={styles.metricLabel}>Goals Secured</Text>
        </View>
        <View style={[styles.metricCard, { borderColor: 'rgba(255, 107, 107, 0.3)' }]}>
          <Text style={[styles.metricValue, { color: '#FF6B6B' }]}>{totalDisruptions}</Text>
          <Text style={styles.metricLabel}>Total Disruptions</Text>
        </View>
      </View>

      {/* The GitHub-Style Heatmap */}
      <View style={styles.heatmapCard}>
        <Text style={styles.heatmapTitle}>90-Day Lock-In Density</Text>
        
        <View style={styles.gridContainer}>
          {heatmapData.map((day, index) => (
            <View 
              key={index} 
              style={[
                styles.gridSquare, 
                { backgroundColor: getIntensityColor(day.count) }
              ]} 
            />
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Less</Text>
          <View style={[styles.legendSquare, { backgroundColor: '#112240' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#20454E' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#429A84' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#64FFDA' }]} />
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>

      {/* Philosophy Banner */}
      <View style={styles.philosophyBox}>
        <Text style={styles.philosophyText}>"We remember, you decide."</Text>
      </View>
    </ScrollView>
  );
}

// Calculate square size dynamically so 90 days fit beautifully on any screen
const screenWidth = Dimensions.get('window').width;
const squareSize = (screenWidth - 80) / 14;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F', padding: 24, paddingTop: 60 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#E6F1FF', marginLeft: 12 },
  
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  metricCard: { flex: 1, backgroundColor: '#112240', borderWidth: 1, borderColor: '#233554', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: '#64FFDA', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#8892B0', textTransform: 'uppercase', letterSpacing: 1 },
  
  heatmapCard: { backgroundColor: '#112240', borderWidth: 1, borderColor: '#233554', padding: 20, borderRadius: 12, marginBottom: 30 },
  heatmapTitle: { fontSize: 16, fontWeight: 'bold', color: '#E6F1FF', marginBottom: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start' },
  gridSquare: { width: squareSize, height: squareSize, borderRadius: 4 },
  
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 20, gap: 6 },
  legendText: { fontSize: 10, color: '#8892B0' },
  legendSquare: { width: 12, height: 12, borderRadius: 2 },
  
  philosophyBox: { alignItems: 'center', paddingVertical: 20, opacity: 0.5 },
  philosophyText: { color: '#64FFDA', fontStyle: 'italic', fontSize: 14 }
});