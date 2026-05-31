// ─────────────────────────────────────────────────────────────
// KEŞFET EKRANI (app/(customer)/explore.tsx)
// ─────────────────────────────────────────────────────────────
// Bu ekran müşterilerin kuaför araması ve filtrelemesi için kullanılır.
// Şu an dummy data ile çalışıyor — Firestore bağlantısı sonra eklenecek.
//
// BAĞLANTILAR:
// - authStore → kullanıcının kayıtlı şehrini varsayılan filtre olarak alır
// - /hairdresser/[id] → karta tıklayınca kuaför profil sayfasına gider
// - cities.ts → şehir listesi
//
// BİLEŞENLER:
// - HairdresserCard → kuaför liste kartı
// - FilterModal → filtre + şehir seçim modalı (iç içe modal yok, koşullu render)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { CITIES } from '../../src/constants/cities';

// ─── DUMMY VERİ ────────────────────────────────────────────
// Firestore'dan gelecek: hairdresserProfiles koleksiyonu
// Her obje bir kuaförü temsil eder
const DUMMY_HAIRDRESSERS = [
  {
    id: '1',                              // Firestore doc ID → /hairdresser/[id] sayfasında kullanılır
    salonName: 'Salon Elegance',
    description: 'Profesyonel saç boyama ve kesim uzmanı',
    city: 'İstanbul',
    district: 'Kadıköy',
    emoji: '💇‍♀️',                        // Gerçek uygulamada profilePhotoURL olacak
    specializations: ['Renk', 'Kesim', 'Balayage'],
    averageRating: 4.8,                   // Firestore: hairdresserProfiles.averageRating
    totalJobs: 124,                       // Firestore: hairdresserProfiles.totalJobs
    followersCount: 892,                  // Firestore: hairdresserProfiles.followersCount
    price: 200,                           // Firestore: hairdresserProfiles.services[0].price (en düşük)
    isOnline: true,                       // Firestore: users.lastActiveAt (son 5 dakika)
    badge: 'En Popüler',                  // Firestore sorgu sıralamasına göre belirlenir
  },
  {
    id: '2',
    salonName: 'Modern Saç Studio',
    description: 'Balayage ve ombre uzmanı, 10 yıl deneyim',
    city: 'İstanbul',
    district: 'Beşiktaş',
    emoji: '✨',
    specializations: ['Balayage', 'Ombre', 'Keratin'],
    averageRating: 4.6,
    totalJobs: 89,
    followersCount: 534,
    price: 350,
    isOnline: false,
    badge: 'Yeni',
  },
  {
    id: '3',
    salonName: 'Style Studio',
    description: 'Gelin saçı ve özel gün uzmanı',
    city: 'Ankara',
    district: 'Çankaya',
    emoji: '👑',
    specializations: ['Gelin Saçı', 'Özel Gün', 'Fön'],
    averageRating: 4.9,
    totalJobs: 203,
    followersCount: 1240,
    price: 500,
    isOnline: true,
    badge: 'Premium',
  },
  {
    id: '4',
    salonName: 'Hair Lab',
    description: 'Yaratıcı renkler ve özel tasarım kesimler',
    city: 'İzmir',
    district: 'Alsancak',
    emoji: '🎨',
    specializations: ['Renk', 'Tasarım Kesim', 'Wolf Cut'],
    averageRating: 4.7,
    totalJobs: 156,
    followersCount: 678,
    price: 300,
    isOnline: true,
    badge: null,
  },
  {
    id: '5',
    salonName: 'Glam House',
    description: 'Saç uzatma ve bakım uzmanı',
    city: 'Bursa',
    district: 'Nilüfer',
    emoji: '💅',
    specializations: ['Saç Uzatma', 'Keratin', 'Bakım'],
    averageRating: 4.5,
    totalJobs: 98,
    followersCount: 423,
    price: 400,
    isOnline: false,
    badge: null,
  },
];

