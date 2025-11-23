import { useCachedQuery } from '@/hooks/useCachedQuery';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Assets
import Qcoin from '../assets/images/Qcoin.svg';
import Checkmark from '../assets/images/check.svg';

const PIXEL_FONT = 'monospace';

// --- FETCHER ---
const fetchQuestsData = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    // 1. Fetch Quests
    const { data: questsData, error: questError } = await supabase
      .from('quests')
      .select('*')
      .order('id');
    if (questError) throw questError;

    // 2. Fetch User Completion
    let completedIds = new Set();
    let userRank = '-';

    if (userId) {
        const { data: userQuests } = await supabase
          .from('user_quests')
          .select('quest_id')
          .eq('user_id', userId);
        
        if (userQuests) {
            userQuests.forEach(uq => completedIds.add(uq.quest_id));
        }

        // 3. Rank
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, xp')
            .order('xp', { ascending: false });
        
        if (profiles) {
            const rank = profiles.findIndex(p => p.id === userId) + 1;
            userRank = rank > 0 ? rank.toString() : '-';
        }
    }

    const finalQuests = (questsData || []).map(q => ({
        ...q,
        isCompleted: completedIds.has(q.id)
    }));

    return { quests: finalQuests, userRank };
};

export default function QuestsScreen() {
  const router = useRouter();
  
  const { data, loading, isOffline, refresh, refreshing } = useCachedQuery(
    'quests_screen_data',
    fetchQuestsData
  );

  const quests = data?.quests || [];
  const userRank = data?.userRank || '-';

  if (loading && !data) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388E3C" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#388E3C"/>}
      >
        {isOffline && <View style={styles.offlineBanner}><Text style={styles.offlineText}>Offline Mode</Text></View>}
        
        <Text style={styles.mainTitle}>MONTHLY QUESTS</Text>

        {quests.map((quest) => (
          <TouchableOpacity 
            key={quest.id}
            style={[styles.questCard, quest.isCompleted && styles.questCardCompleted]} 
            onPress={() => router.push({ pathname: '/quest-details', params: { id: quest.id } })}
            activeOpacity={0.8}
          >
            <View style={styles.questTextContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.questTitle}>{quest.title}</Text>
                {quest.isCompleted && (
                  <View style={styles.completedBadge}>
                    <Checkmark width={12} height={12} />
                    <Text style={styles.completedText}>DONE</Text>
                  </View>
                )}
              </View>
              {quest.subtitle && <Text style={styles.questSubtitle}>{quest.subtitle}</Text>}
              <Text style={styles.questDescription} numberOfLines={2}>{quest.description}</Text>
            </View>
            
            <View style={styles.questReward}>
              <Qcoin width={32} height={32} />
              <Text style={[styles.questRewardText, quest.isCompleted && styles.questRewardTextCompleted]}>
                {quest.xp_reward}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.leaderboardContainer}>
          <View>
            <Text style={styles.leaderboardLabel}>CURRENT</Text>
            <Text style={styles.leaderboardLabel}>LEADERBOARD</Text>
            <Text style={styles.leaderboardLabel}>POSITION</Text>
          </View>
          <View style={styles.leaderboardRankBox}>
            <Text style={styles.leaderboardRank}>{userRank}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  offlineBanner: { backgroundColor: '#C62828', padding: 5, alignItems: 'center', borderRadius: 5, marginBottom: 10 },
  offlineText: { color: 'white', fontWeight: 'bold' },
  mainTitle: { color: 'white', fontFamily: PIXEL_FONT, fontSize: 18, textAlign: 'center', marginTop: 10, marginBottom: 24, fontWeight: 'bold', letterSpacing: 1 },
  questCard: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#424242', flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  questCardCompleted: { backgroundColor: '#1E281E', borderColor: '#2E7D32', opacity: 0.8 },
  questTextContainer: { flex: 1, marginRight: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  questTitle: { color: 'white', fontFamily: PIXEL_FONT, fontSize: 16, fontWeight: 'bold', flex: 1 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#388E3C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  completedText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginLeft: 4, fontFamily: PIXEL_FONT },
  questSubtitle: { color: '#A5D6A7', fontFamily: PIXEL_FONT, fontSize: 12, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  questDescription: { color: '#BDBDBD', fontSize: 12, lineHeight: 18 },
  questReward: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 12, minWidth: 60 },
  questRewardText: { color: '#FFD700', fontFamily: PIXEL_FONT, fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  questRewardTextCompleted: { color: '#4CAF50' },
  leaderboardContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#424242' },
  leaderboardLabel: { color: '#E0E0E0', fontFamily: PIXEL_FONT, fontSize: 16, lineHeight: 24, fontWeight: 'bold' },
  leaderboardRankBox: { backgroundColor: '#151718', borderRadius: 16, borderWidth: 2, borderColor: '#388E3C', width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  leaderboardRank: { color: 'white', fontFamily: PIXEL_FONT, fontSize: 48, fontWeight: 'bold' },
});