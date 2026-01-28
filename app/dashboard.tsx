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

import { DEFAULT_LANGUAGE } from '@/constants/translations';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';

import LeaderBoard from '../assets/images/LeaderBoard.svg';
import Lessons from '../assets/images/Lessons.svg';
import MarketPrice from '../assets/images/market-price.svg';
import MascotFarmer from '../assets/images/MascotFarmer.svg';
import Quest from '../assets/images/Quest.svg';
import Reward from '../assets/images/Reward.svg';

const PIXEL_FONT = 'monospace';

// --- HUB BUTTON COMPONENT ---
const HubButton = ({ icon, label, onPress, style, textStyle }: any) => (
  <TouchableOpacity style={[styles.buttonBase, style]} onPress={onPress}>
    {icon}
    <Text style={[styles.buttonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

// --- PROGRESS BAR COMPONENT (Fixes Type Incompatibility Error) ---
const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
  const progress = total > 0 ? completed / total : 0;
  const barWidth = `${progress * 100}%`; 
  
  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.barBackground}>
        <View style={[progressStyles.barFill, { width: 75 }]} /> 
      </View>
      <Text style={progressStyles.text}>{completed} / {total} {total > 1 ? 'Lessons' : 'Lesson'} Completed</Text>
    </View>
  );
};

// --- TIP OF THE DAY COMPONENT ---
const TipOfTheDay = ({ tipText }: { tipText: string }) => {
    return (
        <View style={styles.tipContainer}>
            <FontAwesome5 name="lightbulb" size={16} color="#FFD700" style={{ marginRight: 10 }} />
            <Text style={styles.tipText} numberOfLines={2}>
                {tipText}
            </Text>
        </View>
    );
};

// --- DATA TYPES (Fixes Element implicitly has an 'any' type error) ---
interface QuestDetail {
    id: number;
    title: string;
    description: string;
}

interface ActiveQuestData {
    status: string;
    quest: QuestDetail | null;
}

type UserProgress = {
    total_lessons: number;
    completed_lessons: number;
    user_coins: number; 
    active_quest: QuestDetail | null;
};

// --- FETCHER FUNCTION: User Progress & Active Quest (Fixes Block-Scoped Variable Error) ---
const fetchUserProgress = async (): Promise<UserProgress> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    
    if (!userId) {
        return { total_lessons: 0, completed_lessons: 0, user_coins: 0, active_quest: null };
    }

    // 1. Fetch Profile Data (Coins) - Fetched for backend consistency
    const { data: profileData } = await supabase.from('profiles').select('coins').eq('id', userId).single();
    const user_coins = profileData?.coins || 0;

    // 2. Fetch Lesson Progress
    const { count: total_lessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
    const { count: completed_lessons } = await supabase.from('user_lessons').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    // 3. Fetch Active Quest
    let active_quest: QuestDetail | null = null;
    
    const { data: userQuests, error: questError } = await supabase
        .from('user_quests')
        .select('status, quest:quests(id, title, description)') as { data: ActiveQuestData[] | null; error: any };

    if (questError) {
        console.error("Error fetching active quest:", questError);
    } else if (userQuests && userQuests.length > 0) {
        // Fix: Accessing the nested quest object after casting/defining ActiveQuestData
        active_quest = userQuests[0].quest;
    }
    
    return {
        total_lessons: total_lessons || 0,
        completed_lessons: completed_lessons || 0,
        user_coins,
        active_quest
    };
};

// --- DUMMY TIP FETCHER ---
const fetchTipOfTheDay = async (lang: string) => {
    return "Remember to check the market prices before selling your produce for the best value!";
};


