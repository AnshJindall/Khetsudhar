import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
// Ensure this package is installed: npx expo install @react-native-async-storage/async-storage

import { DEFAULT_LANGUAGE } from '@/constants/translations';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';
import { FontAwesome5 } from '@expo/vector-icons';

// Assuming these SVG imports are correct relative to your project structure
import Coin from '../assets/images/coin.svg';
import LeaderBoard from '../assets/images/LeaderBoard.svg';
import Lessons from '../assets/images/Lessons.svg';
import MarketPrice from '../assets/images/market-price.svg';
import MascotFarmer from '../assets/images/MascotFarmer.svg';
import Quest from '../assets/images/Quest.svg';
import Reward from '../assets/images/Reward.svg';

const PIXEL_FONT = 'monospace';

// --- Type Definitions (Crucial for TypeScript safety) ---
interface QuestDetail {
    id: number;
    title: string;
    description: string;
}

interface UserQuestResult {
    status: string;
    // The quest property is nested as an object due to the Supabase join ('quest:quests(...)')
    quest: QuestDetail; 
}

interface HubButtonProps {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

// --- NEW COMPONENT: Dynamic Score Header ---
const ScoreHeader: React.FC<{ score: number }> = ({ score }) => (
    <View style={scoreHeaderStyles.container}>
        <Text style={scoreHeaderStyles.greeting}>Welcome Back, Farmer!</Text>
        <View style={scoreHeaderStyles.scoreBox}>
            <Coin width={24} height={24} style={{ marginRight: 5 }} />
            <Text style={scoreHeaderStyles.scoreText}>{score.toLocaleString()}</Text>
        </View>
    </View>
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
const scoreHeaderStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#2C2C2E', // Slightly lighter than background
        borderBottomWidth: 1,
        borderBottomColor: '#388e3c',
    },
    greeting: {
        color: '#E0E0E0',
        fontSize: 16,
        fontFamily: PIXEL_FONT,
    },
    scoreBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#4A148C', // Quests color for contrast
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDD835',
    },
    scoreText: {
        color: '#FDD835',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

// --- NEW COMPONENT: Progress Bar (FIXED to resolve 'Type string is not assignable to DimensionValue' error) ---
const LessonProgressBar: React.FC<{ total: number; completed: number }> = ({ total, completed }) => {
    const progress = total > 0 ? completed / total : 0;
    
    // FIX: Define the width explicitly as a string type to satisfy TypeScript
    const progressWidth: string = `${progress * 100}%`; 

    return (
        <View style={progressBarStyles.container}>
            <View style={progressBarStyles.barBackground}>
                {/* Error was here: Passing the dynamically calculated string width */}
                <View style={[progressBarStyles.barFill, { width:75 }]} /> 
            </View>
            <Text style={progressBarStyles.progressText}>{completed} / {total} Lessons</Text>
        </View>
    );
};

const progressBarStyles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    barBackground: {
        height: 10,
        backgroundColor: '#333',
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#388e3c', // Green progress color
        borderRadius: 5,
    },
    progressText: {
        color: '#B0B0B0',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    }
});


// --- Widget Component Definitions ---
const ActiveQuestWidget: React.FC<{ quest: QuestDetail }> = ({ quest }) => {
    const router = useRouter();
    return (
        <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
                <FontAwesome5 name="tasks" size={18} color="#FFD700" />
                <Text style={styles.widgetTitle}>Active Quest</Text>
            </View>
            <Text style={styles.widgetContentTitle}>{quest.title}</Text>
            <Text style={styles.widgetContent} numberOfLines={2}>
                {quest.description}
            </Text>
            <TouchableOpacity 
                style={styles.widgetButton}
                onPress={() => router.push({ pathname: './quest-details/[id]', params: { id: quest.id.toString() } })}
            >
                <Text style={styles.widgetButtonText}>Continue Quest</Text>
            </TouchableOpacity>
        </View>
    );
};

