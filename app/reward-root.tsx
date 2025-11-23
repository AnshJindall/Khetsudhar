import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { supabase } from '@/utils/supabase';
import { useTranslation } from '@/hooks/useTranslation';

import Checkmark from '../assets/images/check.svg';
import CoinIcon from '../assets/images/coin.svg';
import FertilizerIcon from '../assets/images/fertilizer.svg';
import RationIcon from '../assets/images/ration.svg';
import SeedsIcon from '../assets/images/seeds.svg';

const PIXEL_FONT = 'monospace';
const { width, height } = Dimensions.get('window');

// --- Crop Image Mapping ---
const CROP_IMAGES: { [key: string]: any } = {
  banana: require('../assets/images/crops/banana.png'),
  coffee: require('../assets/images/crops/coffee.png'),
  coconut: require('../assets/images/crops/coconut.png'),
  rice: require('../assets/images/crops/rice.png'),
  cardamom: require('../assets/images/crops/cardamom.png'),
  black_pepper: require('../assets/images/crops/black_pepper.png'),
  ginger: require('../assets/images/crops/ginger.png'),
  cashew: require('../assets/images/crops/cashew.png'),
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- CALIBRATED VINE PROGRESS ---
const INITIAL_REWARD_DATA = [
  {
    id: 1,
    icon: <RationIcon width={28} height={28} />,
    cost: 1000,
    text: '3% OFF RATION',
    position: { top: 1020, left: '65%' }, // Right side
    vineProgress: 0.15, 
  },
  {
    id: 2,
    icon: <SeedsIcon width={28} height={28} />,
    cost: 3000,
    text: '2% DISC SEEDS',
    position: { top: 840, left: '35%' }, // Left side
    vineProgress: 0.31,
  },
  {
    id: 3,
    icon: <RationIcon width={28} height={28} />,
    cost: 5000,
    text: '5% OFF RATION',
    position: { top: 660, left: '65%' }, // Right side
    vineProgress: 0.47,
  },
  {
    id: 4,
    icon: <FertilizerIcon width={28} height={28} />,
    cost: 6000,
    text: '6% OFF FERTILIZER',
    position: { top: 480, left: '35%' }, // Left side
    vineProgress: 0.63,
  },
  {
    id: 5,
    icon: <SeedsIcon width={28} height={28} />,
    cost: 8000,
    text: '5% DISC SEEDS',
    position: { top: 300, left: '65%' }, // Right side
    vineProgress: 0.79,
  },
  {
    id: 6,
    icon: <RationIcon width={28} height={28} />,
    cost: 10000,
    text: '10% OFF RATION',
    position: { top: 120, left: '35%' }, // Left side
    vineProgress: 0.95,
  },
];

// --- SMOOTH VINE PATH ---
const VINE_PATH =
  'M 150 1200 ' + 
  'C 150 1120, 220 1100, 220 1020 ' + 
  'S 80 920, 80 840 ' +               
  'S 220 740, 220 660 ' +             
  'S 80 560, 80 480 ' +               
  'S 220 380, 220 300 ' +             
  'S 80 200, 80 120 ' +               
  'S 150 50, 150 0';                  

const VINE_LENGTH = 2000; 

// --- FIREFLIES ---
const FloatingParticle = ({ delay, size, x, duration }: any) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(withTiming(-height, { duration: duration, easing: Easing.linear }), -1));
    opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0.6, { duration: duration/2 }), withTiming(0, { duration: duration/2 })), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    left: x,
  }));

  return <Animated.View style={[styles.particle, { width: size, height: size }, style]} />;
};

