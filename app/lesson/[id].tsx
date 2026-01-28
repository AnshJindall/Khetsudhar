import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
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

interface LessonDetail {
  id: number;
  title: string;
  description: string;
  sequence: number;
  content: string; 
  points: number;
}

const fetchLessonDetail = async (idStr: string, lang: string) => {
    const lessonId = parseInt(idStr);
    
    // Dynamic Columns
    const titleCol = `title_${lang}`;
    const descCol = `description_${lang}`;
    const contentCol = `content_${lang}`;
    const fallbackTitle = `title_${DEFAULT_LANGUAGE}`;
    const fallbackDesc = `description_${DEFAULT_LANGUAGE}`;
    const fallbackContent = `content_${DEFAULT_LANGUAGE}`;

    const { data: lessonRaw, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
    
    if (error) throw error;

    const lesson: LessonDetail = {
        id: lessonRaw.id,
        sequence: lessonRaw.sequence,
        points: lessonRaw.points,
        title: lessonRaw[titleCol] || lessonRaw[fallbackTitle] || "Lesson",
        description: lessonRaw[descCol] || lessonRaw[fallbackDesc] || "",
        content: lessonRaw[contentCol] || lessonRaw[fallbackContent] || ""
    };

    let isCompleted = false;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user.id) {
        const { data } = await supabase
            .from('user_lessons')
            .select('id')
            .eq('user_id', sessionData.session.user.id)
            .eq('lesson_id', lessonId)
            .maybeSingle();
        if (data) isCompleted = true;
    }

    return { lesson, isCompleted };
};

export default function LessonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language, isLoading: isTransLoading } = useTranslation();

  const { data, loading, isOffline } = useCachedQuery(
    `lesson_detail_${id}_${language || DEFAULT_LANGUAGE}`,
    () => fetchLessonDetail(id!, language || DEFAULT_LANGUAGE)
  );

  const lesson = data?.lesson;
  const isCompleted = data?.isCompleted;

  const handleTakeQuiz = () => {
    if (!lesson) return;
    // Special case for ID 2 (Game) if needed, otherwise normal quiz
    if (lesson.id === 2) {
       router.push({ pathname: '/game/[id]', params: { id: lesson.id.toString() } });
    } else {
       router.push({ pathname: '/quiz/[id]', params: { id: lesson.id.toString() } });
    }
  };

  if ((loading || isTransLoading) && !lesson) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>;
  }

  if (!lesson) return <View style={styles.loadingContainer}><Text style={{color:'white'}}>Lesson not found</Text></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isOffline && <View style={styles.offlineBanner}><Text style={styles.offlineText}>{t('offline_mode')}</Text></View>}

        <View style={styles.headerRow}>
          <Text style={styles.bigNumber}>{lesson.sequence}</Text>
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.headerDescription}>{lesson.description}</Text>
          </View>
        </View>

        <View style={styles.videoPlaceholder}>
          <FontAwesome5 name="play" size={40} color="white" />
        </View>

        <View style={styles.contentContainer}>
            {lesson.content?.replace(/\\n/g, '\n').split('\n').map((line, index) => {
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

        <TouchableOpacity 
          style={[styles.actionButton, (isCompleted || isOffline) && styles.actionButtonCompleted]}
          onPress={handleTakeQuiz}
          disabled={isOffline} 
        >
          <Text style={styles.actionButtonText}>
             {isCompleted ? "PRACTICE QUIZ" : (lesson.id === 2 ? "START FARMING" : t('take_quiz'))}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  offlineBanner: { backgroundColor: '#C62828', padding: 5, alignItems: 'center', borderRadius: 5, marginBottom: 10 },
  offlineText: { color: 'white', fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  bigNumber: { color: 'white', fontSize: 80, fontWeight: '900', marginRight: 15, lineHeight: 85 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 10, lineHeight: 28 },
  headerDescription: { color: '#B0B0B0', fontSize: 16, marginTop: 8, lineHeight: 22, fontStyle: 'italic' },
  videoPlaceholder: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#388E3C', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  contentContainer: { marginBottom: 30 },
  contentHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  contentText: { color: '#E0E0E0', fontSize: 16, lineHeight: 24, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 8 },
  bulletPoint: { color: '#E0E0E0', fontSize: 16, marginRight: 8 },
  actionButton: { backgroundColor: '#388E3C', paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  actionButtonCompleted: { backgroundColor: '#555' },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
});