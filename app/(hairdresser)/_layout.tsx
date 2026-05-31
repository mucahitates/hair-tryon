// Kuaför ekranlarının layout dosyası
// (hairdresser) klasöründeki tüm ekranları sarar

import { Stack } from 'expo-router';

export default function HairdresserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}