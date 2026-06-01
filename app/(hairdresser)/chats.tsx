import { View, Text } from 'react-native';
import { COLORS } from '../../src/constants/theme';
export default function HairdresserChats() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.textPrimary }}>Sohbetler</Text>
    </View>
  );
}