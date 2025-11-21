import { supabase } from '@/utils/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- Assets ---
import RewardMascot from '../../assets/images/RewardMascot.svg';
import FacebookIcon from '../../assets/images/facebook.svg';
import InstagramIcon from '../../assets/images/instagram.svg';
import WhatsAppIcon from '../../assets/images/whatsapp.svg';
import XIcon from '../../assets/images/x-twitter.svg';

const REWARD_DATA: { [key: string]: any } = {
  '1': { percentage: '10%', item: 'FERTILIZER PURCHASE' },
  '2': { percentage: '20%', item: 'COMPOSTING TOOLS' },
  'default': { percentage: '5%', item: 'FARM SUPPLIES' }
};

export default function RewardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  const reward = REWARD_DATA[id] || REWARD_DATA['default'];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsGuest(!session);
      setLoading(false);
    });
  }, []);

  const handleContinue = () => {
    if (isGuest) {
      router.replace({
        pathname: '/login',
        params: { lesson_completed: id },
      });
    } else {
      router.replace('/dashboard'); 
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.rewardCard}>
          <Text style={styles.congratulationsText}>CONGRATULATIONS!!</Text>
          
          {/* --- Restored Mascot Visuals --- */}
          <View style={styles.imageContainer}>
            <RewardMascot width={200} height={200} />
          </View>
          
          <Text style={styles.rewardTextLarge}>YOU WON {reward.percentage} OFF!!</Text>
          <Text style={styles.rewardTextSmall}>ON {reward.item}</Text>
        </View>

        <View style={styles.shareSection}>
          <Text style={styles.shareTitle}>SHARE WITH FELLOW FARMERS</Text>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity><WhatsAppIcon width={50} height={50} /></TouchableOpacity>
            <TouchableOpacity><FacebookIcon width={50} height={50} /></TouchableOpacity>
            <TouchableOpacity><InstagramIcon width={50} height={50} /></TouchableOpacity>
            <TouchableOpacity><XIcon width={50} height={50} /></TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            {isGuest ? 'LOGIN TO SAVE' : 'CONTINUE'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  
  rewardCard: { 
    backgroundColor: '#333333', 
    width: '100%', 
    maxWidth: 400, 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#444'
  },
  congratulationsText: { 
    color: '#FDD835', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    letterSpacing: 2, 
    fontFamily: 'monospace' 
  },
  imageContainer: { 
    width: '90%', 
    aspectRatio: 1, 
    backgroundColor: '#D7C3A0', // <--- The tile color you liked
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  rewardTextLarge: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 10, 
    letterSpacing: 1.5, 
    fontFamily: 'monospace' 
  },
  rewardTextSmall: { 
    color: '#D0D0D0', 
    fontSize: 18, 
    fontWeight: '500', 
    textAlign: 'center', 
    marginBottom: 10, 
    fontFamily: 'monospace' 
  },
  shareSection: { backgroundColor: '#333333', width: '100%', maxWidth: 400, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 },
  shareTitle: { color: '#FDD835', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1, fontFamily: 'monospace' },
  socialIconsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
  
  continueButton: { backgroundColor: '#388e3c', width: '100%', maxWidth: 400, paddingVertical: 18, borderRadius: 30, marginTop: 10, borderWidth: 2, borderColor: '#4CAF50' },
  continueButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 },
});