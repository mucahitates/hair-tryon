// Uygulamanın kök layout dosyası
// Expo Router'ın giriş noktası
// KRİTİK: useRef ile initialize sadece bir kez çalışır

import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../src/services/firebase';
import { useAuthStore } from '../src/stores/authStore';
import { getUser } from '../src/services/userService';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const user = await getUser(firebaseUser.uid);
        if (user) {
          useAuthStore.getState().setAuth(firebaseUser, user);
        }
      } else {
        useAuthStore.getState().setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" options={{ contentStyle: { backgroundColor: COLORS.background } }} />
        <Stack.Screen name="(hairdresser)" options={{ contentStyle: { backgroundColor: COLORS.background } }} />
        <Stack.Screen name="chat/[chatId]" />
        <Stack.Screen name="hairdresser/[id]" />
      </Stack>
    </>
  );
}