// Müşteri ekranlarının layout dosyası
// (customer) klasöründeki tüm ekranları sarar
// Tab navigator burada tanımlanır — şimdilik boş

import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}