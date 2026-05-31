// Uygulamanın kök layout dosyası
// Expo Router'ın giriş noktası
// KRİTİK: useRef ile initialize sadece bir kez çalışır
// Stack navigator burada tanımlanır
// fonts ve global ayarlar burada yüklenir

import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../src/services/firebase';
import { useAuthStore } from '../src/stores/authStore';
import { getUser } from '../src/services/userService';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  // KRİTİK: initialized ref ile useEffect sadece bir kez çalışır
  // React strict mode ve hot reload'da çift çalışmayı önler
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Firebase auth state dinleyicisi başlat
    // onAuthStateChanged null gelince hiçbir şey yapma
    // Yönlendirme app/index.tsx'de yapılır
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(hairdresser)" />
      </Stack>
    </>
  );
}