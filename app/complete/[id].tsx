import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Checkmark from '../../assets/images/check.svg';
import Coin from '../../assets/images/coin.svg';

const LESSON_INFO: { [key: string]: any } = {
  '1': { title: 'Basics of Sustainable Banana Farming', points: 1000 },
  '2': { title: 'Healthy Soil for Better Plants', points: 1500 },
  '3': { title: 'Shade and Plant Diversity', points: 1000 },
  '4': { title: 'Smart Water Use', points: 1500 },
  '5': { title: 'Natural Pest Control', points: 1000 },
};

export default function LessonCompleteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const lesson = LESSON_INFO[id] || { title: 'Lesson Completed', points: 1000 };

  const handleContinue = () => {
    // --- LOGIC FIX: Go back to Lessons List to continue progress ---
    // We use replace to pop this completion screen off the stack
    router.replace('/lessons');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Lesson Title Card */}
        <View style={styles.lessonTitleCard}>
          <Text style={styles.lessonNumber}>{id}</Text>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        {/* Main Completion Card */}
        <View style={styles.card}>
          <Checkmark width={200} height={200} style={styles.checkmark} />
          <Text style={styles.completeText}>LESSON COMPLETED!</Text>

          <View style={styles.rewardContainer}>
            <Text style={styles.rewardTitle}>XP EARNED:</Text>
            <View style={styles.pointsContainer}>
              <Coin width={30} height={30} style={styles.coinIcon} />
              <Text style={styles.pointsText}>{lesson.points}</Text>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>CONTINUE LEARNING</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  lessonTitleCard: { backgroundColor: '#2C2C2E', borderRadius: 20, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  lessonNumber: { color: '#FFFFFF', fontSize: 50, fontWeight: '900', fontFamily: 'monospace', marginRight: 15, lineHeight: 50 },
  lessonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  card: { backgroundColor: '#2E7D32', borderRadius: 20, padding: 20, alignItems: 'center', flexGrow: 1, justifyContent: 'center', borderWidth: 1, borderColor: '#388E3C' },
  checkmark: { marginBottom: 20 },
  completeText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 20, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1 },
  rewardContainer: { alignItems: 'center' },
  rewardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', fontFamily: 'monospace', textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  pointsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  coinIcon: { marginRight: 10 },
  pointsText: { color: '#FDD835', fontSize: 24, fontWeight: 'bold' },
  continueButton: { backgroundColor: '#4CAF50', width: '100%', paddingVertical: 16, borderRadius: 30, marginTop: 20, borderWidth: 2, borderColor: '#66BB6A' },
  continueButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});