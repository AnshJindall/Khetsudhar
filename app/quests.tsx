import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/utils/supabase";

import Qcoin from "../assets/images/Qcoin.svg";

const PIXEL_FONT = "monospace";
const QUEST_REWARD = 1000;

// --- FETCHER ---
const fetchQuestsData = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  // 1. Get User Crop
  let userCrop = null;
  if (userId) {
    const { data: p } = await supabase
      .from("profiles")
      .select("selected_crop")
      .eq("id", userId)
      .single();
    userCrop = p?.selected_crop;
  }

  // 2. Fetch Filtered Quests (Generic OR Specific)
  let query = supabase.from("quests").select("*").order("id");

  if (userCrop) {
    query = query.or(`target_crop.is.null,target_crop.eq.${userCrop}`);
  } else {
    query = query.is("target_crop", null);
  }

  const { data: questsData, error } = await query;
  if (error) throw error;

  // 3. Check Completion
  let completedIds = new Set();
  let userCoins = 0;

  if (userId) {
    const { data: uq } = await supabase
      .from("user_quests")
      .select("quest_id")
      .eq("user_id", userId);
    uq?.forEach((i) => completedIds.add(i.quest_id));

    const { data: p } = await supabase
      .from("profiles")
      .select("quest_coins")
      .eq("id", userId)
      .single();
    userCoins = p?.quest_coins || 0;
  }

  const finalQuests = (questsData || []).map((q) => ({
    ...q,
    xp_reward: QUEST_REWARD,
    isCompleted: completedIds.has(q.id),
  }));

  return { quests: finalQuests, userCoins };
};

export default function QuestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data, loading, isOffline, refresh, refreshing } = useCachedQuery(
    "quests_page_clean_v1",
    fetchQuestsData,
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, []),
  );

  const quests = data?.quests || [];
  const userCoins = data?.userCoins || 0;

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}

        {/* --- SIMPLE STATS HEADER --- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {t("monthly_quests") || "QUESTS"}
            </Text>
            <Text style={styles.headerSub}>Complete tasks to earn coins</Text>
          </View>
          <View style={styles.coinBadge}>
            <Qcoin width={18} height={18} />
            <Text style={styles.coinText}>{userCoins}</Text>
          </View>
        </View>

        {/* --- QUEST LIST --- */}
        {quests.map((quest) => (
          <TouchableOpacity
            key={quest.id}
            style={[
              styles.questCard,
              quest.isCompleted
                ? styles.questCardCompleted
                : styles.questCardActive,
            ]}
            onPress={() => {
              // LOCK IF COMPLETED
              if (!quest.isCompleted) {
                router.push({
                  pathname: "/quest-details",
                  params: { id: String(quest.id) },
                });
              }
            }}
            activeOpacity={quest.isCompleted ? 1 : 0.7}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconBox,
                quest.isCompleted && styles.iconBoxCompleted,
              ]}
            >
              <FontAwesome5
                name={quest.isCompleted ? "check" : quest.icon_type || "scroll"}
                size={18}
                color={quest.isCompleted ? "white" : "#FFD700"}
              />
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardTitle,
                  quest.isCompleted && styles.textCompleted,
                ]}
              >
                {quest.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={1}>
                {quest.isCompleted
                  ? "Completed on " + new Date().toLocaleDateString()
                  : quest.description}
              </Text>
            </View>

            {/* Right Side */}
            {!quest.isCompleted && (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardText}>+{QUEST_REWARD}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {quests.length === 0 && (
          <Text style={styles.emptyText}>
            No quests available for your crop.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  scrollContent: { padding: 20, paddingBottom: 50 },
  offlineBanner: {
    backgroundColor: "#C62828",
    padding: 5,
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
  offlineText: { color: "white", fontWeight: "bold" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
  },
  headerSub: { color: "#888", fontSize: 12, marginTop: 4 },

  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  coinText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
    fontSize: 16,
  },

  questCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  questCardActive: { borderLeftWidth: 4, borderLeftColor: "#FFD700" },
  questCardCompleted: {
    backgroundColor: "#1B2E1B",
    borderColor: "#2E7D32",
    opacity: 0.7,
  }, // Dark Green tint

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconBoxCompleted: { backgroundColor: "#2E7D32" },

  cardContent: { flex: 1 },
  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDesc: { color: "#888", fontSize: 12 },
  textCompleted: { color: "#81C784", textDecorationLine: "line-through" },

  rewardPill: {
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: { color: "#FFD700", fontSize: 12, fontWeight: "bold" },

  emptyText: { color: "#666", textAlign: "center", marginTop: 40 },
});
