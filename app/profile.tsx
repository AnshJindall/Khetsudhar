import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

// --- Supabase ---
import { supabase } from '@/utils/supabase';

// --- Assets ---
import Coin from '../assets/images/coin.svg';
import FarmIcon from '../assets/images/farm.svg';
import Qcoin from '../assets/images/Qcoin.svg'; // Quest Coin for Multiplier
import RewardIcon from '../assets/images/Reward.svg';
import UserImage from '../assets/images/UserImage.svg';
import WinMascot from '../assets/images/winMascot.svg';

const PIXEL_FONT = 'monospace';
const SCREEN_WIDTH = Dimensions.get('window').width;

// --- 1. CUSTOM ANIMATED GAUGE ---
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SustainabilityGauge = ({ score }: { score: string }) => {
  // Map Score to Value (0-100) and Color
  const getScoreConfig = (s: string) => {
    const normalized = s?.toUpperCase() || 'LOW';
    switch (normalized) {
      case 'HIGH': return { value: 90, color: '#4CAF50', label: 'EXCELLENT' }; // Green
      case 'MEDIUM': return { value: 60, color: '#FFC107', label: 'GOOD' };    // Yellow
      case 'LOW': return { value: 30, color: '#FF5252', label: 'CRITICAL' };   // Red
      default: return { value: 10, color: '#FF5252', label: 'UNKNOWN' };
    }
  };

  const config = getScoreConfig(score);
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withTiming(config.value, { duration: 1500, easing: Easing.out(Easing.exp) });
  }, [config.value]);

  // Gauge Dimensions
  const radius = 70;
  const strokeWidth = 12;
  const center = radius + strokeWidth;
  const circumference = Math.PI * radius; 

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * progress.value) / 100;
    return {
      strokeDashoffset: strokeDashoffset,
      stroke: config.color, 
    };
  });

  return (
    <View style={styles.gaugeWrapper}>
      <Svg width={center * 2} height={center + 10}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="100%" y2="0">
            <Stop offset="0" stopColor={config.color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={config.color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Track */}
        <Path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}`}
          stroke="#333"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Progress */}
        <AnimatedPath
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}`}
          stroke={`url(#gaugeGrad)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
        
        {/* Inner Score Text */}
        <SvgText
          x={center}
          y={center - 15}
          textAnchor="middle"
          fill="white"
          fontSize="32"
          fontWeight="bold"
          fontFamily={PIXEL_FONT}
        >
          {config.value}
        </SvgText>
      </Svg>
      
      <View style={[styles.gaugeLabelContainer, { borderColor: config.color }]}>
        <Text style={[styles.gaugeLabelText, { color: config.color }]}>{config.label}</Text>
      </View>
    </View>
  );
};

// --- 2. STAT CARD COMPONENT ---
const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      {icon}
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

// --- 3. XP BAR COMPONENT ---
const XPBar = ({ current, max, level }: { current: number, max: number, level: number }) => {
  const widthPercent = Math.min((current / max) * 100, 100);
  
  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpHeader}>
        <Text style={styles.levelText}>LVL {level}</Text>
        <Text style={styles.xpText}>{current} / {max} XP</Text>
      </View>
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${widthPercent}%` }]} />
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const getProfile = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { setLoading(false); return; }

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error) setProfile(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      getProfile();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'End your session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await supabase.auth.signOut() },
    ]);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{color:'white', marginBottom: 20, fontFamily: PIXEL_FONT}}>GUEST MODE</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Gamification Logic
  const currentXP = profile.xp || 0;
  const level = Math.floor(currentXP / 1000) + 1;
  const xpProgress = currentXP % 1000;
  
  // Multiplier Logic (1 Quest Coin = +0.2x boost)
  const multiplier = 1 + ((profile.quest_coins || 0) * 0.2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- 1. HERO SECTION --- */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              <UserImage width={100} height={100} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{profile.full_name || 'FARMER'}</Text>
          <Text style={styles.userTitle}>PRO {profile.selected_crop || 'FARMER'}</Text>
          
          {/* XP Bar */}
          <XPBar current={xpProgress} max={1000} level={level} />
        </View>

        {/* --- 2. STATS GRID --- */}
        <View style={styles.gridContainer}>
          <StatCard 
            label="WEALTH" 
            value={String(profile.coins || 0)} 
            icon={<Coin width={20} height={20} />} 
          />
          <StatCard 
            label="MULTIPLIER" 
            value={`x${multiplier.toFixed(1)}`} 
            icon={<Qcoin width={20} height={20} />} 
          />
          <StatCard 
            label="QUEST COINS" 
            value={String(profile.quest_coins || 0)} 
            icon={<Qcoin width={20} height={20} />} 
          />
          <StatCard 
            label="LAND SIZE" 
            value={profile.land_size || 'N/A'} 
            icon={<FarmIcon width={20} height={20} />} 
          />
        </View>

        {/* --- 3. SUSTAINABILITY GAUGE --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUSTAINABILITY SCORE</Text>
          <View style={styles.gaugeCard}>
            <SustainabilityGauge score={profile.sustainability_score} />
            <Text style={styles.gaugeTip}>
              Keep using organic fertilizers to boost your score and unlock special rewards!
            </Text>
          </View>
        </View>

        {/* --- 4. ACHIEVEMENTS (Mocked for Visuals) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECENT ACHIEVEMENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsRow}>
            <View style={styles.achievementBadge}>
              <WinMascot width={40} height={40} />
              <Text style={styles.achievementText}>First Harvest</Text>
            </View>
            <View style={styles.achievementBadge}>
              <RewardIcon width={40} height={40} />
              <Text style={styles.achievementText}>Rich Soil</Text>
            </View>
            <View style={[styles.achievementBadge, styles.achievementLocked]}>
              <FontAwesome5 name="lock" size={24} color="#555" />
              <Text style={styles.achievementTextLocked}>Water Saver</Text>
            </View>
          </ScrollView>
        </View>

        {/* --- 5. ACTIONS --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  scrollContainer: { paddingBottom: 40 },

  // Hero Section
  heroSection: { alignItems: 'center', padding: 20, backgroundColor: '#1E1E1E', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', overflow: 'hidden' },
  levelBadge: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1E1E1E' },
  levelBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 14, fontFamily: PIXEL_FONT },
  userName: { color: 'white', fontSize: 22, fontWeight: 'bold', fontFamily: PIXEL_FONT, letterSpacing: 1 },
  userTitle: { color: '#888', fontSize: 12, fontFamily: PIXEL_FONT, marginBottom: 20, letterSpacing: 2 },

  // XP Bar
  xpContainer: { width: '100%', maxWidth: 300 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  levelText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', fontFamily: PIXEL_FONT },
  xpText: { color: '#AAA', fontSize: 12, fontFamily: PIXEL_FONT },
  xpTrack: { height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },

  // Stats Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 25, gap: 10 },
  statCard: { width: '48%', backgroundColor: '#252525', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#333' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: '#888', fontSize: 10, fontFamily: PIXEL_FONT },
  statValue: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: PIXEL_FONT },

  // Sustainability Section
  section: { marginBottom: 25, paddingHorizontal: 20 },
  sectionHeader: { color: '#666', fontSize: 12, fontFamily: PIXEL_FONT, marginBottom: 10, letterSpacing: 1 },
  gaugeCard: { backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  gaugeWrapper: { alignItems: 'center', marginBottom: 10 },
  gaugeLabelContainer: { marginTop: -15, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  gaugeLabelText: { fontSize: 12, fontWeight: 'bold', fontFamily: PIXEL_FONT },
  gaugeTip: { color: '#888', textAlign: 'center', fontSize: 12, marginTop: 10, fontStyle: 'italic' },

  // Achievements
  achievementsRow: { gap: 15, paddingRight: 20 },
  achievementBadge: { width: 80, height: 90, backgroundColor: '#252525', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  achievementLocked: { opacity: 0.5, backgroundColor: '#1A1A1A' },
  achievementText: { color: '#DDD', fontSize: 10, marginTop: 8, textAlign: 'center', fontFamily: PIXEL_FONT },
  achievementTextLocked: { color: '#555', fontSize: 10, marginTop: 8, textAlign: 'center', fontFamily: PIXEL_FONT },

  // Actions
  logoutButton: { marginHorizontal: 20, backgroundColor: '#2A1515', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#5E2A2A' },
  logoutButtonText: { color: '#FF5252', fontWeight: 'bold', fontSize: 14, fontFamily: PIXEL_FONT },
});