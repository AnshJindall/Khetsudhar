import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

import { supabase } from '@/utils/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import Qcoin from '../assets/images/Qcoin.svg';
import Coin from '../assets/images/coin.svg';
import WinMascot from '../assets/images/winMascot.svg';

const PIXEL_FONT = 'monospace';

// Helper to calculate score with multiplier
const calculateScore = (coins: number, questCoins: number) => {
  // Example: 1 Quest Coin adds 20% boost (1.2x)
  const multiplier = 1 + (questCoins * 0.2); 
  return Math.floor(coins * multiplier);
};

const RankRow = ({ rank, name, score, isUser = false, multiplier }: any) => {
  let cardStyle: StyleProp<ViewStyle> = styles.defaultCard;
  let numberStyle: StyleProp<ViewStyle> = styles.rankNumberContainer;

  if (isUser) {
    cardStyle = styles.userCard;
    numberStyle = [styles.rankNumberContainer, styles.userRankNumber];
  } else if (rank === 1) {
    cardStyle = styles.goldCard;
    numberStyle = [styles.rankNumberContainer, styles.goldRankNumber];
  } else if (rank === 2) {
    cardStyle = styles.silverCard;
    numberStyle = [styles.rankNumberContainer, styles.silverRankNumber];
  } else if (rank === 3) {
    cardStyle = styles.bronzeCard;
    numberStyle = [styles.rankNumberContainer, styles.bronzeRankNumber];
  }

  return (
    <View style={[styles.rankCardBase, cardStyle]}>
      <View style={numberStyle}>
        <Text style={styles.rankNumber}>{rank}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.rankName}>{name || 'Anonymous'}</Text>
        {multiplier > 1 && (
          <Text style={styles.rankMultiplier}>x{multiplier.toFixed(1)} Boost Active</Text>
        )}
      </View>
      <View style={styles.scoreContainer}>
        <Coin width={20} height={20} />
        <Text style={styles.rankScore}>{score}</Text>
      </View>
    </View>
  );
};

export default function LeaderboardScreen() {
  const { t, isLoading: isTransLoading } = useTranslation();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchLeaderboard = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const currentId = session?.user?.id;

          // 1. Fetch all profiles (In production, use a Database Function to sort)
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, coins, quest_coins');

          if (error) throw error;

          // 2. Calculate Scores Client-Side (Temporary solution)
          const rankedUsers = (data || []).map(user => {
            const qCoins = user.quest_coins || 0;
            const coins = user.coins || 0;
            const multiplier = 1 + (qCoins * 0.2);
            const finalScore = Math.floor(coins * multiplier);
            
            return { ...user, finalScore, multiplier };
          })
          .sort((a, b) => b.finalScore - a.finalScore) // Sort descending
          .slice(0, 50); // Top 50

          setLeaders(rankedUsers);
          
          if (currentId) {
            setCurrentUserData(rankedUsers.find(u => u.id === currentId));
          }

        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchLeaderboard();
    }, [])
  );

  if (loading || isTransLoading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#388e3c" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- Header --- */}
        <View style={styles.headerContainer}>
          <WinMascot width={100} height={100} style={styles.mascot} />
          <View style={styles.headerText}>
            {/* --- USE TRANSLATION HERE --- */}
            <Text style={styles.headerTitle}>{t('leaderboard')}</Text>
            {/* ---------------------------- */}
            <View style={styles.multiplierContainer}>
              <Qcoin width={20} height={20} style={styles.coinIcon} />
              <Text style={styles.multiplierText}>
                YOUR BOOST: x{currentUserData ? currentUserData.multiplier.toFixed(1) : '1.0'}
              </Text>
            </View>
          </View>
        </View>

        {/* --- List --- */}
        <View style={styles.listContainer}>
          {leaders.map((user, index) => (
            <RankRow
              key={user.id}
              rank={index + 1}
              name={user.full_name}
              score={user.finalScore}
              multiplier={user.multiplier}
              isUser={user.id === currentUserData?.id}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
  mascot: { marginRight: 10 },
  headerText: { flex: 1 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', fontFamily: PIXEL_FONT, letterSpacing: 1 },
  multiplierContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 20, 140, 0.4)', borderColor: '#8E24AA', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  coinIcon: { marginRight: 6 },
  multiplierText: { color: '#E1BEE7', fontSize: 14, fontWeight: 'bold', fontFamily: PIXEL_FONT },
  listContainer: { gap: 12 },
  rankCardBase: { flexDirection: 'row', alignItems: 'center', borderRadius: 30, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 2, elevation: 10 },
  goldCard: { backgroundColor: '#544607', borderColor: '#FDD835' },
  silverCard: { backgroundColor: '#4E5357', borderColor: '#C0C0C0' },
  bronzeCard: { backgroundColor: '#5C3A21', borderColor: '#CD7F32' },
  userCard: { backgroundColor: '#1E3A5F', borderColor: '#0277BD' },
  defaultCard: { backgroundColor: '#333333', borderColor: '#424242' },
  rankNumberContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
  goldRankNumber: { backgroundColor: 'rgba(253, 216, 53, 0.2)', borderColor: 'rgba(253, 216, 53, 0.5)' },
  silverRankNumber: { backgroundColor: 'rgba(192, 192, 192, 0.2)', borderColor: 'rgba(192, 192, 192, 0.5)' },
  bronzeRankNumber: { backgroundColor: 'rgba(205, 127, 50, 0.2)', borderColor: 'rgba(205, 127, 50, 0.5)' },
  userRankNumber: { backgroundColor: 'rgba(2, 119, 189, 0.2)', borderColor: 'rgba(2, 119, 189, 0.5)' },
  rankNumber: { color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: PIXEL_FONT },
  rankName: { color: 'white', fontSize: 18, fontWeight: '500' },
  rankMultiplier: { color: '#B0B0B0', fontSize: 10, fontFamily: PIXEL_FONT, marginTop: 2 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  rankScore: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: PIXEL_FONT, marginLeft: 6 },
});