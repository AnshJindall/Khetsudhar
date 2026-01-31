import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop
} from "react-native-svg";

import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/utils/supabase";

// Assets
import SusScoreIcon from "../assets/images/SusScore.svg";
import UserIcon from "../assets/images/UserImage.svg";

const PIXEL_FONT = "monospace";
const { width } = Dimensions.get("window");
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- GAUGE COMPONENT (From Teammate's Code) ---
const Gauge = ({ score }: { score: number }) => {
  const radius = 80;
  const strokeWidth = 15;
  const center = radius + strokeWidth;
  const circumference = Math.PI * radius; // Half circle
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1500,
      easing: Easing.out(Easing.exp),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  // Color logic based on score
  const getColor = (s: number) => {
    if (s < 40) return "#FF5252"; // Red
    if (s < 70) return "#FFD740"; // Yellow
    return "#4CAF50"; // Green
  };
  const scoreColor = getColor(score);

  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", height: 120 }}
    >
      <Svg width={center * 2} height={center + 10}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FF5252" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#FFD740" stopOpacity="1" />
            <Stop offset="1" stopColor="#4CAF50" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background Track */}
        <Path
          d={`M${strokeWidth},${center} A${radius},${radius} 0 0,1 ${center * 2 - strokeWidth},${center}`}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <AnimatedPath
          d={`M${strokeWidth},${center} A${radius},${radius} 0 0,1 ${center * 2 - strokeWidth},${center}`}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Score Text in Center */}
      <View style={{ position: "absolute", top: 50, alignItems: "center" }}>
        <Text
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: "bold",
            fontFamily: PIXEL_FONT,
          }}
        >
          {score}
        </Text>
        <Text
          style={{
            color: scoreColor,
            fontSize: 12,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          {score < 40 ? "LOW" : score < 70 ? "GOOD" : "EXCELLENT"}
        </Text>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [agriStackId, setAgriStackId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  // --- FETCHER WITH SCORING LOGIC ---
  const fetchProfileAndScore = async () => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) return null;

    // 1. Get Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 2. Calculate Lessons Score (60% Weight)
    const { count: totalLessons } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true });
    const { count: completedLessons } = await supabase
      .from("user_lessons")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const lessonsScore = totalLessons
      ? (completedLessons || 0) / totalLessons
      : 0;

    // 3. Calculate Quests Score (40% Weight)
    const { count: totalQuests } = await supabase
      .from("quests")
      .select("*", { count: "exact", head: true });
    const { count: completedQuests } = await supabase
      .from("user_quests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const questsScore = totalQuests ? (completedQuests || 0) / totalQuests : 0;

    // 4. Weighted Formula
    // Logic: (Lessons% * 0.6) + (Quests% * 0.4)
    const finalScore = Math.round(
      lessonsScore * 100 * 0.6 + questsScore * 100 * 0.4,
    );

    return {
      ...profile,
      sustainabilityScore: finalScore,
      stats: { completedLessons, totalLessons, completedQuests, totalQuests },
    };
  };

  const {
    data: profile,
    refresh,
    refreshing,
  } = useCachedQuery("profile_w_score_v1", fetchProfileAndScore);

  const handleVerifyAgriStack = () => {
    if (!agriStackId.trim()) return Alert.alert("Error", "Enter Valid ID");
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsLinked(true);
      Alert.alert("Success", "AgriStack Linked! Land records fetched.");
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#4CAF50"
          />
        }
      >
        {/* --- 1. USER CARD --- */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <UserIcon width={70} height={70} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.full_name || "Farmer"}
            </Text>
            <Text style={styles.userSub}>
              {profile?.mobile_no || "+91 98765 43210"}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile?.selected_crop || "Mixed"} Farmer
              </Text>
            </View>
          </View>
        </View>

        {/* --- 2. SUSTAINABILITY SCORE (INTEGRATED) --- */}
        <Text style={styles.sectionLabel}>PERFORMANCE</Text>
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <SusScoreIcon width={20} height={20} />
              <Text style={styles.cardTitle}>Sustainability Score</Text>
            </View>
            <FontAwesome5 name="info-circle" size={14} color="#666" />
          </View>

          {/* The Gauge */}
          <Gauge score={profile?.sustainabilityScore || 0} />

          <Text style={styles.scoreDesc}>
            Based on 60% Learning + 40% Field Tasks
          </Text>

          {/* Mini Stats */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniVal}>
                {profile?.stats?.completedLessons || 0}/
                {profile?.stats?.totalLessons || 0}
              </Text>
              <Text style={styles.miniLabel}>Lessons</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.miniStat}>
              <Text style={styles.miniVal}>
                {profile?.stats?.completedQuests || 0}/
                {profile?.stats?.totalQuests || 0}
              </Text>
              <Text style={styles.miniLabel}>Quests</Text>
            </View>
          </View>
        </View>

        {/* --- 3. AGRISTACK STATUS --- */}
        <Text style={styles.sectionLabel}>GOVERNMENT ID</Text>
        <View style={styles.sectionCard}>
          <View style={styles.rowBetween}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isLinked
                      ? "rgba(76, 175, 80, 0.15)"
                      : "rgba(255,255,255,0.05)",
                  },
                ]}
              >
                <FontAwesome5
                  name="id-card"
                  size={16}
                  color={isLinked ? "#4CAF50" : "#888"}
                />
              </View>
              <Text style={styles.cardTitle}>AgriStack</Text>
            </View>
            {isLinked ? (
              <View style={styles.statusPill}>
                <FontAwesome5 name="check" size={10} color="white" />
                <Text style={styles.statusText}>LINKED</Text>
              </View>
            ) : (
              <Text style={{ color: "#666", fontSize: 12 }}>Not Linked</Text>
            )}
          </View>

          {!isLinked && (
            <View style={styles.linkInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Farmer ID (e.g. AGRI-2025)"
                placeholderTextColor="#555"
                value={agriStackId}
                onChangeText={setAgriStackId}
              />
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={handleVerifyAgriStack}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.linkBtnText}>LINK</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* --- 4. SETTINGS MENU --- */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/crop")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E3F2FD" }]}>
              <FontAwesome5 name="leaf" size={14} color="#2196F3" />
            </View>
            <Text style={styles.menuText}>
              {t("change_crop") || "Change Crop"}
            </Text>
            <FontAwesome5 name="chevron-right" size={12} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: "#F3E5F5" }]}>
              <FontAwesome5 name="language" size={14} color="#9C27B0" />
            </View>
            <Text style={styles.menuText}>
              {t("change_language") || "Change Language"}
            </Text>
            <FontAwesome5 name="chevron-right" size={12} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutText}>{t("logout") || "Log Out"}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>KhetSudhaar v1.0.0 (Beta)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollContent: { padding: 20 },

  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarContainer: { marginRight: 16 },
  userInfo: { flex: 1 },
  userName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
    marginBottom: 4,
  },
  userSub: { color: "#888", fontSize: 12, marginBottom: 8 },
  roleBadge: {
    backgroundColor: "#2E7D32",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: { color: "white", fontSize: 10, fontWeight: "bold" },

  sectionLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },

  // Score Card
  scoreCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  scoreDesc: { color: "#888", fontSize: 10, marginTop: -10, marginBottom: 15 },
  miniStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 15,
    gap: 30,
  },
  miniStat: { alignItems: "center" },
  miniVal: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: PIXEL_FONT,
  },
  miniLabel: { color: "#666", fontSize: 10, marginTop: 2 },
  verticalLine: { width: 1, backgroundColor: "#333", height: "80%" },

  // Generic Cards
  sectionCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "500" },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: "white", fontSize: 10, fontWeight: "bold" },

  linkInputContainer: { marginTop: 15, flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "#121212",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "white",
    height: 44,
    borderWidth: 1,
    borderColor: "#333",
  },
  linkBtn: {
    backgroundColor: "#4CAF50",
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  linkBtnText: { color: "white", fontWeight: "bold", fontSize: 12 },

  // Menu
  menuContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2E",
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: { flex: 1, color: "#DDD", fontSize: 14, fontWeight: "500" },

  logoutButton: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
  logoutText: { color: "#EF5350", fontWeight: "bold", fontSize: 14 },

  version: { textAlign: "center", color: "#444", fontSize: 10, marginTop: 20 },
});
