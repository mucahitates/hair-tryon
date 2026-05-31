// Auth ekranlarının layout dosyası
// (auth) klasöründeki tüm ekranları sarar
// login ve register ekranları bu layout altında çalışır

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}