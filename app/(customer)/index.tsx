// app/(customer)/index.tsx
import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

// FIREBASE IMPORTS
import { collection, query, where, onSnapshot, orderBy, limit,doc,getDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8; // Ekranın %80'i genişlik

// YARDIMCI FONKSİYON: Tarih Formatlama (YYYY-MM-DD -> 12 Haz 2026)
const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = parseInt(parts[2], 10);
  const m = TR_MONTHS_SHORT[parseInt(parts[1], 10) - 1];
  const y = parts[0];
  return `${d} ${m} ${y}`;
};

// ── TAB TOGGLE BİLEŞENİ ────────────────────────────────────
function TabToggle({ tabs, activeIndex, onPress }: { tabs: string[]; activeIndex: number; onPress: (i: number) => void; }) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const containerWidth = width - SPACING.lg * 2 - 8;
  const tabWidth = containerWidth / tabs.length;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * tabWidth,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  return (
    <View style={toggleStyles.container}>
      <Animated.View style={[toggleStyles.slider, { width: tabWidth, transform: [{ translateX: slideAnim }] }]} />
      {tabs.map((tab, i) => (
        <TouchableOpacity key={tab} style={[toggleStyles.tab, { width: tabWidth }]} onPress={() => onPress(i)} activeOpacity={0.7}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[toggleStyles.tabText, activeIndex === i && toggleStyles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: 4, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', height: 44 },
  slider: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  tab: { alignItems: 'center', justifyContent: 'center', zIndex: 1, paddingHorizontal: 4 },
  tabText: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  tabTextActive: { color: COLORS.white, fontWeight: '800' },
});

// ── KART BİLEŞENLERİ ──────────────────────────────────────
function FollowingCard({ item }: { item: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: false }).start()} onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()} activeOpacity={1}>
      <Animated.View style={[styles.followingCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.followingAvatarWrapper}>
          <View style={[styles.followingAvatar, item.isOnline && styles.followingAvatarOnline]}>
            <Text style={styles.followingEmoji}>{item.emoji || '💇‍♀️'}</Text>
          </View>
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <Text style={styles.followingName} numberOfLines={1}>{item.salonName || item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AICard({ item, onPress }: { item: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.aiCard, { transform: [{ scale: scaleAnim }] }]}>
        {item.resultImage ? (
          <Image source={{ uri: item.resultImage }} style={styles.aiCardImage} />
        ) : (
          <LinearGradient colors={[COLORS.primary + '33', COLORS.primaryDark + '22']} style={styles.aiCardGradient}>
            <Text style={styles.aiCardEmoji}>✂️</Text>
          </LinearGradient>
        )}
        <View style={styles.aiCardDetails}>
          <Text style={styles.aiCardStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{item.style}</Text>
          <Text style={styles.aiCardColor} numberOfLines={1}>{item.color}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CampaignCard({ item, onPress }: { item: any, onPress?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.campaignCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.1)']} style={styles.campaignGradient}>
          <Text style={styles.campaignEmoji}>{item.emoji || '🎉'}</Text>
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignSalon} numberOfLines={1}>{item.salon || 'Kuaför'}</Text>
            <Text style={styles.campaignTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{item.title}</Text>
            <Text style={styles.campaignDesc} numberOfLines={1}>{item.desc || item.description}</Text>
          </View>
          <View style={styles.campaignRight}>
            <View style={styles.campaignDate}>
              <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.campaignDateText}>{formatDisplayDate(item.endDate) || item.validUntil}</Text>
            </View>
            <View style={styles.campaignButton}>
              <Text style={styles.campaignButtonText}>İncele</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TrendCard({ item }: { item: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: false }).start()} onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()} activeOpacity={1}>
      <Animated.View style={[styles.trendCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.trendEmoji}>{item.emoji || '🔥'}</Text>
        <Text style={styles.trendStyle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{item.style}</Text>
        <View style={styles.trendMeta}>
          <Text style={styles.trendTag} numberOfLines={1}>{item.trend}</Text>
          <View style={styles.trendLikes}>
            <Ionicons name="heart" size={10} color={COLORS.error} />
            <Text style={styles.trendLikesText}>{item.likes}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function SponsoredCard({ item }: { item: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()} onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()} activeOpacity={1}>
      <Animated.View style={[styles.sponsoredCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.sponsoredTag}><Text style={styles.sponsoredTagText}>{item.tag || 'Önerilen'}</Text></View>
        <View style={styles.sponsoredAvatar}><Text style={styles.sponsoredEmoji}>{item.emoji || '✂️'}</Text></View>
        <View style={styles.sponsoredInfo}>
          {/* HATA BURADAYDI: item.name yerine item.salonName getirildi */}
          <Text style={styles.sponsoredName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.salonName || item.name || 'İsimsiz Salon'}
          </Text>
          <Text style={styles.sponsoredSpeciality} numberOfLines={1}>{item.city || 'Kuaför Salonu'}</Text>
          <View style={styles.sponsoredMeta}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#FFB844" />
              <Text style={styles.ratingText}>{(item.averageRating || 5.0).toFixed(1)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>İncele</Text>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── FADE TAB PANEL ─────────────────────────────────────────
function FadeTabPanel({ active, children }: { active: boolean; children: React.ReactNode; }) {
  const opacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: active ? 1 : 0, duration: active ? 200 : 150, useNativeDriver: true }).start();
  }, [active]);

  return (
    <Animated.View pointerEvents={active ? 'auto' : 'none'} style={{ opacity, position: 'absolute', top: 0, left: 0, right: 0 }}>
      {children}
    </Animated.View>
  );
}

// ─── KAMPANYA DETAY MODALI (MÜŞTERİ İÇİN) ───────────────────
function CustomerCampaignModal({ visible, campaign, onClose, onBook }: {
  visible: boolean;
  campaign: any;
  onClose: () => void;
  onBook: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const router = useRouter();
  const { user } = useAuthStore(); 
  
  // Kuaför bilgilerini tutacağımız yeni state
  const [hairdresser, setHairdresser] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
      
      // Modalı açınca kampanya sahibinin profil bilgilerini Firebase'den çekiyoruz
      if (campaign?.hairdresserId) {
        const fetchHairdresser = async () => {
          const hdDoc = await getDoc(doc(db, 'hairdresserProfiles', campaign.hairdresserId));
          if (hdDoc.exists()) {
            setHairdresser(hdDoc.data());
          }
        };
        fetchHairdresser();
      }
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
      setHairdresser(null); // Kapatırken temizle
    }
  }, [visible, campaign]);

  if (!campaign) return null;

  const targetAudienceLabels: Record<string, string> = {
    all: 'Tüm Müşteriler',
    new: 'Sadece Yeni Müşteriler',
    loyal: 'Sadık Müşteriler (5+ Randevu)',
    passive: 'Uzun Süredir Gelmeyenler'
  };

  const audienceText = campaign.targetAudience ? targetAudienceLabels[campaign.targetAudience] : 'Tüm Müşteriler';
  const remainingUsage = campaign.maxUsage ? campaign.maxUsage - (campaign.usageCount || 0) : null;

  const handleBooking = async () => {
    if (!user?.uid) {
      Alert.alert('Giriş Yapın', 'Randevu almak için giriş yapmalısınız.');
      return;
    }

    const pastCount = 0; // Şimdilik test amaçlı 0 kabul ediyoruz
    const audience = campaign.targetAudience;

    if (audience === 'new' && pastCount > 0) {
      Alert.alert('Üzgünüz 😔', 'Bu kampanya sadece salonumuzu ilk kez ziyaret edecek müşterilerimiz için geçerlidir.');
      return;
    }
    
    if (audience === 'loyal' && pastCount < 5) {
      Alert.alert('Sadakat Kampanyası', `Bu kampanyadan yararlanmak için salonda 5 randevu tamamlamış olmalısınız. (Sizin: ${pastCount})`);
      return;
    }

    if (audience === 'passive') {
      if (pastCount === 0) {
        Alert.alert('Uygun Değil', 'Bu kampanya sadece eski müşterilerimiz için geçerlidir.');
        return;
      }
    }

    onClose();
    
    router.push({
      pathname: '/(customer)/booking',
      params: { 
        campaignId: campaign.id,
        hairdresserId: campaign.hairdresserId 
      }
    } as any);
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[modalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          <View style={modalStyles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollContent}>

            {/* ── 1. KUAFÖR KÜNYESİ (YENİ EKLENEN KISIM) ── */}
            <TouchableOpacity 
              style={modalStyles.hdProfileRow} 
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                router.push(`/hairdresser/${campaign.hairdresserId}` as any);
              }}
            >
              <View style={modalStyles.hdAvatarContainer}>
                {hairdresser?.profileImage ? (
                  <Image source={{ uri: hairdresser.profileImage }} style={modalStyles.hdAvatarImg} />
                ) : (
                  <View style={modalStyles.hdAvatarFallback}>
                    <Text style={modalStyles.hdAvatarEmoji}>{hairdresser?.emoji || '✂️'}</Text>
                  </View>
                )}
              </View>
              
              <View style={modalStyles.hdInfoContainer}>
                <Text style={modalStyles.hdSalonName} numberOfLines={1}>
                  {hairdresser?.salonName || campaign.salon || 'Kuaför Salonu'}
                </Text>
                <Text style={modalStyles.hdName} numberOfLines={1}>
                  {hairdresser?.firstName || hairdresser?.name || 'Kuaför'}
                </Text>
              </View>

              <View style={modalStyles.hdRatingContainer}>
                <Ionicons name="star" size={14} color="#FFB844" />
                <Text style={modalStyles.hdRatingText}>
                  {(hairdresser?.averageRating || 5.0).toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ── 2. KAMPANYA BAŞLIĞI VE EMOJİSİ (AYNI KALAN KISIM) ── */}
            <View style={modalStyles.heroSection}>
              <LinearGradient colors={[COLORS.primary + '33', COLORS.primaryDark + '11']} style={modalStyles.heroCircle}>
                <Text style={modalStyles.heroEmoji}>{campaign.emoji || '🎁'}</Text>
              </LinearGradient>

              <Text style={modalStyles.title}>{campaign.title}</Text>

              <View style={modalStyles.discountRow}>
                <View style={modalStyles.discountBadge}>
                  <Ionicons name="pricetag" size={16} color="#34D399" />
                  <Text style={modalStyles.discountText}>%{campaign.discount} İndirim</Text>
                </View>
              </View>
            </View>

            {/* ── ACİLİYET UYARISI ── */}
            {remainingUsage !== null && remainingUsage < 10 && remainingUsage > 0 && (
              <View style={modalStyles.urgencyBox}>
                <Ionicons name="flame" size={18} color="#FFB844" />
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                  Acele et, kampanyadan yararlanabilecek <Text style={{ fontWeight: 'bold', color: COLORS.white }}>son {remainingUsage} kişi!</Text>
                </Text>
              </View>
            )}

            {/* ── AÇIKLAMA ── */}
            <View style={modalStyles.descBox}>
              <Text style={modalStyles.descText}>{campaign.description}</Text>
            </View>

            {/* ── DETAY BİLGİLERİ ── */}
            <View style={modalStyles.infoGrid}>
              <View style={modalStyles.infoItem}>
                <View style={modalStyles.infoIconBox}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={modalStyles.infoTextCol}>
                  <Text style={modalStyles.infoLabel}>Geçerlilik Tarihi</Text>
                  <Text style={modalStyles.infoValue}>
                    {formatDisplayDate(campaign.startDate)} - {formatDisplayDate(campaign.endDate)}
                  </Text>
                </View>
              </View>

              <View style={modalStyles.infoItem}>
                <View style={modalStyles.infoIconBox}>
                  <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={modalStyles.infoTextCol}>
                  <Text style={modalStyles.infoLabel}>Kampanya Şartı</Text>
                  <Text style={modalStyles.infoValue}>{audienceText}</Text>
                </View>
              </View>
            </View>

            {/* ── GEÇERLİ HİZMETLER ── */}
            <View style={modalStyles.servicesSection}>
              <View style={modalStyles.servicesHeader}>
                <Ionicons name="cut-outline" size={18} color={COLORS.textMuted} />
                <Text style={modalStyles.servicesTitle}>Geçerli Hizmetler</Text>
              </View>
              <View style={modalStyles.servicesGrid}>
                {campaign.services && campaign.services.length > 0 ? (
                  campaign.services.map((s: string, idx: number) => (
                    <View key={idx} style={modalStyles.serviceChip}>
                      <Text style={modalStyles.serviceChipText}>{s}</Text>
                    </View>
                  ))
                ) : (
                  <View style={modalStyles.serviceChip}>
                    <Text style={modalStyles.serviceChipText}>Tüm Hizmetler</Text>
                  </View>
                )}
              </View>
            </View>

          </ScrollView>

          {/* ── FOOTER ── */}
          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelBtnText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity style={modalStyles.bookBtn} onPress={handleBooking}>
              <LinearGradient
                colors={['#34D399', '#10B981']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={modalStyles.bookBtnGradient}
              >
                <Text style={modalStyles.bookBtnText}>Fırsatla Randevu Al</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Stillerin sadece yeni eklenen Kuaför Künyesi kısmını aşağıya ekliyorum
// Kendi modalStyles objenin İÇİNE (heroSection'ın üstüne) şu yeni stilleri yapıştır:
const modalStyles = StyleSheet.create({
  // ... (overlay, container, handle, scrollContent aynı kalacak) ...
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.90, overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  scrollContent: { padding: SPACING.lg, paddingBottom: 40 },

  // --- YENİ EKLENEN KUAFÖR KÜNYESİ STİLLERİ ---
  hdProfileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: RADIUS.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  hdAvatarContainer: { marginRight: 12 },
  hdAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  hdAvatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '44' },
  hdAvatarEmoji: { fontSize: 24 },
  hdInfoContainer: { flex: 1, justifyContent: 'center' },
  hdSalonName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white, marginBottom: 2 },
  hdName: { fontSize: FONTS.small, color: COLORS.textMuted },
  hdRatingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFB84415', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#FFB84433', gap: 4 },
  hdRatingText: { color: '#FFB844', fontWeight: 'bold', fontSize: FONTS.small },
  // --------------------------------------------

  heroSection: { alignItems: 'center', marginTop: SPACING.xs, marginBottom: SPACING.md },
  heroCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  heroEmoji: { fontSize: 42 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm, lineHeight: 32 },
  
  discountRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#34D399' + '18', paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#34D399' + '55' },
  discountText: { color: '#34D399', fontWeight: 'bold', fontSize: FONTS.medium },

  urgencyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFB844' + '15', padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#FFB844' + '33', marginBottom: SPACING.md },

  descBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },
  descText: { color: COLORS.textSecondary, fontSize: FONTS.regular, lineHeight: 24, textAlign: 'center' },

  infoGrid: { gap: SPACING.sm, marginBottom: SPACING.xl },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.04)', padding: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  infoIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '18', justifyContent: 'center', alignItems: 'center' },
  infoTextCol: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FONTS.regular, color: COLORS.textPrimary, fontWeight: '700' },

  servicesSection: { marginBottom: SPACING.md },
  servicesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm, paddingLeft: 4 },
  servicesTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  serviceChipText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '500' },

  footer: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg, paddingBottom: 34, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(18,10,31,0.95)' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.regular },
  bookBtn: { flex: 2, borderRadius: RADIUS.xl, overflow: 'hidden' },
  bookBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  bookBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.regular },
});

