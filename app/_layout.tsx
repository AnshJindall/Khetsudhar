import { FontAwesome5 } from '@expo/vector-icons';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// Use the @ alias for import
import { supabase } from '@/utils/supabase';

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

export default function AppLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

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
    // We allow guests to see these screens without logging in
    const publicRoutes = [
      'index', 
      'language', 
      'crop', 
      'login', 
      'lessons',   
      'lesson',
      'quiz',      // <--- CRITICAL: Allows guests to take the quiz
      'complete', 
      'reward'
    ];

    const isPublicRoute = publicRoutes.includes(currentRoute);

    if (session) {
      // User IS logged in: Redirect them out of login page
      if (currentRoute === 'login') {
        router.replace('/lessons');
      }
    } else {
      // User is NOT logged in: Block protected pages
      if (!isPublicRoute) {
        router.replace('/login');
      }
    }
  }, [session, isLoading, segments]);


  if (isLoading) {
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
        
        {/* Public Screens */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="language" options={{ headerShown: true, headerTitle: 'LANGUAGE', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="crop" options={{ headerShown: true, headerTitle: 'CHOOSE CROP', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="login" options={{ headerShown: true, headerTitle: 'LOGIN', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />

        {/* Hybrid Screens */}
        <Stack.Screen name="lessons" options={{ headerShown: true, headerTitle: 'LESSONS', headerLeft: () => session ? <AppHeaderLeft /> : null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="lesson/[id]" options={{ headerShown: true, headerTitle: 'LESSON DETAIL', headerLeft: () => session ? <AppHeaderLeft /> : null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="quiz/[id]" options={{ headerShown: true, headerTitle: 'QUIZ', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="complete/[id]" options={{ headerShown: true, headerTitle: 'COMPLETED', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="reward/[id]" options={{ headerShown: true, headerTitle: 'REWARD', headerLeft: () => null, headerRight: () => <AppHeaderRight /> }} />

        {/* Protected Screens */}
        <Stack.Screen name="dashboard" options={{ headerShown: true, headerTitle: 'DASHBOARD', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="profile" options={{ headerShown: true, headerTitle: 'PROFILE', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="reward-root" options={{ headerShown: true, headerTitle: 'REWARDS TREE', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: true, headerTitle: 'LEADERBOARD', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="quests" options={{ headerShown: true, headerTitle: 'QUESTS', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />
        <Stack.Screen name="marketPrices" options={{ headerShown: true, headerTitle: 'MARKET PRICES', headerLeft: () => <AppHeaderLeft />, headerRight: () => <AppHeaderRight /> }} />

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