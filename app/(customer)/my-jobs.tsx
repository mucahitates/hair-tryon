// İşlerim ekranı — placeholder
// Aktif ilanlar ve teklifler burada olacak

import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function MyJobsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>İşlerim</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.textPrimary, fontSize: FONTS.large },
});