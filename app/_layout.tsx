import { FontAwesome5 } from '@expo/vector-icons';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// Use the @ alias for import
import { supabase } from '@/utils/supabase';
import { useTranslation } from '@/hooks/useTranslation'; // <-- ADDED

function AppHeaderLeft() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/profile')}>
      <FontAwesome5 name="user-circle" size={28} color="white" style={styles.profileIcon} />
    </TouchableOpacity>
  );
}

function AppHeaderRight() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/dashboard')}>
      <Image
        source={require('../assets/images/Applogo.png')}
        style={styles.logoRight}
      />
    </TouchableOpacity>
  );
}

// Custom component to use the hook inside Stack.Screen options
function TranslatedHeaderTitle({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return t(titleKey as any);
}

export default function AppLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  // Initialize translation for the entire layout
  const { t, isLoading: isTransLoading } = useTranslation(); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- AUTH GUARD LOGIC ---
  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] || 'index';

    // --- PUBLIC ROUTES (Guest Access Allowed) ---
    const publicRoutes = [
      'index', 
      'language', 
      'crop', 
      'login',
      'signup', 
      'lessons',   
      'lesson',
      'quiz', 
      'complete', 
      'reward'
    ];

    // Check if current route is in publicRoutes
    const isPublicRoute = publicRoutes.includes(currentRoute as string);

    if (session) {
      // User IS logged in: Redirect them out of login/signup pages
      if (currentRoute === 'login' || (currentRoute as string) === 'signup') {
        router.replace('/lessons');
      }
    } else {
      // User is NOT logged in: Block protected pages
      if (!isPublicRoute) {
        router.replace('/login');
      }
    }
  }, [session, isLoading, segments]);


  if (isLoading || isTransLoading) {
    return (
      <View style={layoutStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#388e3c' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        
        {/* Public Screens - USING TRANSLATED HEADER */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: true, headerTitle: t('choose_language'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="crop" options={{ headerShown: true, headerTitle: t('choose_crop'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="login" options={{ headerShown: true, headerTitle: t('login'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="signup" options={{ headerShown: true, headerTitle: t('signup'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />

        {/* Hybrid Screens */}
        <Stack.Screen name="lessons" options={{ headerShown: true, headerTitle: t('lessons'), headerLeft: () => session ? <AppHeaderLeft /> : null, headerRight: () => <AppHeaderRight /> }} />
        {/* Use a function component for dynamic title in the next two screens */}
        <Stack.Screen name="lesson/[id]" options={{ headerShown: true, headerTitle: 'LESSON DETAIL', headerLeft: () => session ? <AppHeaderLeft /> : null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/[id]" options={{ headerShown: true, headerTitle: t('take_quiz'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="complete/[id]" options={{ headerShown: true, headerTitle: t('completed'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="reward/[id]" options={{ headerShown: true, headerTitle: t('rewards'), headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />

        {/* Protected Screens */}
        <Stack.Screen name="dashboard" options={{ headerShown: true, headerTitle: t('dashboard'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="profile" options={{ headerShown: true, headerTitle: t('profile'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="reward-root" options={{ headerShown: true, headerTitle: t('rewards_tree_title'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: true, headerTitle: t('leaderboard'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="quests" options={{ headerShown: true, headerTitle: t('monthly_quests'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="marketPrices" options={{ headerShown: true, headerTitle: t('market_prices'), headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  logoRight: { width: 40, height: 40, marginRight: 15 },
  profileIcon: { marginLeft: 15 },
});

const layoutStyles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' }
});