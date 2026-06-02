// ─────────────────────────────────────────────────────────────
// KUAFÖR PORTFOLYO EKRANI (app/(hairdresser)/portfolio.tsx)
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
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── GRID HESAPLAMASI (BOŞLUKLAR EKLENDİ) ────────────────────
const GRID_GAP = 6; // Kartlar arası boşluk
const GRID_ITEM_SIZE = (width - (GRID_GAP * 4)) / 3; // Kenar boşlukları ve aralıklar çıkarılarak 3'e bölündü

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_PROFILE = {
  salonName: 'Salon Elegance',
  ownerName: 'Aylin Çelik',
  city: 'İstanbul / Kadıköy',
  bio: 'Profesyonel saç boyama & kesim uzmanı ✂️ 8 yıllık deneyim 💫 Randevu için DM',
  avatar: null,
  totalJobs: 124,
  followers: 892,
  following: 45,
  rating: 4.8,
  instagram: '@salonelegance',
  specialties: ['Balayage', 'Ombre', 'Wolf Cut', 'Keratin'],
};

const DUMMY_PORTFOLIO = [
  {
    id: 'p1',
    service: 'Balayage',
    category: 'Renk',
    colorInfo: 'Karamel & Bal Sarısı',
    price: 750,
    duration: 180,
    date: '24 Mayıs 2025',
    beforeEmoji: '😐',
    afterEmoji: '✨',
    beforePhoto: null,
    afterPhoto: null,
    likes: 48,
    comments: 12,
    views: 234,
    saves: 18,
    isLiked: false,
    isSaved: false,
    isHidden: false,
    customerConsent: true,
    isAnonymous: false,
    customerName: 'Ayşe K.',
    note: 'Doğal geçişli balayage. İşlem süresi 3 saat.',
    fromJob: true,
  },
  {
    id: 'p2',
    service: 'Wolf Cut',
    category: 'Kesim',
    colorInfo: null,
    price: 350,
    duration: 60,
    date: '20 Mayıs 2025',
    beforeEmoji: '😶',
    afterEmoji: '🔥',
    beforePhoto: null,
    afterPhoto: null,
    likes: 92,
    comments: 24,
    views: 567,
    saves: 41,
    isLiked: true,
    isSaved: false,
    isHidden: false,
    customerConsent: true,
    isAnonymous: true,
    customerName: null,
    note: 'Textured wolf cut, layered kesim.',
    fromJob: true,
  },
  {
    id: 'p3',
    service: 'Keratin Bakım',
    category: 'Bakım',
    colorInfo: null,
    price: 600,
    duration: 120,
    date: '15 Mayıs 2025',
    beforeEmoji: '😔',
    afterEmoji: '💫',
    beforePhoto: null,
    afterPhoto: null,
    likes: 31,
    comments: 7,
    views: 189,
    saves: 12,
    isLiked: false,
    isSaved: true,
    isHidden: false,
    customerConsent: true,
    isAnonymous: false,
    customerName: 'Fatma Ş.',
    note: 'Brezilya keratin, 2 ay kalıcı.',
    fromJob: false,
  },
  {
    id: 'p4',
    service: 'Ombre',
    category: 'Renk',
    colorInfo: 'Koyu Kahve → Karamel',
    price: 700,
    duration: 150,
    date: '10 Mayıs 2025',
    beforeEmoji: '😑',
    afterEmoji: '🌟',
    beforePhoto: null,
    afterPhoto: null,
    likes: 156,
    comments: 38,
    views: 891,
    saves: 67,
    isLiked: true,
    isSaved: true,
    isHidden: false,
    customerConsent: true,
    isAnonymous: false,
    customerName: 'Merve Y.',
    note: 'Doğal geçişli ombre, 3 aşamalı renk.',
    fromJob: true,
  },
  {
    id: 'p5',
    service: 'Perma',
    category: 'Kimyasal',
    colorInfo: null,
    price: 450,
    duration: 140,
    date: '5 Mayıs 2025',
    beforeEmoji: '😪',
    afterEmoji: '🌀',
    beforePhoto: null,
    afterPhoto: null,
    likes: 67,
    comments: 15,
    views: 312,
    saves: 28,
    isLiked: false,
    isSaved: false,
    isHidden: false,
    customerConsent: true,
    isAnonymous: true,
    customerName: null,
    note: 'Kalıcı ondülasyon, 6 ay kalıcı.',
    fromJob: false,
  },
  {
    id: 'p6',
    service: 'Saç Boyama',
    category: 'Renk',
    colorInfo: 'Bakır Kırmızı',
    price: 400,
    duration: 90,
    date: '1 Mayıs 2025',
    beforeEmoji: '😒',
    afterEmoji: '🎨',
    beforePhoto: null,
    afterPhoto: null,
    likes: 203,
    comments: 52,
    views: 1243,
    saves: 89,
    isLiked: true,
    isSaved: false,
    isHidden: false,
    customerConsent: true,
    isAnonymous: false,
    customerName: 'Selin A.',
    note: 'Bakır kırmızı tek renk boyama.',
    fromJob: true,
  },
];

