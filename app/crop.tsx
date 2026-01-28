import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Added
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Define the crop data
const CROPS = [
  { id: 'coffee', name: 'COFFEE', image: require('../assets/images/crops/coffee.png') },
  { id: 'coconut', name: 'COCONUT', image: require('../assets/images/crops/coconut.png') },
  { id: 'rice', name: 'RICE', image: require('../assets/images/crops/rice.png') },
  { id: 'banana', name: 'BANANA', image: require('../assets/images/crops/banana.png') },
  { id: 'cardamom', name: 'CARDAMOM', image: require('../assets/images/crops/cardamom.png') },
  { id: 'black_pepper', name: 'BLACK PEPPER', image: require('../assets/images/crops/black_pepper.png') },
  { id: 'ginger', name: 'GINGER', image: require('../assets/images/crops/ginger.png') },
  { id: 'cashew', name: 'CASHEW', image: require('../assets/images/crops/cashew.png') },
];

export default function CropScreen() {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const router = useRouter();
  const { t, isLoading: isTransLoading } = useTranslation(); 

  const handleConfirm = async () => { 
    if (selectedCrop) {
      try {
        // 1. Save crop to Local Storage for Onboarding Check
        await AsyncStorage.setItem('onboarding_crop', selectedCrop);

        // 2. (Optional) Save crop to DB if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from('profiles')
            .update({ selected_crop: selectedCrop })
            .eq('id', session.user.id);
        }

        // 3. Navigate to Step 3: First Quest (ID: 1)
        // Make sure Quest 1 exists in your Supabase 'quests' table!
        router.replace({ pathname: '/quest-details', params: { id: '1' } }); 

      } catch (error) {
        console.error('Error saving crop:', error);
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
        <Text style={styles.title}>{t('choose_crop')}</Text>
        <Text style={styles.subtitle}>{t('choose_your_crop_in_hindi')}</Text>

        <View style={styles.gridContainer}>
          {CROPS.map((crop) => (
            <TouchableOpacity
              key={crop.id}
              style={[
                styles.cropButton,
                selectedCrop === crop.id && styles.cropButtonSelected,
              ]}
              onPress={() => setSelectedCrop(crop.id)}>
              <Image source={crop.image} style={styles.cropImage} />
              <Text style={styles.cropName}>{crop.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedCrop ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedCrop}
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
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', maxWidth: 400 },
  cropButton: { width: '48%', backgroundColor: '#333333', borderRadius: 15, padding: 10, alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#333333' },
  cropButtonSelected: { borderColor: '#388e3c' },
  cropImage: { width: 100, height: 100, marginBottom: 10 },
  cropName: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  confirmButton: { width: '100%', maxWidth: 400, paddingVertical: 16, borderRadius: 30, marginTop: 20 },
  confirmButtonDisabled: { backgroundColor: '#555555' },
  confirmButtonActive: { backgroundColor: '#388e3c' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});