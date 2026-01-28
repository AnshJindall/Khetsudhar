import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFlow();
  }, []);

  const checkFlow = async () => {
    try {
      // 1. Check Session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      // 2. Check Onboarding Flags
      const hasLang = await AsyncStorage.getItem('user_language');
      const hasCrop = await AsyncStorage.getItem('user_crop');
      
      if (!hasLang) {
        setIsFirstLaunch(true); // Go to Language
      } else if (!hasCrop) {
        setIsFirstLaunch(true); // Go to Crop (technically handled by language screen flow usually)
      } else {
        setIsFirstLaunch(false); // Go to Dashboard/Login
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // FLOW LOGIC:
  // 1. No Language? -> Language Screen
  // 2. Logged In? -> Dashboard
  // 3. Not Logged In but has Language? -> Login
  
  if (isFirstLaunch) {
    return <Redirect href="/language" />;
  }

  if (session) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}