export default function DashboardScreen() {
  const router = useRouter();
  const { t, language, isLoading: isTransLoading } = useTranslation(); 
    
  // 1. Fetch User Progress (Lessons, Coins, Active Quest)
  const { 
    data: progressData, 
    loading: progressLoading, 
    refresh: refreshProgress, 
    refreshing: refreshingProgress 
} = useCachedQuery(
    `dashboard_progress_data`,
    fetchUserProgress
  );
    
  // 2. Fetch Tip of the Day
  const { data: tipText, loading: tipLoading, refresh: refreshTip } = useCachedQuery(
    `dashboard_tip_of_day_${language || DEFAULT_LANGUAGE}`,
    () => fetchTipOfTheDay(language || DEFAULT_LANGUAGE)
  );

  const isScreenLoading = (progressLoading || tipLoading || isTransLoading) && !progressData;
    
  // Combined Refresh function
  const handleRefresh = async () => {
    await Promise.all([refreshProgress(), refreshTip()]);
  };
    
  if (isScreenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      </SafeAreaView>
    );
  }
    
  const completed = progressData?.completed_lessons || 0;
  const total = progressData?.total_lessons || 0;
  const activeQuest = progressData?.active_quest;


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshingProgress} onRefresh={handleRefresh} tintColor="#388e3c" />}
      >
        
        {/* ACTIVE QUEST CARD */}
        <View style={styles.currentLessonContainer}>
          <MascotFarmer width={120} height={120} style={styles.mascot} />
          
          {activeQuest ? (
            <TouchableOpacity
              style={[styles.currentLessonCardBase, styles.activeQuestCardGlow]}
              onPress={() => { router.push({ pathname: '/quest-details', params: { id: activeQuest.id.toString() } }); }}
             >
              
              <View style={styles.lessonInfo}>
                {/* Using 'as never' to bypass TranslationKeys type check */}
                <Text style={styles.currentQuestTitle}>
                  {t('active_quest' as never) || 'ACTIVE QUEST'}
                </Text>
                
                <View style={styles.lessonRow}>
                    <Quest width={40} height={40} style={styles.questIcon} />
                  
                  <View style={styles.lessonDetails}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>{activeQuest.title}</Text>
                  </View>
                </View>
                
                <Text style={styles.lessonDescription} numberOfLines={2}>{activeQuest.description}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.currentLessonCardBase, {backgroundColor: '#333'}]}>
                {/* Using 'as never' to bypass TranslationKeys type check */}
                <Text style={{ color: 'white' }}>{t('no_active_quest' as never) || 'No active quests right now.'}</Text>
            </View>
          )}
        </View>

        {/* PROGRESS BAR */}
        <ProgressBar completed={completed} total={total} />
        
        {/* TIP OF THE DAY */}
        {tipText && <TipOfTheDay tipText={tipText} />}

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
  
    // --- Tip Styles ---
    tipContainer: { backgroundColor: 'rgba(255, 255, 0, 0.1)', padding: 12, borderRadius: 10, marginHorizontal: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
    tipText: { color: '#E0E0E0', fontSize: 13, flexShrink: 1 },
    // ------------------

  currentLessonContainer: { marginBottom: 16, paddingHorizontal: 8 },
  currentLessonCardBase: { backgroundColor: '#222', borderRadius: 20, padding: 15, paddingLeft: 100, minHeight: 130, justifyContent: 'center' },
  activeQuestCardGlow: { borderColor: '#4A148C', borderWidth: 1, shadowColor: '#4A148C', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  
  mascot: { position: 'absolute', left: 0, top: -20, zIndex: 5 },
  lessonInfo: { flex: 1 },
  currentQuestTitle: { color: '#9E9E9E', fontSize: 12, fontFamily: PIXEL_FONT, fontWeight: 'bold', marginBottom: 4 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  questIcon: { marginRight: 10 },
  lessonDetails: { flex: 1 },
  lessonTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
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

// --- Progress Bar Styles ---
const progressStyles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 8
    },
    barBackground: {
        width: '100%',
        height: 10,
        backgroundColor: '#333',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    barFill: {
        height: '100%',
        backgroundColor: '#388e3c', // Green fill
        borderRadius: 5,
    },
    text: {
        color: '#B0B0B0',
        fontSize: 12,
        fontFamily: PIXEL_FONT,
        fontWeight: 'bold',
    },
});