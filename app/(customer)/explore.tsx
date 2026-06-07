// ─────────────────────────────────────────────────────────────
// KEŞFET EKRANI (app/(customer)/explore.tsx)
//
// Firestore bağlantısı:
//   listenHairdressers()       → tüm kuaförler, realtime (onSnapshot)
//   listenHairdressersByCity() → şehre göre filtreli, realtime
//   Her ikisi de profileService'den gelir
//
// Filtreleme client-side yapılır:
//   Şehir, puan, uzmanlık, online durum, sıralama
//
// Navigasyon:
//   Kart tıklanınca → /hairdresser/[uid]
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { CITIES } from '../../src/constants/cities';
import { HairdresserProfile } from '../../src/types';
import {
  listenHairdressers,
  listenHairdressersByCity,
} from '../../src/services/hairdresser/profileService';

// ─── SABİTLER ──────────────────────────────────────────────
const SPECIALIZATIONS = [
  'Kesim', 'Renk', 'Balayage', 'Keratin',
  'Gelin Saçı', 'Ombre', 'Fön', 'Bakım',
  'Wolf Cut', 'Saç Uzatma',
];

const SORT_OPTIONS = [
  { label: 'Varsayılan',       value: 'default'    },
  { label: 'En Yüksek Puan',  value: 'rating'     },
  { label: 'En Çok İş',       value: 'jobs'       },
  { label: 'En Düşük Fiyat',  value: 'price_asc'  },
  { label: 'En Yüksek Fiyat', value: 'price_desc' },
];

// ─── FİLTRE TİPİ ───────────────────────────────────────────
interface Filters {
  city: string;
  sort: string;
  minRating: number;
  specs: string[];
  status: 'all' | 'online';
}

// ─── ONLINE KONTROL ────────────────────────────────────────
// Son 5 dakika içinde aktifse online sayılır
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const checkIsOnline = (lastActiveAt?: number, fallback?: boolean): boolean => {
  if (lastActiveAt) return Date.now() - lastActiveAt < ONLINE_THRESHOLD_MS;
  return fallback === true; // seed'deki isOnline field'ı fallback
};

// ─── EN DÜŞÜK FİYAT ────────────────────────────────────────
const getLowestPrice = (services?: { price: number }[]): number => {
  if (!services || services.length === 0) return 0;
  return Math.min(...services.map(s => s.price));
};

