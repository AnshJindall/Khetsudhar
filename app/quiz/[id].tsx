import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';

interface QuizData {
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function QuizScreen() {
  const router = useRouter();
  const { t, isLoading: isTransLoading } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [id]);

  const fetchQuizData = async () => {
    try {
      if (!id) return;
      const lessonId = parseInt(id);

      // 1. Fetch Quiz Data from 'quests' table
      // Assumption: The 'quests' table holds the quiz data for the lesson with the same ID.
      const { data: questData, error } = await supabase
        .from('quests')
        .select('quiz_question, quiz_options, correct_answer')
        .eq('id', lessonId)
        .single();

      if (error) {
        // Fallback or specific error handling if no quiz exists
        console.warn("No quiz found for this lesson, checking fallback or skipping.");
        // Optional: Redirect if no quiz exists? 
        // For now, we show an alert or empty state
      }

      if (questData) {
        setQuiz({
          question: questData.quiz_question || "Question not available",
          // Postgres arrays usually come back as simple JS arrays
          options: questData.quiz_options || [], 
          correctAnswer: questData.correct_answer || ""
        });
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const startShake = () => {
    shakeAnimation.setValue(0);
    Animated.spring(shakeAnimation, {
      toValue: 1,
      velocity: 10,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start(() => shakeAnimation.setValue(0));
  };

  const saveProgress = async () => {
    if (isSaving || !id) return;
    setIsSaving(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      const lessonId = parseInt(id);

      if (userId) {
        // 1. Fetch Lesson Points (Reward)
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('points')
          .eq('id', lessonId)
          .single();
        
        const pointsAwarded = lessonData?.points || 100; // Default 100 if missing

        // 2. Mark Lesson as Completed
        const { error: lessonError } = await supabase
          .from('user_lessons')
          .upsert(
            { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }, 
            { onConflict: 'user_id,lesson_id' }
          );

        if (lessonError) throw lessonError;

        // 3. Add Coins & XP to Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins, xp')
          .eq('id', userId)
          .single();
          
        if (profile) {
          const newCoins = (profile.coins || 0) + pointsAwarded;
          const newXP = (profile.xp || 0) + 50;

          const { error: profileError } = await supabase
            .from('profiles')
            .update({ coins: newCoins, xp: newXP })
            .eq('id', userId);

          if (profileError) throw profileError;
        }
      }

      // Success!
      router.push({ pathname: '/complete/[id]', params: { id: id } });

    } catch (error: any) {
      console.error("Save Progress Error:", error);
      Alert.alert("Error", "Could not save your progress. Please check your internet connection.");
      setIsSaving(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || !quiz) return;

    const isCorrect = selectedAnswer === quiz.correctAnswer;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setTimeout(() => {
        saveProgress();
      }, 1000); 
    } else {
      startShake();
      setTimeout(() => {
        setAnswerStatus(null);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const shakeTranslate = shakeAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -10, 10, -10, 10, 0],
  });

  if (loading || isTransLoading || isSaving) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#388e3c" />
          {isSaving && <Text style={{color:'white', marginTop:10}}>Saving Progress...</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={{color:'white', textAlign:'center'}}>No quiz found for this lesson.</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={() => router.back()}>
                <Text style={styles.confirmButtonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.question}>{quiz.question}</Text>

        <View style={styles.gridContainer}>
          {quiz.options.map((option: string, index: number) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = quiz.correctAnswer === option;

            const buttonStyle = [
              styles.optionButton,
              isSelected && styles.optionButtonSelected,
              answerStatus === 'correct' && isCorrect && styles.optionCorrect,
              answerStatus === 'incorrect' && isSelected && styles.optionIncorrect,
            ];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.optionWrapper,
                  isSelected && answerStatus === 'incorrect' ? { transform: [{ translateX: shakeTranslate }] } : {},
                ]}>
                <TouchableOpacity
                  style={buttonStyle}
                  onPress={() => !answerStatus && setSelectedAnswer(option)}
                  disabled={!!answerStatus}>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.feedbackContainer}>
          {answerStatus === 'correct' && <Text style={[styles.feedbackText, styles.feedbackCorrect]}>{t('excellent_work')}</Text>}
          {answerStatus === 'incorrect' && <Text style={[styles.feedbackText, styles.feedbackIncorrect]}>{t('try_again')}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, selectedAnswer ? styles.confirmButtonActive : styles.confirmButtonDisabled]}
          disabled={!selectedAnswer || !!answerStatus || isSaving}
          onPress={handleCheckAnswer}>
          <Text style={styles.confirmButtonText}>{t('submit_answer')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' },
  container: { flexGrow: 1, padding: 20, justifyContent: 'space-between' },
  question: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center', marginBottom: 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionWrapper: { width: '100%', marginBottom: 15 }, // Full width for list style options? Or keeping grid
  optionButton: { backgroundColor: '#333333', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#444' },
  optionButtonSelected: { borderColor: '#388e3c', transform: [{ scale: 1.02 }] },
  optionCorrect: { backgroundColor: '#388e3c', borderColor: '#4CAF50' },
  optionIncorrect: { backgroundColor: '#D32F2F', borderColor: '#F44336' },
  optionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  feedbackContainer: { height: 30, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  feedbackText: { fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
  feedbackCorrect: { color: '#388e3c' },
  feedbackIncorrect: { color: '#D32F2F' },
  confirmButton: { width: '100%', paddingVertical: 16, borderRadius: 30, marginTop: 10 },
  confirmButtonDisabled: { backgroundColor: '#555555', opacity: 0.7 },
  confirmButtonActive: { backgroundColor: '#388e3c' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});