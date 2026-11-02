import { useFocusEffect } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { fetchTasks, updateTaskFields } from '../taskService';

export default function TimerScreen() {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [hasArmed, setHasArmed] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
  
  // Analytics Tracking
  const [disruptions, setDisruptions] = useState(0);

  // Absolute Timestamp ref for flawless background execution
  const targetEndTimeRef = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadTask = async () => {
        const tasks = await fetchTasks();
        const currentActive = tasks.find((t: any) => t.status === 'active');
        setActiveTask(currentActive || null);

        if (currentActive && currentActive.id !== loadedTaskId) {
          setTimeLeft((currentActive.expectedDuration || 25) * 60);
          setLoadedTaskId(currentActive.id);
          setDisruptions(0); // Reset disruptions for a new task
        }
      };
      loadTask();
    }, [loadedTaskId])
  );

  // 1. Hardware Sensor: Accelerometer
  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (!isManualOverride) {
        setIsFaceDown(z < -0.2);
      }
    });
    return () => sub.remove();
  }, [isManualOverride]);

  // 2. NEW: Gamified Flow Shield (App State Detection)
  // This detects if they swipe out to Instagram/TikTok and penalizes them
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // If the app goes to the background while the timer is armed...
      if (nextAppState.match(/inactive|background/) && isActive && hasArmed) {
        setIsActive(false);
        setHasArmed(false);
        targetEndTimeRef.current = null;
        setDisruptions(prev => prev + 1); // Log the distraction
        Vibration.vibrate(1000);
        Alert.alert(
          "Flow Shield Shattered 💥", 
          "You left the app during an active Lock-In. A disruption has been recorded to your Vault."
        );
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isActive, hasArmed]);

  // 3. Core Timer Engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const effectivelyFaceDown = isFaceDown || isManualOverride;

    if (isActive) {
      if (effectivelyFaceDown) {
        // Arming Phase
        if (!hasArmed) {
          setHasArmed(true);
          // Set the exact timestamp in the future when this should end
          targetEndTimeRef.current = Date.now() + (timeLeft * 1000);
          Vibration.vibrate(100);
        }
        
        // Ticking Phase (Uses absolute time, immune to background freezing)
        interval = setInterval(() => {
          if (targetEndTimeRef.current) {
            const remainingSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remainingSeconds);

            if (remainingSeconds <= 0) {
              clearInterval(interval);
              setIsActive(false);
              setHasArmed(false);
              setIsManualOverride(false);
              targetEndTimeRef.current = null;
              Vibration.vibrate([1000, 1000, 1000]);

              if (activeTask) {
                // Save task completion and write the disruptions to the database
                updateTaskFields(activeTask.id, { status: 'completed', totalDisruptions: disruptions });
              }

              Alert.alert("Session Complete", `Goal achieved.\nTotal Disruptions: ${disruptions}`);
              setActiveTask(null);
              setLoadedTaskId(null);
            }
          }
        }, 500); // Check twice a second for UI smoothness

      } else if (hasArmed) {
        // Penalty Phase (Phone picked up before timer ended)
        setIsActive(false);
        setHasArmed(false);
        targetEndTimeRef.current = null; // Clear the background target
        setDisruptions(prev => prev + 1); // Log the distraction
        Vibration.vibrate(500);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, isFaceDown, isManualOverride, activeTask, hasArmed, disruptions, timeLeft]);

  const toggleTimer = () => {
    if (!isActive && !isFaceDown && !isManualOverride) {
      Alert.alert("Initiate", "Place phone face down, or use the manual override for the presentation.");
    }
    if (isActive) {
      setHasArmed(false);
      setIsManualOverride(false);
      targetEndTimeRef.current = null;
    }
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const triggerSecretOverride = () => {
    if (isActive && !hasArmed) {
      setIsManualOverride(true);
    } else if (hasArmed) {
      setIsManualOverride(false);
      setIsFaceDown(false);
    }
  };

  if (!activeTask) return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Active Intention</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isActive && (isFaceDown || isManualOverride) && (
        <TouchableOpacity 
          activeOpacity={1} 
          onLongPress={triggerSecretOverride}
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', zIndex: 999, justifyContent: 'center', alignItems: 'center' }]}
        >
          <Text style={{ color: '#112240', fontSize: 12 }}>DEEP FOCUS ENGAGED</Text>
          <Text style={{ color: '#0A192F', fontSize: 8, marginTop: 20 }}>(Long press to simulate breaking focus)</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.activeTitle}>Target: {activeTask.title}</Text>
      
      {/* DISRUPTION COUNTER UI */}
      <View style={styles.disruptionBadge}>
        <Text style={styles.disruptionText}>Disruptions: {disruptions}</Text>
      </View>

      <View style={styles.engineContainer}>
        {!isActive && hasArmed === false ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>SENSORS OFFLINE</Text>
          </View>
        ) : isActive && !isFaceDown && !isManualOverride && !hasArmed ? (
          <TouchableOpacity activeOpacity={0.8} onLongPress={triggerSecretOverride} style={[styles.statusBox, { borderColor: '#FFD166' }]}>
            <Text style={[styles.statusText, { color: '#FFD166' }]}>AWAITING PLACEMENT...</Text>
            <Text style={{ color: '#FFD166', fontSize: 8, marginTop: 4 }}>(Long press to override)</Text>
          </TouchableOpacity>
        ) : isActive && (isFaceDown || isManualOverride) ? (
          <View style={[styles.statusBox, { backgroundColor: '#64FFDA' }]}>
            <Text style={[styles.statusText, { color: '#0A192F' }]}>SENSORS ARMED</Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>FOCUS BROKEN</Text>
          </View>
        )}

        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

        <TouchableOpacity style={styles.startBtn} onPress={toggleTimer}>
          <Text style={styles.btnText}>{isActive ? "Pause" : "Initiate Lock-In"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F', padding: 24, paddingTop: 60 },
  emptyContainer: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#E6F1FF' },
  activeTitle: { fontSize: 18, fontWeight: 'bold', color: '#64FFDA', textAlign: 'center', marginBottom: 10 },
  
  disruptionBadge: { backgroundColor: 'rgba(255, 107, 107, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, alignSelf: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)' },
  disruptionText: { color: '#FF6B6B', fontSize: 12, fontWeight: 'bold' },

  engineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBox: { borderWidth: 1, borderColor: '#64FFDA', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  statusText: { color: '#64FFDA', fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
  warningBox: { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderWidth: 1, borderColor: '#FF6B6B', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  warningText: { color: '#FF6B6B', fontSize: 20, fontWeight: 'bold' },
  timerText: { fontSize: 80, fontWeight: 'bold', color: '#E6F1FF', marginBottom: 60, fontVariant: ['tabular-nums'] },
  startBtn: { width: '100%', backgroundColor: '#64FFDA', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#0A192F', fontSize: 18, fontWeight: 'bold' }
});