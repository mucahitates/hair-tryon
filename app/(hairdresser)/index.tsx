// app/(hairdresser)/index.tsx — geçici placeholder
import { View, Text } from 'react-native';
import { COLORS } from '../../src/constants/theme';

export default function HairdresserDashboard() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: 20 }}>Kuaför Paneli 🚀</Text>
      <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Yakında...</Text>
    </View>
  );
}