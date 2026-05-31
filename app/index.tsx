// Uygulamanın giriş noktası
// Firebase auth durumuna göre yönlendirme yapar
// KRİTİK: onAuthStateChanged null gelince HİÇBİR ŞEY YAPMA
// 5 saniye timeout — çözümlenmezse login'e yönlendir
// _layout.tsx'deki auth dinleyicisi ile birlikte çalışır

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../src/services/firebase';
import { useAuthStore } from '../src/stores/authStore';
import { getUser } from '../src/services/userService';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const router = useRouter();
  const resolved = useRef(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      // KRİTİK: resolved true ise tekrar çalışma
      if (resolved.current) return;

      if (firebaseUser) {
        resolved.current = true;
        const user = await getUser(firebaseUser.uid);
        if (user) {
          // Store'u güncelle
          useAuthStore.setState({
            firebaseUser,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          // Role göre yönlendir
          if (user.role === 'customer') {
            router.replace('/(customer)');
          } else if (user.role === 'hairdresser') {
            router.replace('/(hairdresser)');
          }
        } else {
          // Firestore'da kullanıcı yok — login'e gönder
          router.replace('/(auth)/login');
        }
      }
      // KRİTİK: null gelince HİÇBİR ŞEY YAPMA
    });

    // 5 saniye içinde çözümlenmezse login'e yönlendir
    const timeout = setTimeout(() => {
      if (!resolved.current) {
        resolved.current = true;
        router.replace('/(auth)/login');
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Yönlendirme beklenirken loading göster
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}