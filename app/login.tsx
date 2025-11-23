import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '@/utils/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import UserIcon from '../assets/images/user.svg';

export default function LoginScreen() {
  const router = useRouter();
  const { t, isLoading: isTransLoading } = useTranslation();
  const { lesson_completed } = useLocalSearchParams<{ lesson_completed?: string }>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- EMAIL GENERATION (Must match Signup) ---
  const getEmailFromUsername = (usr: string) => {
    const cleanUser = usr.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanUser}@khet.com`;
  };

  // Handle Login
  const handleLogin = async () => {
    if (username.trim() !== '' && password.length >= 1 && !isLoading) {
      setIsLoading(true);
      
      const emailToLogin = getEmailFromUsername(username);
      console.log("Logging in with:", emailToLogin); // Check terminal if this matches your dashboard

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password,
      });

      setIsLoading(false);

      if (error) {
        Alert.alert('Login Failed', error.message);
      } else if (data.session) {
        // Login Success
        router.replace({
            pathname: '/lessons',
            params: { lesson_completed: lesson_completed }
        });
      }
    } else {
      Alert.alert('Invalid Input', 'Please enter your username and password.');
    }
  };

  const isLoginActive = username.trim() !== '' && password.length > 0 && !isLoading;

  if (isTransLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('login')}</Text>

        <View style={styles.avatarContainer}>
          <UserIcon width={100} height={100} />
        </View>
        
        <Text style={styles.inputLabel}>{t('username')}</Text>
        <TextInput
          style={styles.input as StyleProp<TextStyle>}
          placeholder="Enter your username"
          placeholderTextColor="#A0A0A0"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.inputLabel}>{t('password')}</Text>
        <TextInput
          style={styles.input as StyleProp<TextStyle>}
          placeholder="Enter your password"
          placeholderTextColor="#A0A0A0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[
            styles.actionButton,
            isLoginActive ? styles.actionButtonActive : styles.actionButtonDisabled,
          ]}
          disabled={!isLoginActive}
          onPress={handleLogin}>
          <Text style={styles.actionButtonText}>
            {isLoading ? t('logging_in') : t('login')}
          </Text>
        </TouchableOpacity>

        <View style={styles.accountLinkContainer}>
          <Text style={styles.accountLinkText}>{t('dont_have_account')}</Text>
          <TouchableOpacity onPress={() => router.replace('/signup')}>
            <Text style={styles.createOneText}>{t('create_one')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dataNote}>{t('data_note')}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  container: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  avatarContainer: { backgroundColor: '#333333', borderRadius: 15, padding: 20, marginBottom: 30 },
  inputLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 5, marginTop: 15 },
  input: { width: '100%', backgroundColor: '#333333', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: '#444444', color: '#FFFFFF', fontSize: 16 },
  actionButton: { width: '100%', paddingVertical: 14, borderRadius: 30, marginTop: 25 },
  actionButtonActive: { backgroundColor: '#388e3c' },
  actionButtonDisabled: { backgroundColor: '#555555' },
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  accountLinkContainer: { flexDirection: 'row', marginTop: 20 },
  accountLinkText: { color: '#B0B0B0', fontSize: 14, marginRight: 5 },
  createOneText: { color: '#388e3c', fontSize: 14, textDecorationLine: 'underline' },
  dataNote: { color: '#B0B0B0', fontSize: 12, marginTop: 30, marginBottom: 10, textAlign: 'center' },
});