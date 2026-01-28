import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DEFAULT_LANGUAGE } from '@/constants/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/utils/supabase';
import Checkmark from '../../assets/images/check.svg';
import Coin from '../../assets/images/coin.svg';

export default function LessonCompleteScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [lessonInfo, setLessonInfo] = useState<{ title: string; points: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonInfo = async () => {
      if (!id) return;
      
      const lang = language || DEFAULT_LANGUAGE;
      // Dynamic columns based on language
      const titleCol = `title_${lang}`;
      const fallbackTitle = `title_${DEFAULT_LANGUAGE}`;

      const { data, error } = await supabase
        .from('lessons')
        .select(`points, ${titleCol}, ${fallbackTitle}`)
        .eq('id', id)
        .single();

      if (!error && data) {
        // @ts-ignore - Supabase types might not perfectly infer dynamic keys
        const title = data[titleCol] || data[fallbackTitle] || "Lesson Completed";
        setLessonInfo({
          title,
          points: data.points || 0
        });
      }
      setLoading(false);
    };

    fetchLessonInfo();
  }, [id, language]);

  const handleContinue = async () => {
    // Check if user is guest (optional, based on your previous logic)
    const { data: { session } } = await supabase.auth.getSession();
    const isGuest = !session;

    if (isGuest && id === '1') {
      router.replace({ pathname: '/reward/[id]', params: { id: id } });
    } else {
      router.replace('/lessons');
    }
  };

  if (loading) {
    return <SafeAreaView style={[styles.safeArea, {justifyContent:'center', alignItems:'center'}]}><ActivityIndicator size="large" color="#4CAF50" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Lesson Title Card */}
        <View style={styles.lessonTitleCard}>
          <Text style={styles.lessonNumber}>{id}</Text>
          <Text style={styles.lessonTitle}>{lessonInfo?.title}</Text>
        </View>

        {/* Main Completion Card */}
        <View style={styles.card}>
          <Checkmark width={200} height={200} style={styles.checkmark} />
          <Text style={styles.completeText}>{t('completed_lesson_title')}</Text>

          <View style={styles.rewardContainer}>
            <Text style={styles.rewardTitle}>REWARD</Text>
            <View style={styles.pointsContainer}>
              <Coin width={30} height={30} style={styles.coinIcon} />
              <Text style={styles.pointsText}>{lessonInfo?.points}</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>{t('continue_learning')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flex: 1, padding: 20, justifyContent: 'space-between' },
  lessonTitleCard: { backgroundColor: '#2C2C2E', borderRadius: 20, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  lessonNumber: { color: '#FFFFFF', fontSize: 50, fontWeight: '900', fontFamily: 'monospace', marginRight: 15, lineHeight: 50 },
  lessonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  card: { backgroundColor: '#2E7D32', borderRadius: 20, padding: 20, alignItems: 'center', flexGrow: 1, justifyContent: 'center', borderWidth: 1, borderColor: '#388E3C' },
  checkmark: { marginBottom: 20 },
  completeText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1, marginBottom: 20, textAlign:'center' },
  rewardContainer: { alignItems: 'center' },
  rewardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', fontFamily: 'monospace' },
  pointsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  coinIcon: { marginRight: 10 },
  pointsText: { color: '#FDD835', fontSize: 24, fontWeight: 'bold' },
  continueButton: { backgroundColor: '#4CAF50', width: '100%', paddingVertical: 16, borderRadius: 30, marginTop: 20, borderWidth: 2, borderColor: '#66BB6A' },
  continueButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});