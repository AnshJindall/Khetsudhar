import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Added
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// List of languages 
const LANGUAGES = [
  { id: 'hi', name: 'हिन्दी/HINDI' },
  { id: 'en', name: 'ENGLISH' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ/PUNJABI' }, 
  { id: 'ml', name: 'മലയാളം/MALAYALAM' },
  { id: 'ta', name: 'தமிழ்/TAMIL' },
  { id: 'kn', name: 'ಕನ್ನಡ/KANNADA' },
  { id: 'te', name: 'తెలుగు/TELUGU' },
  { id: 'kok', name: 'कोंकणी/KONKANI' },
  { id: 'mr', name: 'मराठी/MARATHI' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t, setLanguage, isLoading: isTransLoading } = useTranslation(); 
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleConfirm = async () => { 
    if (selectedLanguage) {
      try {
        // 1. Update the app's current language immediately
        setLanguage(selectedLanguage);
        
        // 2. Save to Local Storage for Onboarding Check
        await AsyncStorage.setItem('onboarding_lang', selectedLanguage);

        // 3. (Optional) Try saving to DB if user happens to be logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('profiles')
            .update({ language: selectedLanguage })
            .eq('id', session.user.id);
        }

        // 4. Navigate to Step 2: Crop Selection
        router.replace('/crop'); 
        
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

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
        <Text style={styles.title}>{t('choose_language')}</Text>
        <Text style={styles.subtitle}>{t('choose_your_language_in_hindi')}</Text>

        <View style={styles.listContainer}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageButton,
                selectedLanguage === lang.id && styles.languageButtonSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.id)}>
              <Text style={styles.languageButtonText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedLanguage ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedLanguage}
          onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 30 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#B0B0B0', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  listContainer: { width: '100%', maxWidth: 400 },
  languageButton: { backgroundColor: '#333333', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 30, marginVertical: 7, borderWidth: 1, borderColor: '#555555' },
  languageButtonSelected: { backgroundColor: '#388e3c', borderColor: '#388e3c' },
  languageButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  confirmButton: { width: '100%', maxWidth: 400, paddingVertical: 16, borderRadius: 30, marginTop: 20 },
  confirmButtonDisabled: { backgroundColor: '#555555' },
  confirmButtonActive: { backgroundColor: '#388e3c' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});