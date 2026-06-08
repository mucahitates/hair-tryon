// ─────────────────────────────────────────────────────────────
// İŞLERİM EKRANI (app/(customer)/my-jobs.tsx)
// Firestore bağlantılı — gerçek zamanlı
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { createJob, listenCustomerJobs, updateJob, Job } from '../../src/services/customer/jobService';

// Olması gereken
import { listenJobBids } from '../../src/services/customer/jobService';
import { updateBid, Bid } from '../../src/services/hairdresser/jobService';
import { createChat } from '../../src/services/customer/chatService';
import { sendMessage, sendSystemMessage } from '../../src/services/shared/messageService';

const { width } = Dimensions.get('window');

// ─── SABİTLER ──────────────────────────────────────────────
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
  bidding: { label: 'Teklifler Var', color: '#A78BFA', bg: '#A78BFA22' },
  in_progress: { label: 'Devam Ediyor', color: '#60A5FA', bg: '#60A5FA22' },
  accepted: { label: 'Kabul Edildi', color: '#34D399', bg: '#34D39922' },
  completed: { label: 'Tamamlandı', color: '#34D399', bg: '#34D39922' },
  cancelled: { label: 'İptal Edildi', color: '#F87171', bg: '#F8717122' },
  expired: { label: 'Süresi Doldu', color: '#9A9AA0', bg: '#9A9AA022' },
};

