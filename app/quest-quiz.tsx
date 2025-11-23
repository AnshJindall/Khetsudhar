import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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

import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';

// Importing your existing Qcoin asset
import QCoin from '../assets/images/Qcoin.svg';

const PIXEL_FONT = 'monospace';

// --- FETCHER ---
const fetchQuiz = async (id: string) => {
    const { data, error } = await supabase
        .from('quests')
        .select('id, title, quiz_question, quiz_options, correct_answer, quiz_explanation, xp_reward')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

export default function QuizScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{id: string}>(); 
    const { t } = useTranslation();
    
    const { data: quizData, loading, isOffline } = useCachedQuery(
        `quest_quiz_${id}`,
        () => fetchQuiz(id!)
    );

    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultState, setResultState] = useState<'none' | 'correct' | 'incorrect'>('none');

    const handleSubmit = async () => {
        if (!selectedAnswer || !quizData) return;
        if (isOffline) {
            Alert.alert(t('offline_mode'), t('go_online'));
            return;
        }
        
        setIsSubmitting(true);
        const isCorrect = selectedAnswer === quizData.correct_answer;
        setResultState(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const userId = session.user.id;

                    // 1. Mark Quest as Done
                    await supabase.from('user_quests').insert({ 
                        user_id: userId, 
                        quest_id: quizData.id 
                    });

                    // 2. AWARD XP & QUEST COINS (THE NEW LOGIC)
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('xp, quest_coins')
                        .eq('id', userId)
                        .single();

                    if (profile) {
                        const newXP = (profile.xp || 0) + (quizData.xp_reward || 0);
                        const newQuestCoins = (profile.quest_coins || 0) + 1; // Award 1 quest coin for completion

                        await supabase
                            .from('profiles')
                            .update({ xp: newXP, quest_coins: newQuestCoins })
                            .eq('id', userId);
                    }
                }
            } catch (err) {
                console.error("Save error", err);
            }
        } 
        setIsSubmitting(false);
    };

    const handleContinue = () => {
        if (resultState === 'correct') {
            router.replace('/quests');
        } else {
            setResultState('none');
            setSelectedAnswer(null);
        }
    };

    if (loading) return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#4CAF50" /></SafeAreaView>;
    if (!quizData) return <SafeAreaView style={styles.loadingContainer}><Text style={{color:'white'}}>Quiz not loaded</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                 {isOffline && <View style={styles.offlineBanner}><Text style={styles.offlineText}>{t('offline_mode')}</Text></View>}

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('knowledge_check')}</Text>
                    <View style={styles.xpTag}>
                        <QCoin width={16} height={16} />
                        <Text style={styles.xpText}>{t('win_xp').replace('{xp}', quizData.xp_reward)}</Text>
                    </View>
                </View>

                {/* Question Card */}
                <View style={styles.questionCard}>
                    <Text style={styles.questionLabel}>{t('question')}</Text>
                    <Text style={styles.questionText}>{quizData.quiz_question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {quizData.quiz_options?.map((option: string, index: number) => {
                        const isSelected = selectedAnswer === option;
                        let optionStyle: any = styles.optionButton;
                        let iconName = isSelected ? "dot-circle" : "circle";
                        let iconColor = isSelected ? "#4CAF50" : "#666";

                        if (resultState !== 'none') {
                            if (option === quizData.correct_answer) {
                                optionStyle = styles.optionCorrect;
                                iconName = "check-circle";
                                iconColor = "#fff";
                            } else if (isSelected && resultState === 'incorrect') {
                                optionStyle = styles.optionIncorrect;
                                iconName = "times-circle";
                                iconColor = "#fff";
                            } else {
                                optionStyle = styles.optionDisabled;
                            }
                        } else if (isSelected) {
                            optionStyle = styles.optionSelected;
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                style={optionStyle}
                                onPress={() => resultState === 'none' && setSelectedAnswer(option)}
                                disabled={resultState !== 'none' || isOffline}
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name={iconName} size={20} color={iconColor} style={{marginRight: 12}} />
                                <Text style={[styles.optionText, (resultState !== 'none' && (isSelected || option === quizData.correct_answer)) && {color: 'white', fontWeight: 'bold'}]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Result & Explanation Area */}
                {resultState !== 'none' && (
                    <View style={[styles.resultBox, resultState === 'correct' ? styles.resultBoxSuccess : styles.resultBoxError]}>
                        <View style={{flexDirection:'row', alignItems:'center', marginBottom: 8}}>
                            <FontAwesome5 name={resultState === 'correct' ? "trophy" : "exclamation-triangle"} size={20} color="white" />
                            <Text style={styles.resultTitle}>
                                {resultState === 'correct' ? t('excellent_work') : t('not_quite_right')}
                            </Text>
                        </View>
                        <Text style={styles.explanationText}>
                            {quizData.quiz_explanation || t('review_lesson')}
                        </Text>
                    </View>
                )}

                {/* Action Button */}
                <View style={{height: 100}}> 
                    {(selectedAnswer || resultState !== 'none') && (
                        <TouchableOpacity 
                            style={[styles.actionButton, resultState === 'correct' ? styles.btnSuccess : resultState === 'incorrect' ? styles.btnRetry : styles.btnSubmit, isOffline && {opacity: 0.5}]}
                            onPress={resultState === 'none' ? handleSubmit : handleContinue}
                            disabled={isOffline}
                        >
                            <Text style={styles.actionButtonText}>
                                {resultState === 'none' ? t('submit_answer') : resultState === 'correct' ? t('claim_reward') : t('try_again')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#151718' },
    loadingContainer: { flex: 1, backgroundColor: '#151718', justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { padding: 20 },
    offlineBanner: { backgroundColor: '#C62828', padding: 5, alignItems: 'center', borderRadius: 5, marginBottom: 10 },
    offlineText: { color: 'white', fontWeight: 'bold' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', fontFamily: PIXEL_FONT, letterSpacing: 1 },
    xpTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#444' },
    xpText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', fontFamily: PIXEL_FONT },
    questionCard: { marginBottom: 25 },
    questionLabel: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginBottom: 8, fontFamily: PIXEL_FONT },
    questionText: { color: 'white', fontSize: 20, fontWeight: '600', lineHeight: 28 },
    optionsContainer: { gap: 12, marginBottom: 20 },
    optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#444' },
    optionSelected: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#253325', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#4CAF50' },
    optionCorrect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#66BB6A' },
    optionIncorrect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C62828', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#EF5350' },
    optionDisabled: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 18, borderRadius: 12, opacity: 0.5 },
    optionText: { color: '#DDD', fontSize: 16, flex: 1 },
    resultBox: { padding: 16, borderRadius: 12, marginTop: 10, marginBottom: 20 },
    resultBoxSuccess: { backgroundColor: '#1B5E20', borderWidth: 1, borderColor: '#4CAF50' },
    resultBoxError: { backgroundColor: '#B71C1C', borderWidth: 1, borderColor: '#EF5350' },
    resultTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8, fontFamily: PIXEL_FONT },
    explanationText: { color: '#E0E0E0', fontSize: 14, lineHeight: 20, marginTop: 4 },
    actionButton: { paddingVertical: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    btnSubmit: { backgroundColor: '#FFD700' },
    btnSuccess: { backgroundColor: '#4CAF50' },
    btnRetry: { backgroundColor: '#FFF' },
    actionButtonText: { color: '#151718', fontSize: 16, fontWeight: 'bold', fontFamily: PIXEL_FONT, letterSpacing: 1 },
});