// --- COMPONENTS ---
const StatBox = ({ label, value, iconName }: any) => (
  <View style={styles.statBox}>
    <View style={styles.statIconContainer}>
      <FontAwesome5 name={iconName} size={14} color="#A5D6A7" />
    </View>
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const RewardNode = ({ node, index, onPress }: any) => {
  const { icon, cost, text, isUnlocked, isCurrent, position } = node;
  const isLeft = parseFloat(position.left) < 50;

  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withDelay(index * 50, withSpring(1));
  }, []);

  React.useEffect(() => {
    if (isCurrent) {
      pulse.value = withRepeat(withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [isCurrent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }]
  }));

  return (
    <Animated.View style={[styles.node, { top: position.top }, isLeft ? styles.nodeLeft : styles.nodeRight, animatedStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={[styles.nodeWrapper, isLeft ? styles.wrapperLeft : styles.wrapperRight]}>
          
          {/* Text Tag - Now closer to center */}
          <View style={[styles.textTag, isLeft ? styles.textTagLeft : styles.textTagRight]}>
             <Text style={styles.nodeTitle} numberOfLines={2}>{text}</Text>
             <View style={styles.costRow}>
                <CoinIcon width={12} height={12} />
                <Text style={styles.nodeCost}>{cost}</Text>
             </View>
          </View>

          {/* Icon Circle */}
          <View style={[styles.iconCircle, isUnlocked ? styles.iconCircleUnlocked : styles.iconCircleLocked]}>
            {isUnlocked ? icon : <FontAwesome5 name="lock" size={18} color="rgba(255,255,255,0.3)" />}
            
            {/* Status Badge */}
            {isUnlocked && (
              <View style={styles.checkBadge}>
                <Checkmark width={8} height={8} />
              </View>
            )}
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RewardRootScreen() {
  const { t, isLoading: isTransLoading } = useTranslation();
  const [rewards, setRewards] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeReward, setActiveReward] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const animatedStrokeDashoffset = useSharedValue(VINE_LENGTH);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const cachedPoints = await AsyncStorage.getItem('user_points');
          const cachedCrop = await AsyncStorage.getItem('user_selected_crop');
          if (cachedPoints) setUserPoints(parseInt(cachedPoints));
          if (cachedCrop) setSelectedCrop(cachedCrop);

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { setLoading(false); return; }
          setUserId(session.user.id);

          const [profileResult, rewardsResult] = await Promise.all([
            supabase.from('profiles').select('coins, selected_crop').eq('id', session.user.id).single(),
            supabase.from('user_rewards').select('reward_id').eq('user_id', session.user.id)
          ]);

          const profile = profileResult.data;
          const unlockedData = rewardsResult.data || [];
          const unlockedIds = unlockedData.map((r: any) => r.reward_id);

          if (profile) {
            setUserPoints(profile.coins || 0);
            setSelectedCrop(profile.selected_crop);
          }

          setCollectedCount(unlockedIds.length);
          const maxUnlockedId = Math.max(0, ...unlockedIds);
          
          const lastUnlockedReward = INITIAL_REWARD_DATA.find(r => r.id === maxUnlockedId);
          const targetProgress = lastUnlockedReward ? lastUnlockedReward.vineProgress : 0;

          const targetOffset = VINE_LENGTH * (1 - targetProgress);
          animatedStrokeDashoffset.value = withTiming(targetOffset, { duration: 1500, easing: Easing.out(Easing.cubic) });

          setRewards(INITIAL_REWARD_DATA.map((r) => ({
            ...r,
            isUnlocked: unlockedIds.includes(r.id),
            isCurrent: !unlockedIds.includes(r.id) && r.id === maxUnlockedId + 1
          })));

        } catch (e) {
          console.error("Error:", e);
        } finally {
          setLoading(false); 
        }
      };
      loadData();
    }, [])
  );

  const animatedVineProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedStrokeDashoffset.value,
  }));

  const handleNodePress = async (node: any) => {
    if (node.isUnlocked) {
      setActiveReward(node);
      setModalVisible(true);
      return;
    }
    if (!node.isCurrent) {
      // --- TRANSLATION APPLIED ---
      Alert.alert(t('unlocked'), "Grow your roots step by step!"); // Using fallback body here
      return;
    }
    if (userPoints < node.cost) {
      // --- TRANSLATION APPLIED ---
      Alert.alert(t('available_coins'), `You need ${node.cost} coins.`); 
      return;
    }

    // --- TRANSLATION APPLIED ---
    Alert.alert(t('rewards_tree_title'), `Spend ${node.cost} coins?`, [
      { text: t('confirm'), style: "cancel" },
      {
        text: t('confirm'), // Re-using confirm for unlock button text
        onPress: async () => {
          if (!userId) return;
          
          // Optimistic Update
          const newBalance = userPoints - node.cost;
          setUserPoints(newBalance);
          setCollectedCount(prev => prev + 1);
          
          setRewards(prev => prev.map(r => 
            r.id === node.id ? { ...r, isUnlocked: true, isCurrent: false } : 
            r.id === node.id + 1 ? { ...r, isCurrent: true } : r
          ));

          // Grow vine to THIS node
          const targetOffset = VINE_LENGTH * (1 - node.vineProgress);
          animatedStrokeDashoffset.value = withTiming(targetOffset, { duration: 1000 });

          setActiveReward(node);
          setModalVisible(true);

          await supabase.from('profiles').update({ coins: newBalance }).eq('id', userId);
          await supabase.from('user_rewards').insert({ user_id: userId, reward_id: node.id });
        }
      }
    ]);
  };

  const CropImageSource = (selectedCrop && CROP_IMAGES[selectedCrop.toLowerCase()]) 
    ? CROP_IMAGES[selectedCrop.toLowerCase()] 
    : CROP_IMAGES['banana']; 

  if (loading || isTransLoading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#4CAF50" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* --- PREMIUM ORGANIC BACKGROUND --- */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0" stopColor="#1b2e15" />
              <Stop offset="1" stopColor="#0f1a0d" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
        </Svg>
        <FloatingParticle delay={0} size={4} x="20%" duration={8000} />
        <FloatingParticle delay={2000} size={6} x="60%" duration={12000} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          {/* --- TRANSLATION APPLIED --- */}
          <StatBox label={t('available_coins')} value={String(userPoints)} iconName="coins" />
          <StatBox label={t('unlocked')} value={String(collectedCount)} iconName="gift" />
        </View>
        
        {/* --- TRANSLATION APPLIED --- */}
        <Text style={styles.rewardRootTitle}>{t('rewards_tree_title')}</Text>
        
        <View style={styles.rootContainer}>
          <Svg style={styles.vineSvg} height={1200} width={300}>
            {/* Track Path (Soil Color) */}
            <Path 
              d={VINE_PATH} 
              stroke="#3e2723" 
              strokeWidth={16} 
              fill="none"
              strokeLinecap="round"
              strokeOpacity={0.5}
            />
            {/* Fill Path (Vibrant Plant Green) */}
            <AnimatedPath 
              d={VINE_PATH} 
              stroke="#4CAF50" 
              strokeWidth={10} 
              fill="none"
              strokeLinecap="round"
              strokeDasharray={VINE_LENGTH}
              animatedProps={animatedVineProps} 
            />
          </Svg>
          
          <View style={styles.sproutContainer}>
            <View style={styles.sproutGlow} />
            <Image source={CropImageSource} style={styles.sproutImage} />
          </View>

          {rewards.map((node, index) => (
            <RewardNode key={node.id} node={node} index={index} onPress={() => handleNodePress(node)} />
          ))}
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>REWARD UNLOCKED!</Text>
            {activeReward && (
              <>
                <Text style={styles.modalRewardName}>{activeReward.text}</Text>
                <View style={styles.qrBox}>
                  <QRCode value={`KHET_REWARD_${activeReward.id}_USER_${userId}`} size={180} />
                </View>
                {/* --- TRANSLATION APPLIED --- */}
                <Text style={styles.scanInstruction}>{t('scan_at_store')}</Text>
              </>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1b2e15' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 24 },
  
  // Stats
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statLabel: { color: '#AAA', fontFamily: PIXEL_FONT, fontSize: 9, letterSpacing: 0.5 },
  statValue: { color: '#E8F5E9', fontFamily: PIXEL_FONT, fontSize: 18, fontWeight: 'bold' },

  rewardRootTitle: { color: '#A5D6A7', fontFamily: PIXEL_FONT, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 10, marginBottom: 30, letterSpacing: 2 },
  
  // Root System
  rootContainer: { position: 'relative', width: '100%', height: 1200, alignItems: 'center' },
  vineSvg: { position: 'absolute', top: 0, left: '50%', transform: [{ translateX: -150 }] },
  
  sproutContainer: { position: 'absolute', bottom: -15, left: '50%', transform: [{ translateX: -40 }], zIndex: 10, justifyContent: 'center', alignItems: 'center' },
  sproutImage: { width: 80, height: 80, resizeMode: 'contain', zIndex: 2 },
  sproutGlow: { position: 'absolute', width: 50, height: 20, borderRadius: 25, backgroundColor: '#4CAF50', opacity: 0.5, bottom: 10, filter: 'blur(8px)' },

  particle: { position: 'absolute', borderRadius: 50, backgroundColor: 'rgba(165, 214, 167, 0.4)', bottom: 0 },

  // Nodes & Layout
  node: { position: 'absolute', zIndex: 20 },
  nodeLeft: { right: '50%', marginRight: 55 }, // Tighter layout
  nodeRight: { left: '50%', marginLeft: 55 },  // Tighter layout
  
  nodeWrapper: { flexDirection: 'row', alignItems: 'center' },
  wrapperLeft: { flexDirection: 'row-reverse' },
  wrapperRight: { flexDirection: 'row' },
  
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#233320', borderWidth: 2, borderColor: '#3E5238', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },
  iconCircleLocked: { opacity: 0.8 },
  iconCircleUnlocked: { backgroundColor: '#2E7D32', borderColor: '#4CAF50' },
  
  textTag: { backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', width: 100, justifyContent: 'center' },
  textTagLeft: { marginRight: 10, alignItems: 'flex-end' },
  textTagRight: { marginLeft: 10, alignItems: 'flex-start' },
  
  nodeTitle: { color: '#E8F5E9', fontFamily: PIXEL_FONT, fontSize: 10, marginBottom: 2, width: '100%', textAlign: 'center' },
  costRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  nodeCost: { color: '#FFD54F', fontFamily: PIXEL_FONT, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  
  checkBadge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1b2e15' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalView: { width: '80%', backgroundColor: '#233320', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#4CAF50' },
  modalTitle: { fontSize: 20, color: '#4CAF50', fontFamily: PIXEL_FONT, fontWeight: 'bold', marginBottom: 15 },
  modalRewardName: { fontSize: 16, color: '#FFF', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  qrBox: { padding: 15, backgroundColor: 'white', borderRadius: 12, marginBottom: 15 },
  scanInstruction: { color: '#AAA', fontSize: 12, marginBottom: 20, fontFamily: PIXEL_FONT },
  closeButton: { backgroundColor: '#2E7D32', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, fontFamily: PIXEL_FONT },
});