// Login ekranı
// - expo-linear-gradient ile animasyonlu arkaplan
// - Input focus olunca border rengi değişir
// - Giriş başarılıysa fade-out geçiş animasyonu
// - Logo spring animasyonu, form slide+fade animasyonu

import { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../src/services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Gradient animasyonu için renk pozisyonu
  const gradientAnim = useRef(new Animated.Value(0)).current;

  // Input focus animasyonları
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ekran açılınca sıralı animasyon
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
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
      ]),
    ]).start();

    // Arkaplan gradient sürekli döngü animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Email input focus animasyonu
  const handleEmailFocus = () => {
    setEmailFocused(true);
    Animated.timing(emailBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    Animated.timing(emailBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Password input focus animasyonu
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    Animated.timing(passwordBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    Animated.timing(passwordBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Input border rengi interpolasyonu
  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  // Gradient renk interpolasyonu
  const gradientColor = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.background, COLORS.elevatedCard],
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre gerekli');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Başarılı giriş — ekran fade-out animasyonu
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      const message =
        error.code === 'auth/user-not-found' ? 'Kullanıcı bulunamadı' :
          error.code === 'auth/wrong-password' ? 'Şifre hatalı' :
            error.code === 'auth/invalid-email' ? 'Geçersiz email' :
              error.code === 'auth/invalid-credential' ? 'Email veya şifre hatalı' :
                'Giriş yapılamadı';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    Alert.alert('Bilgi', 'Google ile giriş yakında aktif edilecek');
  };

  const handleGithub = () => {
    Alert.alert('Yakında', 'Yakında aktif olacak');
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      {/* Animasyonlu arkaplan gradient */}
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
        <View style={styles.inner}>

          {/* Logo animasyonu */}
          <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>✂️</Text>
            </View>
            <Text style={styles.title}>Hair Tryon</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
          </Animated.View>

          {/* Form animasyonu */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>

            <View style={styles.form}>
              {/* Email input — focus animasyonlu border */}
              <Animated.View style={[styles.inputWrapper, { borderColor: emailBorderColor }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={handleEmailFocus}
                  onBlur={handleEmailBlur}
                />
              </Animated.View>

              {/* Şifre input — focus animasyonlu border */}
              <Animated.View style={[styles.inputWrapper, { borderColor: passwordBorderColor }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                />
              </Animated.View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Giriş Yap</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Ayraç */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sosyal giriş butonları */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogle}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google ile Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={handleGithub}>
                <Text style={styles.socialIcon}>⌥</Text>
                <Text style={styles.socialText}>Github ile Giriş Yap</Text>
              </TouchableOpacity>
            </View>

            {/* Kayıt ol */}
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerText}>
                Hesabın yok mu?{' '}
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
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
  },
  form: {
    marginBottom: SPACING.lg,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
    fontSize: FONTS.small,
  },
  socialButtons: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  socialIcon: {
    fontSize: FONTS.large,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
  socialText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  registerText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});