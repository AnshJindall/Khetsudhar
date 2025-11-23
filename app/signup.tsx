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

const upsertProfile = async (userId: string, fullName: string, mobileNo: string, agriStackId: string) => {
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, full_name: fullName, mobile_no: mobileNo, agristack_id: agriStackId },
    { onConflict: 'id' }
  );
  if (error) console.error('Error upserting profile:', error);
  return true;
};

export default function SignupScreen() { 
  const router = useRouter();
  const { t, isLoading: isTransLoading } = useTranslation();
  const { lesson_completed } = useLocalSearchParams<{ lesson_completed?: string }>();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [agriStackId, setAgriStackId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- EMAIL GENERATION ---
  const getEmailFromUsername = (usr: string) => {
    const cleanUser = usr.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanUser}@khet.com`;
  };

  const handleRegister = async () => {
    if (username.length >= 3 && password.length >= 6 && fullName.trim() !== '' && !isLoading) {
      setIsLoading(true);
      const emailToRegister = getEmailFromUsername(username);
      
      const { data, error } = await supabase.auth.signUp({
        email: emailToRegister,
        password: password,
        options: { data: { full_name: fullName, username: username } }
      });

      if (error) {
        setIsLoading(false);
        Alert.alert('Registration Error', error.message);
      } else if (data.session && data.user) {
         await upsertProfile(data.user.id, fullName, mobileNo, agriStackId);
         setIsLoading(false);
         router.replace({ pathname: '/lessons', params: { lesson_completed: lesson_completed } });
      } else {
        setIsLoading(false);
        Alert.alert('Success', 'Account created! Please log in.');
        router.replace('/login');
      }
    } else {
      Alert.alert('Missing Data', 'Please check username (3+ chars) and password (6+ chars).');
    }
  };

  const isRegisterActive = username.length >= 3 && password.length >= 6 && fullName.trim() !== '' && !isLoading;

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
        <Text style={styles.title}>{t('signup')}</Text> 
        <View style={styles.avatarContainer}><UserIcon width={100} height={100} /></View>
        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput style={styles.input as StyleProp<TextStyle>} placeholder="Enter full name" placeholderTextColor="#A0A0A0" value={fullName} onChangeText={setFullName} />
        <Text style={styles.inputLabel}>{t('username')}</Text>
        <TextInput style={styles.input as StyleProp<TextStyle>} placeholder="Create username" placeholderTextColor="#A0A0A0" autoCapitalize="none" value={username} onChangeText={setUsername} />
        <Text style={styles.inputLabel}>{t('password')}</Text>
        <TextInput style={styles.input as StyleProp<TextStyle>} placeholder="Create password" placeholderTextColor="#A0A0A0" secureTextEntry value={password} onChangeText={setPassword} />
        <Text style={styles.inputLabel}>MOBILE NO.</Text>
        <TextInput style={styles.input as StyleProp<TextStyle>} placeholder="Enter phone no." placeholderTextColor="#A0A0A0" keyboardType="numeric" maxLength={10} value={mobileNo} onChangeText={setMobileNo} />
        <Text style={styles.inputLabel}>AGRISTACK ID</Text>
        <TextInput style={styles.input as StyleProp<TextStyle>} placeholder="Enter agristack id" placeholderTextColor="#A0A0A0" value={agriStackId} onChangeText={setAgriStackId} />
        
        <TouchableOpacity style={[styles.actionButton, isRegisterActive ? styles.actionButtonActive : styles.actionButtonDisabled]} disabled={!isRegisterActive} onPress={handleRegister}>
          <Text style={styles.actionButtonText}>{isLoading ? 'CREATING...' : 'REGISTER'}</Text>
        </TouchableOpacity>

        <View style={styles.accountLinkContainer}>
          <Text style={styles.accountLinkText}>{t('already_have_account')}</Text> 
          <TouchableOpacity onPress={() => router.replace('/login')}><Text style={styles.createOneText}>{t('login')}</Text></TouchableOpacity>
        </View>
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
});