import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '@/utils/supabase';

// --- Import QCoin Icon ---
import QCoin from '../assets/images/Qcoin.svg';

const PIXEL_FONT = 'monospace';

// --- Quiz Data ---
const QUIZ_DATA = {
    question: 'What changes did you notice in the soil condition after adding compost or farmyard manure?', 
    options: [
        { id: 'a', text: 'Increased soil compaction and runoff' },
        { id: 'b', text: 'Improved soil structure, aeration, and water retention' }, // Correct
        { id: 'c', text: 'Reduced nutrient availability and microbial activity' },
        { id: 'd', text: 'A rapid decrease in soil pH (more acidic)' },
    ],
    correctAnswerId: 'b',
    rewardAmount: 1, // 1 Quest Coin
};

export default function QuizScreen() {
    const router = useRouter();
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleAnswerSelect = (id: string) => {
        if (!isAnswerSubmitted) {
            setSelectedAnswer(id);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAnswer) return;

        const correct = selectedAnswer === QUIZ_DATA.correctAnswerId;
        setIsCorrect(correct);
        setIsAnswerSubmitted(true);

        if (correct) {
            // --- AWARD QUEST COINS ---
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session?.user) {
                    const userId = sessionData.session.user.id;
                    
                    // 1. Get Current Profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('quest_coins')
                        .eq('id', userId)
                        .single();
                    
                    if (profile) {
                        // 2. Add Reward (Quest Coins)
                        const newQuestCoins = (profile.quest_coins || 0) + QUIZ_DATA.rewardAmount;

                        // 3. Update Database
                        await supabase
                            .from('profiles')
                            .update({ quest_coins: newQuestCoins })
                            .eq('id', userId);
                    }
                }
            } catch (error) {
                console.error("Failed to reward user:", error);
            }
            
            setTimeout(() => {
                // Go to Quest Complete (You might want to update that file to show QCoins too)
                router.push('/quest-complete');
            }, 2000);
        }
    };

    const handleTryAgain = () => {
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
        setIsCorrect(false);
    };

    const getOptionStyle = (id: string) => {
        if (!isAnswerSubmitted) {
            return id === selectedAnswer ? styles.optionSelected : styles.optionDefault;
        }
        if (id === QUIZ_DATA.correctAnswerId) return styles.optionCorrect;
        if (id === selectedAnswer && !isCorrect) return styles.optionIncorrect;
        return styles.optionDefault;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                {/* --- Quiz Header --- */}
                <View style={styles.headerBox}>
                    <Text style={styles.headerText}>FINAL QUEST QUIZ</Text>
                    <View style={styles.rewardContainer}>
                        <Text style={styles.rewardText}>REWARD: {QUIZ_DATA.rewardAmount}</Text>
                        <QCoin width={20} height={20} style={{marginLeft: 5}} />
                    </View>
                </View>

                <View style={styles.questionBox}>
                    <Text style={styles.questionText}>{QUIZ_DATA.question}</Text>
                </View>

                <View style={styles.optionsList}>
                    {QUIZ_DATA.options.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={getOptionStyle(option.id)}
                            onPress={() => handleAnswerSelect(option.id)}
                            disabled={isAnswerSubmitted}
                        >
                            <FontAwesome5 
                                name={isAnswerSubmitted && option.id === QUIZ_DATA.correctAnswerId ? 'check-circle' : 'circle'}
                                size={20}
                                color={'white'}
                                style={styles.optionIcon}
                            />
                            <Text style={styles.optionText}>{option.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!isAnswerSubmitted && (
                    <TouchableOpacity 
                        style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!selectedAnswer}
                    >
                        <Text style={styles.submitButtonText}>SUBMIT ANSWER</Text>
                    </TouchableOpacity>
                )}

                {isAnswerSubmitted && (
                    <View style={styles.feedbackContainer}>
                        <Text style={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}>
                            {isCorrect ? '✅ CORRECT! Quest Coins Claimed!' : '❌ INCORRECT!'}
                        </Text>
                        {!isCorrect && (
                             <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
                                <Text style={styles.tryAgainButtonText}>TRY AGAIN</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#151718' },
    scrollContainer: { paddingHorizontal: 20, paddingVertical: 30 },
    headerBox: { marginBottom: 30, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
    headerText: { color: 'white', fontSize: 24, fontWeight: 'bold', fontFamily: PIXEL_FONT, marginBottom: 10 },
    rewardContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 20, 140, 0.3)', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderColor: '#8E24AA', borderWidth: 1 },
    rewardText: { color: '#E1BEE7', fontSize: 16, fontWeight: 'bold', fontFamily: PIXEL_FONT },
    questionBox: { backgroundColor: '#2C2C2E', borderRadius: 15, padding: 20, marginBottom: 30, borderLeftWidth: 5, borderLeftColor: '#3498DB' },
    questionText: { color: 'white', fontSize: 18, fontWeight: '600', lineHeight: 25 },
    optionsList: { gap: 15, marginBottom: 30 },
    optionDefault: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#333' },
    optionSelected: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498DB', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#2980B9' },
    optionCorrect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#388E3C' },
    optionIncorrect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C0392B', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#A93226' },
    optionIcon: { marginRight: 15, width: 20, textAlign: 'center' },
    optionText: { flex: 1, color: 'white', fontSize: 16 },
    submitButton: { backgroundColor: '#FFD700', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#555555', opacity: 0.7 },
    submitButtonText: { color: '#151718', fontSize: 18, fontWeight: 'bold', fontFamily: PIXEL_FONT },
    feedbackContainer: { alignItems: 'center', marginTop: 10 },
    feedbackCorrect: { color: '#4CAF50', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    feedbackIncorrect: { color: '#C0392B', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    tryAgainButton: { backgroundColor: '#3498DB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
    tryAgainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});