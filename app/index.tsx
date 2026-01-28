import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLanguage, setHasLanguage] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // 1. Check Supabase Session (Are we logged in?)
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setIsLoggedIn(true);
      } else {
        // 2. If NOT logged in, have we chosen a language before?
        const lang = await AsyncStorage.getItem('user_language');
        if (lang) setHasLanguage(true);
      }
    } catch (e) {
      console.log(e);
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

  // LOGIC:
  // 1. Logged in? -> Dashboard (Skip everything)
  if (isLoggedIn) {
    return <Redirect href="/dashboard" />;
  }

  // 2. Not logged in, but selected language? -> Login Screen
  if (hasLanguage) {
    return <Redirect href="/login" />;
  }

  // 3. Brand new user? -> Language Selection
  return <Redirect href="/language" />;
}