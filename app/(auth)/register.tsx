// Kayıt ekranı — 2 adımlı form
// Adım 1: Ad soyad, email, şifre, şifre tekrar, telefon
// Adım 2: Rol seçimi (müşteri/kuaför) + şehir (modal) + kuaför ise salon adı
// Validasyonlar: email format, şifre eşleşme, telefon 11 hane
// Başarılı kayıt sonrası Firestore users + customerProfiles/hairdresserProfiles yazılır

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
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../src/services/firebase';
import { createUser } from '../../src/services/userService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { CITIES } from '../../src/constants/cities';
import { User, UserRole } from '../../src/types';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Adım 1 state'leri
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Adım 2 state'leri
  const [role, setRole] = useState<UserRole | null>(null);
  const [city, setCity] = useState('');
  const [salonName, setSalonName] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Hata mesajları
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;

  // Input border animasyonları
  const nameBorder = useRef(new Animated.Value(0)).current;
  const emailBorder = useRef(new Animated.Value(0)).current;
  const passwordBorder = useRef(new Animated.Value(0)).current;
  const confirmPasswordBorder = useRef(new Animated.Value(0)).current;
  const phoneBorder = useRef(new Animated.Value(0)).current;
  const salonBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ekran açılış animasyonu
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
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  // Input focus — gold border animasyonu
  const animateBorder = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Border rengi interpolasyonu
  const getBorderColor = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.border, '#D4A017'],
    });

  // Adım 1 validasyon ve geçiş
  const handleNextStep = () => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Ad soyad gerekli';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email gerekli';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Geçerli bir email girin (örn: ad@mail.com)';
    }

    if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler uyuşmuyor';
    }

    if (phone && phone.replace(/\D/g, '').length !== 11) {
      newErrors.phone = 'Telefon 11 haneli olmalı (örn: 05xxxxxxxxx)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Adımlar arası slide animasyonu
    Animated.sequence([
      Animated.timing(stepSlide, {
        toValue: -500,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(stepSlide, {
        toValue: 500,
        duration: 0,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setStep(2);
      Animated.timing(stepSlide, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  };

  // Adım 2 → Adım 1 geri
  const handleBack = () => {
    Animated.sequence([
      Animated.timing(stepSlide, {
        toValue: 500,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(stepSlide, {
        toValue: -500,
        duration: 0,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setStep(1);
      Animated.timing(stepSlide, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  };

  // Kayıt tamamla
  const handleRegister = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!role) {
      newErrors.role = 'Hesap türü seçimi gerekli';
    }
    if (!city) {
      newErrors.city = 'Şehir seçimi gerekli';
    }
    if (role === 'hairdresser' && !salonName.trim()) {
      newErrors.salonName = 'Salon adı gerekli';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Firebase Auth ile kullanıcı oluştur
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = credential.user.uid;

      // Firestore users koleksiyonuna yaz
      const newUser: User = {
        uid,
        email: email.trim(),
        displayName: displayName.trim(),
        phone: phone.trim(),
        role: role!,
        city: city,
        coinBalance: 0,
        isActive: true,
        isBlocked: false,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };

      await createUser(newUser);

      // Müşteri profili oluştur
      if (role === 'customer') {
        await setDoc(doc(db, 'customerProfiles', uid), {
          uid,
          totalJobs: 0,
          totalSpent: 0,
          cancelRate: 0,
        });
      }

      // Kuaför profili oluştur
      if (role === 'hairdresser') {
        await setDoc(doc(db, 'hairdresserProfiles', uid), {
          uid,
          salonName: salonName.trim(),
          city,
          phone: phone.trim(),
          followersCount: 0,
          portfolioCount: 0,
          averageRating: 0,
          totalJobs: 0,
          completionRate: 0,
        });
      }

      // Başarılı — ekran fade-out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();

    } catch (error: any) {
      const message =
        error.code === 'auth/email-already-in-use' ? 'Bu email zaten kullanımda' :
        error.code === 'auth/invalid-email' ? 'Geçersiz email' :
        error.code === 'auth/weak-password' ? 'Şifre çok zayıf' :
        'Kayıt yapılamadı';
      Alert.alert('Hata', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.header, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>✂️</Text>
            </View>
            <Text style={styles.title}>Hair Tryon</Text>
            <Text style={styles.subtitle}>Yeni hesap oluştur</Text>
          </Animated.View>

          {/* Adım göstergesi */}
          <Animated.View style={[styles.stepIndicator, { opacity: fadeAnim }]}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </Animated.View>

          {/* Form */}
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: stepSlide },
              ],
            }
          ]}>

            {step === 1 ? (
              // ─── ADIM 1 ───────────────────────────
              <View style={styles.form}>

                {/* Ad Soyad */}
                <View>
                  <Animated.View style={[
                    styles.inputWrapper,
                    { borderColor: getBorderColor(nameBorder) },
                    errors.displayName ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Ad Soyad"
                      placeholderTextColor={COLORS.textMuted}
                      value={displayName}
                      onChangeText={(t) => { setDisplayName(t); setErrors(e => ({ ...e, displayName: '' })); }}
                      onFocus={() => animateBorder(nameBorder, true)}
                      onBlur={() => animateBorder(nameBorder, false)}
                    />
                  </Animated.View>
                  {errors.displayName ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}
                </View>

                {/* Email */}
                <View>
                  <Animated.View style={[
                    styles.inputWrapper,
                    { borderColor: getBorderColor(emailBorder) },
                    errors.email ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.textMuted}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => animateBorder(emailBorder, true)}
                      onBlur={() => animateBorder(emailBorder, false)}
                    />
                  </Animated.View>
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Şifre */}
                <View>
                  <Animated.View style={[
                    styles.inputWrapper,
                    { borderColor: getBorderColor(passwordBorder) },
                    errors.password ? styles.inputError : null,
                  ]}>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Şifre (en az 6 karakter)"
                        placeholderTextColor={COLORS.textMuted}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
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
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                {/* Şifre Tekrar */}
                <View>
                  <Animated.View style={[
                    styles.inputWrapper,
                    { borderColor: getBorderColor(confirmPasswordBorder) },
                    errors.confirmPassword ? styles.inputError : null,
                  ]}>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Şifre Tekrar"
                        placeholderTextColor={COLORS.textMuted}
                        value={confirmPassword}
                        onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: '' })); }}
                        secureTextEntry={!showConfirmPassword}
                        textContentType="oneTimeCode"
                        onFocus={() => animateBorder(confirmPasswordBorder, true)}
                        onBlur={() => animateBorder(confirmPasswordBorder, false)}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                  {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                </View>

                {/* Telefon */}
                <View>
                  <Animated.View style={[
                    styles.inputWrapper,
                    { borderColor: getBorderColor(phoneBorder) },
                    errors.phone ? styles.inputError : null,
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Telefon: 05xxxxxxxxx (opsiyonel)"
                      placeholderTextColor={COLORS.textMuted}
                      value={phone}
                      onChangeText={(t) => {
                        const onlyNumbers = t.replace(/\D/g, '');
                        if (onlyNumbers.length <= 11) {
                          setPhone(onlyNumbers);
                          setErrors(e => ({ ...e, phone: '' }));
                        }
                      }}
                      keyboardType="phone-pad"
                      maxLength={11}
                      onFocus={() => animateBorder(phoneBorder, true)}
                      onBlur={() => animateBorder(phoneBorder, false)}
                    />
                  </Animated.View>
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>Devam Et →</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.loginText}>
                    Zaten hesabın var mı?{' '}
                    <Text style={styles.loginLink}>Giriş Yap</Text>
                  </Text>
                </TouchableOpacity>
              </View>

            ) : (
              // ─── ADIM 2 ───────────────────────────
              <View style={styles.form}>
                <Text style={styles.sectionTitle}>Hesap türünü seç</Text>

                {/* Rol seçimi */}
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleCard, role === 'customer' && styles.roleCardActive]}
                    onPress={() => { setRole('customer'); setErrors(e => ({ ...e, role: '' })); }}
                  >
                    <Text style={styles.roleEmoji}>👤</Text>
                    <Text style={[styles.roleTitle, role === 'customer' && styles.roleTitleActive]}>
                      Müşteri
                    </Text>
                    <Text style={styles.roleDesc}>Saç modeli dene, kuaför bul</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleCard, role === 'hairdresser' && styles.roleCardActive]}
                    onPress={() => { setRole('hairdresser'); setErrors(e => ({ ...e, role: '' })); }}
                  >
                    <Text style={styles.roleEmoji}>✂️</Text>
                    <Text style={[styles.roleTitle, role === 'hairdresser' && styles.roleTitleActive]}>
                      Kuaför
                    </Text>
                    <Text style={styles.roleDesc}>Müşteri bul, randevu al</Text>
                  </TouchableOpacity>
                </View>
                {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

                {/* Kuaför ise salon adı */}
                {role === 'hairdresser' && (
                  <View>
                    <Animated.View style={[
                      styles.inputWrapper,
                      { borderColor: getBorderColor(salonBorder) },
                      errors.salonName ? styles.inputError : null,
                    ]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Salon Adı"
                        placeholderTextColor={COLORS.textMuted}
                        value={salonName}
                        onChangeText={(t) => { setSalonName(t); setErrors(e => ({ ...e, salonName: '' })); }}
                        onFocus={() => animateBorder(salonBorder, true)}
                        onBlur={() => animateBorder(salonBorder, false)}
                      />
                    </Animated.View>
                    {errors.salonName ? <Text style={styles.errorText}>{errors.salonName}</Text> : null}
                  </View>
                )}

                {/* Şehir Seçimi */}
                <View>
                  <TouchableOpacity
                    style={[
                      styles.inputWrapper,
                      styles.citySelector,
                      errors.city ? styles.inputError : null,
                    ]}
                    onPress={() => setShowCityModal(true)}
                  >
                    <Text style={city ? styles.citySelectorText : styles.citySelectorPlaceholder}>
                      {city || 'Şehir Seç'}
                    </Text>
                    <Text style={styles.cityArrow}>▼</Text>
                  </TouchableOpacity>
                  {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Geri</Text>
                </TouchableOpacity>

              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Şehir Seçim Modalı */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
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
              data={CITIES.filter(c =>
                c.toLowerCase().includes(citySearch.toLowerCase())
              )}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, city === item && styles.cityItemActive]}
                  onPress={() => {
                    setCity(item);
                    setErrors(e => ({ ...e, city: '' }));
                    setShowCityModal(false);
                    setCitySearch('');
                  }}
                >
                  <Text style={[styles.cityItemText, city === item && styles.cityItemTextActive]}>
                    {item}
                  </Text>
                  {city === item && <Text style={styles.cityCheck}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
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
  header: {
    marginBottom: SPACING.lg,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  formContainer: {
    width: '100%',
  },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  eyeText: {
    fontSize: 18,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.small,
    marginTop: 4,
    marginLeft: SPACING.sm,
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
  backButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.regular,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.elevatedCard,
  },
  roleEmoji: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  roleTitleActive: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
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
    color: COLORS.textMuted,
    fontSize: FONTS.regular,
  },
  cityArrow: {
    color: COLORS.textMuted,
    fontSize: FONTS.small,
  },
  loginText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.medium,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '75%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderBottomColor: COLORS.border,
  },
  cityItemActive: {
    backgroundColor: COLORS.elevatedCard,
  },
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