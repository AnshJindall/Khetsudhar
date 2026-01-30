import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/utils/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const InfoSection = ({ title, icon, color, items }: any) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: color }]}>
          <FontAwesome5 name={icon} size={14} color="white" />
        </View>
        <Text style={[styles.sectionTitle, { color: color }]}>{title}</Text>
      </View>
      <View style={styles.card}>
        {items.map((item: string, index: number) => (
          <View key={index} style={styles.listItem}>
            <View style={[styles.bullet, { backgroundColor: color }]} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function SchemeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const isHindi = language === "hi";

  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      console.log("Fetching details for ID:", id); // Debugging Log

      try {
        const { data, error } = await supabase
          .from("gov_schemes")
          .select("*")
          .eq("id", id)
          .maybeSingle(); // <--- CRITICAL FIX: Prevents crash if ID is not found

        if (error) throw error;
        setScheme(data);
      } catch (err) {
        console.error("Error fetching details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: "", headerBackTitle: "" }} />
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Handle "Not Found" State Gracefully
  if (!scheme) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ title: "Not Found", headerBackTitle: "" }} />
        <FontAwesome5 name="exclamation-circle" size={50} color="#666" />
        <Text
          style={{
            color: "white",
            textAlign: "center",
            marginTop: 20,
            fontSize: 16,
          }}
        >
          Scheme details not found.
        </Text>
        <Text style={{ color: "#888", textAlign: "center", marginTop: 10 }}>
          ID: {id}
        </Text>
      </View>
    );
  }

  const title = isHindi ? scheme.title_hi : scheme.title_en;
  const desc = isHindi ? scheme.desc_hi : scheme.desc_en;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("schemes_title") || "Scheme Details",
          headerBackTitle: "",
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.hero,
            { backgroundColor: scheme.color + "20", borderColor: scheme.color },
          ]}
        >
          <View style={[styles.heroIcon, { backgroundColor: scheme.color }]}>
            <FontAwesome5 name={scheme.icon} size={32} color="white" />
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroDesc}>{desc}</Text>
        </View>

        <InfoSection
          title={t("benefits") || "Benefits"}
          icon="gift"
          color="#4CAF50"
          items={isHindi ? scheme.benefits_hi : scheme.benefits_en}
        />

        <InfoSection
          title={t("eligibility") || "Eligibility"}
          icon="user-check"
          color="#2196F3"
          items={isHindi ? scheme.eligibility_hi : scheme.eligibility_en}
        />

        <InfoSection
          title={t("process") || "Process"}
          icon="walking"
          color="#9C27B0"
          items={isHindi ? scheme.steps_hi : scheme.steps_en}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 50 },
  hero: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 5,
  },
  heroTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  heroDesc: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionContainer: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  card: { backgroundColor: "#1E1E1E", borderRadius: 12, padding: 16 },
  listItem: { flexDirection: "row", marginBottom: 12 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  listText: { color: "#ddd", fontSize: 14, lineHeight: 20, flex: 1 },
});
