import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../src/services/firebase';
import { useAuthStore } from '../src/stores/authStore';
import { getUser } from '../src/services/userService';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const router = useRouter();
  const resolved = useRef(false);

  useEffect(() => {
    console.log('index.tsx useEffect başladı');
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('onAuthStateChanged tetiklendi:', firebaseUser?.uid ?? 'null');

      if (resolved.current) return;

      if (firebaseUser) {
        resolved.current = true;
        console.log('Kullanıcı var, Firestore\'dan çekiliyor...');
        const user = await getUser(firebaseUser.uid);
        console.log('Firestore kullanıcı:', user?.role ?? 'bulunamadı');

        if (user) {
          useAuthStore.setState({
            firebaseUser,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          if (user.role === 'customer') {
            console.log('customer\'a yönlendiriliyor');
            router.replace('/(customer)');
          } else if (user.role === 'hairdresser') {
            console.log('hairdresser\'a yönlendiriliyor');
            router.replace('/(hairdresser)');
          }
        } else {
          router.replace('/(auth)/login');
        }
      } else {
        // null gelince direkt login'e yönlendir
        resolved.current = true;
        router.replace('/(auth)/login');
      }
    });

    const timeout = setTimeout(() => {
      if (!resolved.current) {
        resolved.current = true;
        console.log('Timeout! login\'e yönlendiriliyor');
        router.replace('/(auth)/login');
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ color: COLORS.textPrimary, marginTop: 16 }}>Yükleniyor...</Text>
    </View>
  );
}