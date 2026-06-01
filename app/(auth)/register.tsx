// Kayıt ekranı — 2 adımlı form
// Login ile aynı glassmorphism tasarım
// Adım 1: Ad soyad, email, şifre, şifre tekrar, telefon
// Adım 2: Rol seçimi (müşteri/kuaför) + şehir + salon adı

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
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../src/services/firebase';
import { createUser } from '../../src/services/userService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { CITIES } from '../../src/constants/cities';
import { User, UserRole } from '../../src/types';

const { height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Adım 1
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Adım 2
  const [role, setRole] = useState<UserRole | null>(null);
  const [city, setCity] = useState('');
  const [salonName, setSalonName] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;

  // Input border animasyonları
  const nameBorder = useRef(new Animated.Value(0)).current;
  const emailBorder = useRef(new Animated.Value(0)).current;
  const passwordBorder = useRef(new Animated.Value(0)).current;
  const confirmBorder = useRef(new Animated.Value(0)).current;
  const phoneBorder = useRef(new Animated.Value(0)).current;
  const salonBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  const animateBorder = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  };

  const getBorderColor = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.2)', '#D4A017'] });

  const handleNextStep = () => {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Ad soyad gerekli';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Geçerli bir email girin';
    if (password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalı';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Şifreler uyuşmuyor';
    if (phone && phone.replace(/\D/g, '').length !== 11) newErrors.phone = 'Telefon 11 haneli olmalı';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    Animated.sequence([
      Animated.timing(stepSlide, { toValue: -500, duration: 250, useNativeDriver: false }),
      Animated.timing(stepSlide, { toValue: 500, duration: 0, useNativeDriver: false }),
    ]).start(() => {
      setStep(2);
      Animated.timing(stepSlide, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
  };

  const handleBack = () => {
    Animated.sequence([
      Animated.timing(stepSlide, { toValue: 500, duration: 250, useNativeDriver: false }),
      Animated.timing(stepSlide, { toValue: -500, duration: 0, useNativeDriver: false }),
    ]).start(() => {
      setStep(1);
      Animated.timing(stepSlide, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
  };

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!role) newErrors.role = 'Hesap türü seçimi gerekli';
    if (!city) newErrors.city = 'Şehir seçimi gerekli';
    if (role === 'hairdresser' && !salonName.trim()) newErrors.salonName = 'Salon adı gerekli';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = credential.user.uid;
      const newUser: User = {
        uid, email: email.trim(), displayName: displayName.trim(),
        phone: phone.trim(), role: role!, city, coinBalance: 0,
        isActive: true, isBlocked: false, createdAt: Date.now(), lastActiveAt: Date.now(),
      };
      await createUser(newUser);
      if (role === 'customer') {
        await setDoc(doc(db, 'customerProfiles', uid), { uid, totalJobs: 0, totalSpent: 0, cancelRate: 0 });
      }
      if (role === 'hairdresser') {
        await setDoc(doc(db, 'hairdresserProfiles', uid), {
          uid, salonName: salonName.trim(), city, phone: phone.trim(),
          followersCount: 0, portfolioCount: 0, averageRating: 0, totalJobs: 0, completionRate: 0,
        });
      }
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    } catch (error: any) {
      const message =
        error.code === 'auth/email-already-in-use' ? 'Bu email zaten kullanımda' :
        error.code === 'auth/invalid-email' ? 'Geçersiz email' :
        error.code === 'auth/weak-password' ? 'Şifre çok zayıf' : 'Kayıt yapılamadı';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      {/* Login ile aynı gradient arka plan */}
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Login ile aynı dekoratif orb'lar */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo — login ile aynı */}
          <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>✂️</Text>
            </LinearGradient>
            <Text style={styles.title}>Hair Tryon</Text>
            <Text style={styles.subtitle}>Yeni hesap oluştur</Text>
          </Animated.View>

          {/* Adım göstergesi */}
          <Animated.View style={[styles.stepIndicator, { opacity: fadeAnim }]}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              {step > 1 && <Ionicons name="checkmark" size={10} color={COLORS.white} />}
            </View>
            <View style={[styles.stepLine, step > 1 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </Animated.View>

          {/* Form — login ile aynı animasyon yapısı */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: stepSlide }],
          }}>

            {step === 1 ? (
              // ─── ADIM 1 ───────────────────────────
              <View style={styles.form}>

                {/* Ad Soyad */}
                <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(nameBorder) }, errors.displayName ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={displayName}
                    onChangeText={(t) => { setDisplayName(t); setErrors(e => ({ ...e, displayName: '' })); }}
                    onFocus={() => animateBorder(nameBorder, true)}
                    onBlur={() => animateBorder(nameBorder, false)}
                  />
                </Animated.View>
                {errors.displayName ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}

                {/* Email */}
                <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(emailBorder) }, errors.email ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => animateBorder(emailBorder, true)}
                    onBlur={() => animateBorder(emailBorder, false)}
                  />
                </Animated.View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                {/* Şifre */}
                <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(passwordBorder) }, errors.password ? styles.inputError : null]}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Şifre (en az 6 karakter)"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={password}
                      onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
                      secureTextEntry={!showPassword}
                      textContentType="oneTimeCode"
                      onFocus={() => animateBorder(passwordBorder, true)}
                      onBlur={() => animateBorder(passwordBorder, false)}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                {/* Şifre Tekrar */}
                <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(confirmBorder) }, errors.confirmPassword ? styles.inputError : null]}>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Şifre Tekrar"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: '' })); }}
                      secureTextEntry={!showConfirmPassword}
                      textContentType="oneTimeCode"
                      onFocus={() => animateBorder(confirmBorder, true)}
                      onBlur={() => animateBorder(confirmBorder, false)}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

                {/* Telefon */}
                <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(phoneBorder) }, errors.phone ? styles.inputError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Telefon: 05xxxxxxxxx (opsiyonel)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={phone}
                    onChangeText={(t) => {
                      const n = t.replace(/\D/g, '');
                      if (n.length <= 11) { setPhone(n); setErrors(e => ({ ...e, phone: '' })); }
                    }}
                    keyboardType="phone-pad"
                    maxLength={11}
                    onFocus={() => animateBorder(phoneBorder, true)}
                    onBlur={() => animateBorder(phoneBorder, false)}
                  />
                </Animated.View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

                {/* Devam Et — login butonu ile aynı */}
                <TouchableOpacity onPress={handleNextStep} style={styles.buttonWrapper}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Devam Et →</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.registerText}>
                    Zaten hesabın var mı? <Text style={styles.registerLink}>Giriş Yap</Text>
                  </Text>
                </TouchableOpacity>
              </View>

            ) : (
              // ─── ADIM 2 ───────────────────────────
              <View style={styles.form}>
                <Text style={styles.sectionTitle}>Hesap Türünü Seç</Text>

                {/* Rol kartları */}
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleCard, role === 'customer' && styles.roleCardActive]}
                    onPress={() => { setRole('customer'); setErrors(e => ({ ...e, role: '' })); }}
                  >
                    <LinearGradient
                      colors={role === 'customer'
                        ? [COLORS.primary + '33', COLORS.primaryDark + '22']
                        : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']
                      }
                      style={styles.roleGradient}
                    >
                      <Text style={styles.roleEmoji}>👤</Text>
                      <Text style={[styles.roleTitle, role === 'customer' && styles.roleTitleActive]}>Müşteri</Text>
                      <Text style={styles.roleDesc}>Saç modeli dene, kuaför bul</Text>
                      {role === 'customer' && (
                        <View style={styles.roleCheck}>
                          <Ionicons name="checkmark" size={12} color={COLORS.white} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleCard, role === 'hairdresser' && styles.roleCardActive]}
                    onPress={() => { setRole('hairdresser'); setErrors(e => ({ ...e, role: '' })); }}
                  >
                    <LinearGradient
                      colors={role === 'hairdresser'
                        ? [COLORS.primary + '33', COLORS.primaryDark + '22']
                        : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']
                      }
                      style={styles.roleGradient}
                    >
                      <Text style={styles.roleEmoji}>✂️</Text>
                      <Text style={[styles.roleTitle, role === 'hairdresser' && styles.roleTitleActive]}>Kuaför</Text>
                      <Text style={styles.roleDesc}>Müşteri bul, randevu al</Text>
                      {role === 'hairdresser' && (
                        <View style={styles.roleCheck}>
                          <Ionicons name="checkmark" size={12} color={COLORS.white} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

                {/* Salon adı — sadece kuaför */}
                {role === 'hairdresser' && (
                  <>
                    <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(salonBorder) }, errors.salonName ? styles.inputError : null]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Salon Adı"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={salonName}
                        onChangeText={(t) => { setSalonName(t); setErrors(e => ({ ...e, salonName: '' })); }}
                        onFocus={() => animateBorder(salonBorder, true)}
                        onBlur={() => animateBorder(salonBorder, false)}
                      />
                    </Animated.View>
                    {errors.salonName ? <Text style={styles.errorText}>{errors.salonName}</Text> : null}
                  </>
                )}

                {/* Şehir seçimi */}
                <TouchableOpacity
                  style={[styles.inputWrapper, styles.citySelector, errors.city ? styles.inputError : null]}
                  onPress={() => setShowCityModal(true)}
                >
                  <Text style={city ? styles.citySelectorText : styles.citySelectorPlaceholder}>
                    {city || 'Şehir Seç'}
                  </Text>
                  <Text style={styles.cityArrow}>▼</Text>
                </TouchableOpacity>
                {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

                {/* Kayıt Ol */}
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={styles.buttonWrapper}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.buttonText}>Kayıt Ol</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Geri */}
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Geri</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Şehir Seçim Modalı */}
      <Modal visible={showCityModal} animationType="slide" transparent onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seç</Text>
              <TouchableOpacity onPress={() => { setShowCityModal(false); setCitySearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Şehir ara..."
                placeholderTextColor={COLORS.textMuted}
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
              />
            </View>
            <FlatList
              data={CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, city === item && styles.cityItemActive]}
                  onPress={() => { setCity(item); setErrors(e => ({ ...e, city: '' })); setShowCityModal(false); setCitySearch(''); }}
                >
                  <Text style={[styles.cityItemText, city === item && styles.cityItemTextActive]}>{item}</Text>
                  {city === item && <Text style={styles.cityCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  // Login ile aynı orb'lar
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
  // Logo — login ile aynı
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
  iconEmoji: { fontSize: 36 },
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
  // Adım göstergesi
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: SPACING.sm,
  },
  stepLineActive: { backgroundColor: COLORS.primary },
  // Form — login ile aynı
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  // Input — login ile birebir aynı
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
  inputError: { borderColor: COLORS.error },
  eyeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  eyeText: { fontSize: 18 },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.small,
    marginTop: 4,
    marginLeft: SPACING.sm,
  },
  // Buton — login ile aynı
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  // Kayıt ol linki — login ile aynı
  registerText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Rol kartları
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  roleCardActive: { borderColor: COLORS.primary },
  roleGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  roleEmoji: { fontSize: 36 },
  roleTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  roleTitleActive: { color: COLORS.primary },
  roleDesc: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Şehir seçimi
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  citySelectorText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  citySelectorPlaceholder: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: FONTS.regular,
  },
  cityArrow: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  // Modal — login tarzı koyu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1A0533',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONTS.large,
    color: COLORS.textMuted,
    padding: SPACING.sm,
  },
  searchWrapper: {
    margin: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
  },
  searchInput: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cityItemActive: { backgroundColor: 'rgba(167,139,250,0.12)' },
  cityItemText: {
    fontSize: FONTS.regular,
    color: COLORS.textPrimary,
  },
  cityItemTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  cityCheck: {
    color: COLORS.primary,
    fontSize: FONTS.regular,
    fontWeight: 'bold',
  },
});