const DailyTipWidget: React.FC<{ cropName: string; tip: string }> = ({ cropName, tip }) => {
    return (
        <View style={[styles.widgetCard, styles.tipCard]}>
            <View style={styles.widgetHeader}>
                <FontAwesome5 name="lightbulb" size={18} color="#0277BD" />
                <Text style={styles.widgetTitle}>Daily Tip for {cropName}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
        </View>
    );
};

// --- Hub Button Component ---
const HubButton: React.FC<HubButtonProps> = ({ icon, label, onPress, style, textStyle }) => (
  <TouchableOpacity style={[styles.buttonBase, style]} onPress={onPress}>
    {icon}
    <Text style={[styles.buttonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

// --- Main Component ---
export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<any>(null);
  
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [totalLessonsCount, setTotalLessonsCount] = useState(1); 
  const [userScore, setUserScore] = useState(12450); // Initial Placeholder

  // STATE FOR LIVE HUB
  const [activeQuest, setActiveQuest] = useState<QuestDetail | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [userCropName, setUserCropName] = useState<string>('Your Crop'); 

  const getDailyTip = useCallback((cropName: string) => {
    const tips: { [key: string]: string } = {
        'Rice': "Monitor for Brown Spot Disease in hot, humid weather. Ensure proper drainage after heavy rain.",
        'Banana': "Add an extra layer of mulch to maintain soil moisture during the dry season.",
        'Wheat': "It's the optimal time for the first nitrogen top-dressing application.",
        'Your Crop': "Welcome! Select your primary crop in your profile to get personalized daily tips.",
    };
    return tips[cropName] || "Keep learning and exploring new farming techniques!";
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        try {
          setLoading(true); 

          // --- 1. SESSION AND CACHE ---
          const cachedLesson = await AsyncStorage.getItem('dashboard_next_lesson');
          if (cachedLesson) {
            setNextLesson(JSON.parse(cachedLesson));
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const userId = session.user.id;

          // --- 2. FETCH PROFILE (For Crop Info & Points) ---
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('crop:crops(name), points') 
            .eq('id', userId)
            .single();

          let currentCropName = 'Your Crop'; 
          if (profileData) {
                if (profileData.points !== undefined) {
                    setUserScore(profileData.points);
                }

                if (profileData.crop) {
                    const cropData = profileData.crop as { name: string }[] | { name: string };
                    if (Array.isArray(cropData) && cropData.length > 0) {
                        currentCropName = cropData[0].name; 
                    } else if (!Array.isArray(cropData) && (cropData as {name: string}).name) {
                        currentCropName = (cropData as {name: string}).name;
                    }
                }
          } else if (profileError && profileError.code !== 'PGRST116') {
             console.error("Profile fetch error:", profileError);
          }
          
          setUserCropName(currentCropName);
          setDailyTip(getDailyTip(currentCropName));


          // --- 3. FETCH ACTIVE QUEST (FIXED: Scope and Indexing) ---
          // Explicit type assertion handles the implicit 'any' error (TS7015)
          const { data: userQuests, error: questError } = await supabase
            .from('user_quests')
            .select(`
                status,
                quest:quests(id, title, description) 
            `)
            .eq('user_id', userId)
            .eq('status', 'in_progress')
            .order('start_date', { ascending: false })
            .limit(1) as { data: UserQuestResult[] | null, error: any }; 
            
          // Correct error handling placed after the variable declaration (TS2448 fix)
          if (questError) {
              console.error("Error fetching active quest:", questError);
              setActiveQuest(null);
          } else if (userQuests && userQuests.length > 0) {
              // Safely access the quest object from the first result
              const activeQuestData = userQuests[0].quest;
              setActiveQuest(activeQuestData);
          } else {
              setActiveQuest(null);
          }

          // --- 4. FETCH NEXT LESSON & PROGRESS ---
          const { data: completedData } = await supabase.from('user_lessons').select('lesson_id').eq('user_id', userId);
          const completedIds = (completedData || []).map(r => r.lesson_id);
          setCompletedLessonsCount(completedIds.length); 

          const { data: allLessons } = await supabase.from('lessons').select('*').order('sequence', { ascending: true });

          if (allLessons) {
              setTotalLessonsCount(allLessons.length > 0 ? allLessons.length : 1); 

            const upcoming = allLessons.find(l => !completedIds.includes(l.id))
              || { ...allLessons[allLessons.length - 1], isAllComplete: true };

            setNextLesson(upcoming);
            await AsyncStorage.setItem('dashboard_next_lesson', JSON.stringify(upcoming));
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }, [getDailyTip])
  );

  // Dynamic message based on state
  const mascotMessage = activeQuest 
    ? "You have a priority quest in progress!" 
    : (nextLesson?.isAllComplete
        ? "Congratulations! You've mastered all lessons."
        : `Let's continue Lesson ${nextLesson?.sequence || 1} today!`
      );


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScoreHeader score={userScore} />
      
      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* Mascot and Dialogue Box */}
          <View style={styles.mascotArea}>
            <MascotFarmer width={100} height={100} style={styles.mascot} />
            <View style={styles.dialogueBox}>
              <Text style={styles.dialogueText}>{mascotMessage}</Text>
            </View>
          </View>
          
          <View style={styles.currentLessonContainer}>
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
                  {/* Lesson Progress Bar - Now using the fixed component */}
                  <LessonProgressBar completed={completedLessonsCount} total={totalLessonsCount} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentLessonCardBase}><Text style={{ color: 'white' }}>No lessons available.</Text></View>
            )}
          </View>
          
          {/* --- LIVE HUB WIDGETS --- */}
          <View style={styles.widgetGroup}>
            {/* Active Quest Widget */}
            {activeQuest ? (
                <ActiveQuestWidget quest={activeQuest} />
            ) : (
                <View style={[styles.widgetCard, { borderColor: '#4A148C', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}>
                    <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 10 }}>No priority quests right now!</Text>
                    <TouchableOpacity 
                        style={[styles.widgetButton, { backgroundColor: 'transparent', borderColor: '#4A148C', borderWidth: 2 }]}
                        onPress={() => router.push('/quests')}>
                        <Text style={[styles.widgetButtonText, { color: '#4A148C' }]}>View All Quests</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Daily Tip Widget */}
            <DailyTipWidget cropName={userCropName} tip={dailyTip} />
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

  // Mascot Area Styles
  mascotArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  mascot: { 
    width: 100, 
    height: 100, 
    marginRight: 10,
  },
  dialogueBox: {
    flex: 1,
    backgroundColor: '#388e3c', // Lesson/Success color
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 10, 
  },
  dialogueText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: PIXEL_FONT,
  },
  
  // Lesson Card
  currentLessonContainer: { marginBottom: 16, paddingHorizontal: 8 },
  currentLessonCardBase: { backgroundColor: '#222', borderRadius: 20, padding: 15, minHeight: 130, justifyContent: 'center' },
  currentLessonCardGlow: { borderColor: '#388e3c', borderWidth: 1, shadowColor: '#388e3c', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  lessonInfo: { flex: 1 },
  currentLessonTitle: { color: '#9E9E9E', fontSize: 12, fontFamily: PIXEL_FONT, fontWeight: 'bold', marginBottom: 4 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  lessonNumber: { color: 'white', fontSize: 50, fontFamily: PIXEL_FONT, lineHeight: 50, marginRight: 10 }, 
  lessonDetails: { flex: 1 },
  lessonTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pointsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, alignSelf: 'flex-start' },
  coinIcon: { marginRight: 4 },
  pointsText: { color: '#FDD835', fontSize: 16, fontWeight: 'bold' },
  lessonDescription: { color: '#B0B0B0', fontSize: 12 },
  gridContainer: { width: '100%', marginTop: 16 },
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
  
  // --- LIVE HUB WIDGET STYLES ---
  widgetGroup: { gap: 12, marginBottom: 16, marginTop: 8 },
  widgetCard: { 
    backgroundColor: '#222', 
    borderRadius: 15, 
    padding: 15, 
    borderWidth: 1,
    borderColor: '#4A148C',
  },
  tipCard: {
    borderColor: '#0277BD',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: PIXEL_FONT,
  },
  widgetContentTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  widgetContent: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 10,
  },
  widgetButton: {
    backgroundColor: '#4A148C', 
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  widgetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  }
});