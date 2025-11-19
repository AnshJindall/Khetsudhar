import { useLocalSearchParams, useRouter } from 'expo-router';
// ... rest of imports
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- IMPORT SUPABASE CLIENT ---
import { supabase } from '../utils/supabase';

import Coin from '../assets/images/coin.svg';
import Mascot from '../assets/images/Mascot.svg';
import MascotFarmer from '../assets/images/MascotFarmer.svg';

// --- TYPE DEFINITIONS ---

// Define the shape of data coming from the 'lessons' table
interface LessonData {
  id: number;
  title: string;
  description: string;
  sequence: number;
  points: number;
  content_path: string | null;
  theme: string | null; // Added to support your custom styling
}

// Define the final state structure for the UI
interface Lesson extends LessonData {
  status: 'current' | 'completed' | 'locked';
}

// --- DATA FETCHING & PROCESSING LOGIC ---

/**
 * Fetches all available lessons and merges them with the user's completed status.
 */
const fetchLessonsAndProgress = async (): Promise<{lessons: Lesson[], lastCompletedId: number}> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    // If no user, treat all lessons as locked and uncompleted
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('*')
      .order('sequence', { ascending: true })
      .returns<LessonData[]>();
    
    const guestLessons: Lesson[] = (allLessons || []).map(lesson => ({
      ...lesson,
      status: lesson.sequence === 1 ? 'current' : 'locked', // Allow first lesson to be current for guest/new user
    }));

    return { lessons: guestLessons, lastCompletedId: 0 };
  }

  // 1. Fetch ALL lessons
  const { data: allLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .order('sequence', { ascending: true })
    .returns<LessonData[]>();

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError.message);
    Alert.alert('Data Error', 'Failed to load lessons from the server.');
    return { lessons: [], lastCompletedId: 0 };
  }

  // 2. Fetch User's completed lessons
  const { data: completedLessons, error: progressError } = await supabase
    .from('user_lessons')
    .select('lesson_id')
    .eq('user_id', userId);

  if (progressError) {
    console.warn('Error fetching user progress:', progressError.message);
  }

  const completedIds = new Set((completedLessons || []).map(c => c.lesson_id));

  // Determine the sequence number of the most recently completed lesson
  let lastCompletedId = 0;
  if (completedLessons) {
    const completedSequences = allLessons
      .filter(l => completedIds.has(l.id))
      .map(l => l.sequence);
    
    if (completedSequences.length > 0) {
      lastCompletedId = Math.max(...completedSequences);
    }
  }

  // 3. Combine data and determine status
  const finalLessons: Lesson[] = (allLessons || []).map(lesson => {
    const isCompleted = completedIds.has(lesson.id);
    let status: 'current' | 'completed' | 'locked' = 'locked';

    if (isCompleted) {
      status = 'completed';
    } else if (lesson.sequence === lastCompletedId + 1) {
      status = 'current';
    } else if (lastCompletedId === 0 && lesson.sequence === 1) {
      // Allow the first lesson to be current if nothing is completed
      status = 'current';
    }

    return {
      ...lesson,
      status,
    } as Lesson;
  });
  
  return { lessons: finalLessons, lastCompletedId };
};

