// ─────────────────────────────────────────────────────────────
// KUAFÖR İŞ HAVUZU (app/(hairdresser)/jobs.tsx)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_JOBS = [
  {
    id: 'j1',
    customerId: 'c1',
    customerName: 'Ayşe Kaya',
    customerEmoji: '👩',
    customerCity: 'İstanbul / Kadıköy',
    customerRating: 4.9,
    customerJobCount: 8,
    memberSince: '2023',
    service: 'Balayage',
    colorPreference: 'Karamel & Bal Sarısı',
    budget: 800,
    note: 'Doğal görünümlü, yüzüme uygun bir balayage istiyorum. Saçlarım daha önce boyandı.',
    publishedAt: '3 dk önce',
    isNew: true,
    isUrgent: false,
    currentPhotoUrl: null,
    aiResultUrl: null,
    tags: ['Balayage', 'Renk', 'Uzun Saç'],
  },
  {
    id: 'j2',
    customerId: 'c2',
    customerName: 'Fatma Şahin',
    customerEmoji: '👩‍🦱',
    customerCity: 'İstanbul / Beşiktaş',
    customerRating: 5.0,
    customerJobCount: 12,
    memberSince: '2022',
    service: 'Keratin Bakım',
    colorPreference: null,
    budget: 600,
    note: 'Saçlarım çok kuru ve kırılgan. Keratin sonrası düzgün ve parlak bir görünüm istiyorum.',
    publishedAt: '18 dk önce',
    isNew: true,
    isUrgent: true,
    currentPhotoUrl: null,
    aiResultUrl: null,
    tags: ['Keratin', 'Bakım', 'Orta Boy'],
  },
  {
    id: 'j3',
    customerId: 'c3',
    customerName: 'Zeynep Mart',
    customerEmoji: '👩‍🦰',
    customerCity: 'İstanbul / Şişli',
    customerRating: 4.7,
    customerJobCount: 3,
    memberSince: '2024',
    service: 'Wolf Cut',
    colorPreference: 'Doğal Renk',
    budget: 400,
    note: 'Wolf cut yaptırmak istiyorum, layered ve textured bir kesim. Referans fotoğraf gönderdim.',
    publishedAt: '1 saat önce',
    isNew: false,
    isUrgent: false,
    currentPhotoUrl: null,
    aiResultUrl: null,
    tags: ['Kesim', 'Wolf Cut', 'Kısa'],
  },
  {
    id: 'j4',
    customerId: 'c4',
    customerName: 'Merve Yıldız',
    customerEmoji: '👱‍♀️',
    customerCity: 'İstanbul / Üsküdar',
    customerRating: 4.5,
    customerJobCount: 5,
    memberSince: '2023',
    service: 'Ombre',
    colorPreference: 'Kahve → Sarı',
    budget: 700,
    note: 'Koyu kahveden sarıya geçiş istiyorum. Daha önce hiç ombre yaptırmadım.',
    publishedAt: '2 saat önce',
    isNew: false,
    isUrgent: false,
    currentPhotoUrl: null,
    aiResultUrl: null,
    tags: ['Ombre', 'Renk', 'Uzun Saç'],
  },
];

const DUMMY_MY_BIDS = [
  {
    id: 'b1',
    jobId: 'j1',
    customerName: 'Selin Arslan',
    customerEmoji: '👩‍🦳',
    service: 'Saç Boyama',
    myPrice: 450,
    customerBudget: 500,
    status: 'pending',
    sentAt: '10 dk önce',
    chatId: 'chat1',
  },
  {
    id: 'b2',
    jobId: 'j2',
    customerName: 'Elif Demir',
    customerEmoji: '👩‍🦱',
    service: 'Balayage',
    myPrice: 750,
    customerBudget: 800,
    status: 'accepted',
    sentAt: '2 saat önce',
    chatId: 'chat2',
  },
  {
    id: 'b3',
    jobId: 'j3',
    customerName: 'Hande Koç',
    customerEmoji: '👩',
    service: 'Keratin',
    myPrice: 600,
    customerBudget: 550,
    status: 'rejected',
    sentAt: 'Dün',
    chatId: 'chat3',
  },
];

