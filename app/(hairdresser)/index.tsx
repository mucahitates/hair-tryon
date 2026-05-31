// Kuaför ana ekranı — şimdilik placeholder
// Login sonrası buraya yönlendirilir

import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function HairdresserHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Kuaför Ana Ekranı</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: FONTS.large,
  },
});