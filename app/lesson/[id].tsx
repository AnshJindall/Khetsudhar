import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

// Import Supabase client
import { supabase } from '../../utils/supabase';

// Re-use coin icon for visual consistency
import Coin from '../../assets/images/coin.svg';

// --- TYPE DEFINITIONS ---

interface LessonDetail {
  id: number;
  title: string;
  sequence: number;
  content: string; 
  points: number;
  theme: string | null;
}

// --- SUPABASE FUNCTIONS ---

const fetchLessonById = async (lessonId: number): Promise<LessonDetail | null> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, sequence, content, points, theme')
    .eq('id', lessonId)
    .single();

  if (error) {
    console.error('Error fetching lesson detail:', error.message);
    return null;
  }
  return data as LessonDetail;
};


const markLessonComplete = async (lesson: LessonDetail): Promise<{success: boolean, sequence: number}> => {
  // FIX: Use the correct asynchronous method to get the user ID
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  if (!userId) {
    Alert.alert('Authentication Error', 'You must be logged in to complete a lesson.');
    return { success: false, sequence: lesson.sequence };
  }

  // Insert the completion record into the user_lessons table
  const { error: insertError } = await supabase
    .from('user_lessons')
    .insert([
      { 
        user_id: userId, 
        lesson_id: lesson.id, 
        completed_at: new Date().toISOString() 
      }
    ])
    .select()
    .maybeSingle();

  if (insertError) {
    if (insertError.code === '23505') { 
        console.log('Lesson already completed by user, continuing.');
        return { success: true, sequence: lesson.sequence };
    }
    console.error('Error marking lesson complete:', insertError.message);
    Alert.alert('Completion Error', 'Failed to save progress. Please try again.');
    return { success: false, sequence: lesson.sequence };
  }
  
  return { success: true, sequence: lesson.sequence };
};


// --- LESSON DETAIL SCREEN MAIN COMPONENT ---
export default function LessonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Ensure 'id' is a number
  const lessonId = parseInt(id || '0', 10);
  
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); 

  // Fetch lesson data and check completion status when the screen loads
  useEffect(() => {
    if (lessonId > 0) {
      const loadData = async () => {
        setLoading(true);
        const fetchedLesson = await fetchLessonById(lessonId);
        setLesson(fetchedLesson);

        if (fetchedLesson) {
          // FIX: Safely retrieve userId for completion status check
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user.id;

          if (userId) {
            // Check if lesson is already completed
            const { data, error } = await supabase
              .from('user_lessons')
              .select('id')
              .eq('user_id', userId) 
              .eq('lesson_id', lessonId)
              .maybeSingle();
              
            if (data) setIsCompleted(true);
          }
        }

        setLoading(false);
      };
      loadData();
    } else {
      setLoading(false);
      Alert.alert('Error', 'Invalid lesson ID.');
      router.back();
    }
  }, [lessonId]);


  const handleMarkComplete = async () => {
    if (!lesson || isCompleting) return;
    setIsCompleting(true);

    const { success, sequence } = await markLessonComplete(lesson);

    setIsCompleting(false);

    if (success) {
      setIsCompleted(true);
      Alert.alert('Success!', `Lesson ${sequence} completed. ${lesson.points} points earned!`, [
        {
          text: 'Continue',
          onPress: () => router.replace({
            pathname: '/lessons',
            params: { lesson_completed: sequence.toString() } 
          })
        }
      ]);
    } else {
      // Error handled inside markLessonComplete
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Lesson not found.</Text>
      </View>
    );
  }

  const completeButtonTitle = isCompleted 
    ? 'COMPLETED (GO BACK)' 
    : isCompleting 
    ? 'COMPLETING...' 
    : `MARK AS COMPLETE (+${lesson.points} POINTS)`;

  const completeButtonStyle = isCompleted
    ? styles.completeButtonCompleted
    : styles.completeButton;


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sequenceTitle}>Lesson {lesson.sequence}</Text>
        <Text style={styles.mainTitle}>{lesson.title}</Text>

        <View style={styles.pointsHeader}>
            <Coin width={30} height={30} style={styles.coinIcon} />
            <Text style={styles.pointsText}>{lesson.points} Points Available</Text>
        </View>
        
        <View style={styles.contentBox}>
            <Text style={styles.contentTitle}>THE CORE CONCEPT:</Text>
            <Text style={styles.contentText}>
                {lesson.content || "Placeholder content. Content is missing in the Supabase 'lessons' table."}
            </Text>
        </View>

        <TouchableOpacity
          style={completeButtonStyle}
          onPress={isCompleted ? router.back : handleMarkComplete}
          disabled={isCompleting}>
          <Text style={styles.completeButtonText}>{completeButtonTitle}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← BACK TO ALL LESSONS</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES (Unchanged from previous versions) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { paddingHorizontal: 20, paddingVertical: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  errorText: { color: '#FF4444', fontSize: 18 },
  sequenceTitle: { color: '#388e3c', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  mainTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  pointsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333333' },
  coinIcon: { marginRight: 10 },
  pointsText: { color: '#FDD835', fontSize: 20, fontWeight: 'bold' },
  contentBox: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 20, marginBottom: 40 },
  contentTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#444444', paddingBottom: 5 },
  contentText: { color: '#B0B0B0', fontSize: 16, lineHeight: 24 },
  completeButton: { width: '100%', paddingVertical: 18, borderRadius: 30, backgroundColor: '#388e3c', marginBottom: 15 },
  completeButtonCompleted: { width: '100%', paddingVertical: 18, borderRadius: 30, backgroundColor: '#555', marginBottom: 15 },
  completeButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  backButton: { marginTop: 10, alignSelf: 'center' },
  backButtonText: { color: '#B0B0B0', fontSize: 14, textDecorationLine: 'underline' }
});