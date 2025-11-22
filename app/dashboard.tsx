import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Ensure this package is installed: npx expo install @react-native-async-storage/async-storage

import { DEFAULT_LANGUAGE } from '@/constants/translations';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useTranslation } from '@/hooks/useTranslation';
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

// --- 1. DEFINE THE TYPE ---
type DashboardLesson = {
  id: number | string;
  title: string;
  description: string;
  sequence: number | string; 
  points: number;
  theme: string | null;
  isAllComplete?: boolean;
};

// --- FETCHER FUNCTION ---
const fetchDashboardData = async (lang: string): Promise<DashboardLesson | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  const titleCol = `title_${lang}`;
  const descCol = `description_${lang}`;
  const fallbackTitle = `title_${DEFAULT_LANGUAGE}`;
  const fallbackDesc = `description_${DEFAULT_LANGUAGE}`;

  // 1. Fetch All Lessons
  const { data: allLessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('sequence', { ascending: true });
    
  if (error) throw error;

  // 2. Fetch User Progress
  let completedIds: number[] = [];
  if (userId) {
    const { data: completedData } = await supabase
      .from('user_lessons')
      .select('lesson_id')
      .eq('user_id', userId);
    if (completedData) completedIds = completedData.map(r => r.lesson_id);
  }

  // 3. Determine Next Lesson
  if (allLessons && allLessons.length > 0) {
    // Cast to 'any' temporarily to access dynamic columns like 'title_hi'
    const upcomingRaw = allLessons.find(l => !completedIds.includes(l.id)) as any;

    if (upcomingRaw) {
      return {
        id: upcomingRaw.id,
        sequence: upcomingRaw.sequence,
        points: upcomingRaw.points,
        theme: upcomingRaw.theme,
        // Safe dynamic access
        title: upcomingRaw[titleCol] || upcomingRaw[fallbackTitle] || "Lesson",
        description: upcomingRaw[descCol] || upcomingRaw[fallbackDesc] || "Start learning!",
        isAllComplete: false
      };
    } else {
      // --- ALL DONE STATE ---
      return {
        id: 'completed',
        title: "ALL LESSONS COMPLETED!",
        description: "You are a master farmer! Review your lessons anytime.",
        sequence: "🏆",
        points: 0,
        isAllComplete: true,
        theme: 'gold'
      };
    }
  }
  return null;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t, language, isLoading: isTransLoading } = useTranslation(); 

  // Use our offline-ready hook
  const { data: nextLesson, loading, isOffline, refresh, refreshing } = useCachedQuery(
    `dashboard_next_lesson_${language || DEFAULT_LANGUAGE}`,
    () => fetchDashboardData(language || DEFAULT_LANGUAGE)
  );

  const isScreenLoading = (loading || isTransLoading) && !nextLesson;

  if (isScreenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#388e3c" />}
      >
        
        {/* OFFLINE BANNER */}
        {isOffline && (
            <View style={styles.offlineBanner}>
                <FontAwesome5 name="wifi" size={14} color="white" />
                <Text style={styles.offlineText}> Offline Mode</Text>
            </View>
        )}

        <View style={styles.currentLessonContainer}>
          <MascotFarmer width={120} height={120} style={styles.mascot} />
          
          {nextLesson ? (
            <TouchableOpacity
              style={[
                styles.currentLessonCardBase, 
                styles.currentLessonCardGlow,
                nextLesson.isAllComplete && styles.completedCard
              ]}
              onPress={() => {
                if (nextLesson.isAllComplete) {
                   router.push('/lessons'); 
                } else {
                   router.push({ pathname: '/lesson/[id]', params: { id: nextLesson.id.toString() } });
                }
              }}>
              
              <View style={styles.lessonInfo}>
                <Text style={[styles.currentLessonTitle, nextLesson.isAllComplete && { color: '#FFD700' }]}>
                  {nextLesson.isAllComplete ? t('completed') : t('continue_learning')}
                </Text>
                
                <View style={styles.lessonRow}>
                  <Text style={[styles.lessonNumber, nextLesson.isAllComplete && { fontSize: 50 }]}>
                    {nextLesson.sequence}
                  </Text>

                  <View style={styles.lessonDetails}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>{nextLesson.title}</Text>
                  </View>

                  <View style={styles.pointsContainer}>
                    {nextLesson.isAllComplete ? (
                       <FontAwesome5 name="star" size={24} color="#FFD700" />
                    ) : (
                       <>
                         <Coin width={20} height={20} style={styles.coinIcon} />
                         <Text style={styles.pointsText}>{nextLesson.points}</Text>
                       </>
                    )}
                  </View>
                </View>
                
                <Text style={styles.lessonDescription} numberOfLines={2}>{nextLesson.description}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.currentLessonCardBase}><Text style={{ color: 'white' }}>No lessons available.</Text></View>
          )}
        </View>

        {/* Grid Buttons */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <HubButton label={t('monthly_quests')} icon={<Quest width={80} height={80} />} onPress={() => router.push('/quests')} style={[styles.buttonSquare, styles.questsButton]} textStyle={styles.squareButtonText} />
            <HubButton label={t('leaderboard')} icon={<LeaderBoard width={80} height={80} />} onPress={() => router.push('/leaderboard')} style={[styles.buttonSquare, styles.leaderboardButton]} textStyle={styles.squareButtonText} />
          </View>
          <View style={styles.gridRow}>
            <HubButton label={t('rewards')} icon={<Reward width={80} height={80} />} onPress={() => router.push('/reward-root')} style={[styles.buttonRect, styles.rewardsButton]} textStyle={styles.rectButtonText} />
          </View>
          <View style={styles.gridRow}>
            <HubButton label={t('lessons')} icon={<Lessons width={80} height={80} />} onPress={() => router.push({ pathname: '/lessons', params: { lesson_completed: '0' } })} style={[styles.buttonRect, styles.lessonsButton]} textStyle={styles.rectButtonText} />
          </View>
          <View style={styles.gridRow}>
            <HubButton label={t('market_prices')} icon={<MarketPrice width={80} height={80} />} onPress={() => router.push('/marketPrices')} style={[styles.buttonRect, styles.marketButton]} textStyle={styles.rectButtonText} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  offlineBanner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#C62828', padding: 8, borderRadius: 8, marginBottom: 20 },
  offlineText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  
  currentLessonContainer: { marginBottom: 16, paddingHorizontal: 8 },
  currentLessonCardBase: { backgroundColor: '#222', borderRadius: 20, padding: 15, paddingLeft: 100, minHeight: 130, justifyContent: 'center' },
  currentLessonCardGlow: { borderColor: '#388e3c', borderWidth: 1, shadowColor: '#388e3c', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  completedCard: { borderColor: '#FFD700', borderWidth: 2, backgroundColor: '#2A2A2A' },
  
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
  
  // Grid
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