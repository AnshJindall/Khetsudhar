import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import translations, { DEFAULT_LANGUAGE, TranslationKeys } from '@/constants/translations';
import { supabase } from '@/utils/supabase';

// Key for caching language in AsyncStorage
const LANGUAGE_STORAGE_KEY = '@user_language';

/**
 * Custom hook for fetching and applying translations based on user's profile language.
 * Provides a translation function 't'.
 */
export const useTranslation = () => {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLanguage = useCallback(async () => {
    // 1. Try to load from local cache first (for instant loading)
    let userLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    // 2. If not in cache, check Supabase profile
    if (!userLang) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && profile?.language) {
            userLang = profile.language;
          }
        }
      } catch (e) {
        console.warn("Could not fetch profile language:", e);
      }
    }
    
    // 3. Set the final language and update cache if new language is valid
    const finalLanguage = userLang && translations[userLang] ? userLang : DEFAULT_LANGUAGE;
    setLanguageState(finalLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, finalLanguage);
    setIsLoading(false);

  }, []);

  // Fetch language whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchLanguage();
    }, [fetchLanguage])
  );
  
  /**
   * The translation function.
   * @param key The key of the string to translate.
   * @returns The translated string, or the key itself as a fallback.
   */
  const t = useCallback((key: TranslationKeys): string => {
    // 1. Try to get translation for the currently set language
    const langStrings = translations[language];
    if (langStrings && langStrings[key]) {
      return langStrings[key];
    }
    
    // 2. Fallback to English (DEFAULT_LANGUAGE)
    const defaultStrings = translations[DEFAULT_LANGUAGE];
    if (defaultStrings && defaultStrings[key]) {
      return defaultStrings[key];
    }

    // 3. Ultimate fallback: return the key itself
    return key; 
  }, [language]);

  /**
   * Manually sets the language state and saves it to AsyncStorage.
   */
  const setLanguage = async (newLang: string) => {
    setLanguageState(newLang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  }

  return { t, language, isLoading, setLanguage };
};