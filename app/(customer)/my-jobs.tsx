// ─────────────────────────────────────────────────────────────
// İŞLERİM EKRANI (app/(customer)/my-jobs.tsx)
// ─────────────────────────────────────────────────────────────
// Müşterinin iş ilanları ve teklifleri
//
// SEKMELER:
// 1. Aktif — bekleyen/devam eden ilanlar + teklifler
// 2. Geçmiş — tamamlanan/iptal edilen işler
//
// BAĞLANTILAR:
// - authStore → kullanıcı bilgisi
// - Firestore: jobs/{jobId} → iş ilanları (şimdilik dummy)
// - Firestore: bids/{bidId} → teklifler (şimdilik dummy)
// - /hairdresser/[id] → kuaför profil sayfası (bid kartındaki avatar)
// - chat/[chatId] → sohbet ekranı
//
// YENİ İLAN OLUŞTURMA:
// - Sağ üstteki + butonu → CreateJobModal açılır
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİLER ─────────────────────────────────────────

// Firestore: jobs koleksiyonu — müşteriye ait aktif iş ilanları
const DUMMY_ACTIVE_JOBS = [
  {
    id: '1',
    serviceCategory: 'Renk',
    serviceName: 'Balayage',
    budget: 800,
    city: 'İstanbul',
    status: 'bidding',
    bidCount: 3,
    createdAt: '2 saat önce',
    expiresAt: '70 saat',
    generatedPhotoEmoji: '🌊',
    notes: 'Doğal görünümlü balayage istiyorum',
    bids: [
      {
        id: 'b1',
        hairdresserId: '1',           // /hairdresser/[id] için kullanılır
        hairdresserName: 'Salon Elegance',
        hairdresserEmoji: '💇‍♀️',
        price: 750,
        note: 'Merhaba! Balayage konusunda 5 yıllık deneyimim var.',
        rating: 4.8,
        status: 'pending',
      },
      {
        id: 'b2',
        hairdresserId: '2',
        hairdresserName: 'Modern Saç',
        hairdresserEmoji: '✨',
        price: 850,
        note: 'Doğal balayage konusunda uzmanım.',
        rating: 4.6,
        status: 'pending',
      },
      {
        id: 'b3',
        hairdresserId: '4',
        hairdresserName: 'Hair Lab',
        hairdresserEmoji: '🎨',
        price: 700,
        note: 'Uygun fiyata kaliteli hizmet sunuyoruz.',
        rating: 4.7,
        status: 'pending',
      },
    ],
  },
  {
    id: '2',
    serviceCategory: 'Kesim',
    serviceName: 'Wolf Cut',
    budget: 400,
    city: 'İstanbul',
    status: 'pending',
    bidCount: 0,
    createdAt: '1 gün önce',
    expiresAt: '48 saat',
    generatedPhotoEmoji: '🐺',
    notes: 'Wolf cut istiyorum, referans fotoğrafım var',
    bids: [],
  },
];

// Firestore: jobs koleksiyonu — tamamlanan/iptal edilen işler
const DUMMY_PAST_JOBS = [
  {
    id: '3',
    serviceCategory: 'Bakım',
    serviceName: 'Keratin Bakım',
    budget: 600,
    city: 'İstanbul',
    status: 'completed',
    hairdresserId: '3',
    hairdresserName: 'Style Studio',
    hairdresserEmoji: '👑',
    completedAt: '1 hafta önce',
    completedDate: '24 Mayıs 2025',
    paidPrice: 580,
    rating: 5,
    beforePhotoEmoji: '😐',         // Gerçek: jobs.originalPhotoUrl
    afterPhotoEmoji: '✨',           // Gerçek: jobs.generatedPhotoUrl
    notes: 'Saçlarım çok yıpranmıştı, keratin yaptırdım.',
    duration: '2 saat',
  },
  {
    id: '4',
    serviceCategory: 'Renk',
    serviceName: 'Tek Renk Boyama',
    budget: 400,
    city: 'İstanbul',
    status: 'cancelled',
    hairdresserId: '5',
    hairdresserName: 'Glam House',
    hairdresserEmoji: '💅',
    completedAt: '2 hafta önce',
    completedDate: '17 Mayıs 2025',
    paidPrice: 0,
    rating: 0,
    beforePhotoEmoji: '😐',
    afterPhotoEmoji: '❌',
    notes: 'Randevu günü iptal ettim.',
    duration: '-',
  },
];

