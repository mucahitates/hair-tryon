// Login ekranı — Glassmorphism tasarım
// Gradient arka plan + yarı saydam kartlar
// Input focus gold border animasyonu
// Giriş başarılıysa fade-out geçiş

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
import { useAuthStore } from '../../src/stores/authStore';
import { getUser } from '../../src/services/userService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const emailBorder = useRef(new Animated.Value(0)).current;
  const passwordBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const animateBorder = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getBorderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.2)', '#D4A017'],
    });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre gerekli');
      return;
    }
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = await getUser(credential.user.uid);
      if (user) {
        useAuthStore.setState({
          firebaseUser: credential.user,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }).start(() => {
          if (user.role === 'customer') router.replace('/(customer)');
          else if (user.role === 'hairdresser') router.replace('/(hairdresser)');
        });
      } else {
        Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı');
      }
    } catch (error: any) {
      Alert.alert('Hata', 'Email veya şifre hatalı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      {/* Gradient arka plan */}
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dekoratif renkli daireler */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>

          {/* Logo */}
          <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={[COLORS.primaryDark, COLORS.primary]}
              style={styles.iconContainer}
            >
              <Text style={styles.iconEmoji}>✂️</Text>
            </LinearGradient>
            <Text style={styles.title}>Hair Tryon</Text>
            <Text style={styles.subtitle}>Hesabına giriş yap</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>

            <View style={styles.form}>
              {/* Email */}
              <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(emailBorder) }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => animateBorder(emailBorder, true)}
                  onBlur={() => animateBorder(emailBorder, false)}
                />
              </Animated.View>

              {/* Şifre */}
              <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(passwordBorder) }]}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Şifre"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="oneTimeCode"
                    onFocus={() => animateBorder(passwordBorder, true)}
                    onBlur={() => animateBorder(passwordBorder, false)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Şifremi unuttum */}
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotText}>Şifremi Unuttum</Text>
              </TouchableOpacity>

              {/* Giriş yap butonu */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.buttonWrapper}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Ayraç */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sosyal butonlar */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Bilgi', 'Google ile giriş yakında aktif edilecek')}
              >
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google ile Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Yakında', 'Yakında aktif olacak')}
              >
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  // Dekoratif daireler
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7C3AED',
    opacity: 0.25,
    top: -50,
    left: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#A78BFA',
    opacity: 0.15,
    top: height * 0.3,
    right: -60,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#6D28D9',
    opacity: 0.2,
    bottom: 80,
    left: -40,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: FONTS.xxlarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  eyeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  eyeText: {
    fontSize: 18,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.sm,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: FONTS.medium,
  },
  buttonWrapper: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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