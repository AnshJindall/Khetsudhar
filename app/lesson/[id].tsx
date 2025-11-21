import { FontAwesome5 } from '@expo/vector-icons';
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

import { supabase } from '@/utils/supabase';

interface LessonDetail {
  id: number;
  title: string;
  sequence: number;
  content: string; 
  points: number;
  theme: string | null;
}

const fetchLessonById = async (lessonId: number): Promise<LessonDetail | null> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, sequence, content, points, theme')
    .eq('id', lessonId)
    .single();

  if (error) {
    console.error('Error fetching lesson:', error.message);
    return null;
  }
  return data as LessonDetail;
};

const markLessonComplete = async (lesson: LessonDetail): Promise<{success: boolean, sequence: number}> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  // --- GUEST LOGIC: Allow proceed without saving ---
  if (!userId) {
    return { success: true, sequence: lesson.sequence };
  }

  // 1. Insert into user_lessons (Mark as Done)
  const { error: insertError } = await supabase
    .from('user_lessons')
    .insert([{ user_id: userId, lesson_id: lesson.id, completed_at: new Date().toISOString() }])
    .select()
    .maybeSingle();

  // 2. Handle Errors (Ignore duplicate key error 23505 if already completed)
  if (insertError) {
    if (insertError.code === '23505') {
      // Already completed, just return success without adding points again
      return { success: true, sequence: lesson.sequence };
    }
    Alert.alert('Error', 'Failed to save progress.');
    return { success: false, sequence: lesson.sequence };
  }

  // 3. AWARD COINS (Only if this is the first time completing it - i.e. no insertError)
  // A. Get current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('coins, xp')
    .eq('id', userId)
    .single();

  if (profile) {
    const newCoins = (profile.coins || 0) + lesson.points;
    const newXp = (profile.xp || 0) + lesson.points; // Assuming points = XP

    // B. Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coins: newCoins, xp: newXp })
      .eq('id', userId);
      
    if (updateError) console.error("Error awarding coins:", updateError);
  }

  return { success: true, sequence: lesson.sequence };
};

const FormattedContent = ({ content }: { content: string }) => {
  if (!content) return null;
  const cleanContent = content.replace(/\\n/g, '\n');
  const lines = cleanContent.split('\n');

  return (
    <View style={styles.contentContainer}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('##')) {
          return <Text key={index} style={styles.contentHeader}>{trimmed.replace(/##/g, '').trim()}</Text>;
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.contentText}>{trimmed.replace(/^-/, '').trim()}</Text>
            </View>
          );
        } else if (trimmed.length > 0) {
          return <Text key={index} style={styles.contentText}>{trimmed}</Text>;
        }
        return <View key={index} style={{ height: 8 }} />;
      })}
    </View>
  );
};

export default function LessonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = parseInt(id || '0', 10);
  
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); 

  useEffect(() => {
    if (lessonId > 0) {
      const loadData = async () => {
        setLoading(true);
        const fetchedLesson = await fetchLessonById(lessonId);
        setLesson(fetchedLesson);

        if (fetchedLesson) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user.id) {
            const { data } = await supabase
              .from('user_lessons')
              .select('id')
              .eq('user_id', sessionData.session.user.id) 
              .eq('lesson_id', lessonId)
              .maybeSingle();
            if (data) setIsCompleted(true);
          }
        }
        setLoading(false);
      };
      loadData();
    } else {
      router.back();
    }
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lesson || isCompleting) return;
    setIsCompleting(true);
    const { success } = await markLessonComplete(lesson);
    setIsCompleting(false);
    
    if (success) {
      setIsCompleted(true);
      // Navigate to the Quiz
      router.push({ pathname: '/quiz/[id]', params: { id: lesson.id.toString() } });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  if (!lesson) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.bigNumber}>{lesson.sequence}</Text>
          <Text style={styles.headerTitle}>{lesson.title}</Text>
        </View>

        <View style={styles.videoPlaceholder}>
          <FontAwesome5 name="play" size={40} color="white" />
        </View>

        <FormattedContent content={lesson.content} />

        <TouchableOpacity 
          style={[styles.actionButton, isCompleted && styles.actionButtonCompleted]}
          onPress={isCompleted ? () => {} : handleComplete}
          disabled={isCompleted || isCompleting}
        >
          <Text style={styles.actionButtonText}>
            {isCompleting ? 'SAVING...' : isCompleted ? 'COMPLETED ✓' : 'TAKE QUIZ'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1C1C1E' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  bigNumber: { color: 'white', fontSize: 80, fontWeight: '900', marginRight: 15, lineHeight: 85 },
  headerTitle: { flex: 1, color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 10, lineHeight: 28 },
  videoPlaceholder: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#388E3C', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  contentContainer: { marginBottom: 30 },
  contentHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  contentText: { color: '#E0E0E0', fontSize: 16, lineHeight: 24, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 8 },
  bulletPoint: { color: '#E0E0E0', fontSize: 16, marginRight: 8, marginTop: 0 },
  actionButton: { backgroundColor: '#388E3C', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  actionButtonCompleted: { backgroundColor: '#555' },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});