import { supabase } from '@/utils/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function GameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);

  const GAME_URL = 'https://eclectic-otter-4571bc.netlify.app/'; 

  const handleGameComplete = async () => {
    if (isSaving || !id) return;
    setIsSaving(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      const lessonId = parseInt(id as string);

      if (userId) {
        // 1. Fetch Points
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('points')
          .eq('id', lessonId)
          .single();
        
        const pointsAwarded = lessonData?.points || 150; 

        // 2. Mark Completed
        const { error: lessonError } = await supabase
          .from('user_lessons')
          .upsert(
            { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }, 
            { onConflict: 'user_id,lesson_id' }
          );

        if (lessonError) throw lessonError;

        // 3. Award Coins
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins, xp')
          .eq('id', userId)
          .single();
          
        if (profile) {
          const newCoins = (profile.coins || 0) + pointsAwarded;
          const newXP = (profile.xp || 0) + 100; 

          await supabase
            .from('profiles')
            .update({ coins: newCoins, xp: newXP })
            .eq('id', userId);
        }
      }

      // Navigate to Complete
      router.replace({
        pathname: '/complete/[id]',
        params: { id: id as string }
      });

    } catch (error: any) {
      console.error("Game Save Error:", error);
      Alert.alert("Error", "Could not save progress. Please check internet.");
      setIsSaving(false);
    }
  };

  const handleMessage = (event: any) => {
    // Debugging: This Alert confirms the app received the signal
    // console.log("Message received from game:", event.nativeEvent.data);
    
    if (event.nativeEvent.data === 'lesson_complete') {
      handleGameComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: GAME_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loading: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
  }
});