// ── ANA EKRAN ─────────────────────────────────────────────
export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [aiTab, setAiTab] = useState(0);
  const [discoverTab, setDiscoverTab] = useState(0);

  // Firestore Data States
  const [following, setFollowing] = useState<any[]>([]);
  const [aiTries, setAiTries] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedAiItem, setSelectedAiItem] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Tam ekran fotoğraf için state
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(bannerScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: false }),
    ]).start();
  }, []);

  // ── FIREBASE DATA FETCHING ──
  useEffect(() => {
    if (!user?.uid) return;

    const unsubs: (() => void)[] = [];

    const followsQ = query(collection(db, 'follows'), where('userId', '==', user.uid));
    unsubs.push(onSnapshot(followsQ, snap => {
      setFollowing(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    const triesQ = query(collection(db, 'aiTries'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
    unsubs.push(onSnapshot(triesQ, snap => {
      setAiTries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    const favsQ = query(collection(db, 'favorites'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'));
    unsubs.push(onSnapshot(favsQ, snap => {
      setFavorites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    const campQ = query(collection(db, 'campaigns'), where('status', '==', 'active'));
    unsubs.push(onSnapshot(campQ, snap => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    const trendQ = query(collection(db, 'trending'), limit(5));
    unsubs.push(onSnapshot(trendQ, snap => {
      setTrending(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    const sugQ = query(collection(db, 'hairdresserProfiles'), orderBy('averageRating', 'desc'), limit(5));
    unsubs.push(onSnapshot(sugQ, snap => {
      setSuggested(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }));

    return () => unsubs.forEach(u => u());
  }, [user?.uid]);

  const firstName = user?.displayName?.split(' ')[0] || 'Kullanıcı';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── ÜST BAR ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.coinBadge}>
              <Text style={styles.coinBadgeEmoji}>🪙</Text>
              <Text style={styles.coinBadgeText}>{user?.coinBalance || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifButton}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>

          {/* ── AI SAÇ BANNER ── */}
          <Animated.View style={[styles.bannerWrapper, { transform: [{ scale: bannerScale }] }]}>
            <TouchableOpacity onPress={() => router.push('/(customer)/ai-hair' as any)} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.primaryDark, COLORS.primary, '#C084FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                <View style={styles.bannerContent}>
                  <View style={styles.bannerBadge}>
                    <Text style={styles.bannerBadgeText}>✨ Yapay Zeka</Text>
                  </View>
                  <Text style={styles.bannerTitle}>Saç Modelini{'\n'}Önce Dene!</Text>
                  <Text style={styles.bannerSubtitle}>Fotoğrafına yeni saç modelini uygula</Text>
                  <View style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>Hemen Dene</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                  </View>
                </View>
                <View style={styles.bannerDecor}>
                  <Text style={styles.bannerDecorEmoji}>💇‍♀️</Text>
                  <View style={styles.bannerDecorCircle1} />
                  <View style={styles.bannerDecorCircle2} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── TAKİP ETTİKLERİN ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Takip Ettiklerin</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/explore' as any)}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {following.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyFollowing}
              onPress={() => router.push('/(customer)/explore' as any)}
            >
              <Ionicons name="person-add-outline" size={24} color={COLORS.primary} />
              <Text style={styles.emptyFollowingText}>Kuaför takip et</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.followingList}>
              {following.map((item) => (
                <FollowingCard key={item.id} item={item} />
              ))}
            </ScrollView>
          )}

          {/* ── TOGGLE 1: SON DENEMELER / FAVORİLER ── */}
          <TabToggle tabs={['Son Denemeler', 'Favoriler']} activeIndex={aiTab} onPress={setAiTab} />

          <View style={[styles.tabPanelContainer, { minHeight: 126 }]}>
            <FadeTabPanel active={aiTab === 0}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiCardList}>
                {aiTries.length === 0 ? (
                  <TouchableOpacity style={styles.aiEmptyCard} onPress={() => router.push('/(customer)/ai-hair' as any)}>
                    <Ionicons name="sparkles-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.aiEmptyText}>İlk denemeyi yap!</Text>
                  </TouchableOpacity>
                ) : (
                  aiTries.map((item) => (
                    <AICard key={item.id} item={item} onPress={() => setSelectedAiItem(item)} />
                  ))
                )}
              </ScrollView>
            </FadeTabPanel>

            <FadeTabPanel active={aiTab === 1}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiCardList}>
                {favorites.length === 0 ? (
                  <TouchableOpacity style={styles.aiEmptyCard} onPress={() => router.push('/(customer)/ai-hair' as any)}>
                    <Ionicons name="heart-outline" size={28} color={COLORS.primary} />
                    <Text style={styles.aiEmptyText}>Henüz favori yok</Text>
                  </TouchableOpacity>
                ) : (
                  favorites.map((item) => (
                    <AICard key={item.id} item={item} onPress={() => setSelectedAiItem(item)} />
                  ))
                )}
              </ScrollView>
            </FadeTabPanel>
          </View>

          {/* ── TOGGLE 2: KAMPANYALAR / POPÜLER / ÖNERİLEN ── */}
          <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
            <Text style={styles.sectionTitle}>Keşfet</Text>
          </View>
          <TabToggle tabs={['Kampanyalar', 'Popüler', 'Önerilen']} activeIndex={discoverTab} onPress={setDiscoverTab} />

          <View style={[styles.tabPanelContainer, { minHeight: 240, paddingHorizontal: SPACING.lg }]}>

            {/* KAMPANYALAR */}
            <FadeTabPanel active={discoverTab === 0}>
              <View style={styles.discoverList}>
                {campaigns.length === 0 ? (
                  <View style={styles.emptyDiscover}>
                    <Text style={styles.emptyDiscoverText}>Aktif kampanya yok</Text>
                  </View>
                ) : (
                  campaigns.slice(0, 4).map((item) => (
                    <CampaignCard
                      key={item.id}
                      item={item}
                      onPress={() => {
                        setSelectedCampaign(item);
                        setShowCampaignModal(true);
                      }}
                    />
                  ))
                )}
              </View>
            </FadeTabPanel>

            {/* POPÜLER */}
            <FadeTabPanel active={discoverTab === 1}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.md }}>
                {trending.map((item) => (
                  <TrendCard key={item.id} item={item} />
                ))}
              </ScrollView>
            </FadeTabPanel>

            {/* ÖNERİLEN KUAFÖRLER */}
            <FadeTabPanel active={discoverTab === 2}>
              <View style={styles.discoverList}>
                {suggested.map((item) => (
                  <SponsoredCard key={item.id} item={item} />
                ))}
              </View>
            </FadeTabPanel>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── AI GÖRSEL MODAL ── */}
      <Modal
        visible={!!selectedAiItem}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (fullscreenImage) setFullscreenImage(null);
          else setSelectedAiItem(null);
        }}
      >
        {fullscreenImage ? (
          /* TAM EKRAN GÖRÜNÜMÜ */
          <TouchableOpacity style={styles.fullscreenOverlay} activeOpacity={1} onPress={() => setFullscreenImage(null)}>
            <Image source={{ uri: fullscreenImage }} style={styles.fullscreenImage} resizeMode="contain" />
            <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullscreenImage(null)}>
              <Ionicons name="close-circle" size={40} color={COLORS.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          /* ÖNCESİ / SONRASI GÖRÜNÜMÜ */
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedAiItem(null)} activeOpacity={1} />

            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedAiItem(null)}>
                <Ionicons name="close-circle" size={32} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{selectedAiItem?.style}</Text>
              <Text style={styles.modalSubtitle}>{selectedAiItem?.color}</Text>

              <View style={styles.comparisonContainer}>
                {/* Eski Fotoğraf (Sol) */}
                <View style={styles.comparisonHalf}>
                  <Text style={styles.comparisonLabel}>Öncesi</Text>
                  {selectedAiItem?.originalImage ? (
                    <TouchableOpacity onPress={() => setFullscreenImage(selectedAiItem.originalImage)}>
                      <Image source={{ uri: selectedAiItem.originalImage }} style={styles.comparisonImg} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.placeholderImg}><Text style={{ color: '#555' }}>Görsel Yok</Text></View>
                  )}
                </View>

                {/* Yeni Fotoğraf (Sağ) */}
                <View style={styles.comparisonHalf}>
                  <Text style={styles.comparisonLabel}>Sonrası</Text>
                  {selectedAiItem?.resultImage ? (
                    <TouchableOpacity onPress={() => setFullscreenImage(selectedAiItem.resultImage)}>
                      <Image source={{ uri: selectedAiItem.resultImage }} style={styles.comparisonImg} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.placeholderImg}><Text style={{ color: '#555' }}>Görsel Yok</Text></View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* ── KAMPANYA DETAY MODALI ── */}
      <CustomerCampaignModal
        visible={showCampaignModal}
        campaign={selectedCampaign}
        onClose={() => setShowCampaignModal(false)}
        onBook={() => {
          setShowCampaignModal(false);
          // Kampanya ID'sini parametre olarak atıp randevu ekranına yönlendirme
          router.push({
            pathname: '/(customer)/booking',
            params: { campaignId: selectedCampaign.id }
          } as any);
        }}
      />

    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.15, top: -100, right: -80 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#A78BFA', opacity: 0.08, bottom: 300, left: -60 },
  scrollContent: { paddingTop: 56, paddingBottom: 180 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  greeting: { fontSize: FONTS.medium, color: COLORS.textSecondary },
  userName: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212,160,23,0.15)', borderWidth: 1, borderColor: 'rgba(212,160,23,0.3)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.full },
  coinBadgeEmoji: { fontSize: 14 },
  coinBadgeText: { fontSize: FONTS.small, fontWeight: 'bold', color: '#D4A017' },
  notifButton: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.background },
  bannerWrapper: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  banner: { borderRadius: RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', minHeight: 160, overflow: 'hidden' },
  bannerContent: { flex: 1, gap: SPACING.xs },
  bannerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 4 },
  bannerBadgeText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '600' },
  bannerTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white, lineHeight: 28 },
  bannerSubtitle: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  bannerButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  bannerButtonText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '700' },
  bannerDecor: { position: 'relative', width: 90, alignItems: 'center', justifyContent: 'center' },
  bannerDecorEmoji: { fontSize: 64, zIndex: 2 },
  bannerDecorCircle1: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  bannerDecorCircle2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  seeAll: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  emptyFollowing: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyFollowingText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  followingList: { paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.xl },
  followingCard: { alignItems: 'center', gap: SPACING.xs, width: 68 },
  followingAvatarWrapper: { position: 'relative' },
  followingAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  followingAvatarOnline: { borderColor: COLORS.primary },
  followingEmoji: { fontSize: 26 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  followingName: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },
  tabPanelContainer: { position: 'relative', marginBottom: SPACING.lg },
  aiCardList: { paddingHorizontal: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.sm },
  aiCard: { width: 110, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  aiCardImage: { width: '100%', height: 110 },
  aiCardGradient: { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' },
  aiCardEmoji: { fontSize: 32 },
  aiCardDetails: { padding: SPACING.xs, alignItems: 'center' },
  aiCardStyle: { fontSize: 9, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  aiCardColor: { fontSize: 8, color: COLORS.textMuted, textAlign: 'center' },
  aiEmptyCard: { width: 140, height: 130, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  aiEmptyText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  discoverList: { gap: SPACING.md, paddingBottom: SPACING.md },
  emptyDiscover: { padding: SPACING.xl, alignItems: 'center' },
  emptyDiscoverText: { fontSize: FONTS.small, color: COLORS.textMuted },
  campaignCard: { height: 62, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.border },
  campaignGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, gap: SPACING.md },
  campaignEmoji: { fontSize: 28 },
  campaignInfo: { flex: 1, gap: 1, overflow: 'hidden' },
  campaignSalon: { fontSize: 10, color: COLORS.textMuted },
  campaignTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.primary },
  campaignDesc: { fontSize: FONTS.small, color: COLORS.textSecondary },
  campaignRight: { alignItems: 'flex-end', gap: SPACING.sm, flexShrink: 0 },
  campaignDate: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  campaignDateText: { fontSize: 10, color: COLORS.textMuted },
  campaignButton: { backgroundColor: COLORS.primary, paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full },
  campaignButtonText: { fontSize: 11, color: COLORS.white, fontWeight: '700' },
  trendCard: { width: 110, height: 110, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, overflow: 'hidden' },
  trendEmoji: { fontSize: 28 },
  trendStyle: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  trendMeta: { alignItems: 'center', gap: 3 },
  trendTag: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  trendLikes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendLikesText: { fontSize: 10, color: COLORS.textMuted },
  sponsoredCard: { height: 80, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, gap: SPACING.md, overflow: 'hidden' },
  sponsoredTag: { position: 'absolute', top: 10, right: 10, backgroundColor: '#D4A01722', paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#D4A01744' },
  sponsoredTagText: { fontSize: 9, color: '#D4A017', fontWeight: '700' },
  sponsoredAvatar: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sponsoredEmoji: { fontSize: 24 },
  sponsoredInfo: { flex: 1, gap: 2, overflow: 'hidden' },
  sponsoredName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  sponsoredSpeciality: { fontSize: FONTS.small, color: COLORS.textSecondary },
  sponsoredMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: FONTS.small, color: '#FFB844', fontWeight: 'bold' },
  sponsoredPrice: { fontSize: FONTS.small, color: COLORS.success, fontWeight: '600' },
  bookButton: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 10, borderRadius: RADIUS.md, flexShrink: 0 },
  bookButtonText: { fontSize: 11, color: COLORS.white, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { position: 'absolute', width: '100%', height: '100%' },
  modalContent: { width: '90%', backgroundColor: '#1A0533', borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 2 },
  modalCloseBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10 },
  modalTitle: { color: COLORS.white, fontSize: FONTS.xlarge, fontWeight: 'bold', marginTop: 10 },
  modalSubtitle: { color: COLORS.primary, fontSize: FONTS.medium, fontWeight: '600', marginBottom: SPACING.xl },
  comparisonContainer: { flexDirection: 'row', width: '100%', gap: SPACING.md, minHeight: width * 0.6 },
  comparisonHalf: { flex: 1, alignItems: 'center' },
  comparisonLabel: { color: COLORS.textMuted, fontSize: FONTS.small, marginBottom: 5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  comparisonImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  placeholderImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: '100%', height: '100%' },
  fullscreenClose: { position: 'absolute', top: 50, right: 20 },
});