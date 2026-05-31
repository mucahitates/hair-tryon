// Müşteri ana sayfası
// Üst bar, hızlı aksiyonlar, yakındaki kuaförler, coin bakiyesi
// Şimdilik dummy data — Firestore bağlantısı sonra eklenecek
// authStore'dan kullanıcı bilgisi alınır

import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// Dummy kuaför verisi — Firestore bağlantısı sonra eklenecek
const DUMMY_HAIRDRESSERS = [
  { id: '1', name: 'Salon Elegance', city: 'İstanbul', rating: 4.8, reviews: 124, speciality: 'Renk & Kesim', emoji: '💇‍♀️' },
  { id: '2', name: 'Modern Saç', city: 'İstanbul', rating: 4.6, reviews: 89, speciality: 'Balayage', emoji: '✨' },
  { id: '3', name: 'Style Studio', city: 'İstanbul', rating: 4.9, reviews: 203, speciality: 'Gelin Saçı', emoji: '👑' },
];

// Hızlı aksiyon kartı
function QuickAction({ emoji, label, color, onPress }: {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: false }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.quickAction, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={[color + '33', color + '11']}
          style={styles.quickActionGradient}
        >
          <Text style={styles.quickActionEmoji}>{emoji}</Text>
          <Text style={styles.quickActionLabel}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Kuaför kartı
function HairdresserCard({ item, onPress }: { item: typeof DUMMY_HAIRDRESSERS[0]; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.hairdresserCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.hairdresserAvatar}>
          <Text style={styles.hairdresserEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.hairdresserInfo}>
          <Text style={styles.hairdresserName}>{item.name}</Text>
          <Text style={styles.hairdresserSpeciality}>{item.speciality}</Text>
          <View style={styles.hairdresserMeta}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.hairdresserCity}>{item.city}</Text>
          </View>
        </View>
        <View style={styles.hairdresserRating}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFB844" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.reviewCount}>{item.reviews} yorum</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const firstName = user?.displayName?.split(' ')[0] || 'Kullanıcı';

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Üst bar */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View>
            <Text style={styles.greeting}>Merhaba 👋</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentAnim }],
        }}>

          {/* AI Banner */}
          <TouchableOpacity
            onPress={() => router.push('/(customer)/ai-hair')}
            style={styles.aiBannerWrapper}
          >
            <LinearGradient
              colors={[COLORS.primaryDark, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiBanner}
            >
              <View style={styles.aiBannerContent}>
                <Text style={styles.aiBannerTitle}>AI Saç Deneme</Text>
                <Text style={styles.aiBannerSubtitle}>
                  Yeni saç modelini önce dene, sonra karar ver
                </Text>
                <View style={styles.aiBannerButton}>
                  <Text style={styles.aiBannerButtonText}>Hemen Dene</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </View>
              </View>
              <Text style={styles.aiBannerEmoji}>✨</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hızlı aksiyonlar */}
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActions}>
            <QuickAction
              emoji="🔍"
              label="Kuaför Bul"
              color={COLORS.primary}
              onPress={() => router.push('/(customer)/explore')}
            />
            <QuickAction
              emoji="💼"
              label="İlan Oluştur"
              color="#34D399"
              onPress={() => router.push('/(customer)/my-jobs')}
            />
            <QuickAction
              emoji="💬"
              label="Mesajlar"
              color="#FBBF24"
              onPress={() => router.push('/(customer)/chats')}
            />
            <QuickAction
              emoji="📅"
              label="Randevular"
              color="#F87171"
              onPress={() => router.push('/(customer)/appointments')}
            />
          </View>

          {/* Yakındaki kuaförler */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yakındaki Kuaförler</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/explore')}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hairdresserList}>
            {DUMMY_HAIRDRESSERS.map((item) => (
              <HairdresserCard
                key={item.id}
                item={item}
                onPress={() => {}}
              />
            ))}
          </View>

          {/* Coin bakiyesi */}
          <TouchableOpacity style={styles.coinCard}>
            <LinearGradient
              colors={['#D4A01733', '#D4A01711']}
              style={styles.coinCardGradient}
            >
              <View style={styles.coinCardLeft}>
                <Text style={styles.coinEmoji}>🪙</Text>
                <View>
                  <Text style={styles.coinLabel}>Coin Bakiyem</Text>
                  <Text style={styles.coinBalance}>{user?.coinBalance || 0} Coin</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4A017" />
            </LinearGradient>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7C3AED',
    opacity: 0.2,
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#A78BFA',
    opacity: 0.1,
    bottom: 200,
    left: -60,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONTS.medium,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONTS.xxlarge,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  aiBannerWrapper: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  aiBanner: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  aiBannerContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  aiBannerTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  aiBannerSubtitle: {
    fontSize: FONTS.small,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  aiBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  aiBannerButtonText: {
    fontSize: FONTS.small,
    color: COLORS.white,
    fontWeight: '600',
  },
  aiBannerEmoji: {
    fontSize: 56,
    marginLeft: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  quickAction: {
    width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hairdresserList: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  hairdresserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  hairdresserAvatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hairdresserEmoji: {
    fontSize: 26,
  },
  hairdresserInfo: {
    flex: 1,
    gap: 2,
  },
  hairdresserName: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  hairdresserSpeciality: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  hairdresserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  hairdresserCity: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  hairdresserRating: {
    alignItems: 'flex-end',
    gap: 4,
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
  reviewCount: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  coinCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4A01744',
  },
  coinCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  coinCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  coinEmoji: {
    fontSize: 32,
  },
  coinLabel: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  coinBalance: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: '#D4A017',
  },
});