import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [nextScreen, setNextScreen] = useState<string>('/language');

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // 1. Check if user is already logged in (Skip everything)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setNextScreen('/dashboard');
        return;
      }

      // 2. Check Local Progress
      const lang = await AsyncStorage.getItem('onboarding_lang');
      const crop = await AsyncStorage.getItem('onboarding_crop');
      const rewardClaimed = await AsyncStorage.getItem('onboarding_reward_claimed');

      if (!lang) {
        setNextScreen('/language'); // Step 1: User hasn't chosen language
      } else if (!crop) {
        setNextScreen('/crop');     // Step 2: User hasn't chosen crop
      } else if (!rewardClaimed) {
        // Step 3: Send to First Quest (ID 1)
        // Ensure you have a quest with id=1 in your database!
        setNextScreen('/quest-details?id=1'); 
      } else {
        setNextScreen('/login');    // Step 4: Finished quest, needs to login
      }
    } catch (e) {
      console.error("Onboarding check failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151718' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // @ts-ignore
  return <Redirect href={nextScreen} />;
}