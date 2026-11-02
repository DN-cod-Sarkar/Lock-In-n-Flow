import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter, useSegments } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { auth } from '../firebase';

SystemUI.setBackgroundColorAsync('#0A192F');

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (initializing) return;
    const inAuthScreen = segments[0] === ('login' as string);

    if (!user && !inAuthScreen) {
      router.replace('/login' as any);
    } else if (user && inAuthScreen) {
      router.replace('/' as any);
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A192F' }}>
        <ActivityIndicator size="large" color="#64FFDA" />
      </View>
    );
  }


  if (!user) {
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="login" />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A192F',
          borderTopColor: '#233554',
          elevation: 0,
          height: Platform.OS === 'android' ? 75 : 90,
          paddingBottom: Platform.OS === 'android' ? 16 : 30,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#64FFDA',
        tabBarInactiveTintColor: '#8892B0',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => <Ionicons name="timer-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Flow Vault',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}