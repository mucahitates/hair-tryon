// Şifremi unuttum ekranı
// Kullanıcı emailini girer, Firebase şifre sıfırlama maili gönderir
// login.tsx'den yönlendirilir

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../src/services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const emailBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateBorder = (focused: boolean) => {
    Animated.timing(emailBorder, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = emailBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Email adresi gerekli');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Hata', 'Geçerli bir email girin');
      return;
    }

    setIsLoading(true);
    try {
      // Firebase şifre sıfırlama maili gönder
      await sendPasswordResetEmail(auth, email.trim());
      setIsSent(true);
    } catch (error: any) {
      const message =
        error.code === 'auth/user-not-found' ? 'Bu email ile kayıtlı hesap bulunamadı' :
        error.code === 'auth/invalid-email' ? 'Geçersiz email adresi' :
        'Mail gönderilemedi, tekrar dene';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[COLORS.background, COLORS.elevatedCard, COLORS.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.inner, { transform: [{ translateY: slideAnim }] }]}>

          {/* Geri butonu */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Geri</Text>
          </TouchableOpacity>

          {/* Başlık */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>🔑</Text>
            </View>
            <Text style={styles.title}>Şifremi Unuttum</Text>
            <Text style={styles.subtitle}>
              {isSent
                ? 'Sıfırlama maili gönderildi!'
                : 'Email adresini gir, sıfırlama bağlantısı gönderelim'}
            </Text>
          </View>

          {isSent ? (
            // Mail gönderildi ekranı
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>✉️</Text>
              <Text style={styles.successText}>
                <Text style={styles.successEmail}>{email}</Text>
                {' '}adresine şifre sıfırlama bağlantısı gönderildi.
              </Text>
              <Text style={styles.successSubText}>
                Spam klasörünü de kontrol etmeyi unutma.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.buttonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Email giriş formu
            <View style={styles.form}>
              <Animated.View style={[styles.inputWrapper, { borderColor }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email adresin"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  onFocus={() => animateBorder(true)}
                  onBlur={() => animateBorder(false)}
                />
              </Animated.View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Sıfırlama Maili Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.xl,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: FONTS.xxlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.md,
  },
  inputWrapper: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.lg,
  },
  successEmoji: {
    fontSize: 64,
  },
  successText: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  successEmail: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  successSubText: {
    fontSize: FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});