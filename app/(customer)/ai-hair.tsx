// ─────────────────────────────────────────────────────────────
// AI SAÇ DENEME EKRANI (app/(customer)/ai-hair.tsx)
// ─────────────────────────────────────────────────────────────
// 6 adımlı saç değiştirme akışı:
// Adım 1: Fotoğraf yükle (galeri veya kamera)
// Adım 2: Cinsiyet seç (kadın/erkek)
// Adım 3: Saç modeli seç (grid görünüm)
// Adım 4: Renk seç (24 renk paleti)
// Adım 5: İşleniyor (fal.ai API çağrısı)
// Adım 6: Sonuç (öncesi/sonrası + iş ilanına dönüştür + favoriye ekle)
//
// BAĞLANTILAR:
// - expo-image-picker → fotoğraf seçimi
// - expo-camera → kamera erişimi
// - fal.ai → AI saç değiştirme (EXPO_PUBLIC_FAL_API_KEY)
// - authStore → kullanıcı bilgisi
// - Firestore: hairTryOns koleksiyonu → sonuçlar kaydedilecek (şimdilik stub)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,

} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { changeHairStyle } from '../../src/services/falService';

const { width, height } = Dimensions.get('window');

// ─── SAÇ MODELLERİ ─────────────────────────────────────────
// Firestore veya statik liste olarak tutulabilir
// fal.ai modeline gönderilecek stil adı — style alanı API'ye gider
const HAIR_STYLES_FEMALE = [
  { id: 'f1', name: 'Dalgalı Bob', emoji: '🌊', style: 'wavy bob' },
  { id: 'f2', name: 'Uzun Düz', emoji: '📏', style: 'long straight' },
  { id: 'f3', name: 'Kıvırcık', emoji: '🌀', style: 'curly' },
  { id: 'f4', name: 'Pixie Cut', emoji: '✂️', style: 'pixie cut' },
  { id: 'f5', name: 'Balayage Bob', emoji: '🌟', style: 'balayage bob' },
  { id: 'f6', name: 'Beach Waves', emoji: '🏄', style: 'beach waves' },
  { id: 'f7', name: 'Butterfly Cut', emoji: '🦋', style: 'butterfly cut' },
  { id: 'f8', name: 'Wolf Cut', emoji: '🐺', style: 'wolf cut' },
  { id: 'f9', name: 'Curtain Bangs', emoji: '🎭', style: 'curtain bangs' },
  { id: 'f10', name: 'Lob', emoji: '💫', style: 'lob' },
  { id: 'f11', name: 'Bixie', emoji: '⚡', style: 'bixie' },
  { id: 'f12', name: 'Shag', emoji: '🎸', style: 'shag' },
];

const HAIR_STYLES_MALE = [
  { id: 'm1', name: 'Undercut', emoji: '⚡', style: 'undercut' },
  { id: 'm2', name: 'Fade', emoji: '✂️', style: 'fade' },
  { id: 'm3', name: 'Pompadour', emoji: '👑', style: 'pompadour' },
  { id: 'm4', name: 'Buzz Cut', emoji: '🔲', style: 'buzz cut' },
  { id: 'm5', name: 'Quiff', emoji: '🌊', style: 'quiff' },
  { id: 'm6', name: 'Slick Back', emoji: '💎', style: 'slick back' },
  { id: 'm7', name: 'Textured Crop', emoji: '🎯', style: 'textured crop' },
  { id: 'm8', name: 'Side Part', emoji: '📐', style: 'side part' },
];

