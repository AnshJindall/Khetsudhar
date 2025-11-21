import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// List of languages from your design
const LANGUAGES = [
  { id: 'hi', name: 'हिन्दी/HINDI' },
  { id: 'en', name: 'ENGLISH' },
  { id: 'ml', name: 'മലയാളം/MALAYALAM' },
  { id: 'ta', name: 'தமிழ்/TAMIL' },
  { id: 'kn', name: 'ಕನ್ನಡ/KANNADA' },
  { id: 'te', name: 'తెలుగు/TELUGU' },
  { id: 'kok', name: 'कोंकणी/KONKANI' },
  { id: 'mr', name: 'मराठी/MARATHI' },
];

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const router = useRouter();

 const handleConfirm = async () => { // Make async
    if (selectedLanguage) {
      // 2. Add this logic to save to DB
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .update({ language: selectedLanguage })
          .eq('id', session.user.id);
          
        if (error) console.error('Error saving language:', error);
      }

      router.push('/crop'); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title Section */}
        <Text style={styles.title}>CHOOSE YOUR LANGUAGE</Text>
        <Text style={styles.subtitle}>अपनी भाषा चुनें</Text>

        {/* Language List */}
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

        {/* Spacer View to push confirm button to bottom */}
        <View style={{ flex: 1 }} />

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedLanguage ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedLanguage}
          onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>CONFIRM</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718', // Dark background
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30, // Added padding to replace removed header
    paddingBottom: 30,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#B0B0B0',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    width: '100%',
    maxWidth: 400, // Max width for larger screens
  },
  languageButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30, // Fully rounded corners
    marginVertical: 7,
    borderWidth: 1,
    borderColor: '#555555',
  },
  languageButtonSelected: {
    backgroundColor: '#388e3c', // Green highlight
    borderColor: '#388e3c',
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20, // Margin from the list or spacer
  },
  confirmButtonDisabled: {
    backgroundColor: '#555555',
  },
  confirmButtonActive: {
    backgroundColor: '#388e3c',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});