// ─────────────────────────────────────────────────────────────
// FİLTRE MODALI
// İki görünüm — iç içe Modal yok:
//   showCityPicker=false → ana filtre
//   showCityPicker=true  → şehir seçici (aynı modal içinde)
// ─────────────────────────────────────────────────────────────
function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      setShowCityPicker(false);
      setCitySearch('');
    }
  }, [visible]);

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

              <FlatList
                data={[
                  { name: 'Tüm Şehirler', value: '' },
                  ...filteredCities.map(c => ({ name: c, value: c })),
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
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>Filtrele</Text>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                  <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>

                {/* ŞEHİR */}
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

                {/* SIRALAMA */}
                <Text style={modalStyles.sectionTitle}>📊 Sıralama</Text>
                <View style={modalStyles.chipGrid}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[modalStyles.chip, local.sort === opt.value && modalStyles.chipActive]}
                      onPress={() => setLocal({ ...local, sort: opt.value })}
                    >
                      <Text style={[
                        modalStyles.chipText,
                        local.sort === opt.value && modalStyles.chipTextActive,
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* MİNİMUM PUAN */}
                <Text style={modalStyles.sectionTitle}>⭐ Minimum Puan</Text>
                <View style={modalStyles.chipGrid}>
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        modalStyles.chip,
                        local.minRating === r && modalStyles.chipActive,
                        local.minRating === r && {
                          borderColor: '#FFB844',
                          backgroundColor: '#FFB84422',
                        },
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

                {/* UZMANLIK */}
                <Text style={modalStyles.sectionTitle}>✂️ Uzmanlık</Text>
                <View style={modalStyles.chipGrid}>
                  {SPECIALIZATIONS.map((spec) => {
                    const isActive = local.specs.includes(spec);
                    return (
                      <TouchableOpacity
                        key={spec}
                        style={[modalStyles.chip, isActive && modalStyles.chipActive]}
                        onPress={() => {
                          const newSpecs = isActive
                            ? local.specs.filter(s => s !== spec)
                            : [...local.specs, spec];
                          setLocal({ ...local, specs: newSpecs });
                        }}
                      >
                        <Text style={[
                          modalStyles.chipText,
                          isActive && modalStyles.chipTextActive,
                        ]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* DURUM */}
                <Text style={modalStyles.sectionTitle}>🟢 Durum</Text>
                <View style={modalStyles.chipGrid}>
                  {[
                    { label: 'Tümü',         value: 'all'    },
                    { label: 'Şu an müsait', value: 'online' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        modalStyles.chip,
                        local.status === opt.value && modalStyles.chipActive,
                      ]}
                      onPress={() =>
                        setLocal({ ...local, status: opt.value as 'all' | 'online' })
                      }
                    >
                      <Text style={[
                        modalStyles.chipText,
                        local.status === opt.value && modalStyles.chipTextActive,
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ height: SPACING.xl }} />
              </ScrollView>

              {/* Alt butonlar */}
              <View style={modalStyles.footer}>
                <TouchableOpacity
                  style={modalStyles.resetBtn}
                  onPress={() => setLocal({
                    city: '',
                    sort: 'default',
                    minRating: 0,
                    specs: [],
                    status: 'all',
                  })}
                >
                  <Text style={modalStyles.resetText}>Sıfırla</Text>
                </TouchableOpacity>

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

// ─────────────────────────────────────────────────────────────
// KUAFÖR KARTI
// HairdresserProfile verisini render eder
// isOnline ve lowestPrice ekranda hesaplanır
// ─────────────────────────────────────────────────────────────
function HairdresserCard({
  item,
  onPress,
}: {
  item: HairdresserProfile & { isOnline: boolean; lowestPrice: number };
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }).start()
      }
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Üst kısım */}
        <View style={styles.cardTop}>

          {/* Avatar + online nokta */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {/* Gerçek uygulamada: photoURL varsa Image bileşeni */}
              <Text style={styles.avatarEmoji}>✂️</Text>
            </View>
            {item.isOnline && <View style={styles.onlineDot} />}
          </View>

          {/* Salon adı, açıklama, konum */}
          <View style={styles.cardInfo}>
            <Text style={styles.salonName} numberOfLines={1}>
              {item.salonName}
            </Text>
            {item.description && (
              <Text style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.location}>
                {/* district HairdresserProfile'da yok, seed'de eklendi — opsiyonel cast */}
                {(item as any).district
                  ? `${(item as any).district}, ${item.city}`
                  : item.city}
              </Text>
            </View>
          </View>

          {/* Puan + fiyat */}
          <View style={styles.cardRight}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#FFB844" />
              <Text style={styles.ratingText}>
                {(item.averageRating || 0).toFixed(1)}
              </Text>
            </View>
            {item.lowestPrice > 0 && (
              <Text style={styles.priceText}>₺{item.lowestPrice}+</Text>
            )}
          </View>
        </View>

        {/* Alt kısım — uzmanlık + istatistikler */}
        <View style={styles.cardBottom}>
          <View style={styles.tags}>
            {(item.specializations || []).slice(0, 3).map((spec) => (
              <View key={spec} style={styles.tag}>
                <Text style={styles.tagText}>{spec}</Text>
              </View>
            ))}
          </View>
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

// ─────────────────────────────────────────────────────────────
// ANA EKRAN
// ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // ── Firestore'dan gelen ham veri ──
  const [hairdressers, setHairdressers] = useState<HairdresserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state'leri ──
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: user?.city || '',   // kullanıcının kayıtlı şehri varsayılan
    sort: 'default',
    minRating: 0,
    specs: [],
    status: 'all',
  });

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // ── Firestore realtime dinleyici ──
  // filters.city değişince uygun listener'a geçer
  // unsubscribe: useEffect cleanup'ında çağrılır → bellek sızıntısı olmaz
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      if (filters.city) {
        // Şehir seçiliyse → listenHairdressersByCity
        unsubscribe = listenHairdressersByCity(filters.city, (data) => {
          setHairdressers(data);
          setIsLoading(false);
        });
      } else {
        // Tüm şehirler → listenHairdressers
        unsubscribe = listenHairdressers((data) => {
          setHairdressers(data);
          setIsLoading(false);
        });
      }
    } catch (err) {
      console.error('Kuaförler dinlenemedi:', err);
      setError('Kuaförler yüklenemedi. Tekrar deneyin.');
      setIsLoading(false);
    }

    // Cleanup — listener'ı kapat
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [filters.city]); // sadece şehir değişince yeni listener kur

  // ── Kaç filtre aktif ──
  const activeFilterCount = [
    filters.city !== (user?.city || ''),
    filters.sort !== 'default',
    filters.minRating > 0,
    filters.specs.length > 0,
    filters.status !== 'all',
  ].filter(Boolean).length;

  // ── Client-side filtreleme + sıralama ──
  // Firestore'dan gelen veriyi ekran üzerinde filtreler
  // isOnline ve lowestPrice burada hesaplanır — servise eklenmedi
  const filtered = hairdressers
    .map(h => ({
      ...h,
      // isOnline: seed'deki isOnline field'ı + lastActiveAt kontrolü
      isOnline: checkIsOnline(undefined, (h as any).isOnline),
      // lowestPrice: services dizisindeki en düşük fiyat
      lowestPrice: getLowestPrice(h.services),
    }))
    .filter((h) => {
      // Arama — salon adı veya uzmanlık
      const matchSearch =
        h.salonName.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()) ||
        (h.specializations || []).some(s =>
          s.toLowerCase().includes(search.toLowerCase())
        );

      // Minimum puan
      const matchRating = (h.averageRating || 0) >= filters.minRating;

      // Uzmanlık — seçilen uzmanlıklardan en az biri eşleşmeli
      const matchSpecs =
        filters.specs.length === 0 ||
        filters.specs.some(s => (h.specializations || []).includes(s));

      // Online durum
      const matchStatus =
        filters.status === 'all' ||
        (filters.status === 'online' && h.isOnline);

      // Not: şehir filtresi Firestore sorgusu tarafından yapılıyor
      // client'ta tekrar filtrelemiyoruz

      return matchSearch && matchRating && matchSpecs && matchStatus;
    })
    .sort((a, b) => {
      if (filters.sort === 'rating')     return (b.averageRating || 0) - (a.averageRating || 0);
      if (filters.sort === 'jobs')       return (b.totalJobs || 0) - (a.totalJobs || 0);
      if (filters.sort === 'price_asc')  return a.lowestPrice - b.lowestPrice;
      if (filters.sort === 'price_desc') return b.lowestPrice - a.lowestPrice;
      return 0; // default — Firestore averageRating desc sırası korunur
    });

  // ── Filtre sıfırla ──
  const resetFilters = () => {
    setFilters({
      city: user?.city || '',
      sort: 'default',
      minRating: 0,
      specs: [],
      status: 'all',
    });
  };

  // ── Yükleniyor ──
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Kuaförler yükleniyor...</Text>
      </View>
    );
  }

  // ── Hata ──
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient
          colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
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

      {/* ── ARAMA ── */}
      <View style={styles.searchWrapper}>
        <Ionicons
          name="search-outline"
          size={18}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
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
        <Text style={styles.resultText}>
          {filtered.length} kuaför bulundu
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFilters}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── KUAFÖR LİSTESİ ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HairdresserCard
            item={item}
            // uid ile portfolyo/profil sayfasına git
            onPress={() => router.push(`/hairdresser/${item.uid}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Kuaför bulunamadı</Text>
            <Text style={styles.emptySubText}>
              {search ? 'Farklı bir arama deneyin' : 'Filtreleri değiştirmeyi deneyin'}
            </Text>
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

// ─── MODAL STİLLERİ ────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingTop: SPACING.lg, borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  citySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 14 },
  citySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  citySelectorText: { fontSize: FONTS.regular, color: COLORS.textPrimary, fontWeight: '600' },
  citySearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, margin: SPACING.lg, paddingHorizontal: SPACING.md, height: 44, gap: SPACING.sm },
  citySearchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.regular },
  cityListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cityListItemActive: { backgroundColor: COLORS.primary + '18' },
  cityListItemText: { fontSize: FONTS.regular, color: COLORS.textSecondary },
  cityListItemTextActive: { color: COLORS.primary, fontWeight: '700' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.xs },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  resetBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  resetText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: FONTS.regular },
  applyBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  applyGradient: { paddingVertical: 14, alignItems: 'center' },
  applyText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.regular },
});

// ─── ANA EKRAN STİLLERİ ────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  filterButton: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  filterButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  filterBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: 'bold' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, height: 46 },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.regular },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  resultText: { fontSize: FONTS.small, color: COLORS.textMuted },
  clearFilters: { fontSize: FONTS.small, color: COLORS.error, fontWeight: '600' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160, gap: SPACING.md },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 28 },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  cardInfo: { flex: 1, gap: 3 },
  salonName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  description: { fontSize: FONTS.small, color: COLORS.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 11, color: COLORS.textMuted },
  cardRight: { alignItems: 'flex-end', gap: 4, marginTop: 22 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFB84422', paddingVertical: 3, paddingHorizontal: 7, borderRadius: RADIUS.full },
  ratingText: { fontSize: FONTS.small, color: '#FFB844', fontWeight: 'bold' },
  priceText: { fontSize: FONTS.small, color: COLORS.success, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  tag: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.primary + '18', borderWidth: 1, borderColor: COLORS.primary + '33' },
  tagText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: SPACING.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 10, color: COLORS.textMuted },
  loadingText: { fontSize: FONTS.regular, color: COLORS.textMuted, marginTop: SPACING.sm },
  errorText: { fontSize: FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.large, color: COLORS.textSecondary, fontWeight: 'bold' },
  emptySubText: { fontSize: FONTS.medium, color: COLORS.textMuted },
});