// Hizmet kategorileri — yeni ilan oluştururken seçilir
const SERVICE_CATEGORIES = [
  { id: '1', name: 'Kesim', emoji: '✂️' },
  { id: '2', name: 'Renk', emoji: '🎨' },
  { id: '3', name: 'Bakım', emoji: '💆' },
  { id: '4', name: 'Şekillendirme', emoji: '💨' },
  { id: '5', name: 'Uzatma', emoji: '✨' },
  { id: '6', name: 'Kimyasal', emoji: '🧪' },
];

// ─── DURUM BADGE ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844', bg: '#FFB84422' },
    bidding: { label: 'Teklifler Var', color: '#A78BFA', bg: '#A78BFA22' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', bg: '#34D39922' },
    completed: { label: 'Tamamlandı', color: '#34D399', bg: '#34D39922' },
    cancelled: { label: 'İptal Edildi', color: '#F87171', bg: '#F8717122' },
    expired: { label: 'Süresi Doldu', color: '#9A9AA0', bg: '#9A9AA022' },
  }[status] || { label: status, color: COLORS.textMuted, bg: 'rgba(255,255,255,0.08)' };

  return (
    <View style={[badgeStyles.container, { backgroundColor: config.bg }]}>
      <View style={[badgeStyles.dot, { backgroundColor: config.color }]} />
      <Text style={[badgeStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── TEKLİF KARTI ──────────────────────────────────────────
// Aktif ilandaki her kuaför teklifi için kart
// Avatar/isme tıklayınca → /hairdresser/[hairdresserId] sayfasına gider
// Kabul Et → Firestore: bids.status = accepted (şimdilik stub)
// Reddet → Firestore: bids.status = rejected (şimdilik stub)
// Mesaj At → chat ekranına navigate eder
function BidCard({ bid, onAccept, onReject, onChat }: {
  bid: typeof DUMMY_ACTIVE_JOBS[0]['bids'][0];
  onAccept: () => void;
  onReject: () => void;
  onChat: () => void;
}) {
  const router = useRouter();

  return (
    <View style={bidStyles.container}>
      {/* Kuaför bilgisi — tıklayınca profil sayfasına gider */}
      <View style={bidStyles.header}>
        <TouchableOpacity
          style={bidStyles.hairdresserInfo}
          onPress={() => router.push(`/hairdresser/${bid.hairdresserId}` as any)}
          activeOpacity={0.7}
        >
          <View style={bidStyles.avatar}>
            <Text style={bidStyles.avatarEmoji}>{bid.hairdresserEmoji}</Text>
          </View>
          <View style={bidStyles.info}>
            <View style={bidStyles.nameRow}>
              <Text style={bidStyles.name}>{bid.hairdresserName}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </View>
            <View style={bidStyles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFB844" />
              <Text style={bidStyles.rating}>{bid.rating}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={bidStyles.price}>₺{bid.price}</Text>
      </View>

      {/* Teklif notu */}
      <Text style={bidStyles.note} numberOfLines={2}>{bid.note}</Text>

      {/* Aksiyon butonları */}
      <View style={bidStyles.actions}>
        {/* Mesaj at — chat ekranına gider */}
        <TouchableOpacity style={bidStyles.chatBtn} onPress={onChat}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
          <Text style={bidStyles.chatBtnText}>Mesaj At</Text>
        </TouchableOpacity>

        {/* Reddet — Firestore: bids.status = rejected */}
        <TouchableOpacity style={bidStyles.rejectBtn} onPress={onReject}>
          <Text style={bidStyles.rejectBtnText}>Reddet</Text>
        </TouchableOpacity>

        {/* Kabul Et — Firestore: bids.status = accepted, job.status = accepted */}
        <TouchableOpacity style={bidStyles.acceptBtn} onPress={onAccept}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={bidStyles.acceptGradient}
          >
            <Text style={bidStyles.acceptBtnText}>Kabul Et</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const bidStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Tıklanabilir kuaför bilgisi alanı
  hairdresserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: FONTS.small,
    color: '#FFB844',
    fontWeight: '600',
  },
  price: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  note: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    backgroundColor: COLORS.primary + '11',
  },
  chatBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  rejectBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rejectBtnText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '700',
  },
});

// ─── AKTİF İLAN KARTI ──────────────────────────────────────
// Aktif iş ilanı kartı — teklifleri açıp kapatır
function ActiveJobCard({ job, isExpanded, onToggle }: {
  job: typeof DUMMY_ACTIVE_JOBS[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const expandAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      tension: 70,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      onPress={onToggle}
      activeOpacity={1}
    >
      <Animated.View style={[jobStyles.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* Kart üst kısmı */}
        <View style={jobStyles.cardTop}>
          {/* AI önizleme thumbnail */}
          <View style={jobStyles.photoThumb}>
            <LinearGradient
              colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
              style={jobStyles.photoThumbGradient}
            >
              <Text style={jobStyles.photoThumbEmoji}>{job.generatedPhotoEmoji}</Text>
            </LinearGradient>
          </View>

          <View style={jobStyles.cardInfo}>
            <Text style={jobStyles.serviceName}>{job.serviceName}</Text>
            <Text style={jobStyles.serviceCategory}>{job.serviceCategory}</Text>
            <View style={jobStyles.cardMeta}>
              <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
              <Text style={jobStyles.metaText}>{job.city}</Text>
              <Text style={jobStyles.metaDot}>·</Text>
              <Text style={jobStyles.metaText}>₺{job.budget}</Text>
            </View>
          </View>

          <View style={jobStyles.cardRight}>
            <StatusBadge status={job.status} />
            <Text style={jobStyles.createdAt}>{job.createdAt}</Text>
          </View>
        </View>

        {/* Alt kısım — teklif sayısı + süre */}
        <View style={jobStyles.cardBottom}>
          <View style={jobStyles.bidCountRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.primary} />
            <Text style={jobStyles.bidCountText}>{job.bidCount} teklif</Text>
          </View>
          <View style={jobStyles.expiryRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={jobStyles.expiryText}>{job.expiresAt} kaldı</Text>
          </View>
          {job.bidCount > 0 && (
            <TouchableOpacity style={jobStyles.expandBtn} onPress={onToggle}>
              <Text style={jobStyles.expandBtnText}>
                {isExpanded ? 'Gizle' : 'Teklifleri Gör'}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Teklifler listesi */}
        {isExpanded && job.bids.length > 0 && (
          <Animated.View style={{ opacity: expandAnim }}>
            <View style={jobStyles.bidsContainer}>
              <Text style={jobStyles.bidsTitle}>Teklifler</Text>
              {job.bids.map((bid) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  onAccept={() => {}}
                  onReject={() => {}}
                  onChat={() => router.push('/chats' as any)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const jobStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardTop: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photoThumbGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumbEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 3 },
  serviceName: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  serviceCategory: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  metaDot: { color: COLORS.textMuted, fontSize: 11 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  createdAt: { fontSize: 10, color: COLORS.textMuted },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bidCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  expiryText: { fontSize: FONTS.small, color: COLORS.textMuted },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  expandBtnText: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bidsContainer: {
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bidsTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});

// ─── GEÇMİŞ İŞ DETAY MODALI ───────────────────────────────
// Geçmiş iş kartına tıklayınca açılır
// Öncesi/sonrası, fiyat, tarih, süre, puan detaylarını gösterir
// selectedJob → PastJobCard'dan gelen iş objesi
function PastJobDetailModal({ visible, job, onClose }: {
  visible: boolean;
  job: typeof DUMMY_PAST_JOBS[0] | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!job) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <Animated.View style={[detailStyles.container, { transform: [{ translateY: slideAnim }] }]}>

          {/* Başlık */}
          <View style={detailStyles.header}>
            <Text style={detailStyles.title}>İş Detayı</Text>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Durum badge */}
            <View style={detailStyles.statusRow}>
              <StatusBadge status={job.status} />
              <Text style={detailStyles.completedDate}>{job.completedDate}</Text>
            </View>

            {/* Öncesi / Sonrası fotoğraflar */}
            <View style={detailStyles.photosRow}>
              {/* Öncesi */}
              <View style={detailStyles.photoCard}>
                <Text style={detailStyles.photoLabel}>Öncesi</Text>
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={detailStyles.photoBox}
                >
                  {/* Gerçek uygulamada: Image source={{ uri: job.beforePhotoUrl }} */}
                  <Text style={detailStyles.photoEmoji}>{job.beforePhotoEmoji}</Text>
                </LinearGradient>
              </View>

              {/* Ok */}
              <View style={detailStyles.arrowContainer}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={detailStyles.arrowBg}
                >
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </View>

              {/* Sonrası */}
              <View style={detailStyles.photoCard}>
                <Text style={detailStyles.photoLabel}>Sonrası</Text>
                <LinearGradient
                  colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                  style={detailStyles.photoBox}
                >
                  {/* Gerçek uygulamada: Image source={{ uri: job.afterPhotoUrl }} */}
                  <Text style={detailStyles.photoEmoji}>{job.afterPhotoEmoji}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* İş detayları */}
            <View style={detailStyles.detailsCard}>

              {/* Hizmet */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="cut-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Hizmet</Text>
                  <Text style={detailStyles.detailValue}>{job.serviceName}</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Kuaför — tıklayınca profil sayfasına gider */}
              <TouchableOpacity
                style={detailStyles.detailRow}
                onPress={() => {
                  onClose();
                  router.push(`/hairdresser/${job.hairdresserId}` as any);
                }}
              >
                <View style={detailStyles.detailIcon}>
                  <Text style={{ fontSize: 18 }}>{job.hairdresserEmoji}</Text>
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Kuaför</Text>
                  <Text style={detailStyles.detailValue}>{job.hairdresserName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={detailStyles.divider} />

              {/* Tarih */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Tarih</Text>
                  <Text style={detailStyles.detailValue}>{job.completedDate}</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Süre */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Süre</Text>
                  <Text style={detailStyles.detailValue}>{job.duration}</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Ödenen fiyat */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Ödenen Fiyat</Text>
                  <Text style={[
                    detailStyles.detailValue,
                    job.paidPrice > 0 ? { color: COLORS.success } : { color: COLORS.textMuted }
                  ]}>
                    {job.paidPrice > 0 ? `₺${job.paidPrice}` : '-'}
                  </Text>
                </View>
              </View>

              {/* Puan — sadece tamamlanan işlerde */}
              {job.status === 'completed' && job.rating > 0 && (
                <>
                  <View style={detailStyles.divider} />
                  <View style={detailStyles.detailRow}>
                    <View style={detailStyles.detailIcon}>
                      <Ionicons name="star-outline" size={18} color="#FFB844" />
                    </View>
                    <View style={detailStyles.detailInfo}>
                      <Text style={detailStyles.detailLabel}>Verdiğin Puan</Text>
                      <View style={detailStyles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= job.rating ? 'star' : 'star-outline'}
                            size={16}
                            color="#FFB844"
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}

            </View>

            {/* Notlar */}
            {job.notes && (
              <View style={detailStyles.notesCard}>
                <Text style={detailStyles.notesTitle}>📝 Notlar</Text>
                <Text style={detailStyles.notesText}>{job.notes}</Text>
              </View>
            )}

            <View style={{ height: SPACING.xl }} />
          </ScrollView>

        </Animated.View>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A0533',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  completedDate: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
  },
  // Öncesi/sonrası fotoğraflar
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  photoCard: {
    flex: 1,
    gap: SPACING.xs,
  },
  photoLabel: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  photoBox: {
    aspectRatio: 3 / 4,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoEmoji: { fontSize: 48 },
  arrowContainer: { alignItems: 'center' },
  arrowBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Detaylar kartı
  detailsCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  // Notlar
  notesCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  notesTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  notesText: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

// ─── GEÇMİŞ İŞ KARTI ──────────────────────────────────────
// Tamamlanan veya iptal edilen iş kartı
// Tıklayınca PastJobDetailModal açılır
function PastJobCard({ job, onPress }: {
  job: typeof DUMMY_PAST_JOBS[0];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[pastStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={pastStyles.left}>
          <View style={pastStyles.avatar}>
            <Text style={pastStyles.avatarEmoji}>{job.hairdresserEmoji}</Text>
          </View>
          <View style={pastStyles.info}>
            <Text style={pastStyles.serviceName}>{job.serviceName}</Text>
            <Text style={pastStyles.hairdresserName}>{job.hairdresserName}</Text>
            <Text style={pastStyles.date}>{job.completedAt}</Text>
          </View>
        </View>

        <View style={pastStyles.right}>
          <StatusBadge status={job.status} />
          {job.status === 'completed' && job.rating > 0 && (
            <View style={pastStyles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= job.rating ? 'star' : 'star-outline'}
                  size={12}
                  color="#FFB844"
                />
              ))}
            </View>
          )}
          {job.paidPrice > 0 && (
            <Text style={pastStyles.price}>₺{job.paidPrice}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const pastStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  info: { gap: 2 },
  serviceName: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  hairdresserName: {
    fontSize: FONTS.small,
    color: COLORS.textSecondary,
  },
  date: { fontSize: 10, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: 4 },
  ratingRow: { flexDirection: 'row', gap: 2 },
  price: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});

// ─── YENİ İLAN OLUŞTURMA MODALI ────────────────────────────
// + butonuna tıklayınca açılır
// Firestore: jobs koleksiyonuna yeni döküman ekler (şimdilik stub)
function CreateJobModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      slideAnim.setValue(300);
      setSelectedCategory(null);
      setServiceName('');
      setBudget('');
      setNotes('');
    }
  }, [visible]);

  const handleCreate = () => {
    if (!selectedCategory || !budget) return;
    // TODO: Firestore'a yeni iş ilanı ekle
    // await addDoc(collection(db, 'jobs'), { ... })
    onClose();
  };

  const isValid = selectedCategory && budget.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={createStyles.overlay}>
        <Animated.View style={[createStyles.container, { transform: [{ translateY: slideAnim }] }]}>

          <View style={createStyles.header}>
            <Text style={createStyles.title}>Yeni İlan Oluştur</Text>
            <TouchableOpacity onPress={onClose} style={createStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Hizmet kategorisi */}
            <Text style={createStyles.sectionTitle}>Hizmet Kategorisi *</Text>
            <View style={createStyles.categoryGrid}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    createStyles.categoryChip,
                    selectedCategory === cat.name && createStyles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={createStyles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    createStyles.categoryName,
                    selectedCategory === cat.name && createStyles.categoryNameActive,
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* İstediğin stil */}
            <Text style={createStyles.sectionTitle}>İstediğin Stil (opsiyonel)</Text>
            <View style={createStyles.inputWrapper}>
              <TextInput
                style={createStyles.input}
                placeholder="Örn: Balayage, Wolf Cut..."
                placeholderTextColor={COLORS.textMuted}
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            {/* Bütçe */}
            <Text style={createStyles.sectionTitle}>Bütçen *</Text>
            <View style={createStyles.inputWrapper}>
              <Text style={createStyles.currencySymbol}>₺</Text>
              <TextInput
                style={[createStyles.input, { flex: 1 }]}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
            </View>

            {/* Notlar */}
            <Text style={createStyles.sectionTitle}>Notlar (opsiyonel)</Text>
            <View style={[createStyles.inputWrapper, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[createStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Kuaföre iletmek istediğin detaylar..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>

          <View style={createStyles.footer}>
            <TouchableOpacity
              style={[createStyles.createBtn, !isValid && createStyles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!isValid}
            >
              <LinearGradient
                colors={isValid ? [COLORS.primary, COLORS.primaryDark] : ['#444', '#333']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={createStyles.createBtnGradient}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                <Text style={createStyles.createBtnText}>İlan Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A0533',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
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
  sectionTitle: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary + '33',
    borderColor: COLORS.primary,
  },
  categoryEmoji: { fontSize: 16 },
  categoryName: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  categoryNameActive: { color: COLORS.primary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  currencySymbol: {
    fontSize: FONTS.large,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  input: {
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
    width: '100%',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  createBtnText: {
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function MyJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Seçili geçmiş iş — detay modalı için
  const [selectedPastJob, setSelectedPastJob] = useState<typeof DUMMY_PAST_JOBS[0] | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleTabChange = (tab: 'active' | 'past') => {
    Animated.spring(tabSlide, {
      toValue: tab === 'active' ? 0 : 1,
      tension: 70,
      friction: 10,
      useNativeDriver: false,
    }).start();
    setActiveTab(tab);
    setExpandedJobId(null);
  };

  const tabIndicatorLeft = tabSlide.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />

      {/* Üst bar */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>İşlerim</Text>
          <Text style={styles.subtitle}>{DUMMY_ACTIVE_JOBS.length} aktif ilan</Text>
        </View>
        {/* Yeni ilan oluştur — + butonu */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.addBtnGradient}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Sekme navigasyonu */}
      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Aktif İlanlar
          </Text>
          {DUMMY_ACTIVE_JOBS.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{DUMMY_ACTIVE_JOBS.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('past')}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Geçmiş İşler
          </Text>
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'active' ? (
          DUMMY_ACTIVE_JOBS.length > 0 ? (
            <View style={styles.jobList}>
              {DUMMY_ACTIVE_JOBS.map((job) => (
                <ActiveJobCard
                  key={job.id}
                  job={job}
                  isExpanded={expandedJobId === job.id}
                  onToggle={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
                style={styles.emptyIcon}
              >
                <Ionicons name="briefcase-outline" size={48} color={COLORS.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Henüz ilan yok</Text>
              <Text style={styles.emptyDesc}>
                AI ile saç modelini dene ve kuaförlerden teklif al
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyBtnGradient}
                >
                  <Ionicons name="add" size={18} color={COLORS.white} />
                  <Text style={styles.emptyBtnText}>İlan Oluştur</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        ) : (
          DUMMY_PAST_JOBS.length > 0 ? (
            <View style={styles.jobList}>
              {DUMMY_PAST_JOBS.map((job) => (
                <PastJobCard
                  key={job.id}
                  job={job}
                  // Tıklayınca detay modalı açılır
                  onPress={() => setSelectedPastJob(job)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Geçmiş iş yok</Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Yeni ilan oluşturma modalı */}
      <CreateJobModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Geçmiş iş detay modalı — selectedPastJob null değilse açılır */}
      <PastJobDetailModal
        visible={selectedPastJob !== null}
        job={selectedPastJob}
        onClose={() => setSelectedPastJob(null)}
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
  subtitle: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  addBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    position: 'relative',
    height: 42,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: COLORS.white + '33',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 160,
  },
  jobList: { gap: SPACING.md },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: SPACING.md,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    fontSize: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
  },
  emptyBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyBtnText: {
    fontSize: FONTS.regular,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});