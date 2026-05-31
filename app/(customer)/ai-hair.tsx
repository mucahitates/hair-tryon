// AI Saç Deneme ekranı — placeholder
// fal.ai entegrasyonu burada olacak

import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function AIHairScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Saç</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.textPrimary, fontSize: FONTS.large },
});