// ─── RENK PALETİ ───────────────────────────────────────────
// color alanı fal.ai API'ye gönderilir
const HAIR_COLORS = [
  { id: 'c1', name: 'Doğal Siyah', color: '#1a1a1a', apiColor: 'natural black' },
  { id: 'c2', name: 'Koyu Kahve', color: '#3d2b1f', apiColor: 'dark brown' },
  { id: 'c3', name: 'Orta Kahve', color: '#6b4423', apiColor: 'medium brown' },
  { id: 'c4', name: 'Açık Kahve', color: '#a0522d', apiColor: 'light brown' },
  { id: 'c5', name: 'Karamel', color: '#c68642', apiColor: 'caramel' },
  { id: 'c6', name: 'Altın Sarı', color: '#f4c430', apiColor: 'golden blonde' },
  { id: 'c7', name: 'Platin', color: '#e8e0d0', apiColor: 'platinum blonde' },
  { id: 'c8', name: 'Kül Sarı', color: '#c4b99a', apiColor: 'ash blonde' },
  { id: 'c9', name: 'Kızıl', color: '#8b2500', apiColor: 'auburn red' },
  { id: 'c10', name: 'Bakır', color: '#b87333', apiColor: 'copper' },
  { id: 'c11', name: 'Çilek Sarısı', color: '#e8b4b8', apiColor: 'strawberry blonde' },
  { id: 'c12', name: 'Gül Altın', color: '#e8b4a0', apiColor: 'rose gold' },
  { id: 'c13', name: 'Mor', color: '#6b2d8b', apiColor: 'purple' },
  { id: 'c14', name: 'Leylak', color: '#c4a0d8', apiColor: 'lavender' },
  { id: 'c15', name: 'Mavi', color: '#1e4d8c', apiColor: 'blue' },
  { id: 'c16', name: 'Turkuaz', color: '#00a896', apiColor: 'teal' },
  { id: 'c17', name: 'Pembe', color: '#ff69b4', apiColor: 'pink' },
  { id: 'c18', name: 'Kırmızı', color: '#cc0000', apiColor: 'red' },
  { id: 'c19', name: 'Turuncu', color: '#ff6600', apiColor: 'orange' },
  { id: 'c20', name: 'Zeytin', color: '#556b2f', apiColor: 'olive' },
  { id: 'c21', name: 'Gri', color: '#808080', apiColor: 'grey' },
  { id: 'c22', name: 'Beyaz', color: '#f5f5f5', apiColor: 'white' },
  { id: 'c23', name: 'Siyah Mavi', color: '#0a0a2e', apiColor: 'blue black' },
  { id: 'c24', name: 'Balayage', color: '#c68642', apiColor: 'balayage' },
];

