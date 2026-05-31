// Randevularım ekranı — placeholder
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📅 Randevularım</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.textPrimary, fontSize: FONTS.large },
});