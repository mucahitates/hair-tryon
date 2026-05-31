// Müşteri profil ekranı — geçici
// Çıkış yapma butonu ile test amaçlı

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  role: {
    color: COLORS.primary,
    fontSize: FONTS.medium,
  },
  button: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
});