// ─── ADIM GÖSTERGESİ ───────────────────────────────────────
// Üstte hangi adımda olduğunu gösterir
// currentStep: 1-6 arası
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={stepStyles.stepRow}>
          <Animated.View
            style={[
              stepStyles.dot,
              i + 1 === currentStep && stepStyles.dotActive,
              i + 1 < currentStep && stepStyles.dotDone,
            ]}
          >
            {i + 1 < currentStep && (
              <Ionicons name="checkmark" size={10} color={COLORS.white} />
            )}
          </Animated.View>
          {i < totalSteps - 1 && (
            <View style={[stepStyles.line, i + 1 < currentStep && stepStyles.lineDone]} />
          )}
        </View>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  dotDone: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  line: {
    width: 32,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  lineDone: {
    backgroundColor: COLORS.primaryDark,
  },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function AIHairScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Akış state'leri
  const [step, setStep] = useState(1);                    // Mevcut adım (1-6)
  const [photo, setPhoto] = useState<string | null>(null); // Seçilen fotoğraf URI
  const [gender, setGender] = useState<'female' | 'male' | null>(null); // Cinsiyet
  const [selectedStyle, setSelectedStyle] = useState<typeof HAIR_STYLES_FEMALE[0] | null>(null); // Seçilen model
  const [selectedColor, setSelectedColor] = useState<typeof HAIR_COLORS[0] | null>(null); // Seçilen renk
  const [resultImage, setResultImage] = useState<string | null>(null); // fal.ai sonuç görseli
  const [isProcessing, setIsProcessing] = useState(false); // API işleniyor mu
  const [isFavorited, setIsFavorited] = useState(false); // Favoriye eklendi mi

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const processingAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Genişletilmiş görsel için state
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Adım değişince geçiş animasyonu
  const animateStep = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: false }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start();
    });
  };

  // İşleniyor animasyonu — dönen çemberler
  useEffect(() => {
    if (step === 5) {
      Animated.loop(
        Animated.timing(processingAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        })
      ).start();
      // fal.ai API çağrısı başlat
      handleProcessing();
    }
  }, [step]);

  // Sonuç gelince fade-in animasyonu
  useEffect(() => {
    if (step === 6) {
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  // ── ADIM 1: FOTOĞRAF SEÇ ──────────────────────────────────
  // Galeriden fotoğraf seçmek için expo-image-picker kullanır
  // İzin yoksa uyarı gösterir
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        animateStep(2);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    }
  };

  // Kameradan fotoğraf çekmek için expo-image-picker kullanır
  const handlePickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        animateStep(2);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf çekilemedi.');
    }
  };

  // ── ADIM 5: FAL.AI API ÇAĞRISI ───────────────────────────
  // fal.ai hair-change modeline istek gönderir
  // API key: EXPO_PUBLIC_FAL_API_KEY (.env dosyasından)
  // Başarılı olursa step 6'ya geçer, hata olursa alert gösterir
  const handleProcessing = async () => {
    setIsProcessing(true);
    try {
      const result = await changeHairStyle(
        {
          photoUri: photo!,
          modelPrompt: selectedStyle?.style || '',
          colorPrompt: selectedColor?.apiColor || '',
          colorName: selectedColor?.name || '',
          modelName: selectedStyle?.name || '',
        },
        (status) => console.log('FAL Progress:', status)
      );

      setResultImage(result.generatedImageUrl);
      setIsProcessing(false);
      animateStep(6);

    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Hata', error.message || 'İşlem sırasında hata oluştu.');
      animateStep(4);
    }
  };

  // ── FAVORİYE EKLE ────────────────────────────────────────
  // Firestore: hairTryOns koleksiyonuna kaydeder
  // Şimdilik sadece local state değişiyor
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Firestore'a kaydet
    // await addDoc(collection(db, 'hairTryOns'), { userId, photo, resultImage, style, color, createdAt })
  };

  // ── İŞ İLANINA DÖNÜŞTÜR ──────────────────────────────────
  // AI sonucunu iş ilanı oluşturma ekranına taşır
  // İşlerim ekranına navigate eder, result parametresi ile
  const handleCreateJob = () => {
    // TODO: router.push ile işlerim ekranına git, AI sonucunu parametre olarak geçir
    Alert.alert('Bilgi', 'İş ilanı oluşturma yakında aktif olacak!');
  };

  // ── GERİ GİT ─────────────────────────────────────────────
  const handleBack = () => {
    if (step > 1) {
      animateStep(step - 1);
    }
  };

  // ── SIFIRLA ──────────────────────────────────────────────
  // Tüm state'i sıfırlayıp adım 1'e döner
  const handleReset = () => {
    setPhoto(null);
    setGender(null);
    setSelectedStyle(null);
    setSelectedColor(null);
    setResultImage(null);
    setIsFavorited(false);
    animateStep(1);
  };

  // Adım başlıkları
  const stepTitles = [
    'Fotoğrafını Yükle',
    'Cinsiyet Seç',
    'Saç Modeli Seç',
    'Renk Seç',
    'İşleniyor...',
    'Sonuç',
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* ── ÜST BAR ── */}
      <View style={styles.header}>
        {/* Geri butonu — adım 1'de tab bar'a döner, diğerlerinde önceki adıma */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={step === 1 ? () => router.back() : handleBack}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Saç Deneme</Text>
          <Text style={styles.headerSubtitle}>{stepTitles[step - 1]}</Text>
        </View>

        {/* Sıfırla butonu — adım 1 hariç görünür */}
        {step > 1 && step < 5 && (
          <TouchableOpacity style={styles.headerBtn} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        {(step === 1 || step >= 5) && <View style={styles.headerBtn} />}
      </View>

      {/* Adım göstergesi — adım 5 ve 6'da gizlenir */}
      {step < 5 && (
        <StepIndicator currentStep={step} totalSteps={4} />
      )}

      {/* ── ADIM İÇERİĞİ ── */}
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}>

        {/* ══ ADIM 1: FOTOĞRAF YÜKLE ══ */}
        {step === 1 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepDescription}>
              En iyi sonuç için yüzün net göründüğü, düz arka planlı bir fotoğraf seç.
            </Text>

            {/* Galeri butonu */}
            <TouchableOpacity style={styles.photoOptionCard} onPress={handlePickFromGallery}>
              <LinearGradient
                colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                style={styles.photoOptionGradient}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="images-outline" size={36} color={COLORS.primary} />
                </View>
                <View style={styles.photoOptionInfo}>
                  <Text style={styles.photoOptionTitle}>Galeriden Seç</Text>
                  <Text style={styles.photoOptionDesc}>Mevcut fotoğraflarından birini seç</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Kamera butonu */}
            <TouchableOpacity style={styles.photoOptionCard} onPress={handlePickFromCamera}>
              <LinearGradient
                colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                style={styles.photoOptionGradient}
              >
                <View style={styles.photoOptionIcon}>
                  <Ionicons name="camera-outline" size={36} color={COLORS.primary} />
                </View>
                <View style={styles.photoOptionInfo}>
                  <Text style={styles.photoOptionTitle}>Kamerayla Çek</Text>
                  <Text style={styles.photoOptionDesc}>Şu an fotoğraf çek</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* İpuçları */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>📸 İpuçları</Text>
              {[
                'Yüzün net ve ortada olsun',
                'İyi aydınlatılmış bir ortamda çek',
                'Saçların görünür olsun',
                'Gözlük veya şapka olmasın',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ══ ADIM 2: CİNSİYET SEÇ ══ */}
        {step === 2 && (
          <View style={styles.stepContent}>
            {/* Seçilen fotoğraf önizleme */}
            {photo && (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            )}

            <Text style={styles.stepDescription}>
              Saç modelleri cinsiyete göre değişir. Devam etmek için seç.
            </Text>

            <View style={styles.genderRow}>
              {/* Kadın butonu */}
              <TouchableOpacity
                style={[styles.genderCard, gender === 'female' && styles.genderCardActive]}
                onPress={() => { setGender('female'); animateStep(3); }}
              >
                <LinearGradient
                  colors={gender === 'female'
                    ? [COLORS.primary + '44', COLORS.primaryDark + '33']
                    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                  }
                  style={styles.genderGradient}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[styles.genderLabel, gender === 'female' && styles.genderLabelActive]}>
                    Kadın
                  </Text>
                  <Text style={styles.genderCount}>40 model</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Erkek butonu */}
              <TouchableOpacity
                style={[styles.genderCard, gender === 'male' && styles.genderCardActive]}
                onPress={() => { setGender('male'); animateStep(3); }}
              >
                <LinearGradient
                  colors={gender === 'male'
                    ? [COLORS.primary + '44', COLORS.primaryDark + '33']
                    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                  }
                  style={styles.genderGradient}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[styles.genderLabel, gender === 'male' && styles.genderLabelActive]}>
                    Erkek
                  </Text>
                  <Text style={styles.genderCount}>20 model</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══ ADIM 3: SAÇ MODELİ SEÇ ══ */}
        {step === 3 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Denemek istediğin saç modelini seç.
            </Text>

            {/* Saç modeli grid — cinsiyete göre liste değişir */}
            <View style={styles.styleGrid}>
              {(gender === 'female' ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE).map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.styleCard, selectedStyle?.id === style.id && styles.styleCardActive]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <LinearGradient
                    colors={selectedStyle?.id === style.id
                      ? [COLORS.primary + '44', COLORS.primaryDark + '33']
                      : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']
                    }
                    style={styles.styleCardGradient}
                  >
                    <Text style={styles.styleEmoji}>{style.emoji}</Text>
                    <Text style={[styles.styleName, selectedStyle?.id === style.id && styles.styleNameActive]}>
                      {style.name}
                    </Text>
                    {/* Seçili ise checkmark */}
                    {selectedStyle?.id === style.id && (
                      <View style={styles.styleCheck}>
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Devam butonu — model seçilmeden aktif olmaz */}
            <TouchableOpacity
              style={[styles.nextBtn, !selectedStyle && styles.nextBtnDisabled]}
              onPress={() => selectedStyle && animateStep(4)}
              disabled={!selectedStyle}
            >
              <LinearGradient
                colors={selectedStyle ? [COLORS.primary, COLORS.primaryDark] : ['#444', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>Devam Et</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ══ ADIM 4: RENK SEÇ ══ */}
        {step === 4 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Saçın için bir renk seç.
            </Text>

            {/* Renk paleti grid — 4 sütun */}
            <View style={styles.colorGrid}>
              {HAIR_COLORS.map((colorItem) => (
                <TouchableOpacity
                  key={colorItem.id}
                  style={[
                    styles.colorCard,
                    selectedColor?.id === colorItem.id && styles.colorCardActive,
                  ]}
                  onPress={() => setSelectedColor(colorItem)}
                >
                  {/* Renk dairesi */}
                  <View style={[styles.colorCircle, { backgroundColor: colorItem.color }]}>
                    {selectedColor?.id === colorItem.id && (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    )}
                  </View>
                  <Text style={[styles.colorName, selectedColor?.id === colorItem.id && styles.colorNameActive]}>
                    {colorItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Devam butonu — renk seçilmeden aktif olmaz */}
            <TouchableOpacity
              style={[styles.nextBtn, !selectedColor && styles.nextBtnDisabled]}
              onPress={() => selectedColor && animateStep(5)}
              disabled={!selectedColor}
            >
              <LinearGradient
                colors={selectedColor ? [COLORS.primary, COLORS.primaryDark] : ['#444', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>AI ile İşle</Text>
                <Ionicons name="sparkles" size={18} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ══ ADIM 5: İŞLENİYOR ══ */}
        {step === 5 && (
          <View style={styles.processingContainer}>
            {/* Dönen animasyon */}
            <View style={styles.processingCircles}>
              <Animated.View style={[
                styles.processingCircle1,
                {
                  transform: [{
                    rotate: processingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]} />
              <Animated.View style={[
                styles.processingCircle2,
                {
                  transform: [{
                    rotate: processingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['360deg', '0deg'],
                    })
                  }]
                }
              ]} />
              <View style={styles.processingCenter}>
                <Text style={styles.processingEmoji}>✨</Text>
              </View>
            </View>

            <Text style={styles.processingTitle}>AI işliyor...</Text>
            <Text style={styles.processingDesc}>
              Saç modelini fotoğrafına uygulamak{'\n'}birkaç saniye sürebilir.
            </Text>

            {/* Seçilen stil ve renk özeti */}
            <View style={styles.processingInfo}>
              <View style={styles.processingInfoItem}>
                <Text style={styles.processingInfoLabel}>Model</Text>
                <Text style={styles.processingInfoValue}>{selectedStyle?.name}</Text>
              </View>
              <View style={styles.processingInfoDivider} />
              <View style={styles.processingInfoItem}>
                <Text style={styles.processingInfoLabel}>Renk</Text>
                <View style={styles.processingColorRow}>
                  <View style={[styles.processingColorDot, { backgroundColor: selectedColor?.color }]} />
                  <Text style={styles.processingInfoValue}>{selectedColor?.name}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ══ ADIM 6: SONUÇ ══ */}
        {step === 6 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
            <Animated.View style={{ opacity: resultAnim, transform: [{ scale: resultAnim }] }}>

              {/* Öncesi / Sonrası karşılaştırma */}
              <View style={styles.comparisonRow}>
                {/* Öncesi */}
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonLabel}>Öncesi</Text>
                  {photo ? (
                    <TouchableOpacity onPress={() => setExpandedImage(photo)}>
                      <Image source={{ uri: photo }} style={styles.comparisonImage} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.comparisonImage, styles.comparisonPlaceholder]}>
                      <Ionicons name="person-outline" size={40} color={COLORS.textMuted} />
                    </View>
                  )}
                </View>

                {/* Ok */}
                <View style={styles.comparisonArrow}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.comparisonArrowBg}
                  >
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </LinearGradient>
                </View>

                {/* Sonrası */}
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonLabel}>Sonrası</Text>
                  {resultImage ? (
                    <TouchableOpacity onPress={() => setExpandedImage(resultImage)}>
                      <Image source={{ uri: resultImage }} style={styles.comparisonImage} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.comparisonImage, styles.comparisonPlaceholder]}>
                      <Ionicons name="sparkles-outline" size={40} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              </View>

              {/* Seçilen stil + renk özeti */}
              <View style={styles.resultSummary}>
                <View style={styles.resultSummaryItem}>
                  <Ionicons name="cut-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.resultSummaryText}>{selectedStyle?.name}</Text>
                </View>
                <View style={styles.resultSummaryDivider} />
                <View style={styles.resultSummaryItem}>
                  <View style={[styles.resultColorDot, { backgroundColor: selectedColor?.color }]} />
                  <Text style={styles.resultSummaryText}>{selectedColor?.name}</Text>
                </View>
              </View>

              {/* Aksiyon butonları */}
              <View style={styles.resultActions}>

                {/* Favoriye ekle butonu */}
                {/* Tıklayınca Firestore hairTryOns'a kaydeder */}
                <TouchableOpacity
                  style={[styles.resultActionBtn, isFavorited && styles.resultActionBtnActive]}
                  onPress={handleFavorite}
                >
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? COLORS.error : COLORS.textPrimary}
                  />
                  <Text style={[styles.resultActionText, isFavorited && { color: COLORS.error }]}>
                    {isFavorited ? 'Favorilendi' : 'Favoriye Ekle'}
                  </Text>
                </TouchableOpacity>

                {/* İş ilanına dönüştür butonu */}
                {/* Tıklayınca işlerim ekranına gider, AI sonucunu parametre olarak taşır */}
                <TouchableOpacity style={styles.createJobBtn} onPress={handleCreateJob}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createJobGradient}
                  >
                    <Ionicons name="briefcase-outline" size={18} color={COLORS.white} />
                    <Text style={styles.createJobText}>İş İlanı Oluştur</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Tekrar dene butonu — adım 1'e döner */}
                <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
                  <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>

              </View>
            </Animated.View>
          </ScrollView>
        )}

      </Animated.View>
      {/* Fotoğraf büyütme modalı */}
      <Modal
        visible={expandedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <TouchableOpacity
          style={styles.expandedOverlay}
          activeOpacity={1}
          onPress={() => setExpandedImage(null)}
        >
          {expandedImage && (
            <Image
              source={{ uri: expandedImage }}
              style={styles.expandedImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7C3AED',
    opacity: 0.15,
    top: -100,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#A78BFA',
    opacity: 0.08,
    bottom: 200,
    left: -60,
  },
  // Üst bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // İçerik alanı — animasyonlu
  content: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
    gap: SPACING.md,
  },
  stepDescription: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },

  // ── ADIM 1: FOTOĞRAF ──
  photoOptionCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  photoOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOptionInfo: {
    flex: 1,
  },
  photoOptionTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  photoOptionDesc: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  // İpuçları kartı
  tipsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tipsTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  tipText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },

  // ── ADIM 2: CİNSİYET ──
  photoPreview: {
    width: 120,
    height: 160,
    borderRadius: RADIUS.lg,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  genderCardActive: {
    borderColor: COLORS.primary,
  },
  genderGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  genderEmoji: {
    fontSize: 48,
  },
  genderLabel: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  genderLabelActive: {
    color: COLORS.primary,
  },
  genderCount: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
  },

  // ── ADIM 3: SAÇ MODELİ ──
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  styleCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  styleCardActive: {
    borderColor: COLORS.primary,
  },
  styleCardGradient: {
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 80,
    justifyContent: 'center',
  },
  styleEmoji: {
    fontSize: 24,
  },
  styleName: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  styleNameActive: {
    color: COLORS.primary,
  },
  styleCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── ADIM 4: RENK ──
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm * 5) / 6,
    alignItems: 'center',
    gap: 4,
  },
  colorCardActive: {},
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorName: {
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  colorNameActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Devam butonu
  nextBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  nextBtnText: {
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // ── ADIM 5: İŞLENİYOR ──
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  processingCircles: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  processingCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  processingCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingEmoji: {
    fontSize: 28,
  },
  processingTitle: {
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  processingDesc: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  processingInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    width: '100%',
  },
  processingInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  processingInfoLabel: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
  },
  processingInfoValue: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  processingInfoDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  processingColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  processingColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // ── ADIM 6: SONUÇ ──
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  comparisonCard: {
    flex: 1,
    gap: 20,
    
  },
  comparisonLabel: {
    fontSize: 25,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '800',
    bottom: -5,
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  comparisonPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonArrow: {
    alignItems: 'center',
  },
  comparisonArrowBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  resultSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  resultSummaryText: {
    fontSize: FONTS.small,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  resultSummaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  resultColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resultActions: {
    gap: SPACING.lg,
  },
  // Favoriye ekle butonu
  resultActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultActionBtnActive: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '18',
  },
  resultActionText: {
    fontSize: FONTS.regular,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  // İş ilanı oluştur butonu
  createJobBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  createJobGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  createJobText: {
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Tekrar dene butonu
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  retryText: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
  },
  // Fotoğraf büyütme modalı stilleri
  expandedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: width * 0.95,
    height: height * 0.9,
    borderRadius: RADIUS.lg,
  },
});