import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function GameScreen() {
 const router = useRouter();
 const { id } = useLocalSearchParams();

 // 🚨 1. YOU MUST REPLACE THIS WITH THE DIRECT EMBED/HTML LINK 🚨
 // This ensures the WebView loads ONLY the game, not the Itch.io interface.
 const GAME_URL = 'https://eclectic-otter-4571bc.netlify.app/'; 

 const handleMessage = (event: any) => {
 // Listens for window.ReactNativeWebView.postMessage('lesson_complete') from the game
 if (event.nativeEvent.data === 'lesson_complete') {
 router.replace({
 pathname: '/complete/[id]',
 params: { id: id as string }
 });
  }}

  return (
    <View style={styles.container}>
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
    </View>
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