// Uzmanlık filtre seçenekleri — Firestore'da hairdresserProfiles.specializations ile eşleşir
const SPECIALIZATIONS = [
  'Kesim', 'Renk', 'Balayage', 'Keratin',
  'Gelin Saçı', 'Ombre', 'Fön', 'Bakım',
  'Wolf Cut', 'Saç Uzatma',
];

// Sıralama seçenekleri
const SORT_OPTIONS = [
  { label: 'Varsayılan', value: 'default' },
  { label: 'En Yüksek Puan', value: 'rating' },
  { label: 'En Çok İş', value: 'jobs' },
  { label: 'En Düşük Fiyat', value: 'price_asc' },
  { label: 'En Yüksek Fiyat', value: 'price_desc' },
];

// ─── KUAFÖR KARTI ──────────────────────────────────────────
// DUMMY_HAIRDRESSERS dizisindeki her kuaför için bir kart render eder
// onPress → /hairdresser/[id] sayfasına navigate eder
function HairdresserCard({ item, onPress }: {
  item: typeof DUMMY_HAIRDRESSERS[0];
  onPress: () => void;
}) {
  // Karta basınca küçük scale animasyonu
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Badge — En Popüler / Yeni / Premium gibi etiketler */}
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}

        {/* Üst kısım — avatar + salon bilgileri + puan/fiyat */}
        <View style={styles.cardTop}>

          {/* Sol — Avatar ve online durumu */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {/* Gerçek uygulamada: <Image source={{ uri: item.profilePhotoURL }} /> */}
              <Text style={styles.avatarEmoji}>{item.emoji}</Text>
            </View>
            {/* Online nokta — users.lastActiveAt son 5 dakikaysa gösterilir */}
            {item.isOnline && <View style={styles.onlineDot} />}
          </View>

          {/* Orta — Salon adı, açıklama, konum */}
          <View style={styles.cardInfo}>
            <Text style={styles.salonName}>{item.salonName}</Text>
            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
            {/* Konum — hairdresserProfiles.district + city */}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.location}>{item.district}, {item.city}</Text>
            </View>
          </View>

          {/* Sağ — Puan ve başlangıç fiyatı */}
          <View style={styles.cardRight}>
            {/* Puan — hairdresserProfiles.averageRating */}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#FFB844" />
              <Text style={styles.ratingText}>{item.averageRating}</Text>
            </View>
            {/* Fiyat — hairdresserProfiles.services en düşük fiyat */}
            <Text style={styles.priceText}>₺{item.price}+</Text>
          </View>
        </View>

        {/* Alt kısım — uzmanlık etiketleri + iş/takipçi istatistikleri */}
        <View style={styles.cardBottom}>
          {/* Uzmanlık etiketleri — hairdresserProfiles.specializations */}
          <View style={styles.tags}>
            {item.specializations.slice(0, 3).map((spec) => (
              <View key={spec} style={styles.tag}>
                <Text style={styles.tagText}>{spec}</Text>
              </View>
            ))}
          </View>
          {/* İstatistikler — totalJobs + followersCount */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="briefcase-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.statText}>{item.totalJobs}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.statText}>{item.followersCount}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── FİLTRE MODALI ─────────────────────────────────────────
// İki görünüm içerir — iç içe Modal kullanılmaz (iOS'ta çakışır):
// 1. showCityPicker=false → Ana filtre görünümü
// 2. showCityPicker=true  → Şehir seçici görünümü (aynı modal içinde koşullu render)
//
// filters prop'u → mevcut filtre state'i (ExploreScreen'den gelir)
// onApply → "Uygula" butonuna basınca ExploreScreen'deki filters state'ini günceller
function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (f: any) => void;
}) {
  // local → modal içindeki geçici filtre state'i (Uygula'ya basana kadar gerçek state değişmez)
  const [local, setLocal] = useState(filters);
  // showCityPicker → true olunca ana görünüm gizlenir, şehir listesi gösterilir
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Modal her açıldığında local state'i sıfırla
  useEffect(() => {
    setLocal(filters);
    setShowCityPicker(false);
    setCitySearch('');
  }, [visible]);

  // Şehir aramasına göre filtrelenmiş liste — CITIES sabiti (cities.ts)
  const filteredCities = CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>

          {/* ── GÖRÜNÜM 2: ŞEHİR SEÇİCİ ── */}
          {showCityPicker ? (
            <>
              {/* Başlık — geri ok + şehir seç başlığı + kapat */}
              <View style={modalStyles.header}>
                <TouchableOpacity
                  onPress={() => { setShowCityPicker(false); setCitySearch(''); }}
                  style={modalStyles.backBtn}
                >
                  <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={modalStyles.title}>Şehir Seç</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                  <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Şehir arama kutusu */}
              <View style={modalStyles.citySearch}>
                <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
                <TextInput
                  style={modalStyles.citySearchInput}
                  placeholder="Şehir ara..."
                  placeholderTextColor={COLORS.textMuted}
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoFocus
                />
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Şehir listesi — CITIES sabiti + "Tüm Şehirler" seçeneği */}
              <FlatList
                data={[
                  { name: 'Tüm Şehirler', value: '' },
                  ...filteredCities.map(c => ({ name: c, value: c }))
                ]}
                keyExtractor={(item) => item.value || 'all'}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      modalStyles.cityListItem,
                      local.city === item.value && modalStyles.cityListItemActive,
                    ]}
                    onPress={() => {
                      // Şehir seçilince local state güncelle + şehir görünümünü kapat
                      setLocal({ ...local, city: item.value });
                      setShowCityPicker(false);
                      setCitySearch('');
                    }}
                  >
                    <Text style={[
                      modalStyles.cityListItemText,
                      local.city === item.value && modalStyles.cityListItemTextActive,
                    ]}>
                      {item.name}
                    </Text>
                    {local.city === item.value && (
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (

            // ── GÖRÜNÜM 1: ANA FİLTRE ──
            <>
              {/* Başlık */}
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>Filtrele</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                  <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* ŞEHİR — tıklayınca showCityPicker=true → şehir görünümüne geçer */}
                <Text style={modalStyles.sectionTitle}>📍 Şehir</Text>
                <TouchableOpacity
                  style={modalStyles.citySelector}
                  onPress={() => setShowCityPicker(true)}
                >
                  <View style={modalStyles.citySelectorLeft}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                    <Text style={modalStyles.citySelectorText}>
                      {local.city || 'Tüm Şehirler'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {local.city ? (
                      <TouchableOpacity
                        onPress={() => setLocal({ ...local, city: '' })}
                        style={{ marginRight: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>

                {/* SIRALAMA — chip butonlar, SORT_OPTIONS dizisinden render edilir */}
                <Text style={modalStyles.sectionTitle}>📊 Sıralama</Text>
                <View style={modalStyles.chipGrid}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[modalStyles.chip, local.sort === opt.value && modalStyles.chipActive]}
                      onPress={() => setLocal({ ...local, sort: opt.value })}
                    >
                      <Text style={[modalStyles.chipText, local.sort === opt.value && modalStyles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* MİNİMUM PUAN — 5 seçenek, chip butonlar */}
                <Text style={modalStyles.sectionTitle}>⭐ Minimum Puan</Text>
                <View style={modalStyles.chipGrid}>
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        modalStyles.chip,
                        local.minRating === r && modalStyles.chipActive,
                        local.minRating === r && { borderColor: '#FFB844', backgroundColor: '#FFB84422' },
                      ]}
                      onPress={() => setLocal({ ...local, minRating: r })}
                    >
                      <Text style={[
                        modalStyles.chipText,
                        local.minRating === r && { color: '#FFB844', fontWeight: '700' },
                      ]}>
                        {r === 0 ? 'Tümü' : `${r}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* UZMANLIK — çoklu seçim, SPECIALIZATIONS dizisinden render edilir */}
                <Text style={modalStyles.sectionTitle}>✂️ Uzmanlık</Text>
                <View style={modalStyles.chipGrid}>
                  {SPECIALIZATIONS.map((spec) => {
                    const isActive = local.specs.includes(spec);
                    return (
                      <TouchableOpacity
                        key={spec}
                        style={[modalStyles.chip, isActive && modalStyles.chipActive]}
                        onPress={() => {
                          // Seçiliyse çıkar, seçili değilse ekle
                          const newSpecs = isActive
                            ? local.specs.filter((s: string) => s !== spec)
                            : [...local.specs, spec];
                          setLocal({ ...local, specs: newSpecs });
                        }}
                      >
                        <Text style={[modalStyles.chipText, isActive && modalStyles.chipTextActive]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* DURUM — Online / Tümü seçimi, chip butonlar */}
                <Text style={modalStyles.sectionTitle}>🟢 Durum</Text>
                <View style={modalStyles.chipGrid}>
                  {[
                    { label: 'Tümü', value: 'all' },
                    { label: 'Şu an müsait', value: 'online' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[modalStyles.chip, local.status === opt.value && modalStyles.chipActive]}
                      onPress={() => setLocal({ ...local, status: opt.value })}
                    >
                      <Text style={[modalStyles.chipText, local.status === opt.value && modalStyles.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ height: SPACING.xl }} />
              </ScrollView>

              {/* Alt butonlar — Sıfırla + Uygula */}
              <View style={modalStyles.footer}>
                {/* Sıfırla — tüm filtreleri varsayılana döndürür */}
                <TouchableOpacity
                  style={modalStyles.resetBtn}
                  onPress={() => setLocal({
                    city: 'tüm şehirler',
                    sort: 'default',
                    minRating: 0,
                    specs: [],
                    status: 'all',
                  })}
                >
                  <Text style={modalStyles.resetText}>Sıfırla</Text>
                </TouchableOpacity>

                {/* Uygula — local state'i gerçek filters'a yazar, modal kapanır */}
                <TouchableOpacity
                  style={modalStyles.applyBtn}
                  onPress={() => { onApply(local); onClose(); }}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={modalStyles.applyGradient}
                  >
                    <Text style={modalStyles.applyText}>Uygula</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── MODAL STİLLERİ ────────────────────────────────────────
const modalStyles = StyleSheet.create({
  // Ana overlay — yarı saydam siyah arka plan
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  // Modal container — ekranın altından çıkar, max %90 yükseklik
  container: {
    backgroundColor: '#1A0533',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  // Başlık satırı — geri/kapat butonları + başlık
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Bölüm başlıkları
  sectionTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  // Şehir seçim butonu
  citySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  citySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  citySelectorText: {
    fontSize: FONTS.regular,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  // Şehir arama kutusu
  citySearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  citySearchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  // Şehir liste öğesi
  cityListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cityListItemActive: {
    backgroundColor: COLORS.primary + '18',
  },
  cityListItemText: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
  },
  cityListItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Chip grid — tüm filtre seçenekleri için ortak
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  // Chip buton — pasif hali
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Chip buton — aktif hali
  chipActive: {
    backgroundColor: COLORS.primary + '33',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Alt butonlar
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  resetText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONTS.regular,
  },
  applyBtn: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  applyGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.regular,
  },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Arama kutusu metni
  const [search, setSearch] = useState('');
  // Filtre modal açık/kapalı
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Filtre state'i — başlangıçta kullanıcının kayıtlı şehri varsayılan gelir
  const [filters, setFilters] = useState({
    city: user?.city || '',   // authStore'dan kullanıcının kayıtlı şehri
    sort: 'default',
    minRating: 0,
    specs: [] as string[],
    status: 'all',
  });

  // Sayfa açılış animasyonu
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  // Kaç filtre aktif — filtre butonundaki badge sayısı
  const activeFilterCount = [
    filters.city !== (user?.city || ''),
    filters.sort !== 'default',
    filters.minRating > 0,
    filters.specs.length > 0,
    filters.status !== 'all',
  ].filter(Boolean).length;

  // Filtreleme + sıralama mantığı
  const filtered = DUMMY_HAIRDRESSERS.filter((h) => {
    // Arama kutusu — salon adı, şehir veya uzmanlıkla eşleşir
    const matchSearch =
      h.salonName.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    // Şehir filtresi
    const matchCity = !filters.city || h.city === filters.city;
    // Minimum puan filtresi
    const matchRating = h.averageRating >= filters.minRating;
    // Uzmanlık filtresi — seçilen uzmanlıklardan en az biri eşleşmeli
    const matchSpecs = filters.specs.length === 0 ||
      filters.specs.some(s => h.specializations.includes(s));
    // Online durum filtresi
    const matchStatus = filters.status === 'all' ||
      (filters.status === 'online' && h.isOnline);

    return matchSearch && matchCity && matchRating && matchSpecs && matchStatus;
  }).sort((a, b) => {
    if (filters.sort === 'rating') return b.averageRating - a.averageRating;
    if (filters.sort === 'jobs') return b.totalJobs - a.totalJobs;
    if (filters.sort === 'price_asc') return a.price - b.price;
    if (filters.sort === 'price_desc') return b.price - a.price;
    return 0;
  });

  return (
    <View style={styles.container}>
      {/* Arka plan gradient */}
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>Keşfet</Text>
          {/* Şehir satırı — tıklayınca filtre modal açılır */}
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.cityText}>
              {filters.city || 'Tüm Şehirler'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Filtre butonu — aktif filtre varsa badge gösterir */}
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? COLORS.primary : COLORS.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── ARAMA KUTUSU ── */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Salon adı veya uzmanlık..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── SONUÇ SATIRI ── */}
      <View style={styles.resultRow}>
        <Text style={styles.resultText}>{filtered.length} kuaför bulundu</Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={() => setFilters({
            city: user?.city || '',
            sort: 'default',
            minRating: 0,
            specs: [],
            status: 'all',
          })}>
            <Text style={styles.clearFilters}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── KUAFÖR LİSTESİ ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HairdresserCard
            item={item}
            // /hairdresser/[id] sayfasına navigate et
            onPress={() => router.push(`/hairdresser/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Kuaför bulunamadı</Text>
            <Text style={styles.emptySubText}>Filtreleri değiştirmeyi deneyin</Text>
          </View>
        }
      />

      {/* ── FİLTRE MODALI ── */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApply={setFilters}
      />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Dekoratif arka plan dairesi
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7C3AED',
    opacity: 0.12,
    top: -60,
    right: -60,
  },
  // Üst bar — başlık + şehir + filtre butonu
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.xxlarge,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  // Şehir satırı — tıklanabilir
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cityText: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Filtre butonu — aktif filtre varsa primary renk
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '18',
  },
  // Aktif filtre sayı badge'i
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Arama kutusu
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    height: 46,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
  },
  // Sonuç satırı — kaç kuaför bulundu + filtre temizle
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  resultText: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
  },
  clearFilters: {
    fontSize: FONTS.small,
    color: COLORS.error,
    fontWeight: '600',
  },
  // Liste içeriği padding
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 160,
    gap: SPACING.md,
  },
  // Kuaför kartı — ana container
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  // Badge — En Popüler / Yeni / Premium
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary + '33',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  badgeText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
  },
  // Kart üst kısım — avatar + bilgiler + puan/fiyat
  cardTop: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  avatarWrapper: { position: 'relative' },
  // Avatar — gerçek uygulamada Image bileşeni olacak
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  // Online nokta — sol alt köşe
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  cardInfo: { flex: 1, gap: 3 },
  salonName: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // Sağ kısım — puan badge + fiyat
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 22,
    marginRight: -4,
    bottom: -2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFB84422',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    fontSize: FONTS.small,
    color: '#FFB844',
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: FONTS.small,
    color: COLORS.success,
    fontWeight: '600',
  },
  // Kart alt kısım — etiketler + istatistikler
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '18',
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  tagText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  // Boş liste
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.large,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: FONTS.medium,
    color: COLORS.textMuted,
  },
});