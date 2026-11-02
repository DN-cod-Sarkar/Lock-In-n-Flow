import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Camera access is required.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    }
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleProfileImagePress = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Gallery", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const theme = {
    bg: isDarkMode ? '#0A192F' : '#F0F4F8',
    card: isDarkMode ? '#112240' : '#FFFFFF',
    text: isDarkMode ? '#E6F1FF' : '#0A192F',
    subText: isDarkMode ? '#8892B0' : '#495670',
    border: isDarkMode ? '#233554' : '#D1D8E0',
    accent: '#64FFDA'
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleProfileImagePress} style={[styles.profileImageContainer, { borderColor: theme.accent }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person" size={40} color={theme.subText} />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color="#0A192F" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.text }]}>Flow Master</Text>
          <Text style={[styles.profileSub, { color: theme.subText }]}>Tap photo to update</Text>
        </View>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.settingSub, { color: theme.subText }]}>Toggle app theme</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#D1D8E0', true: '#64FFDA' }} thumbColor={isDarkMode ? '#0A192F' : '#FFFFFF'} />
        </View>

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Push Notifications</Text>
            <Text style={[styles.settingSub, { color: theme.subText }]}>Reminders for scheduled tasks</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: theme.border, true: '#64FFDA' }} thumbColor={notifications ? '#0A192F' : '#FFFFFF'} />
        </View>

        <View style={[styles.settingRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Strict Flow Shield</Text>
            <Text style={[styles.settingSub, { color: theme.subText }]}>Instantly fail task on app exit</Text>
          </View>
          <Switch value={strictMode} onValueChange={setStrictMode} trackColor={{ false: theme.border, true: '#FF6B6B' }} thumbColor={strictMode ? '#0A192F' : '#FFFFFF'} />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.dangerBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.dangerBtnText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  backBtn: { padding: 10, borderRadius: 12, borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { paddingHorizontal: 20 },
  profileSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  profileImageContainer: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  profileImage: { width: '100%', height: '100%', borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#64FFDA', padding: 6, borderRadius: 12, borderWidth: 2, borderColor: '#0A192F' },
  profileName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  profileSub: { fontSize: 14 },
  sectionTitle: { color: '#64FFDA', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  settingTextContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  settingSub: { fontSize: 12 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF6B6B', marginTop: 10 },
  dangerBtnText: { color: '#FF6B6B', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});