// ─── DURUM BADGE ───────────────────────────────────────────
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
function BidCard({ bid, job, onAccept, onReject, onChat, isLoading }: {
  bid: Bid & { id: string };
  job: Job & { id: string };
  onAccept: () => void;
  onReject: () => void;
  onChat: () => void;
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
            <Text style={bidStyles.avatarEmoji}>{bid.hairdresserEmoji}</Text>
          </View>
          <View style={bidStyles.info}>
            <View style={bidStyles.nameRow}>
              <Text style={bidStyles.name}>{bid.hairdresserName}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={bidStyles.price}>₺{bid.price}</Text>
      </View>

      {bid.note ? (
        <Text style={bidStyles.note} numberOfLines={2}>{bid.note}</Text>
      ) : null}

      {bid.status === 'pending' && (
        <View style={bidStyles.actions}>
          <TouchableOpacity style={bidStyles.chatBtn} onPress={onChat} disabled={isLoading}>
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
            <Text style={bidStyles.chatBtnText}>Mesaj At</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={bidStyles.rejectBtn}
            onPress={onReject}
            disabled={isLoading}
          >
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
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={bidStyles.acceptBtnText}>Kabul Et</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {bid.status === 'accepted' && (
        <View style={[bidStyles.statusRow, { backgroundColor: '#34D399' + '18' }]}>
          <Ionicons name="checkmark-circle" size={14} color="#34D399" />
          <Text style={[bidStyles.statusRowText, { color: '#34D399' }]}>Teklif kabul edildi</Text>
        </View>
      )}

      {bid.status === 'rejected' && (
        <View style={[bidStyles.statusRow, { backgroundColor: '#F87171' + '18' }]}>
          <Ionicons name="close-circle" size={14} color="#F87171" />
          <Text style={[bidStyles.statusRowText, { color: '#F87171' }]}>Teklif reddedildi</Text>
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
  chatBtnSmall: { backgroundColor: COLORS.primary + '22', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full },
  chatBtnSmallText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
});

// ─── AKTİF İLAN KARTI ──────────────────────────────────────
function ActiveJobCard({ job, bids, isExpanded, onToggle, onBidAction }: {
  job: Job & { id: string };
  bids: (Bid & { id: string })[];
  isExpanded: boolean;
  onToggle: () => void;
  onBidAction: (bid: Bid & { id: string }, action: 'accept' | 'reject' | 'chat') => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [loadingBidId, setLoadingBidId] = useState<string | null>(null);

  const pendingBids = bids.filter(b => b.status === 'pending');
  const acceptedBid = bids.find(b => b.status === 'accepted');

  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      onPress={onToggle}
      activeOpacity={1}
    >
      <Animated.View style={[jobStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Üst kısım */}
        <View style={jobStyles.cardTop}>
          <View style={jobStyles.photoThumb}>
            <LinearGradient colors={[COLORS.primary + '44', COLORS.primaryDark + '33']} style={jobStyles.photoThumbGradient}>
              <Text style={jobStyles.photoThumbEmoji}>✂️</Text>
            </LinearGradient>
          </View>

          <View style={jobStyles.cardInfo}>
            <Text style={jobStyles.serviceName}>{job.service}</Text>
            <Text style={jobStyles.serviceCategory}>{job.serviceCategory || ''}</Text>
            <View style={jobStyles.cardMeta}>
              <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
              <Text style={jobStyles.metaText}>{job.customerCity}</Text>
              <Text style={jobStyles.metaDot}>·</Text>
              <Text style={jobStyles.metaText}>₺{job.budget}</Text>
            </View>
          </View>

          <View style={jobStyles.cardRight}>
            <StatusBadge status={bids.length > 0 ? 'bidding' : job.status} />
          </View>
        </View>

        {/* Alt kısım */}
        <View style={jobStyles.cardBottom}>
          <View style={jobStyles.bidCountRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.primary} />
            <Text style={jobStyles.bidCountText}>{bids.length} teklif</Text>
          </View>

          {acceptedBid && (
            <View style={[jobStyles.acceptedTag]}>
              <Ionicons name="checkmark-circle" size={13} color="#34D399" />
              <Text style={jobStyles.acceptedTagText}>Kabul edildi</Text>
            </View>
          )}

          {bids.length > 0 && (
            <TouchableOpacity style={jobStyles.expandBtn} onPress={onToggle}>
              <Text style={jobStyles.expandBtnText}>
                {isExpanded ? 'Gizle' : 'Teklifleri Gör'}
              </Text>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Teklifler */}
        {isExpanded && bids.length > 0 && (
          <View style={jobStyles.bidsContainer}>
            <Text style={jobStyles.bidsTitle}>Teklifler ({bids.length})</Text>
            {bids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                job={job}
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
                onChat={() => onBidAction(bid, 'chat')}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const jobStyles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  photoThumb: { width: 56, height: 56, borderRadius: RADIUS.md, overflow: 'hidden' },
  photoThumbGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoThumbEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  serviceCategory: { fontSize: FONTS.small, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  metaDot: { color: COLORS.textMuted, fontSize: 11 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  bidCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bidCountText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  acceptedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#34D399' + '18', paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full },
  acceptedTagText: { fontSize: 11, color: '#34D399', fontWeight: '600' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' as any },
  expandBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  bidsContainer: { gap: SPACING.xs, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  bidsTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
});

// ─── GEÇMİŞ İŞ KARTI ──────────────────────────────────────
function PastJobCard({ job, onPress }: {
  job: Job & { id: string };
  onPress: () => void;
}) {
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
            <Text style={pastStyles.avatarEmoji}>✂️</Text>
          </View>
          <View style={pastStyles.info}>
            <Text style={pastStyles.serviceName}>{job.service}</Text>
            <Text style={pastStyles.meta}>₺{job.budget} · {job.customerCity}</Text>
          </View>
        </View>
        <View style={pastStyles.right}>
          <StatusBadge status={job.status} />
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
function CreateJobModal({ visible, onClose, onCreated }: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
      setSelectedCategory(null);
      setServiceName('');
      setBudget('');
      setNotes('');
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!selectedCategory || !budget || !user) return;

    setIsLoading(true);
    try {
      await createJob({
        customerId: user.uid,
        customerName: user.displayName,
        customerEmoji: '👤',
        customerCity: user.city || 'Belirtilmedi',
        customerRating: 5.0,
        customerJobCount: 0,
        service: serviceName || selectedCategory,
        colorPreference: null,
        budget: parseInt(budget),
        note: notes,
        tags: [selectedCategory],
        status: 'open',
        beforePhotoUrl: null,
        afterPhotoUrl: null,
      });

      onCreated();
      onClose();
      Alert.alert('İlan Oluşturuldu! 🎉', 'Kuaförler tekliflerini gönderecek.');
    } catch (error) {
      Alert.alert('Hata', 'İlan oluşturulamadı. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = selectedCategory && budget.length > 0;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={createStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[createStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          <View style={createStyles.handle} />

          <View style={createStyles.header}>
            <Text style={createStyles.title}>Yeni İlan Oluştur</Text>
            <TouchableOpacity onPress={onClose} style={createStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

            {/* Kategori */}
            <Text style={createStyles.sectionTitle}>Hizmet Kategorisi *</Text>
            <View style={createStyles.categoryGrid}>
              {SERVICE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[createStyles.categoryChip, selectedCategory === cat.name && createStyles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Text style={createStyles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[createStyles.categoryName, selectedCategory === cat.name && createStyles.categoryNameActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stil adı */}
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
                onChangeText={(t) => setBudget(t.replace(/\D/g, ''))}
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
          </ScrollView>

          <View style={createStyles.footer}>
            <TouchableOpacity
              style={[createStyles.createBtn, (!isValid || isLoading) && createStyles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!isValid || isLoading}
            >
              <LinearGradient
                colors={isValid ? [COLORS.primary, COLORS.primaryDark] : ['#444', '#333']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={createStyles.createBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                    <Text style={createStyles.createBtnText}>İlan Oluştur</Text>
                  </>
                )}
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

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [jobs, setJobs] = useState<(Job & { id: string })[]>([]);
  const [jobBids, setJobBids] = useState<Record<string, (Bid & { id: string })[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Kullanıcının ilanlarını dinle
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
    const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'in_progress');

    for (const job of activeJobs) {
      const unsub = listenJobBids(job.id, (bids) => {
        setJobBids(prev => ({ ...prev, [job.id]: bids as (Bid & { id: string })[] }));
      });
      unsubs.push(unsub);
    }

    return () => unsubs.forEach(u => u());
  }, [jobs]);

  const activeJobs = jobs.filter(j => j.status === 'open' || j.status === 'in_progress');
  const pastJobs = jobs.filter(j => j.status === 'completed' || j.status === 'cancelled');

  const handleTabChange = (tab: 'active' | 'past') => {
    Animated.spring(tabSlide, { toValue: tab === 'active' ? 0 : 1, tension: 70, friction: 10, useNativeDriver: false }).start();
    setActiveTab(tab);
    setExpandedJobId(null);
  };

  const tabIndicatorLeft = tabSlide.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  // Teklif aksiyonları
  const handleBidAction = async (
    job: Job & { id: string },
    bid: Bid & { id: string },
    action: 'accept' | 'reject' | 'chat'
  ) => {
    if (!user) return;

    if (action === 'reject') {
      Alert.alert('Teklifi Reddet', `${bid.hairdresserName} teklifini reddetmek istediğine emin misin?`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            await updateBid(bid.id, { status: 'rejected' });
          },
        },
      ]);
      return;
    }

    if (action === 'accept') {
      try {
        // 1. Teklifi kabul et
        await updateBid(bid.id, { status: 'accepted' });

        // 2. İş ilanını güncelle
        await updateJob(job.id, { status: 'in_progress' });

        // 3. Chat oluştur
        const chatId = await createChat({
          jobId: job.id,
          customerId: user.uid,
          customerName: user.displayName,
          customerEmoji: '👤',
          hairdresserId: bid.hairdresserId,
          hairdresserName: bid.hairdresserName,
          hairdresserEmoji: bid.hairdresserEmoji,
          jobService: job.service,
          jobStatus: 'accepted',
          bidPrice: bid.price,
          customerBudget: job.budget,
          appointmentDate: null,
          note: job.note,
          beforeEmoji: '😐',
          afterEmoji: '✨',
          isOnline: false,
        });

        // 4. Bid'e chatId ekle
        await updateBid(bid.id, { chatId });

        // 5. Sistem mesajı gönder
        await sendSystemMessage(chatId, '✅ Teklif kabul edildi');
        await sendMessage(
          chatId,
          bid.hairdresserId,
          'hairdresser',
          `Merhaba ${user.displayName}! Teklifinizi kabul ettiğiniz için teşekkürler. Size en iyi hizmeti sunmak için sabırsızlanıyorum! 🎉`
        );

        Alert.alert('Teklif Kabul Edildi! 🎉', `${bid.hairdresserName} ile iletişime geçebilirsiniz.`, [
          { text: 'Mesaj At', onPress: () => router.push({ pathname: '/(customer)/chat/[chatId]', params: { chatId } } as any) },
          { text: 'Tamam' },
        ]);
      } catch (error) {
        Alert.alert('Hata', 'İşlem başarısız. Tekrar deneyin.');
      }
      return;
    }

    if (action === 'chat') {
      if (bid.chatId) {
        router.push({ pathname: '/(customer)/chat/[chatId]', params: { chatId: bid.chatId } } as any);
        return;
      }

      // chatId yoksa mevcut chatlerde bu job + hairdresser kombinasyonunu ara
      // Bulamazsa yeni chat oluştur
      try {
        const chatId = await createChat({
          jobId: job.id,
          customerId: user.uid,
          customerName: user.displayName,
          customerEmoji: '👤',
          hairdresserId: bid.hairdresserId,
          hairdresserName: bid.hairdresserName,
          hairdresserEmoji: bid.hairdresserEmoji,
          jobService: job.service,
          jobStatus: bid.status === 'accepted' ? 'accepted' : 'bidding',
          bidPrice: bid.price,
          customerBudget: job.budget,
          appointmentDate: null,
          note: job.note,
          beforeEmoji: '😐',
          afterEmoji: '✨',
          isOnline: false,
        });
        await updateBid(bid.id, { chatId });
        router.push({ pathname: '/(customer)/chat/[chatId]', params: { chatId } } as any);
      } catch (error) {
        Alert.alert('Hata', 'Sohbet başlatılamadı.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />

      {/* Header */}
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

      {/* Sekmeler */}
      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Aktif İlanlar
          </Text>
          {activeJobs.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeJobs.length}</Text>
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
                    bids={jobBids[job.id] || []}
                    isExpanded={expandedJobId === job.id}
                    onToggle={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    onBidAction={(bid, action) => handleBidAction(job, bid, action)}
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
                  <PastJobCard key={job.id} job={job} onPress={() => { }} />
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

      <CreateJobModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => setActiveTab('active')}
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