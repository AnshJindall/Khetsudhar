import { FontAwesome5 } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

// --- IMPORT SUPABASE CLIENT (Adjust the path as necessary)
import { supabase } from '../utils/supabase';

// --- FUNCTIONS FOR THE CONSISTENT APP HEADER ---

// Profile Icon (for post-login screens)
function AppHeaderLeft() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/profile')}>
      <FontAwesome5 name="user-circle" size={28} color="white" style={styles.profileIcon} />
    </TouchableOpacity>
  );
}

// Logo (for all screens)
function AppHeaderRight() {
  const router = useRouter();
  // Note: Assuming '/dashboard' is the authenticated home screen.
  // We navigate to it on logo press.
  return (
    <TouchableOpacity onPress={() => router.push('/dashboard')}>
      <Image
        source={require('@/assets/images/Applogo.png')}
        style={styles.logoRight}
      />
    </TouchableOpacity>
  );
}

// --- GLOBAL LAYOUT COMPONENT (Integrated Auth Guard) ---
export default function AppLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // --- Supabase Authentication Listener ---
  useEffect(() => {
    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Real-time Listener for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- Routing Logic (Auth Guard) ---
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = segments[0] === 'login';

    if (session) {
      // User is logged in
      if (isLoginPage) {
        // Redirect away from login to lessons/dashboard
        router.replace('/lessons');
      }
    } else {
      // User is NOT logged in
      if (!isLoginPage) {
        // Redirect to login if they try to access a protected route
        router.replace('/login');
      }
    }
  }, [session, isLoading, segments]);


  if (isLoading) {
    // Show loading while session check is in progress
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
          // Global header style
          headerStyle: {
            backgroundColor: '#388e3c', // Khetsudhaar green
          },
          headerTintColor: '#fff', // White text/icons
          headerShadowVisible: false, // Clean flat look
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* --- PRE-LOGIN SCREENS --- */}
        {/* These screens have NO profile icon */}
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerTitle: 'LOGIN',
            headerLeft: () => null, // No profile icon
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="language"
          options={{
            headerShown: true,
            headerTitle: 'LANGUAGE',
            headerLeft: () => null, // No profile icon
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="crop"
          options={{
            headerShown: true,
            headerTitle: 'CHOOSE CROP',
            headerLeft: () => null, // No profile icon
            headerRight: () => <AppHeaderRight />,
          }}
        />
        
        {/* --- POST-LOGIN SCREENS --- */}
        {/* These screens HAVE the profile icon */}
        {/* Conditional rendering could be used here, but keeping it simple with fixed components */}
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: true,
            headerTitle: 'DASHBOARD',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="lessons"
          options={{
            headerShown: true,
            headerTitle: 'LESSONS',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="lesson/[id]"
          options={{
            headerShown: true,
            headerTitle: 'LESSON DETAIL',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        
        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            headerTitle: 'PROFILE',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="reward-root"
          options={{
            headerShown: true,
            headerTitle: 'REWARDS',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="leaderboard"
          options={{
            headerShown: true,
            headerTitle: 'LEADERBOARD',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="quests" 
          options={{
            headerShown: true,
            headerTitle: 'DAILY QUESTS', 
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="marketPrices"
          options={{
            headerShown: true,
            headerTitle: 'MARKET PRICES',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="quest-details"
          options={{
            headerShown: true,
            headerTitle: 'QUEST DETAILS', 
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="quest-complete" 
          options={{
            headerShown: true,
            headerTitle: 'QUEST COMPLETE',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
        <Stack.Screen
          name="quest-quiz" 
          options={{
            headerShown: true,
            headerTitle: 'QUEST QUIZ',
            headerLeft: () => <AppHeaderLeft />,
            headerRight: () => <AppHeaderRight />,
          }}
        />
      </Stack>

      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  logoRight: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  profileIcon: {
    marginLeft: 15,
  },
});

const layoutStyles = StyleSheet.create({
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#151718' 
    }
});