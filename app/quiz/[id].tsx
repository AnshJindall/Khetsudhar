import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  ActivityIndicator
} from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';

// --- Mock Quiz Data ---
const QUIZ_DATA: { [key: string]: any } = {
  '1': {
    question: 'What is a key benefit of sustainable farming',
    options: ['More chemicals', 'Soil health', 'Water Waste', 'Soil Erosion'],
    correctAnswer: 'Soil health',
  },
  '2': {
    question: 'What is the main ingredient for banana waste compost?',
    options: ['Banana peels', 'Old tires', 'Plastic bags', 'Glass bottles'],
    correctAnswer: 'Banana peels',
  },
  '3': {
    question: 'What do shade trees help with?',
    options: ['Stopping pests', 'Using more water', 'Removing soil', 'Nothing'],
    correctAnswer: 'Stopping pests',
  },
};
// -------------------------------------

export default function QuizScreen() {
  const router = useRouter();
  const { t, isLoading: isTransLoading } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [shakeAnimation] = useState(new Animated.Value(0));

  const quiz = QUIZ_DATA[id] || QUIZ_DATA['1'];

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

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === quiz.correctAnswer;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setTimeout(() => {
        router.push({
          pathname: '/complete/[id]',
          params: { id: id }, // Pass the lesson ID
        });
      }, 1500); 
    } else {
      startShake();
      setTimeout(() => {
        setAnswerStatus(null);
        setSelectedAnswer(null);
      }, 1500);
    }
  };

  const handlePressOption = (option: string) => {
    if (answerStatus) return;
    setSelectedAnswer(option);
  };

  const shakeTranslate = shakeAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -10, 10, -10, 10, 0],
  });

  if (isTransLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.question}>{quiz.question}</Text>

        {/* Options Grid */}
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
                  isSelected && answerStatus === 'incorrect'
                    ? { transform: [{ translateX: shakeTranslate }] }
                    : {},
                ]}>
                <TouchableOpacity
                  style={buttonStyle}
                  onPress={() => handlePressOption(option)}
                  disabled={!!answerStatus}>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Spacer View */}
        <View style={{ flex: 1 }} />

        {/* Feedback Text */}
        <View style={styles.feedbackContainer}>
          {answerStatus === 'correct' && (
            <Text style={[styles.feedbackText, styles.feedbackCorrect]}>{t('excellent_work')}</Text>
          )}
          {answerStatus === 'incorrect' && (
            <Text style={[styles.feedbackText, styles.feedbackIncorrect]}>{t('try_again')}</Text>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedAnswer ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedAnswer || !!answerStatus}
          onPress={handleCheckAnswer}>
          <Text style={styles.confirmButtonText}>{t('submit_answer')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles are the same as before
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#151718', // Dark background
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#151718' 
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between', // Push button to bottom
  },
  question: {
    color: '#FFFFFF',
    fontSize: 28, // Bigger
    fontWeight: 'bold',
    fontFamily: 'monospace', // Gamified font
    textAlign: 'center',
    marginBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionWrapper: {
    width: '48%', // Two columns with a small gap
  },
  optionButton: {
    backgroundColor: '#333333',
    borderRadius: 20, // More rounded
    paddingVertical: 30, // Taller
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#444', // Slightly visible border
  },
  optionButtonSelected: {
    borderColor: '#388e3c',
    transform: [{ scale: 1.05 }], // Pop effect
    // Green glow
    shadowColor: '#388e3c',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  optionCorrect: {
    backgroundColor: '#388e3c',
    borderColor: '#4CAF50',
    transform: [{ scale: 1.05 }],
  },
  optionIncorrect: {
    backgroundColor: '#D32F2F', // Red
    borderColor: '#F44336',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  feedbackContainer: {
    height: 30, // Reserve space for feedback
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  feedbackCorrect: {
    color: '#388e3c', // Green
  },
  feedbackIncorrect: {
    color: '#D32F2F', // Red
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#555555',
    opacity: 0.7,
  },
  confirmButtonActive: {
    backgroundColor: '#388e3c',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});