type PortfolioItem = typeof DUMMY_PORTFOLIO[0];

// ─── TAM EKRAN DETAY MODALI ────────────────────────────────
function DetailModal({ visible, onClose, item }: {
  visible: boolean;
  onClose: () => void;
  item: PortfolioItem | null;
}) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setActiveTab('after');
      setIsLiked(item?.isLiked || false);
      setIsSaved(item?.isSaved || false);
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!item) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 1.4, tension: 80, friction: 4, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, tension: 80, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const categoryColors: Record<string, string> = {
    'Renk': '#A78BFA', 'Kesim': '#34D399', 'Bakım': '#60A5FA',
    'Şekillendirme': '#F472B6', 'Kimyasal': '#FB923C',
  };
  const catColor = categoryColors[item.category] || COLORS.primary;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[detailStyles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#140824', '#090514']} style={StyleSheet.absoluteFill} />

        {/* Kapat */}
        <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
          <Ionicons name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* Fotoğraf */}
          <View style={detailStyles.photoBox}>
            <LinearGradient
              colors={activeTab === 'before' ? ['#1A1C29', '#12141F'] : ['#2A1F3D', '#1A0F2E']}
              style={detailStyles.photoGradient}
            >
              <Text style={detailStyles.photoEmoji}>
                {activeTab === 'before' ? item.beforeEmoji : item.afterEmoji}
              </Text>

              {/* Önce/Sonra toggle — resmin üzerinde */}
              <View style={detailStyles.toggleWrapper}>
                <TouchableOpacity
                  style={[detailStyles.toggleBtn, activeTab === 'before' && detailStyles.toggleActive]}
                  onPress={() => setActiveTab('before')}
                >
                  <Text style={[detailStyles.toggleText, activeTab === 'before' && detailStyles.toggleActiveText]}>
                    Önce
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[detailStyles.toggleBtn, activeTab === 'after' && detailStyles.toggleActive]}
                  onPress={() => setActiveTab('after')}
                >
                  <Text style={[detailStyles.toggleText, activeTab === 'after' && detailStyles.toggleActiveText]}>
                    Sonra
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Kategori badge */}
              <View style={[detailStyles.catBadge, { backgroundColor: catColor + '33', borderColor: catColor + '66' }]}>
                <Text style={[detailStyles.catBadgeText, { color: catColor }]}>{item.category}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* İçerik */}
          <View style={detailStyles.content}>

            {/* Başlık satırı */}
            <View style={detailStyles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={detailStyles.serviceName}>{item.service}</Text>
                {item.colorInfo && (
                  <Text style={detailStyles.colorInfo}>{item.colorInfo}</Text>
                )}
              </View>
              <View style={detailStyles.priceBadge}>
                <Text style={detailStyles.priceText}>₺{item.price}</Text>
              </View>
            </View>

            {/* Detay badge'leri */}
            <View style={detailStyles.badgesRow}>
              <View style={detailStyles.badge}>
                <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                <Text style={detailStyles.badgeText}>{item.duration} dk</Text>
              </View>
              <View style={detailStyles.badge}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={detailStyles.badgeText}>{item.date}</Text>
              </View>
              {!item.isAnonymous && item.customerName && (
                <View style={detailStyles.badge}>
                  <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                  <Text style={detailStyles.badgeText}>{item.customerName}</Text>
                </View>
              )}
              {item.fromJob && (
                <View style={[detailStyles.badge, { borderColor: COLORS.primary + '44', backgroundColor: COLORS.primary + '11' }]}>
                  <Ionicons name="briefcase-outline" size={14} color={COLORS.primary} />
                  <Text style={[detailStyles.badgeText, { color: COLORS.primary }]}>Uygulama işi</Text>
                </View>
              )}
            </View>

            {/* Not */}
            {item.note && (
              <View style={detailStyles.noteBox}>
                <Text style={detailStyles.noteText}>{item.note}</Text>
              </View>
            )}

            {/* Aksiyon butonları */}
            <View style={detailStyles.actionsRow}>
              <TouchableOpacity style={detailStyles.actionBtn} onPress={handleLike}>
                <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                  <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? '#F87171' : COLORS.textSecondary} />
                </Animated.View>
                <Text style={detailStyles.actionCount}>{item.likes + (isLiked && !item.isLiked ? 1 : 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={detailStyles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
                <Text style={detailStyles.actionCount}>{item.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={detailStyles.actionBtn}>
                <Ionicons name="eye-outline" size={24} color={COLORS.textSecondary} />
                <Text style={detailStyles.actionCount}>{item.views}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={detailStyles.actionBtn} onPress={() => setIsSaved(!isSaved)}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={isSaved ? COLORS.primary : COLORS.textSecondary} />
                <Text style={detailStyles.actionCount}>{item.saves}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeBtn: { position: 'absolute', top: 56, left: SPACING.lg, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  photoBox: { width, height: width * 1.2 },
  photoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoEmoji: { fontSize: 120 },
  toggleWrapper: { position: 'absolute', bottom: SPACING.lg, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full, padding: 4 },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: RADIUS.full },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '600' },
  toggleActiveText: { color: COLORS.white, fontWeight: 'bold' },
  catBadge: { position: 'absolute', top: 60, right: SPACING.lg, paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full, borderWidth: 1 },
  catBadgeText: { fontSize: FONTS.small, fontWeight: '700' },
  content: { padding: SPACING.lg, gap: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  serviceName: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  colorInfo: { fontSize: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  priceBadge: { backgroundColor: COLORS.success + '22', paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.success + '44', alignSelf: 'flex-start' },
  priceText: { color: COLORS.success, fontWeight: '800', fontSize: FONTS.large },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  badgeText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  noteBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  noteText: { fontSize: FONTS.regular, color: COLORS.textMuted, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: SPACING.xl, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
});

// ─── YENİ ÇALIŞMA EKLE MODALI ──────────────────────────────
function AddPortfolioModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
}) {
  const [service, setService] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => {
        setService(''); setCategory(''); setPrice(''); setDuration(''); setNote(''); setIsAnonymous(false);
      });
    }
  }, [visible]);

  const handleAdd = () => {
    if (!service || !category || !price || !duration) {
      Alert.alert('Eksik Bilgi', 'Zorunlu alanları doldurun'); return;
    }
    onAdd({
      id: Date.now().toString(),
      service, category, price: parseInt(price), duration: parseInt(duration), note, isAnonymous,
      beforeEmoji: '😐', afterEmoji: '✨', beforePhoto: null, afterPhoto: null,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      likes: 0, comments: 0, views: 0, saves: 0,
      isLiked: false, isSaved: false, isHidden: false,
      customerConsent: true, fromJob: false, customerName: null, colorInfo: null,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={addStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[addStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          <View style={addStyles.dragHandle} />
          <Text style={addStyles.title}>Yeni Çalışma Ekle</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

            {/* Fotoğraf Seçimi */}
            <View style={addStyles.photosRow}>
              <TouchableOpacity style={addStyles.photoCard}>
                <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']} style={addStyles.photoCardInner}>
                  <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
                  <Text style={addStyles.photoCardLabel}>Öncesi</Text>
                  <Text style={addStyles.photoCardHint}>Fotoğraf seç</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={addStyles.arrowContainer}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={addStyles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </LinearGradient>
              </View>

              <TouchableOpacity style={addStyles.photoCard}>
                <LinearGradient colors={[COLORS.primary + '22', COLORS.primary + '08']} style={[addStyles.photoCardInner, { borderColor: COLORS.primary + '44' }]}>
                  <Ionicons name="sparkles-outline" size={36} color={COLORS.primary} />
                  <Text style={[addStyles.photoCardLabel, { color: COLORS.primary }]}>Sonrası</Text>
                  <Text style={addStyles.photoCardHint}>Fotoğraf seç</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={addStyles.form}>
              {/* Hizmet */}
              <View style={addStyles.field}>
                <Text style={addStyles.label}>Hizmet Adı *</Text>
                <TextInput
                  style={addStyles.input}
                  value={service}
                  onChangeText={setService}
                  placeholder="Balayage, Wolf Cut..."
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Kategori */}
              <View style={addStyles.field}>
                <Text style={addStyles.label}>Kategori *</Text>
                <View style={addStyles.chips}>
                  {['Kesim', 'Renk', 'Bakım', 'Şekillendirme', 'Kimyasal'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[addStyles.chip, category === cat && addStyles.chipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[addStyles.chipText, category === cat && addStyles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fiyat & Süre */}
              <View style={addStyles.row}>
                <View style={[addStyles.field, { flex: 1 }]}>
                  <Text style={addStyles.label}>Ücret (₺) *</Text>
                  <TextInput style={addStyles.input} value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, ''))} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={[addStyles.field, { flex: 1 }]}>
                  <Text style={addStyles.label}>Süre (dk) *</Text>
                  <TextInput style={addStyles.input} value={duration} onChangeText={(t) => setDuration(t.replace(/\D/g, ''))} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />
                </View>
              </View>

              {/* Not */}
              <View style={addStyles.field}>
                <Text style={addStyles.label}>Not</Text>
                <TextInput
                  style={[addStyles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="İşlem hakkında not..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>

              {/* Anonim */}
              <TouchableOpacity style={addStyles.anonRow} onPress={() => setIsAnonymous(!isAnonymous)}>
                <View style={[addStyles.checkbox, isAnonymous && addStyles.checkboxActive]}>
                  {isAnonymous && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                </View>
                <View>
                  <Text style={addStyles.anonTitle}>Müşteriyi anonim paylaş</Text>
                  <Text style={addStyles.anonSub}>Müşteri adı gizlenir</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={addStyles.footer}>
            <TouchableOpacity onPress={handleAdd}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={addStyles.submitBtn}>
                <Text style={addStyles.submitText}>Portfolyoya Ekle</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const addStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '92%', overflow: 'hidden', paddingHorizontal: SPACING.lg },
  dragHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginVertical: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: '900', color: COLORS.white, marginBottom: SPACING.xl },
  photosRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  photoCard: { flex: 1, aspectRatio: 1 },
  photoCardInner: { flex: 1, borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: SPACING.xs },
  photoCardLabel: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.textSecondary },
  photoCardHint: { fontSize: FONTS.small, color: COLORS.textMuted },
  arrowContainer: { paddingHorizontal: SPACING.md },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  form: { gap: SPACING.lg },
  field: { gap: SPACING.xs },
  label: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600', marginLeft: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: SPACING.md },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.textMuted, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  anonTitle: { fontSize: FONTS.regular, color: COLORS.white, fontWeight: '600' },
  anonSub: { fontSize: FONTS.small, color: COLORS.textMuted },
  footer: { paddingBottom: 40, paddingTop: SPACING.md },
  submitBtn: { borderRadius: RADIUS.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  submitText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});

// ─── GRID KARTI (BOŞLUKLU VE ÇERÇEVELİ) ───────────────────────
function GridCard({ item, onPress, onLongPress }: {
  item: PortfolioItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const categoryColors: Record<string, string> = {
    'Renk': '#A78BFA', 'Kesim': '#34D399', 'Bakım': '#60A5FA',
    'Şekillendirme': '#F472B6', 'Kimyasal': '#FB923C',
  };
  const catColor = categoryColors[item.category] || COLORS.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      activeOpacity={0.9}
    >
      <Animated.View style={[gridStyles.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Split — sol önce, sağ sonra */}
        <View style={gridStyles.splitBox}>
          <LinearGradient colors={['#1A1C29', '#12141F']} style={gridStyles.half}>
            <Text style={gridStyles.emojiSmall}>{item.beforeEmoji}</Text>
          </LinearGradient>
          <LinearGradient colors={['#2A1F3D', '#1A0F2E']} style={gridStyles.half}>
            <Text style={gridStyles.emojiLarge}>{item.afterEmoji}</Text>
          </LinearGradient>
          <View style={gridStyles.splitLine} />

          {/* Kategori nokta */}
          <View style={[gridStyles.catDot, { backgroundColor: catColor }]} />

          {/* Fiyat */}
          <View style={gridStyles.priceTag}>
            <Text style={gridStyles.priceText}>₺{item.price}</Text>
          </View>

          {/* Gizli overlay */}
          {item.isHidden && (
            <View style={gridStyles.hiddenOverlay}>
              <Ionicons name="eye-off" size={22} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </View>

        {/* Alt bilgi */}
        <View style={gridStyles.info}>
          <Text style={gridStyles.serviceName} numberOfLines={1}>{item.service}</Text>
          <View style={gridStyles.statsRow}>
            <View style={gridStyles.stat}>
              <Ionicons name="heart" size={11} color="#F87171" />
              <Text style={gridStyles.statText}>{item.likes}</Text>
            </View>
            <View style={gridStyles.stat}>
              <Ionicons name="eye-outline" size={11} color={COLORS.textMuted} />
              <Text style={gridStyles.statText}>{item.views}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const gridStyles = StyleSheet.create({
  card: { 
    width: GRID_ITEM_SIZE, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    overflow: 'hidden',
    borderRadius: RADIUS.md, // Köşeleri hafif yuvarlatıyoruz
    borderWidth: 1, // Sınır çizgisi eklendi
    borderColor: 'rgba(255,255,255,0.15)', // Sınır rengini belirginleştirdik
  },
  splitBox: { width: '100%', aspectRatio: 1, flexDirection: 'row', position: 'relative' },
  half: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emojiSmall: { fontSize: 22, opacity: 0.5 },
  emojiLarge: { fontSize: 32 },
  splitLine: { position: 'absolute', width: 1, height: '100%', left: '50%', backgroundColor: 'rgba(255,255,255,0.08)' },
  catDot: { position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderRadius: 4 },
  priceTag: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  priceText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },
  hiddenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center' },
  info: { paddingHorizontal: 6, paddingVertical: 5 },
  serviceName: { fontSize: 11, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 3 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 10, color: COLORS.textMuted },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserPortfolioScreen() {
  const { user } = useAuthStore();
  const [portfolio, setPortfolio] = useState(DUMMY_PORTFOLIO);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const handleLongPress = (item: PortfolioItem) => {
    Alert.alert(item.service, 'Ne yapmak istiyorsunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: item.isHidden ? 'Göster' : 'Gizle', onPress: () => setPortfolio(prev => prev.map(p => p.id === item.id ? { ...p, isHidden: !p.isHidden } : p)) },
      { text: 'Sil', style: 'destructive', onPress: () => setPortfolio(prev => prev.filter(p => p.id !== item.id)) },
    ]);
  };

  const totalLikes = portfolio.reduce((a, b) => a + b.likes, 0);
  const totalViews = portfolio.reduce((a, b) => a + b.views, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#140824', '#090514']} style={StyleSheet.absoluteFill} />

      <FlatList
        data={portfolio}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        // BOŞLUK STİLLERİ BURADA EKLENDİ
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_GAP }} // Kartlar arası yatay boşluk ve kenar boşluğu
        contentContainerStyle={{ gap: GRID_GAP, paddingBottom: 120 }} // Kartlar arası dikey boşluk
        ListHeaderComponent={
          <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: contentAnim }] }}>

            {/* ── PROFİL HEADER — Instagram tarzı ── */}
            <View style={styles.profileHeader}>

              {/* Avatar + İstatistikler */}
              <View style={styles.profileTop}>
                {/* Avatar */}
                <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
                      <Text style={styles.avatarEmoji}>✂️</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="add" size={14} color={COLORS.white} />
                  </View>
                </TouchableOpacity>

                {/* Sayılar — Instagram gibi */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{portfolio.length}</Text>
                    <Text style={styles.statLabel}>Çalışma</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{DUMMY_PROFILE.followers}</Text>
                    <Text style={styles.statLabel}>Takipçi</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalLikes}</Text>
                    <Text style={styles.statLabel}>Beğeni</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{totalViews}</Text>
                    <Text style={styles.statLabel}>Görüntü</Text>
                  </View>
                </View>
              </View>

              {/* Salon adı & bio */}
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.salonName}>{DUMMY_PROFILE.salonName}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFB844" />
                    <Text style={styles.ratingText}>{DUMMY_PROFILE.rating}</Text>
                  </View>
                </View>
                <Text style={styles.ownerName}>{DUMMY_PROFILE.ownerName}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.locationText}>{DUMMY_PROFILE.city}</Text>
                </View>
                <Text style={styles.bio}>{DUMMY_PROFILE.bio}</Text>

                {/* Uzmanlık etiketleri */}
                <View style={styles.specialtiesRow}>
                  {DUMMY_PROFILE.specialties.map((s) => (
                    <View key={s} style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Butonlar */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editProfileBtn}>
                  <Text style={styles.editProfileText}>Profili Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPostBtn} onPress={() => setShowAddModal(true)}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.addPostGradient}>
                    <Ionicons name="add" size={18} color={COLORS.white} />
                    <Text style={styles.addPostText}>Ekle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />
            </View>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <GridCard
            item={item}
            onPress={() => { setSelectedItem(item); setShowDetail(true); }}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Henüz çalışma yok</Text>
            <Text style={styles.emptyDesc}>İlk çalışmanı ekle!</Text>
          </View>
        }
      />

      <DetailModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        item={selectedItem}
      />
      <AddPortfolioModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(item) => setPortfolio([item, ...portfolio])}
      />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090514' },

  // Profil Header
  profileHeader: { paddingTop: 60, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.md },

  // Avatar
  avatarWrapper: { position: 'relative' },
  avatar: { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
  avatarEmoji: { fontSize: 38 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#090514' },

  // İstatistikler
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: FONTS.large, fontWeight: '900', color: COLORS.white },
  statLabel: { fontSize: 11, color: COLORS.textMuted },

  // Profil bilgileri
  profileInfo: { gap: SPACING.xs, marginBottom: SPACING.md },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  salonName: { fontSize: FONTS.xlarge, fontWeight: '900', color: COLORS.white },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFB844' + '22', paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#FFB844' + '44' },
  ratingText: { fontSize: FONTS.small, color: '#FFB844', fontWeight: 'bold' },
  ownerName: { fontSize: FONTS.regular, color: COLORS.textSecondary, fontWeight: '500' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: FONTS.small, color: COLORS.textMuted },
  bio: { fontSize: FONTS.regular, color: COLORS.textSecondary, lineHeight: 20 },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  specialtyChip: { backgroundColor: COLORS.primary + '22', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  specialtyText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // Aksiyon butonları
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  editProfileBtn: { flex: 1, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  editProfileText: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.white },
  addPostBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  addPostGradient: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 20 },
  addPostText: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.white },

  // Divider
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 2 },

  // Boş durum
  emptyState: { alignItems: 'center', marginTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  emptyDesc: { fontSize: FONTS.medium, color: COLORS.textMuted },
});