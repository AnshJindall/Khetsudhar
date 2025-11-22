import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Try Network Request
      const result = await fetcher();
      
      // 2. If successful, save to Cache & Update State
      await AsyncStorage.setItem(key, JSON.stringify(result));
      setData(result);
      setIsOffline(false);
      
    } catch (error) {
      console.log(`[${key}] Network failed, trying cache...`);
      
      // 3. If failed, load from Cache
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        setData(JSON.parse(cached));
        setIsOffline(true);
      } else {
        // 4. No cache and no internet?
        if (!isRefresh && !data) {
           console.log("No cached data available");
        }
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key]); // Dependency on 'key' ensures we fetch new data if key changes (e.g., language change)

  // FIX: Run loadData whenever it changes (which happens when 'key' changes)
  useEffect(() => {
    loadData();
  }, [loadData]);

  return { 
    data, 
    loading, 
    isOffline, 
    refresh: () => loadData(true),
    refreshing 
  };
}