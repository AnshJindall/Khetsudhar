import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Coin from '../assets/images/coin.svg';

export default function QuestCompleteScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleContinue = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Logged in user -> Dashboard
        router.replace('/dashboard');
      } else {
        // Onboarding user -> Login
        await AsyncStorage.setItem('onboarding_reward_claimed', 'true');
        router.replace('/login');
      }
    } catch (error) {
      console.error("Navigation error:", error);
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Info Card */}
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            {/* KEY 1: mission_complete */}
            <Text style={styles.questTitle}>
              {t('mission_complete')} 
            </Text>
            <View style={styles.miniPointsBadge}>
              <Coin width={16} height={16} />
              <Text style={styles.miniPointsText}>1000</Text>
            </View>
          </View>
          {/* KEY 2: great_job */}
          <Text style={styles.questDescription}>
             {t('great_job')}
          </Text>
        </View>

        {/* Main Success Card */}
        <View style={styles.successCard}>
          <View style={styles.checkCircle}>
            <FontAwesome5 name="check" size={50} color="white" />
          </View>

          {/* KEY 3: quest_completed */}
          <Text style={styles.completedTitle}>{t('quest_completed')}</Text>
          
          <View style={styles.rewardContainer}>
            {/* KEY 4: reward_earned */}
            <Text style={styles.rewardLabel}>{t('reward_earned')}</Text>
            <View style={styles.rewardValueRow}>
              <Coin width={32} height={32} />
              <Text style={styles.rewardValueText}>1000</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue} 
        >
          {/* KEY 5: continue_learning */}
          <Text style={styles.continueButtonText}>{t('continue_learning')}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  topCard: { backgroundColor: '#2C2C2E', width: '100%', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#444' },
  topCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  questTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10, fontFamily: 'monospace' },
  miniPointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  miniPointsText: { color: 'white', fontWeight: 'bold', fontFamily: 'monospace' },
  questDescription: { color: '#B0B0B0', fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
  successCard: { backgroundColor: '#2E4623', width: '100%', borderRadius: 24, paddingVertical: 50, paddingHorizontal: 20, alignItems: 'center', borderWidth: 2, borderColor: '#1b2e15' },
  checkCircle: { width: 100, height: 100, backgroundColor: '#64DD17', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 4, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  completedTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', fontFamily: 'monospace', letterSpacing: 1 },
  rewardContainer: { alignItems: 'center', gap: 8 },
  rewardLabel: { color: '#E0E0E0', fontSize: 16, fontWeight: '500', fontFamily: 'monospace', textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  rewardValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardValueText: { color: 'white', fontSize: 32, fontWeight: 'bold', fontFamily: 'monospace' },
  continueButton: { backgroundColor: '#43A047', width: '100%', paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 20, borderWidth: 2, borderColor: '#2E7D32' },
  continueButtonText: { color: 'white', fontSize: 20, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
});