// ─── FOTOĞRAF BÜYÜTME MODALI ───────────────────────────────
function PhotoModal({ visible, onClose, emoji, label }: {
  visible: boolean;
  onClose: () => void;
  emoji: string;
  label: string;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={photoModalStyles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={photoModalStyles.container}>
          <Text style={photoModalStyles.label}>{label}</Text>
          <View style={photoModalStyles.photoBox}>
            <Text style={photoModalStyles.emoji}>{emoji}</Text>
          </View>
          <TouchableOpacity style={photoModalStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const photoModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  container: { width: width * 0.85, alignItems: 'center', gap: SPACING.md },
  label: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  photoBox: { width: width * 0.85, height: width * 0.85, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emoji: { fontSize: 100 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});

// ─── TEKLİF VER MODALI ─────────────────────────────────────
function BidModal({ visible, onClose, job }: {
  visible: boolean;
  onClose: () => void;
  job: typeof DUMMY_JOBS[0] | null;
}) {
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    } else {
      slideAnim.setValue(500);
      setPrice('');
      setNote('');
    }
  }, [visible]);

  if (!job) return null;

  const handleSend = () => {
    if (!price) { Alert.alert('Hata', 'Fiyat giriniz'); return; }
    Alert.alert('Teklif Gönderildi', `₺${price} teklifiniz gönderildi!`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={bidModalStyles.overlay}>
        <Animated.View style={[bidModalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={bidModalStyles.header}>
            <Text style={bidModalStyles.title}>Teklif Ver</Text>
            <TouchableOpacity onPress={onClose} style={bidModalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* İş özeti */}
            <View style={bidModalStyles.jobSummary}>
              <LinearGradient
                colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
                style={bidModalStyles.jobSummaryGradient}
              >
                <Text style={bidModalStyles.jobSummaryEmoji}>{job.customerEmoji}</Text>
                <View style={bidModalStyles.jobSummaryInfo}>
                  <Text style={bidModalStyles.jobSummaryName}>{job.customerName}</Text>
                  <Text style={bidModalStyles.jobSummaryService}>{job.service}</Text>
                  <View style={bidModalStyles.jobSummaryBudget}>
                    <Ionicons name="wallet-outline" size={13} color={COLORS.success} />
                    <Text style={bidModalStyles.jobSummaryBudgetText}>Bütçe: ₺{job.budget}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Fiyat giriş */}
            <View style={bidModalStyles.section}>
              <Text style={bidModalStyles.label}>Teklif Fiyatınız (₺) *</Text>
              <View style={bidModalStyles.priceInputWrapper}>
                <Text style={bidModalStyles.priceSymbol}>₺</Text>
                <TextInput
                  style={bidModalStyles.priceInput}
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              {price && parseInt(price) > job.budget && (
                <View style={bidModalStyles.warningRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
                  <Text style={bidModalStyles.warningText}>Müşteri bütçesini aşıyor</Text>
                </View>
              )}
              {price && parseInt(price) <= job.budget && (
                <View style={bidModalStyles.successRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
                  <Text style={bidModalStyles.successText}>Bütçeye uygun</Text>
                </View>
              )}
            </View>

            {/* Not */}
            <View style={bidModalStyles.section}>
              <Text style={bidModalStyles.label}>Müşteriye Not (opsiyonel)</Text>
              <View style={bidModalStyles.noteWrapper}>
                <TextInput
                  style={bidModalStyles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Kendinizi tanıtın, deneyiminizden bahsedin..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={200}
                />
              </View>
              <Text style={bidModalStyles.charCount}>{note.length}/200</Text>
            </View>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>

          <View style={bidModalStyles.footer}>
            <TouchableOpacity style={bidModalStyles.sendBtn} onPress={handleSend}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={bidModalStyles.sendBtnGradient}
              >
                <Ionicons name="send-outline" size={18} color={COLORS.white} />
                <Text style={bidModalStyles.sendBtnText}>Teklifi Gönder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const bidModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  jobSummary: { margin: SPACING.lg, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  jobSummaryGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  jobSummaryEmoji: { fontSize: 36 },
  jobSummaryInfo: { flex: 1 },
  jobSummaryName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  jobSummaryService: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  jobSummaryBudget: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  jobSummaryBudgetText: { fontSize: FONTS.small, color: COLORS.success, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.sm },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  priceSymbol: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.primary, marginRight: SPACING.sm },
  priceInput: { flex: 1, fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary, paddingVertical: SPACING.md },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.sm },
  warningText: { fontSize: FONTS.small, color: COLORS.warning },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.sm },
  successText: { fontSize: FONTS.small, color: COLORS.success },
  noteWrapper: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  noteInput: { color: COLORS.textPrimary, fontSize: FONTS.regular, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  sendBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  sendBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14 },
  sendBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});

// ─── İŞ KARTI ──────────────────────────────────────────────
function JobCard({ job, onBid }: {
  job: typeof DUMMY_JOBS[0];
  onBid: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [photoModal, setPhotoModal] = useState<{ visible: boolean; emoji: string; label: string }>({
    visible: false, emoji: '', label: '',
  });

  const openPhoto = (emoji: string, label: string) => {
    setPhotoModal({ visible: true, emoji, label });
  };

  return (
    <>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: false }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
        activeOpacity={1}
      >
        <Animated.View style={[styles.jobCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.jobCardGradient}
          >
            {/* ── ÜST: MÜŞTERİ BİLGİSİ ── */}
            <View style={styles.jobCardHeader}>
              <View style={styles.customerInfo}>
                <View style={styles.customerAvatarWrapper}>
                  <LinearGradient
                    colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
                    style={styles.customerAvatar}
                  >
                    <Text style={styles.customerEmoji}>{job.customerEmoji}</Text>
                  </LinearGradient>
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>{job.customerName}</Text>
                  <View style={styles.customerMeta}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                    <Text style={styles.customerMetaText}>{job.customerCity}</Text>
                  </View>
                  <View style={styles.customerStats}>
                    <Ionicons name="star" size={11} color="#FFB844" />
                    <Text style={styles.customerRating}>{job.customerRating}</Text>
                    <Text style={styles.customerDot}>·</Text>
                    <Text style={styles.customerJobCount}>{job.customerJobCount} iş</Text>
                    <Text style={styles.customerDot}>·</Text>
                    <Text style={styles.customerMemberSince}>{job.memberSince}'den beri</Text>
                  </View>
                </View>
              </View>

              {/* Sağ badge'ler */}
              <View style={styles.jobBadges}>
                {job.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>YENİ</Text>
                  </View>
                )}
                {job.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={10} color={COLORS.warning} />
                    <Text style={styles.urgentBadgeText}>ACİL</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── ORTACA: HİZMET + FOTOĞRAFLAR ── */}
            <View style={styles.jobServiceRow}>
              <View style={styles.jobServiceInfo}>
                <View style={styles.jobServiceBadge}>
                  <Ionicons name="cut-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.jobServiceText}>{job.service}</Text>
                </View>
                {job.colorPreference && (
                  <View style={styles.jobColorBadge}>
                    <View style={styles.jobColorDot} />
                    <Text style={styles.jobColorText}>{job.colorPreference}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Fotoğraflar — tıklayınca büyür */}
            <View style={styles.photosRow}>
              <TouchableOpacity
                style={styles.photoCard}
                onPress={() => openPhoto(job.customerEmoji, 'Şu Anki Görünüm')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.photoCardGradient}
                >
                  <Text style={styles.photoEmoji}>{job.customerEmoji}</Text>
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>Şu An</Text>
                  </View>
                  <View style={styles.zoomIcon}>
                    <Ionicons name="expand-outline" size={12} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.photoArrow}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.photoArrowBg}>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.photoArrowLabel}>AI</Text>
              </View>

              <TouchableOpacity
                style={styles.photoCard}
                onPress={() => openPhoto('✨', 'İstenen Görünüm')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                  style={styles.photoCardGradient}
                >
                  <Text style={styles.photoEmoji}>✨</Text>
                  <View style={[styles.photoLabel, { backgroundColor: COLORS.primary + 'CC' }]}>
                    <Text style={styles.photoLabelText}>İstenen</Text>
                  </View>
                  <View style={styles.zoomIcon}>
                    <Ionicons name="expand-outline" size={12} color={COLORS.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Etiketler */}
            <View style={styles.tagsRow}>
              {job.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Müşteri notu */}
            <View style={styles.noteCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.noteText} numberOfLines={2}>{job.note}</Text>
            </View>

            {/* ── ALT: BÜTÇE + ZAMAN + TEKLİF ── */}
            <View style={styles.jobCardFooter}>
              <View style={styles.jobFooterLeft}>
                <View style={styles.budgetBadge}>
                  <Ionicons name="wallet-outline" size={14} color={COLORS.success} />
                  <Text style={styles.budgetText}>₺{job.budget}</Text>
                </View>
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.timeText}>{job.publishedAt}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.bidBtn} onPress={onBid}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.bidBtnGradient}
                >
                  <Ionicons name="send-outline" size={14} color={COLORS.white} />
                  <Text style={styles.bidBtnText}>Teklif Ver</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Fotoğraf büyütme modalı — kart içinde, modal içinde modal yok */}
      <PhotoModal
        visible={photoModal.visible}
        onClose={() => setPhotoModal({ visible: false, emoji: '', label: '' })}
        emoji={photoModal.emoji}
        label={photoModal.label}
      />
    </>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'jobs' | 'mybids'>('jobs');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'nearby' | 'matched'>('all');
  const [selectedJob, setSelectedJob] = useState<typeof DUMMY_JOBS[0] | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();
  }, []);

  const filteredJobs = DUMMY_JOBS.filter(j => {
    if (activeFilter === 'new') return j.isNew;
    if (activeFilter === 'nearby') return j.customerCity.includes('Kadıköy') || j.customerCity.includes('Beşiktaş');
    if (activeFilter === 'matched') return ['Balayage', 'Keratin Bakım', 'Wolf Cut'].includes(j.service);
    return true;
  });

  const bidStatusConfig = {
    pending: { label: 'Bekliyor', color: '#FFB844', icon: 'time-outline' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', icon: 'checkmark-circle-outline' },
    rejected: { label: 'Reddedildi', color: '#F87171', icon: 'close-circle-outline' },
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>İş Havuzu</Text>
          <Text style={styles.subtitle}>{filteredJobs.length} ilan mevcut</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── SEKMELER ── */}
      <View style={styles.tabRow}>
        {[
          { key: 'jobs', label: 'İş İlanları', count: DUMMY_JOBS.length },
          { key: 'mybids', label: 'Tekliflerim', count: DUMMY_MY_BIDS.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={[{ flex: 1, opacity: contentOpacity }]}>

        {activeTab === 'jobs' ? (
          <>
            {/* ── FİLTRELER ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {[
                { key: 'all', label: 'Tümü', icon: 'grid-outline' },
                { key: 'new', label: 'Yeni', icon: 'sparkles-outline' },
                { key: 'nearby', label: 'Yakınımda', icon: 'location-outline' },
                { key: 'matched', label: 'Hizmetlerime Uygun', icon: 'checkmark-circle-outline' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter.key as any)}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={13}
                    color={activeFilter === filter.key ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── İŞ LİSTESİ ── */}
            <FlatList
              data={filteredJobs}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
              renderItem={({ item }) => (
                <JobCard
                  job={item}
                  onBid={() => { setSelectedJob(item); setShowBidModal(true); }}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>İlan bulunamadı</Text>
                  <Text style={styles.emptyDesc}>Filtre değiştirmeyi deneyin</Text>
                </View>
              }
            />
          </>
        ) : (
          /* ── TEKLİFLERİM ── */
          <FlatList
            data={DUMMY_MY_BIDS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            renderItem={({ item }) => {
              const statusConf = bidStatusConfig[item.status as keyof typeof bidStatusConfig];
              return (
                <TouchableOpacity
                  style={styles.bidCard}
                  onPress={() => router.push(`/chat/${item.chatId}` as any)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={styles.bidCardGradient}
                  >
                    <View style={styles.bidCardHeader}>
                      <View style={styles.bidCustomerInfo}>
                        <Text style={styles.bidEmoji}>{item.customerEmoji}</Text>
                        <View>
                          <Text style={styles.bidCustomerName}>{item.customerName}</Text>
                          <Text style={styles.bidService}>{item.service}</Text>
                        </View>
                      </View>
                      <View style={[styles.bidStatusBadge, { backgroundColor: statusConf.color + '22', borderColor: statusConf.color + '44' }]}>
                        <Ionicons name={statusConf.icon as any} size={12} color={statusConf.color} />
                        <Text style={[styles.bidStatusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                      </View>
                    </View>

                    <View style={styles.bidCardFooter}>
                      <View style={styles.bidPriceRow}>
                        <Text style={styles.bidPriceLabel}>Teklifim</Text>
                        <Text style={styles.bidPrice}>₺{item.myPrice}</Text>
                        <Text style={styles.bidPriceSep}>/</Text>
                        <Text style={styles.bidBudget}>Bütçe ₺{item.customerBudget}</Text>
                      </View>
                      <View style={styles.bidTimeRow}>
                        <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                        <Text style={styles.bidTime}>{item.sentAt}</Text>
                      </View>
                    </View>

                    {item.status !== 'rejected' && (
                      <TouchableOpacity
                        style={styles.goToChatBtn}
                        onPress={() => router.push(`/chat/${item.chatId}` as any)}
                      >
                        <Text style={styles.goToChatText}>Sohbete Git</Text>
                        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </Animated.View>

      {/* Teklif ver modalı */}
      <BidModal
        visible={showBidModal}
        onClose={() => { setShowBidModal(false); setSelectedJob(null); }}
        job={selectedJob}
      />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  notifBtn: { position: 'relative', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.background },
  // Sekmeler
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 10, borderRadius: RADIUS.lg },
  tabActive: { backgroundColor: COLORS.primary + '33', borderWidth: 1, borderColor: COLORS.primary + '66' },
  tabText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabCount: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabCountActive: { backgroundColor: COLORS.primary + '44' },
  tabCountText: { fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold' },
  tabCountTextActive: { color: COLORS.primary },
  // Filtreler
  filterScroll: { marginBottom: SPACING.md },
  filterContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  filterChipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  // Liste
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
  // İş kartı
  jobCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  jobCardGradient: { padding: SPACING.md, gap: SPACING.md },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, flex: 1 },
  customerAvatarWrapper: { position: 'relative' },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  customerEmoji: { fontSize: 24 },
  customerDetails: { flex: 1, gap: 2 },
  customerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  customerMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  customerMetaText: { fontSize: 11, color: COLORS.textMuted },
  customerStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerRating: { fontSize: 11, color: '#FFB844', fontWeight: '600' },
  customerDot: { fontSize: 11, color: COLORS.textMuted },
  customerJobCount: { fontSize: 11, color: COLORS.textMuted },
  customerMemberSince: { fontSize: 11, color: COLORS.textMuted },
  jobBadges: { gap: 4, alignItems: 'flex-end' },
  newBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 2, paddingHorizontal: 8 },
  newBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: 'bold' },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.warning + '22', borderRadius: RADIUS.full, paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.warning + '44' },
  urgentBadgeText: { fontSize: 9, color: COLORS.warning, fontWeight: 'bold' },
  jobServiceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  jobServiceInfo: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  jobServiceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '18', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  jobServiceText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  jobColorBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  jobColorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c68642' },
  jobColorText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  // Fotoğraflar
  photosRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  photoCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  photoCardGradient: { aspectRatio: 3 / 4, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  photoEmoji: { fontSize: 40 },
  photoLabel: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm, paddingVertical: 3, alignItems: 'center' },
  photoLabelText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  zoomIcon: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.sm, padding: 3 },
  photoArrow: { alignItems: 'center', gap: 4 },
  photoArrowBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  photoArrowLabel: { fontSize: 9, color: COLORS.primary, fontWeight: 'bold' },
  // Etiketler
  tagsRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  // Not
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACING.sm },
  noteText: { flex: 1, fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  // Alt kısım
  jobCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  budgetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '18', paddingVertical: 5, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.success + '44' },
  budgetText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.success },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  bidBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  bidBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 16 },
  bidBtnText: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.white },
  // Tekliflerim
  bidCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  bidCardGradient: { padding: SPACING.md, gap: SPACING.md },
  bidCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidCustomerInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  bidEmoji: { fontSize: 32 },
  bidCustomerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  bidService: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1 },
  bidStatusText: { fontSize: FONTS.small, fontWeight: '700' },
  bidCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bidPriceLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidPrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  bidPriceSep: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidBudget: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bidTime: { fontSize: 11, color: COLORS.textMuted },
  goToChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 8, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  goToChatText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  // Boş durum
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted },
});