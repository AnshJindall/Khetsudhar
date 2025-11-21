import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

const handleConfirm = async () => { // Make async
    if (selectedCrop) {
      // 2. Save crop to DB
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase
          .from('profiles')
          .update({ selected_crop: selectedCrop }) // Ensure column exists in DB
          .eq('id', session.user.id);

        if (error) console.error('Error saving crop:', error);
      }

      router.push('/lessons'); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Title Section */}
        <Text style={styles.title}>CHOOSE YOUR CROP</Text>
        <Text style={styles.subtitle}>अपनी फसल चुनें</Text>

        {/* Crop Grid */}
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

        {/* Spacer View to push confirm button to bottom */}
        <View style={{ flex: 1 }} />

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedCrop ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedCrop}
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
    paddingTop: 30,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
  },
  cropButton: {
    width: '48%', // Two columns with a small gap
    backgroundColor: '#333333',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#333333',
  },
  cropButtonSelected: {
    borderColor: '#388e3c', // Green highlight
  },
  cropImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  cropName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
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