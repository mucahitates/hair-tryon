// Keşfet ekranı — placeholder
// Kuaför arama ve harita görünümü burada olacak

import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Keşfet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.textPrimary, fontSize: FONTS.large },
});