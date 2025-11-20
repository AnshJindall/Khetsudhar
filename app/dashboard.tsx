import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '@/utils/supabase';

import Coin from '../assets/images/coin.svg';
import LeaderBoard from '../assets/images/LeaderBoard.svg';
import Lessons from '../assets/images/Lessons.svg';
import MarketPrice from '../assets/images/market-price.svg';
import MascotFarmer from '../assets/images/MascotFarmer.svg';
import Quest from '../assets/images/Quest.svg';
import Reward from '../assets/images/Reward.svg';

const PIXEL_FONT = 'monospace';

const HubButton = ({ icon, label, onPress, style, textStyle }: any) => (
  <TouchableOpacity style={[styles.buttonBase, style]} onPress={onPress}>
    {icon}
    <Text style={[styles.buttonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const userId = session.user.id;

          const { data: completedData } = await supabase.from('user_lessons').select('lesson_id').eq('user_id', userId);
          const completedIds = (completedData || []).map(r => r.lesson_id);

          const { data: allLessons } = await supabase.from('lessons').select('*').order('sequence', { ascending: true });

          if (allLessons) {
            const upcoming = allLessons.find(l => !completedIds.includes(l.id));
            setNextLesson(upcoming || { ...allLessons[allLessons.length - 1], isAllComplete: true });
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.currentLessonContainer}>
            <MascotFarmer width={120} height={120} style={styles.mascot} />
            {nextLesson ? (
              <TouchableOpacity
                style={[styles.currentLessonCardBase, styles.currentLessonCardGlow]}
                onPress={() => nextLesson.id && router.push({ pathname: '/lesson/[id]', params: { id: nextLesson.id.toString() } })}>
                <View style={styles.lessonInfo}>
                  <Text style={styles.currentLessonTitle}>{nextLesson.isAllComplete ? 'COURSE COMPLETE!' : 'CONTINUE LEARNING'}</Text>
                  <View style={styles.lessonRow}>
                    <Text style={styles.lessonNumber}>{nextLesson.sequence}</Text>
                    <View style={styles.lessonDetails}>
                      <Text style={styles.lessonTitle} numberOfLines={2}>{nextLesson.title}</Text>
                    </View>
                    <View style={styles.pointsContainer}>
                      <Coin width={20} height={20} style={styles.coinIcon} />
                      <Text style={styles.pointsText}>{nextLesson.points}</Text>
                    </View>
                  </View>
                  <Text style={styles.lessonDescription} numberOfLines={2}>{nextLesson.description}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentLessonCardBase}><Text style={{color:'white'}}>No lessons available.</Text></View>
            )}
          </View>

          {/* Grid Buttons */}
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <HubButton label="QUESTS" icon={<Quest width={80} height={80} />} onPress={() => router.push('/quests')} style={[styles.buttonSquare, styles.questsButton]} textStyle={styles.squareButtonText} />
              <HubButton label="LEADERBOARD" icon={<LeaderBoard width={80} height={80} />} onPress={() => router.push('/leaderboard')} style={[styles.buttonSquare, styles.leaderboardButton]} textStyle={styles.squareButtonText} />
            </View>
            <View style={styles.gridRow}>
              <HubButton label="REWARDS" icon={<Reward width={80} height={80} />} onPress={() => router.push('/reward-root')} style={[styles.buttonRect, styles.rewardsButton]} textStyle={styles.rectButtonText} />
            </View>
            <View style={styles.gridRow}>
              <HubButton label="LESSONS" icon={<Lessons width={80} height={80} />} onPress={() => router.push({ pathname: '/lessons', params: { lesson_completed: '0' } })} style={[styles.buttonRect, styles.lessonsButton]} textStyle={styles.rectButtonText} />
            </View>
            <View style={styles.gridRow}>
              <HubButton label="MARKET PRICES" icon={<MarketPrice width={80} height={80} />} onPress={() => router.push('/marketPrices')} style={[styles.buttonRect, styles.marketButton]} textStyle={styles.rectButtonText} />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  currentLessonContainer: { marginBottom: 16, paddingHorizontal: 8 },
  currentLessonCardBase: { backgroundColor: '#222', borderRadius: 20, padding: 15, paddingLeft: 100, minHeight: 130, justifyContent: 'center' },
  currentLessonCardGlow: { borderColor: '#388e3c', borderWidth: 1, shadowColor: '#388e3c', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  mascot: { position: 'absolute', left: 0, top: -20, zIndex: 5 },
  lessonInfo: { flex: 1 },
  currentLessonTitle: { color: '#9E9E9E', fontSize: 12, fontFamily: PIXEL_FONT, fontWeight: 'bold', marginBottom: 4 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  lessonNumber: { color: 'white', fontSize: 70, fontFamily: PIXEL_FONT, lineHeight: 70, marginRight: 10 },
  lessonDetails: { flex: 1 },
  lessonTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pointsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, alignSelf: 'flex-start' },
  coinIcon: { marginRight: 4 },
  pointsText: { color: '#FDD835', fontSize: 16, fontWeight: 'bold' },
  lessonDescription: { color: '#B0B0B0', fontSize: 12 },
  gridContainer: { width: '100%' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  buttonBase: { borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 10, marginHorizontal: 8 },
  buttonSquare: { flex: 1, aspectRatio: 1 },
  buttonRect: { flex: 1, height: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontFamily: PIXEL_FONT },
  squareButtonText: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  rectButtonText: { fontSize: 20, marginLeft: 16 },
  questsButton: { backgroundColor: 'rgba(74, 20, 140, 0.5)', borderColor: '#4A148C' },
  leaderboardButton: { backgroundColor: 'rgba(253, 216, 53, 0.2)', borderColor: '#FDD835' },
  rewardsButton: { backgroundColor: 'rgba(194, 24, 91, 0.5)', borderColor: '#C2185B' },
  lessonsButton: { backgroundColor: 'rgba(56, 142, 60, 0.5)', borderColor: '#388e3c' },
  marketButton: { backgroundColor: 'rgba(2, 119, 189, 0.5)', borderColor: '#0277BD' },
});