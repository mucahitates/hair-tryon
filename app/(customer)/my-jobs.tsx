// app/(customer)/my-jobs.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Modal, TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { createJob, listenCustomerJobs, updateJob, Job } from '../../src/services/customer/jobService';
import { updateBid } from '../../src/services/hairdresser/jobService';
import { createChat } from '../../src/services/customer/chatService';
import { sendMessage, sendSystemMessage } from '../../src/services/shared/messageService';
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, deleteDoc, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../src/services/firebase';

const { width, height } = Dimensions.get('window');

const SERVICE_CATEGORIES = [
  { id: '1', name: 'Kesim', emoji: '✂️' },
  { id: '2', name: 'Renk', emoji: '🎨' },
  { id: '3', name: 'Bakım', emoji: '💆' },
  { id: '4', name: 'Şekillendirme', emoji: '💨' },
  { id: '5', name: 'Uzatma', emoji: '✨' },
  { id: '6', name: 'Kimyasal', emoji: '🧪' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Teklif Bekleniyor', color: '#FFB844', bg: '#FFB84422' },
  open: { label: 'Teklif Bekleniyor', color: '#FFB844', bg: '#FFB84422' },
  paused: { label: 'Durduruldu', color: '#9A9AA0', bg: '#9A9AA022' },
  bidding: { label: 'Teklifler Var', color: '#A78BFA', bg: '#A78BFA22' },
  in_progress: { label: 'Devam Ediyor', color: '#60A5FA', bg: '#60A5FA22' },
  accepted: { label: 'Kabul Edildi', color: '#34D399', bg: '#34D39922' },
  completed: { label: 'Tamamlandı', color: '#34D399', bg: '#34D39922' },
  cancelled: { label: 'İptal Edildi', color: '#F87171', bg: '#F8717122' },
  expired: { label: 'Süresi Doldu', color: '#9A9AA0', bg: '#9A9AA022' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: COLORS.textMuted, bg: 'rgba(255,255,255,0.08)' };
  return (
    <View style={[badgeStyles.container, { backgroundColor: config.bg }]}>
      <View style={[badgeStyles.dot, { backgroundColor: config.color }]} />
      <Text style={[badgeStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── TEKLİF KARTI ──────────────────────────────────────────
function BidCard({ bid, job, hasAcceptedBid, onAccept, onReject, onChat, onCancelAccept, isLoading }: {
  bid: any;
  job: Job & { id: string };
  hasAcceptedBid: boolean;
  onAccept: () => void;
  onReject: () => void;
  onChat: () => void;
  onCancelAccept: () => void;
  isLoading: boolean;
}) {
  const router = useRouter();
  return (
    <View style={bidStyles.container}>
      <View style={bidStyles.header}>
        <TouchableOpacity
          style={bidStyles.hairdresserInfo}
          onPress={() => router.push(`/hairdresser/${bid.hairdresserId}` as any)}
          activeOpacity={0.7}
        >
          <View style={bidStyles.avatar}>
            <Text style={bidStyles.avatarEmoji}>{bid.hairdresserEmoji || '✂️'}</Text>
          </View>
          <View style={bidStyles.info}>
            <View style={bidStyles.nameRow}>
              <Text style={bidStyles.name}>{bid.hairdresserName || 'Kuaför'}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={bidStyles.price}>₺{bid.myPrice || bid.price || 0}</Text>
      </View>

      {bid.note ? <Text style={bidStyles.note} numberOfLines={2}>{bid.note}</Text> : null}

      {/* Bekleyen teklif ve henüz hiçbir teklif kabul edilmemişse */}
      {bid.status === 'pending' && !hasAcceptedBid && (
        <View style={bidStyles.actions}>
          <TouchableOpacity style={bidStyles.chatBtn} onPress={onChat} disabled={isLoading}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
            <Text style={bidStyles.chatBtnText}>Mesaj At</Text>
          </TouchableOpacity>
          <TouchableOpacity style={bidStyles.rejectBtn} onPress={onReject} disabled={isLoading}>
            <Text style={bidStyles.rejectBtnText}>Reddet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[bidStyles.acceptBtn, isLoading && { opacity: 0.6 }]}
            onPress={onAccept}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={bidStyles.acceptGradient}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Text style={bidStyles.acceptBtnText}>Kabul Et</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Başka bir teklif kabul edilmişse diğer bekleyen tekliflere uyarı ver */}
      {bid.status === 'pending' && hasAcceptedBid && (
        <View style={{ marginTop: SPACING.xs }}>
          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Başka bir teklif kabul edildi.</Text>
        </View>
      )}

      {/* Kabul Edilen Teklif ve İptal Butonu */}
      {bid.status === 'accepted' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <View style={[bidStyles.statusRow, { backgroundColor: '#34D399' + '18', flex: 1, marginTop: 0 }]}>
            <Ionicons name="checkmark-circle" size={14} color="#34D399" />
            <Text style={[bidStyles.statusRowText, { color: '#34D399' }]}>Teklif kabul edildi</Text>
          </View>
          <TouchableOpacity
            style={bidStyles.cancelAcceptBtn}
            onPress={onCancelAccept}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator size="small" color="#F87171" /> : <Text style={bidStyles.cancelAcceptBtnText}>İptal Et</Text>}
          </TouchableOpacity>
        </View>
      )}

      {bid.status === 'rejected' && (
        <View style={[bidStyles.statusRow, { backgroundColor: '#F87171' + '18' }]}>
          <Ionicons name="close-circle" size={14} color="#F87171" />
          <Text style={[bidStyles.statusRowText, { color: '#F87171' }]}>Teklif reddedildi</Text>
        </View>
      )}

      {bid.status === 'withdrawn' && (
        <View style={[bidStyles.statusRow, { backgroundColor: '#9A9AA0' + '18' }]}>
          <Ionicons name="remove-circle" size={14} color="#9A9AA0" />
          <Text style={[bidStyles.statusRowText, { color: '#9A9AA0' }]}>Teklif geri çekildi</Text>
        </View>
      )}

      {bid.status === 'cancelled' && (
        <View style={[bidStyles.statusRow, { backgroundColor: '#F87171' + '18' }]}>
          <Ionicons name="close-circle" size={14} color="#F87171" />
          <Text style={[bidStyles.statusRowText, { color: '#F87171' }]}>Teklif iptal edildi</Text>
        </View>
      )}
    </View>
  );
}

const bidStyles = StyleSheet.create({
  container: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm, marginTop: SPACING.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hairdresserInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 20 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  price: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  note: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44', backgroundColor: COLORS.primary + '11' },
  chatBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  rejectBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  rejectBtnText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  acceptBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  acceptGradient: { paddingVertical: 8, alignItems: 'center', justifyContent: 'center', minHeight: 32 },
  acceptBtnText: { fontSize: 11, color: COLORS.white, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md },
  statusRowText: { flex: 1, fontSize: FONTS.small, fontWeight: '600' },
  cancelAcceptBtn: { paddingVertical: 9, paddingHorizontal: 14, backgroundColor: '#F8717118', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#F8717144', justifyContent: 'center', alignItems: 'center' },
  cancelAcceptBtnText: { color: '#F87171', fontSize: 11, fontWeight: 'bold' }
});

// ─── AKTİF İLAN KARTI ──────────────────────────────────────
function ActiveJobCard({ job, bids, onPress }: {
  job: Job & { id: string };
  bids: any[];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isPaused = (job.status as string) === 'paused';
  const acceptedBid = bids.find(b => b.status === 'accepted');

  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Animated.View style={[jobStyles.card, { transform: [{ scale: scaleAnim }] }, isPaused && { opacity: 0.7 }]}>
        <View style={jobStyles.cardTop}>
          <View style={jobStyles.photoThumb}>
            {job.afterPhotoUrl ? (
              <Image source={{ uri: job.afterPhotoUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <LinearGradient colors={[COLORS.primary + '44', COLORS.primaryDark + '33']} style={jobStyles.photoThumbGradient}>
                <Text style={jobStyles.photoThumbEmoji}>✂️</Text>
              </LinearGradient>
            )}
          </View>
          <View style={jobStyles.cardInfo}>
            <Text style={jobStyles.serviceName}>{job.service}</Text>
            <Text style={jobStyles.serviceCategory}>{job.serviceCategory || 'Saç İşlemi'}</Text>
            <View style={jobStyles.cardMeta}>
              <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
              <Text style={jobStyles.metaText}>{job.customerCity}</Text>
              <Text style={jobStyles.metaDot}>·</Text>
              <Text style={jobStyles.metaText}>₺{job.budget}</Text>
            </View>
          </View>
          <View style={jobStyles.cardRight}>
            <StatusBadge status={bids.filter(b => b.status !== 'withdrawn' && b.status !== 'cancelled').length > 0 && !isPaused ? 'bidding' : (job.status as string)} />
          </View>
        </View>

        <View style={jobStyles.cardBottom}>
          <View style={jobStyles.bidCountRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.primary} />
            <Text style={jobStyles.bidCountText}>
              {bids.filter(b => b.status !== 'withdrawn' && b.status !== 'cancelled').length} teklif
            </Text>
          </View>

          {acceptedBid && (
            <View style={jobStyles.acceptedTag}>
              <Ionicons name="checkmark-circle" size={13} color="#34D399" />
              <Text style={jobStyles.acceptedTagText}>Kabul edildi</Text>
            </View>
          )}

          <View style={jobStyles.expandBtn}>
            <Text style={jobStyles.expandBtnText}>Detayları Gör</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const jobStyles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  photoThumb: { width: 56, height: 56, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  photoThumbGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoThumbEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  serviceCategory: { fontSize: FONTS.small, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  metaDot: { color: COLORS.textMuted, fontSize: 11 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  bidCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bidCountText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  acceptedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#34D399' + '18', paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full },
  acceptedTagText: { fontSize: 11, color: '#34D399', fontWeight: '600' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expandBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
});

// ─── İLAN DETAY MODALI ─────────────────────────────────────
function JobDetailModal({ visible, job, bids, onClose, onBidAction, onPause, onDelete }: {
  visible: boolean;
  job: (Job & { id: string }) | null;
  bids: any[];
  onClose: () => void;
  onBidAction: (bid: any, action: 'accept' | 'reject' | 'chat' | 'cancel_accept') => void;
  onPause: () => void;
  onDelete: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [loadingBidId, setLoadingBidId] = useState<string | null>(null);

  // Büyütülen fotoğrafın state'i
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    if (visible && job) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
      setExpandedImage(null);
    }
  }, [visible, job]);

  if (!job) return null;

  const isPaused = (job.status as string) === 'paused';
  const hasPhotos = job.beforePhotoUrl && job.afterPhotoUrl;

  const activeBids = bids.filter(b => b.status !== 'withdrawn' && b.status !== 'cancelled');
  const acceptedBid = bids.find(b => b.status === 'accepted');
  const isLocked = !!acceptedBid; // İlan onaylanmışsa yönetilemez (Pause/Delete kapatılır)

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[detailStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />
          <View style={detailStyles.handle} />

          <View style={detailStyles.header}>
            <View>
              <Text style={detailStyles.title}>İlan Detayları</Text>
              <StatusBadge status={activeBids.length > 0 && !isPaused ? 'bidding' : (job.status as string)} />
            </View>
            <View style={detailStyles.headerActions}>

              {isLocked ? (
                <View style={detailStyles.lockedBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />
                  <Text style={detailStyles.lockedBadgeText}>İlan Kilitli</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={detailStyles.actionBtn} onPress={onPause}>
                    <Ionicons name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'} size={22} color={isPaused ? '#34D399' : '#FFB844'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[detailStyles.actionBtn, { backgroundColor: '#F8717122', borderColor: '#F8717144' }]} onPress={() => { onClose(); setTimeout(onDelete, 300); }}>
                    <Ionicons name="trash-outline" size={20} color="#F87171" />
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.scrollContent}>
            {hasPhotos && (
              <View style={detailStyles.photosSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={detailStyles.photoBox}
                  onPress={() => setExpandedImage(job.beforePhotoUrl!)}
                >
                  <Image source={{ uri: job.beforePhotoUrl! }} style={detailStyles.photoImg} />
                  <View style={detailStyles.photoBadge} pointerEvents="none"><Text style={detailStyles.photoBadgeText}>Mevcut Saç</Text></View>
                </TouchableOpacity>
                <View style={detailStyles.photoArrow}>
                  <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={detailStyles.photoBox}
                  onPress={() => setExpandedImage(job.afterPhotoUrl!)}
                >
                  <Image source={{ uri: job.afterPhotoUrl! }} style={detailStyles.photoImg} />
                  <View style={[detailStyles.photoBadge, { backgroundColor: COLORS.primary }]} pointerEvents="none"><Text style={[detailStyles.photoBadgeText, { color: COLORS.white }]}>İstenen Model</Text></View>
                </TouchableOpacity>
              </View>
            )}

            <View style={detailStyles.infoCard}>
              <View style={detailStyles.infoRow}>
                <View>
                  <Text style={detailStyles.infoLabel}>Hizmet</Text>
                  <Text style={detailStyles.infoValue}>{job.service}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={detailStyles.infoLabel}>Bütçe</Text>
                  <Text style={[detailStyles.infoValue, { color: '#34D399' }]}>₺{job.budget}</Text>
                </View>
              </View>
              {job.note ? (
                <View style={detailStyles.noteBox}>
                  <Text style={detailStyles.infoLabel}>Müşteri Notu</Text>
                  <Text style={detailStyles.noteText}>{job.note}</Text>
                </View>
              ) : null}
            </View>

            <View style={detailStyles.bidsSection}>
              <Text style={detailStyles.bidsTitle}>Gelen Teklifler ({activeBids.length})</Text>
              {activeBids.length > 0 ? (
                activeBids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    job={job}
                    hasAcceptedBid={isLocked}
                    isLoading={loadingBidId === bid.id}
                    onAccept={async () => {
                      setLoadingBidId(bid.id);
                      await onBidAction(bid, 'accept');
                      setLoadingBidId(null);
                    }}
                    onReject={async () => {
                      setLoadingBidId(bid.id);
                      await onBidAction(bid, 'reject');
                      setLoadingBidId(null);
                    }}
                    onChat={() => {
                      onClose();
                      onBidAction(bid, 'chat');
                    }}
                    onCancelAccept={async () => {
                      setLoadingBidId(bid.id);
                      await onBidAction(bid, 'cancel_accept');
                      setLoadingBidId(null);
                    }}
                  />
                ))
              ) : (
                <View style={detailStyles.noBidsBox}>
                  <Ionicons name="time-outline" size={32} color={COLORS.textMuted} />
                  <Text style={detailStyles.noBidsText}>Henüz teklif gelmedi.</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Büyütülmüş Fotoğraf Modalı */}
          <Modal
            visible={expandedImage !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setExpandedImage(null)}
          >
            <TouchableOpacity
              style={detailStyles.expandedOverlay}
              activeOpacity={1}
              onPress={() => setExpandedImage(null)}
            >
              <TouchableOpacity style={detailStyles.expandedCloseBtn} onPress={() => setExpandedImage(null)}>
                <Ionicons name="close" size={28} color={COLORS.white} />
              </TouchableOpacity>

              {expandedImage && (
                <Image
                  source={{ uri: expandedImage }}
                  style={detailStyles.expandedImage}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </Modal>

        </Animated.View>
      </View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.90 },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  lockedBadgeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.lg, paddingBottom: 60 },
  photosSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl },
  photoBox: { width: '42%', aspectRatio: 3 / 4, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoBadge: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, borderRadius: RADIUS.md, alignItems: 'center' },
  photoBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: 'bold' },
  photoArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  noteBox: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  noteText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  bidsSection: { gap: SPACING.sm },
  bidsTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  noBidsBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
  noBidsText: { color: COLORS.textMuted, fontSize: FONTS.small },
  expandedOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  expandedImage: { width: '100%', height: '80%' },
  expandedCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});

// ─── GEÇMİŞ İŞ KARTI ──────────────────────────────────────
function PastJobCard({ job, onPress }: { job: Job & { id: string }; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[pastStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={pastStyles.left}>
          <View style={pastStyles.avatar}>
            {job.afterPhotoUrl ? (
              <Image source={{ uri: job.afterPhotoUrl }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
            ) : (
              <Text style={pastStyles.avatarEmoji}>✂️</Text>
            )}
          </View>
          <View style={pastStyles.info}>
            <Text style={pastStyles.serviceName}>{job.service}</Text>
            <Text style={pastStyles.meta}>₺{job.budget} · {job.customerCity}</Text>
          </View>
        </View>
        <View style={pastStyles.right}>
          <StatusBadge status={(job.status as string)} />
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const pastStyles = StyleSheet.create({
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 22 },
  info: { gap: 2 },
  serviceName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  meta: { fontSize: FONTS.small, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: 4 },
});

// ─── İLAN OLUŞTURMA MODALI ─────────────────────────────────
function CreateJobModal({ visible, onClose, onCreated, initialService = '', aiBeforePhoto = null, aiAfterPhoto = null }: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialService?: string;
  aiBeforePhoto?: string | null;
  aiAfterPhoto?: string | null;
}) {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    SERVICE_CATEGORIES.some(c => c.name === initialService) ? initialService : null
  );
  const [serviceName, setServiceName] = useState(initialService);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState(aiBeforePhoto ? 'Yapay zeka ile oluşturduğum bu saç modelini istiyorum. İlgili fotoğrafları ilana ekledim.' : '');
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setServiceName(initialService);
      setNotes(aiBeforePhoto ? 'Yapay zeka ile oluşturduğum bu saç modelini istiyorum. İlgili fotoğrafları ilana ekledim.' : '');
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
      setSelectedCategory(null); setServiceName(''); setBudget(''); setNotes('');
    }
  }, [visible, initialService, aiBeforePhoto]);

  const handleCreate = async () => {
    if ((!selectedCategory && !serviceName) || !budget || !user) {
      Alert.alert('Eksik', 'Lütfen kategori/stil ve bütçe alanlarını doldurun.');
      return;
    }

    setIsLoading(true);
    try {
      await createJob({
        customerId: user.uid,
        customerName: user.displayName,
        customerEmoji: '👤',
        customerCity: user.city || 'Belirtilmedi',
        customerRating: 5.0,
        customerJobCount: 0,
        service: serviceName || selectedCategory || 'Özel Kesim',
        colorPreference: null,
        budget: parseInt(budget),
        note: notes,
        tags: selectedCategory ? [selectedCategory] : ['AI Model'],
        status: 'open',
        beforePhotoUrl: aiBeforePhoto || null,
        afterPhotoUrl: aiAfterPhoto || null,
      });
      onCreated();
      onClose();
      Alert.alert('İlan Oluşturuldu! 🎉', 'Kuaförler tekliflerini gönderecek.');
    } catch {
      Alert.alert('Hata', 'İlan oluşturulamadı. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = (selectedCategory || serviceName.length > 0) && budget.length > 0;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={createStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[createStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />
          <View style={createStyles.handle} />
          <View style={createStyles.header}>
            <Text style={createStyles.title}>{aiBeforePhoto ? 'AI Modeli ile İlan Aç' : 'Yeni İlan Oluştur'}</Text>
            <TouchableOpacity onPress={onClose} style={createStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

            {aiBeforePhoto && aiAfterPhoto && (
              <View style={{ flexDirection: 'row', gap: 10, padding: SPACING.lg }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>Mevcut Saç</Text>
                  <Image source={{ uri: aiBeforePhoto }} style={{ width: '100%', height: 120, borderRadius: RADIUS.md }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>İstenen Model</Text>
                  <Image source={{ uri: aiAfterPhoto }} style={{ width: '100%', height: 120, borderRadius: RADIUS.md }} />
                </View>
              </View>
            )}

            <Text style={createStyles.sectionTitle}>Hizmet Kategorisi *</Text>
            <View style={createStyles.categoryGrid}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[createStyles.categoryChip, selectedCategory === cat.name && createStyles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={createStyles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[createStyles.categoryName, selectedCategory === cat.name && createStyles.categoryNameActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={createStyles.sectionTitle}>İstediğin Stil (opsiyonel)</Text>
            <View style={createStyles.inputWrapper}>
              <TextInput style={createStyles.input} placeholder="Örn: Balayage, Wolf Cut..." placeholderTextColor={COLORS.textMuted} value={serviceName} onChangeText={setServiceName} />
            </View>
            <Text style={createStyles.sectionTitle}>Bütçen *</Text>
            <View style={createStyles.inputWrapper}>
              <Text style={createStyles.currencySymbol}>₺</Text>
              <TextInput style={[createStyles.input, { flex: 1 }]} placeholder="0" placeholderTextColor={COLORS.textMuted} value={budget} onChangeText={(t) => setBudget(t.replace(/\D/g, ''))} keyboardType="numeric" />
            </View>
            <Text style={createStyles.sectionTitle}>Notlar (opsiyonel)</Text>
            <View style={[createStyles.inputWrapper, { alignItems: 'flex-start' }]}>
              <TextInput style={[createStyles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Kuaföre iletmek istediğin detaylar..." placeholderTextColor={COLORS.textMuted} value={notes} onChangeText={setNotes} multiline />
            </View>
          </ScrollView>
          <View style={createStyles.footer}>
            <TouchableOpacity style={[createStyles.createBtn, (!isValid || isLoading) && createStyles.createBtnDisabled]} onPress={handleCreate} disabled={!isValid || isLoading}>
              <LinearGradient colors={isValid ? [COLORS.primary, COLORS.primaryDark] : ['#444', '#333']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={createStyles.createBtnGradient}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : (<><Ionicons name="add-circle-outline" size={20} color={COLORS.white} /><Text style={createStyles.createBtnText}>İlan Oluştur</Text></>)}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  categoryEmoji: { fontSize: 16 },
  categoryName: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  categoryNameActive: { color: COLORS.primary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md },
  currencySymbol: { fontSize: FONTS.large, color: COLORS.primary, fontWeight: 'bold', marginRight: SPACING.sm },
  input: { paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular, width: '100%' },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  createBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  createBtnDisabled: { opacity: 0.5 },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, minHeight: 50 },
  createBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function MyJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<(Job & { id: string }) | null>(null);
  const [jobs, setJobs] = useState<(Job & { id: string })[]>([]);
  const [jobBids, setJobBids] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // AI Verileri
  const [aiData, setAiData] = useState<{ before: string | null; after: string | null; service: string }>({
    before: null, after: null, service: ''
  });

  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // AI yönlendirme yakalayıcısı
  useEffect(() => {
    if (params.autoCreate === 'true') {
      setAiData({
        before: (params.aiBeforePhoto as string) || null,
        after: (params.aiAfterPhoto as string) || null,
        service: (params.aiService as string) || '',
      });
      setTimeout(() => setShowCreateModal(true), 500);
      router.setParams({ autoCreate: '', aiBeforePhoto: '', aiAfterPhoto: '', aiService: '' });
    }
  }, [params]);

  // İlanları dinle
  useEffect(() => {
    if (!user) return;
    const unsub = listenCustomerJobs(user.uid, (fetchedJobs) => {
      setJobs(fetchedJobs as (Job & { id: string })[]);
      setIsLoading(false);
    });
    return unsub;
  }, [user]);

  // Her ilanın tekliflerini dinle
  useEffect(() => {
    if (jobs.length === 0) return;
    const unsubs: (() => void)[] = [];

    const activeJobs = jobs.filter(j =>
      (j.status as string) === 'open' || (j.status as string) === 'in_progress' || (j.status as string) === 'paused'
    );

    for (const job of activeJobs) {
      const q = query(
        collection(db, 'bids'),
        where('jobId', '==', job.id),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const bids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setJobBids(prev => ({ ...prev, [job.id!]: bids }));
      });
      unsubs.push(unsub);
    }

    return () => unsubs.forEach(u => u());
  }, [jobs]);

  const activeJobs = jobs.filter(j => (j.status as string) === 'open' || (j.status as string) === 'in_progress' || (j.status as string) === 'paused');
  const pastJobs = jobs.filter(j => (j.status as string) === 'completed' || (j.status as string) === 'cancelled');

  const handleTabChange = (tab: 'active' | 'past') => {
    Animated.spring(tabSlide, { toValue: tab === 'active' ? 0 : 1, tension: 70, friction: 10, useNativeDriver: false }).start();
    setActiveTab(tab);
  };

  const tabIndicatorLeft = tabSlide.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  // İlan durdur / başlat
  const handlePauseJob = (job: Job & { id: string }) => {
    const isPaused = (job.status as string) === 'paused';
    Alert.alert(
      isPaused ? 'İlanı Yayına Al' : 'İlanı Durdur',
      isPaused ? 'İlan yeniden yayına alınacak ve kuaförler görebilecek.' : 'İlan durdurulacak ve kuaförler göremeyecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: isPaused ? 'Yayına Al' : 'Durdur',
          onPress: async () => {
            await updateDoc(doc(db, 'jobs', job.id), { status: isPaused ? 'open' : 'paused' });
            if (selectedJob && selectedJob.id === job.id) setSelectedJob({ ...selectedJob, status: (isPaused ? 'open' : 'paused') as any });
          },
        },
      ]
    );
  };

  // İlan sil
  const handleDeleteJob = (job: Job & { id: string }) => {
    Alert.alert(
      'İlanı Sil', 'Bu ilan kalıcı olarak silinecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            setSelectedJob(null);
            await deleteDoc(doc(db, 'jobs', job.id));
          },
        },
      ]
    );
  };

  // ─── TEKLİF AKSİYONLARI ───
  const handleBidAction = async (job: Job & { id: string }, bid: any, action: 'accept' | 'reject' | 'chat' | 'cancel_accept') => {
    if (!user) return;

    // REDDETME DURUMU
    if (action === 'reject') {
      Alert.alert('Teklifi Reddet', `${bid.hairdresserName || 'Kuaför'} teklifini reddetmek istediğine emin misin?`, [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Reddet', style: 'destructive', onPress: async () => { await updateBid(bid.id, { status: 'rejected' }); } },
      ]);
      return;
    }

    // KABUL ETME DURUMU (Randevu Ekranına Yönlendirme)
    if (action === 'accept') {
      try {
        await updateBid(bid.id, { status: 'accepted' });
        await updateJob(job.id, { status: 'in_progress' as any });

        const chatId = await createChat({
          jobId: job.id,
          hairdresserPhotoUrl: bid.hairdresserPhotoUrl || null,
          customerId: user.uid,
          customerName: user.displayName || 'Müşteri',
          customerEmoji: '👤',
          hairdresserId: bid.hairdresserId || '',
          hairdresserName: bid.hairdresserName || 'Kuaför',
          hairdresserEmoji: bid.hairdresserEmoji || '✂️',
          jobService: job.service || 'Hizmet',
          jobStatus: 'accepted',
          bidPrice: bid.myPrice || bid.price || 0,
          customerBudget: job.budget || 0,
          appointmentDate: null,
          note: job.note || null,
          beforeEmoji: '😐',
          afterEmoji: '✨',
          isOnline: false,
        } as any);

        await updateBid(bid.id, { chatId });

        await sendSystemMessage(chatId, '✅ Teklif kabul edildi, müşteri randevu tarihi seçiyor...');

        setSelectedJob(null);

        Alert.alert(
          'Harika! 🎉',
          'Teklifi kabul ettiniz. Lütfen randevu gün ve saatinizi belirlemek için devam edin.',
          [
            {
              text: 'Takvime Git',
              onPress: () => router.push({
                pathname: '/(customer)/booking',
                params: {
                  hairdresserId: bid.hairdresserId,
                  jobId: job.id,
                  bidId: bid.id,
                  service: job.service
                }
              } as any)
            }
          ]
        );
      } catch (error) {
        console.error("TEKLİF KABUL ETME HATASI: ", error);
        Alert.alert('Hata', 'İşlem başarısız. Lütfen terminali kontrol edin.');
      }
      return;
    }

    // ONAYLANAN TEKLİFİ İPTAL ETME (Vazgeçme)
    if (action === 'cancel_accept') {
      Alert.alert(
        'Teklifi İptal Et',
        'Bu tekliften vazgeçmek istediğinize emin misiniz? İlanınız tekrar kuaförlere açılacaktır.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'İptal Et',
            style: 'destructive',
            onPress: async () => {
              try {
                await updateBid(bid.id, { status: 'cancelled' as any });
                await updateJob(job.id, { status: 'open' }); // İlan tekrar açıldı

                if (bid.chatId) {
                  await sendSystemMessage(bid.chatId, '❌ Müşteri tekliften vazgeçti ve iptal etti.');
                  await sendMessage(bid.chatId, user.uid, 'customer', 'Merhaba, maalesef bu işlemden vazgeçmek durumundayım. İyi çalışmalar.');
                }
                Alert.alert('İptal Edildi', 'Teklif iptal edildi, ilanınız yeniden açık hale geldi.');
              } catch (e) {
                console.error("İPTAL HATASI:", e);
                Alert.alert('Hata', 'İptal işlemi başarısız.');
              }
            }
          }
        ]
      );
      return;
    }

    // SOHBET BAŞLATMA
    if (action === 'chat') {
      if (bid.chatId) {
        router.push({ pathname: '/(customer)/chat/[chatId]', params: { chatId: bid.chatId } } as any);
        return;
      }
      try {
        const chatId = await createChat({
          
          jobId: job.id, customerId: user.uid, customerName: user.displayName || 'Müşteri', customerEmoji: '👤',
          hairdresserId: bid.hairdresserId || '', hairdresserName: bid.hairdresserName || 'Kuaför', hairdresserEmoji: bid.hairdresserEmoji || '✂️',
          jobService: job.service || '', jobStatus: bid.status === 'accepted' ? 'accepted' : 'bidding', bidPrice: bid.myPrice || bid.price || 0,
          customerBudget: job.budget || 0, appointmentDate: null, note: job.note || null, beforeEmoji: '😐', afterEmoji: '✨', isOnline: false,
        });
        await updateBid(bid.id, { chatId });
        router.push({ pathname: '/(customer)/chat/[chatId]', params: { chatId } } as any);
      } catch (error) {
        console.error("CHAT BAŞLATMA HATASI: ", error);
        Alert.alert('Hata', 'Sohbet başlatılamadı.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.orb1} />

      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>İşlerim</Text>
          <Text style={styles.subtitle}>{activeJobs.length} aktif ilan</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.addBtnGradient}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Aktif İlanlar</Text>
          {activeJobs.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{activeJobs.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('past')}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Geçmiş İşler</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>İlanlar yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'active' ? (
            activeJobs.length > 0 ? (
              <View style={styles.jobList}>
                {activeJobs.map((job) => (
                  <ActiveJobCard
                    key={job.id}
                    job={job}
                    bids={jobBids[job.id!] || []}
                    onPress={() => setSelectedJob(job)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <LinearGradient colors={[COLORS.primary + '22', COLORS.primaryDark + '11']} style={styles.emptyIcon}>
                  <Ionicons name="briefcase-outline" size={48} color={COLORS.primary} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>Henüz ilan yok</Text>
                <Text style={styles.emptyDesc}>İlan oluştur ve kuaförlerden teklif al</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGradient}>
                    <Ionicons name="add" size={18} color={COLORS.white} />
                    <Text style={styles.emptyBtnText}>İlan Oluştur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : (
            pastJobs.length > 0 ? (
              <View style={styles.jobList}>
                {pastJobs.map((job) => (
                  <PastJobCard key={job.id} job={job} onPress={() => setSelectedJob(job)} />
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
      )}

      {/* İlan Oluşturma Modalı */}
      <CreateJobModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setTimeout(() => setAiData({ before: null, after: null, service: '' }), 500);
        }}
        onCreated={() => setActiveTab('active')}
        initialService={aiData.service}
        aiBeforePhoto={aiData.before}
        aiAfterPhoto={aiData.after}
      />

      {/* İLAN DETAY MODALI */}
      <JobDetailModal
        visible={!!selectedJob}
        job={selectedJob}
        bids={selectedJob ? (jobBids[selectedJob.id] || []) : []}
        onClose={() => setSelectedJob(null)}
        onBidAction={(bid, action) => handleBidAction(selectedJob!, bid, action)}
        onPause={() => selectedJob && handlePauseJob(selectedJob)}
        onDelete={() => selectedJob && handleDeleteJob(selectedJob)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  addBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: 3, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, position: 'relative', height: 42 },
  tabIndicator: { position: 'absolute', top: 3, bottom: 3, width: '50%', backgroundColor: COLORS.primary, borderRadius: RADIUS.sm },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  tabText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },
  tabBadge: { backgroundColor: COLORS.white + '33', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
  jobList: { gap: SPACING.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.regular, color: COLORS.textMuted },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.xl },
  emptyBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});