import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

import QCoin from "../assets/images/Qcoin.svg";

const PIXEL_FONT = "monospace";

// Force 1000 XP constant
const QUEST_REWARD = 1000;

const fetchQuiz = async (id: string) => {
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return { ...data, xp_reward: QUEST_REWARD }; // Visual Override
};

export default function QuizScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const {
    data: quizData,
    loading,
    isOffline,
  } = useCachedQuery(`quest_quiz_final_${id}`, () => fetchQuiz(id!));

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultState, setResultState] = useState<
    "none" | "correct" | "incorrect"
  >("none");

  const handleSubmit = async () => {
    if (!selectedAnswer || !quizData) return;
    if (isOffline) {
      Alert.alert("Offline", "Please connect to internet to complete quest.");
      return;
    }

    setIsSubmitting(true);
    const isCorrect = selectedAnswer === quizData.correct_answer;
    
    // Update UI immediately
    setResultState(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      try {
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user.id;

        if (userId) {
          // --- STEP 1: MARK AS COMPLETE ---
          // We insert into user_quests. If it fails, we catch the error.
          const { error: insertError } = await supabase
            .from("user_quests")
            .insert({ user_id: userId, quest_id: quizData.id });

          // If error is NOT "duplicate key" (code 23505), then it's a real error.
          if (insertError && insertError.code !== "23505") {
             console.error("Quest Insert Error:", insertError);
             Alert.alert("Error Saving Quest", insertError.message);
             setIsSubmitting(false);
             return; 
          }

          // --- STEP 2: ADD COINS ---
          // Only proceed if there was NO error, or if it was a duplicate (already done)
          // We fetch the profile first to get the current balance.
          const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("quest_coins")
            .eq("id", userId)
            .single();

          if (fetchError) {
             console.error("Profile Fetch Error:", fetchError);
             // We don't stop here, but we warn.
          } else {
             const currentCoins = profile?.quest_coins || 0;
             const newBalance = currentCoins + QUEST_REWARD;
             
             // Update the coins
             const { error: updateError } = await supabase
               .from("profiles")
               .update({ quest_coins: newBalance })
               .eq("id", userId);

             if (updateError) {
                 console.error("Coin Update Error:", updateError);
                 Alert.alert("Error Adding Coins", updateError.message);
             }
          }
        }
      } catch (err: any) {
        console.error("Critical Completion error", err);
        Alert.alert("Error", err.message || "An unexpected error occurred.");
      }
    }
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    if (resultState === "correct") {
      router.replace("/quests"); // Go back to list
    } else {
      setResultState("none");
      setSelectedAnswer(null);
    }
  };

  if (loading || !quizData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B1FA2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("knowledge_check") || "MISSION QUIZ"}
          </Text>
          <View style={styles.xpTag}>
            <QCoin width={16} height={16} />
            <Text style={styles.xpText}>+{QUEST_REWARD} QP</Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>QUESTION</Text>
          <Text style={styles.questionText}>{quizData.quiz_question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {quizData.quiz_options?.map((option: string, index: number) => {
            const isSelected = selectedAnswer === option;
            let optionStyle: any = styles.optionButton;
            let iconName = isSelected ? "dot-circle" : "circle";
            let iconColor = isSelected ? "#7B1FA2" : "#666";

            if (resultState !== "none") {
              if (option === quizData.correct_answer) {
                optionStyle = styles.optionCorrect;
                iconName = "check-circle";
                iconColor = "#fff";
              } else if (isSelected && resultState === "incorrect") {
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
                onPress={() =>
                  resultState === "none" && setSelectedAnswer(option)
                }
                disabled={resultState !== "none" || isOffline}
                activeOpacity={0.8}
              >
                <FontAwesome5
                  name={iconName}
                  size={20}
                  color={iconColor}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={[
                    styles.optionText,
                    resultState !== "none" &&
                      (isSelected || option === quizData.correct_answer) && {
                        color: "white",
                        fontWeight: "bold",
                      },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Result Message */}
        {resultState !== "none" && (
          <View
            style={[
              styles.resultBox,
              resultState === "correct"
                ? styles.resultBoxSuccess
                : styles.resultBoxError,
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <FontAwesome5
                name={
                  resultState === "correct" ? "trophy" : "exclamation-triangle"
                }
                size={20}
                color="white"
              />
              <Text style={styles.resultTitle}>
                {resultState === "correct"
                  ? "Excellent Work!"
                  : "Not Quite Right"}
              </Text>
            </View>
            <Text style={styles.explanationText}>
              {quizData.quiz_explanation}
            </Text>
          </View>
        )}

        {/* Button */}
        <View style={{ height: 100 }}>
          {(selectedAnswer || resultState !== "none") && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                resultState === "correct"
                  ? styles.btnSuccess
                  : resultState === "incorrect"
                    ? styles.btnRetry
                    : styles.btnSubmit,
              ]}
              onPress={resultState === "none" ? handleSubmit : handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {resultState === "none"
                    ? "SUBMIT ANSWER"
                    : resultState === "correct"
                      ? "CLAIM REWARD"
                      : "TRY AGAIN"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: { padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
    letterSpacing: 1.5,
  },
  xpTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  xpText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
  },
  questionCard: { marginBottom: 30 },
  questionLabel: {
    color: "#7B1FA2",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: PIXEL_FONT,
    letterSpacing: 1,
  },
  questionText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 32,
  },
  optionsContainer: { gap: 16, marginBottom: 30 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  optionSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A1A35",
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#7B1FA2",
  },
  optionCorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1B5E20",
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  optionIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B71C1C",
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#EF5350",
  },
  optionDisabled: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 24,
    opacity: 0.4,
  },
  optionText: { color: "#DDD", fontSize: 16, flex: 1, fontWeight: "500" },
  resultBox: { padding: 20, borderRadius: 24, marginTop: 10, marginBottom: 30 },
  resultBoxSuccess: {
    backgroundColor: "#1B5E20",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  resultBoxError: {
    backgroundColor: "#B71C1C",
    borderWidth: 1,
    borderColor: "#EF5350",
  },
  resultTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 10,
    fontFamily: PIXEL_FONT,
  },
  explanationText: {
    color: "#E0E0E0",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnSubmit: { backgroundColor: "#FFD700" },
  btnSuccess: { backgroundColor: "#4CAF50" },
  btnRetry: { backgroundColor: "#FFF" },
  actionButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
    letterSpacing: 1,
  },
});
