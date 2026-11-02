import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Details", "Please enter both your email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      Alert.alert("Authentication Failed", error.message);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Missing Details", "Please enter both your email and password.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Right Settings Button */}
      <View style={styles.topRight}>
         <TouchableOpacity style={styles.settingsBtn}>
           <Ionicons name="settings" size={24} color="#8892B0" />
         </TouchableOpacity>
      </View>

      <View style={styles.content}>
        
        {/* Your Custom App Logo */}
        <Image 
          source={require('../../assets/images/logo-glow.png')} 
          style={styles.logo} 
        />

        <Text style={styles.title}>Lock-In n Flow</Text>
        <Text style={styles.subtitle}>Authenticate to access your vault.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#8892B0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8892B0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
          <Text style={styles.signUpBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  
  topRight: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  settingsBtn: { backgroundColor: '#112240', padding: 10, borderRadius: 30, borderWidth: 1, borderColor: '#233554' },
  
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  
  // Custom Logo Styles
  logo: { width: 90, height: 90, borderRadius: 22, marginBottom: 24, resizeMode: 'cover' },
  
  title: { fontSize: 32, fontWeight: 'bold', color: '#E6F1FF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8892B0', marginBottom: 40, textAlign: 'center' },
  
  input: { width: '100%', backgroundColor: '#112240', borderWidth: 1, borderColor: '#233554', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, color: '#E6F1FF', fontSize: 16, marginBottom: 16 },
  
  loginBtn: { width: '100%', backgroundColor: '#64FFDA', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16, elevation: 2 },
  loginBtnText: { color: '#0A192F', fontSize: 16, fontWeight: 'bold' },
  
  signUpBtn: { width: '100%', backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#64FFDA' },
  signUpBtnText: { color: '#64FFDA', fontSize: 16, fontWeight: 'bold' }
});