// --- Reusable Lesson Card Component ---
interface LessonCardProps {
  lesson: Lesson;
  isCurrent?: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCurrent = false }) => {
  const router = useRouter();
  const { id, title, description, points, status, theme } = lesson;

  // --- STYLE LOGIC ---
  const cardStyle = [
    styles.lessonCard,
    isCurrent && styles.currentLessonCard,
    status === 'completed' && styles.completedLessonCard,
    status === 'locked' && styles.lockedLessonCard,
    // Apply special theme style only if it's not completed
    theme === 'women' && status !== 'completed' && styles.womenLessonCard,
  ];

  // Logic to determine if the lesson is actionable
  const isActionable = status !== 'locked';

  return (
    <TouchableOpacity
      style={cardStyle}
      disabled={!isActionable}
      onPress={() =>
        router.push({
          pathname: '/lesson/[id]',
          params: { id: id }, // Use the Supabase 'id' for routing
        })
      }>
      <Text style={[styles.lessonNumber, isCurrent && styles.currentLessonNumber]}>
        {lesson.sequence}
      </Text>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{title}</Text>
        {status !== 'completed' && (
          <Text style={styles.lessonDescription}>{description}</Text>
        )}
        <View style={styles.pointsContainer}>
          <Coin width={24} height={24} style={styles.coinIcon} />
          <Text style={styles.pointsText}>{points}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


// --- LESSONS SCREEN MAIN COMPONENT ---
export default function LessonsScreen() {
  const { lesson_completed } = useLocalSearchParams<{ lesson_completed?: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCompletedSeq, setLastCompletedSeq] = useState(0);

  // Load lessons from Supabase on component mount
  const loadLessons = useCallback(async () => {
    setLoading(true);
    const { lessons: fetchedLessons, lastCompletedId: completedSeq } = await fetchLessonsAndProgress();
    setLessons(fetchedLessons);
    setLastCompletedSeq(completedSeq);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Re-run loadLessons whenever the screen is focused or 'lesson_completed' parameter changes
    // The router replace in LoginScreen uses this param for simple navigation signaling
    loadLessons(); 
  }, [lesson_completed, loadLessons]);
  
  // Use useMemo to filter and compute sections only when 'lessons' changes
  const { currentLesson, completedLessons, upcomingLessons, totalScore } = useMemo(() => {
    const current = lessons.find((l) => l.status === 'current');
    const completed = lessons.filter((l) => l.status === 'completed');
    const upcoming = lessons.filter((l) => l.status === 'locked');
    const score = completed.reduce((sum, l) => sum + l.points, 0);

    return {
      currentLesson: current,
      completedLessons: completed,
      upcomingLessons: upcoming,
      totalScore: score,
    };
  }, [lessons]);

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
        {/* Current Lesson Section */}
        {currentLesson && (
          <>
            <View style={styles.currentSection}>
              <Mascot width={140} height={140} style={styles.mascot} />
              <View style={styles.currentTag}>
                <Text style={styles.currentTagText}>CURRENT LESSON</Text>
              </View>
            </View>
            <LessonCard lesson={currentLesson} isCurrent={true} />
          </>
        )}

        {/* Upcoming Lessons Section */}
        {upcomingLessons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UPCOMING LESSONS</Text>
            {upcomingLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </>
        )}

        {/* Recently Completed Section */}
        {completedLessons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENTLY COMPLETED LESSON</Text>
            <View style={styles.completedSectionHeader}>
              <MascotFarmer width={100} height={100} style={styles.farmerMascot} />
              <Text style={styles.totalScore}>TOTAL SCORE {totalScore}</Text>
            </View>
            {/* Sort completed lessons in reverse sequence order so latest is first */}
            {completedLessons.sort((a, b) => b.sequence - a.sequence).map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES (Kept exactly as provided by the user) ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718',
  },
  container: {
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  },
  currentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
    marginBottom: -40,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  mascot: {
    transform: [{ translateX: -15 }],
  },
  currentTag: {
    backgroundColor: '#388e3c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    transform: [{ translateY: -30 }],
    shadowColor: '#388e3c',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  currentTagText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#777',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 25,
    letterSpacing: 1,
  },
  lessonCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  currentLessonCard: {
    paddingLeft: 20,
    backgroundColor: '#222',
    borderColor: '#388e3c',
    shadowColor: '#388e3c',
    shadowOpacity: 0.7,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  lockedLessonCard: {
    backgroundColor: '#222',
    opacity: 0.6,
  },
  completedLessonCard: {
    backgroundColor: '#2E7D32',
    borderColor: '#388E3C',
    paddingLeft: 20,
  },
  womenLessonCard: {
    backgroundColor: '#4A148C', // Dark Purple/Pink
    borderColor: '#C2185B', // Hot Pink Border
    shadowColor: '#C2185B',
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  lessonNumber: {
    color: '#555',
    fontSize: 80,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginRight: 15,
    lineHeight: 80,
  },
  currentLessonNumber: {
    color: '#FFFFFF',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lessonDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  coinIcon: {
    marginRight: 8,
  },
  pointsText: {
    color: '#FDD835',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  farmerMascot: {
    width: 100,
    height: 100,
  },
  totalScore: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});