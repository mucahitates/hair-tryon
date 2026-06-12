// app/(customer)/hairdresser/[id].tsx veya app/hairdresser/[id].tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Modal, TextInput, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, collection, query, where,
  getDocs, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

type TabType = 'portfolio' | 'services' | 'reviews';

interface HairdresserProfile {
  id: string;
  salonName: string;
  ownerName: string;
  description: string;
  city: string;
  district: string;
  address?: string;
  phone?: string;
  instagram?: string;
  emoji: string;
  profileImageUrl?: string | null;
  specializations: string[];
  averageRating: number;
  totalJobs: number;
  followersCount: number;
  experience?: number;
  isOnline: boolean;
  ratings?: {
    communication: number;
    quality: number;
    punctuality: number;
    valueForMoney: number;
  };
  services?: Service[];
  workingHours?: Record<string, { isOpen: boolean; open: string; close: string }>;
}

interface PortfolioItem {
  id: string;
  hairdresserId: string;
  service: string;
  category: string;
  colorInfo?: string | null;
  price: number;
  duration: number;
  date: string;
  beforeEmoji: string;
  afterEmoji: string;
  likes: number;
  note?: string;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  imageUrl?: string | null;
}

interface Review {
  id: string;
  hairdresserId: string;
  reviewerName: string;
  reviewerEmoji: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

interface Service {
  id: string;
  category: string;
  name: string;
  price: number;
  duration: number;
}

const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={size}
          color="#FFB844"
        />
      ))}
    </View>
  );
}

// ─── PORTFOLYO GRID KARTI ──────────────────────────────────
function PortfolioGridCard({ item, onPress }: { item: PortfolioItem; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ITEM_SIZE = (width - (SPACING.lg * 2) - 12) / 2;

  const categoryColors: Record<string, string> = {
    'Renk': '#A78BFA',
    'Kesim': '#34D399',
    'Bakım': '#60A5FA',
    'Şekillendirme': '#F472B6',
    'Kimyasal': '#FB923C',
  };
  const catColor = categoryColors[item.category] || COLORS.primary;

  // Akıllı Fotoğraf Kontrolü (Hangi isimle kaydedildiyse otomatik eşleşir)
  const beforeImg = item.beforePhoto || item.beforePhotoUrl || item.beforeImageUrl;
  const afterImg = item.afterPhoto || item.afterPhotoUrl || item.afterImageUrl || item.imageUrl;
  const isSingleImage = !!item.imageUrl && !beforeImg && !item.afterPhotoUrl && !item.afterImageUrl;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      activeOpacity={0.9}
    >
      <Animated.View style={[{ width: ITEM_SIZE }, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[portGridStyles.cardContainer, { borderColor: catColor + '55', shadowColor: catColor }]}>

          {isSingleImage ? (
            <Image source={{ uri: item.imageUrl! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={portGridStyles.splitContainer}>
              <LinearGradient colors={['#1A1C29', '#12141F']} style={portGridStyles.halfSide}>
                {beforeImg ? (
                  <Image source={{ uri: beforeImg }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <Text style={portGridStyles.emojiBefore}>{item.beforeEmoji || '😐'}</Text>
                )}
              </LinearGradient>

              <LinearGradient colors={['#2A1F3D', '#1A0F2E']} style={portGridStyles.halfSide}>
                {afterImg ? (
                  <Image source={{ uri: afterImg }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <Text style={portGridStyles.emojiAfter}>{item.afterEmoji || '✨'}</Text>
                )}
              </LinearGradient>
              <View style={portGridStyles.centerDivider} />
            </View>
          )}

          <View style={[portGridStyles.topBadge, { backgroundColor: catColor + '33', borderColor: catColor + '55' }]}>
            <Text style={[portGridStyles.topBadgeText, { color: catColor }]}>{item.category}</Text>
          </View>
          <LinearGradient colors={['transparent', 'rgba(10, 5, 20, 0.98)']} style={portGridStyles.bottomOverlay}>
            <Text style={portGridStyles.serviceText} numberOfLines={1}>{item.service}</Text>
            <View style={portGridStyles.metaRow}>
              <View style={portGridStyles.metaItem}>
                <Ionicons name="heart" size={13} color="#F87171" />
                <Text style={portGridStyles.metaText}>{item.likes || 0}</Text>
              </View>
              <View style={portGridStyles.priceBadge}>
                <Text style={portGridStyles.priceText}>₺{item.price}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const portGridStyles = StyleSheet.create({
  cardContainer: { width: '100%', aspectRatio: 0.75, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1.5, backgroundColor: '#1A1C29', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  splitContainer: { flex: 1, flexDirection: 'row' },
  halfSide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emojiBefore: { fontSize: 26, opacity: 0.4 },
  emojiAfter: { fontSize: 36 },
  centerDivider: { position: 'absolute', width: 1.5, height: '100%', left: '50%', backgroundColor: 'rgba(255,255,255,0.15)' },
  topBadge: { position: 'absolute', top: 6, left: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  topBadgeText: { fontSize: 8, fontWeight: '900' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingTop: 32, paddingBottom: 10, justifyContent: 'flex-end' },
  serviceText: { fontSize: 12, fontWeight: '900', color: COLORS.white, marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  priceBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  priceText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
});

// ─── PORTFOLYO DETAY MODALI ────────────────────────────────
function PortfolioDetailModal({ visible, onClose, item, userId }: {
  visible: boolean; onClose: () => void; item: PortfolioItem | null; userId?: string;
}) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && item) {
      setActiveTab('after');
      setLikes(item.likes || 0);
      setIsLiked(false);
      setCommentText('');
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();

      // Yorumları dinle
      const { collection, query, where, orderBy, onSnapshot } = require('firebase/firestore');
      const q = query(
        collection(db, 'portfolioComments'),
        where('portfolioId', '==', item.id),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(q, (snap: any) => {
        setComments(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, item]);

  if (!item) return null;

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikes(prev => prev + (next ? 1 : -1));
    Animated.sequence([
      Animated.spring(likeAnim, { toValue: 1.4, tension: 80, friction: 4, useNativeDriver: true }),
      Animated.spring(likeAnim, { toValue: 1, tension: 80, friction: 4, useNativeDriver: true }),
    ]).start();
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'portfolio', item.id), {
        likes: likes + (next ? 1 : -1),
      });
    } catch (e) { console.error(e); }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !userId) return;
    setSendingComment(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'portfolioComments'), {
        portfolioId: item.id,
        hairdresserId: item.hairdresserId,
        userId,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      });
      setCommentText('');
    } catch (e) {
      Alert.alert('Hata', 'Yorum gönderilemedi.');
    } finally {
      setSendingComment(false);
    }
  };

  const beforeImg = item.beforePhoto || item.beforePhotoUrl || item.beforeImageUrl;
  const afterImg = item.afterPhoto || item.afterPhotoUrl || item.afterImageUrl || item.imageUrl;
  const isSingleImage = !!item.imageUrl && !beforeImg && !item.afterPhotoUrl && !item.afterImageUrl;
  const currentImage = activeTab === 'before' ? beforeImg : afterImg;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[portDetailStyles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#140824', '#090514']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={portDetailStyles.closeBtn} onPress={onClose}>
          <Ionicons name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
            <View style={portDetailStyles.photoBox}>
              {isSingleImage ? (
                <Image source={{ uri: item.imageUrl! }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              ) : (
                <LinearGradient
                  colors={activeTab === 'before' ? ['#1A1C29', '#12141F'] : ['#2A1F3D', '#1A0F2E']}
                  style={portDetailStyles.photoGradient}
                >
                  {currentImage ? (
                    <Image source={{ uri: currentImage }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                  ) : (
                    <Text style={portDetailStyles.photoEmoji}>
                      {activeTab === 'before' ? (item.beforeEmoji || '😐') : (item.afterEmoji || '✨')}
                    </Text>
                  )}
                  <View style={portDetailStyles.toggleWrapper}>
                    {['before', 'after'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[portDetailStyles.toggleBtn, activeTab === t && portDetailStyles.toggleActive]}
                        onPress={() => setActiveTab(t as 'before' | 'after')}
                      >
                        <Text style={[portDetailStyles.toggleText, activeTab === t && portDetailStyles.toggleActiveText]}>
                          {t === 'before' ? 'Önce' : 'Sonra'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </LinearGradient>
              )}
            </View>

            <View style={portDetailStyles.content}>
              <View style={portDetailStyles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={portDetailStyles.serviceName}>{item.service}</Text>
                  {item.colorInfo && <Text style={portDetailStyles.colorInfo}>{item.colorInfo}</Text>}
                </View>
                <View style={portDetailStyles.priceBadge}>
                  <Text style={portDetailStyles.priceText}>₺{item.price}</Text>
                </View>
              </View>

              <View style={portDetailStyles.badges}>
                <View style={portDetailStyles.badge}>
                  <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                  <Text style={portDetailStyles.badgeText}>{item.duration} dk</Text>
                </View>
                <View style={portDetailStyles.badge}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={portDetailStyles.badgeText}>{item.date}</Text>
                </View>
                <View style={portDetailStyles.badge}>
                  <Ionicons name="pricetag-outline" size={13} color={COLORS.textMuted} />
                  <Text style={portDetailStyles.badgeText}>{item.category}</Text>
                </View>
              </View>

              {item.note && (
                <View style={portDetailStyles.noteBox}>
                  <Text style={portDetailStyles.noteText}>{item.note}</Text>
                </View>
              )}

              {/* Beğeni */}
              <View style={portDetailStyles.actionsRow}>
                <TouchableOpacity style={portDetailStyles.actionBtn} onPress={handleLike}>
                  <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                    <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? '#F87171' : COLORS.textSecondary} />
                  </Animated.View>
                  <Text style={portDetailStyles.actionCount}>{likes}</Text>
                </TouchableOpacity>
                <View style={portDetailStyles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
                  <Text style={portDetailStyles.actionCount}>{comments.length}</Text>
                </View>
              </View>

              {/* Yorumlar */}
              <View style={portDetailStyles.commentsSection}>
                <Text style={portDetailStyles.commentsTitle}>Yorumlar</Text>
                {comments.length === 0 && (
                  <Text style={portDetailStyles.noComments}>Henüz yorum yok. İlk yorumu sen yap!</Text>
                )}
                {comments.map((c) => (
                  <View key={c.id} style={portDetailStyles.commentRow}>
                    <View style={portDetailStyles.commentAvatar}>
                      <Ionicons name="person" size={16} color={COLORS.primary} />
                    </View>
                    <View style={portDetailStyles.commentContent}>
                      <Text style={portDetailStyles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Yorum yaz */}
              {userId && (
                <View style={portDetailStyles.commentInput}>
                  <TextInput
                    style={portDetailStyles.commentTextInput}
                    placeholder="Yorum yaz..."
                    placeholderTextColor={COLORS.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={300}
                  />
                  <TouchableOpacity
                    style={[portDetailStyles.sendBtn, (!commentText.trim() || sendingComment) && { opacity: 0.4 }]}
                    onPress={handleSendComment}
                    disabled={!commentText.trim() || sendingComment}
                  >
                    {sendingComment
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : <Ionicons name="send" size={18} color={COLORS.white} />
                    }
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const portDetailStyles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeBtn: { position: 'absolute', top: 56, left: SPACING.lg, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  photoBox: { width, height: width * 1.1, backgroundColor: '#090514' },
  photoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoEmoji: { fontSize: 100 },
  toggleWrapper: { position: 'absolute', bottom: SPACING.lg, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: RADIUS.full, padding: 4 },
  toggleBtn: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: RADIUS.full },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '600' },
  toggleActiveText: { color: COLORS.white, fontWeight: 'bold' },
  content: { padding: SPACING.lg, gap: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  serviceName: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  colorInfo: { fontSize: FONTS.regular, color: COLORS.textSecondary, marginTop: 3 },
  priceBadge: { backgroundColor: '#34D399' + '22', paddingVertical: 7, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#34D399' + '44' },
  priceText: { color: '#34D399', fontWeight: '800', fontSize: FONTS.medium },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  noteBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md },
  noteText: { fontSize: FONTS.regular, color: COLORS.textMuted, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: SPACING.xl, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { fontSize: FONTS.small, color: COLORS.textMuted },
  commentsSection: { gap: SPACING.sm },
  commentsTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  noComments: { fontSize: FONTS.small, color: COLORS.textMuted },
  commentRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  commentContent: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.sm },
  commentText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm },
  commentTextInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.regular, maxHeight: 80, paddingVertical: 4 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});

// ─── RANDEVU MODALI ────────────────────────────────────────
function AppointmentModal({ visible, onClose, hairdresser, services, availability }: {
  visible: boolean; onClose: () => void; hairdresser: HairdresserProfile; services: Service[]; availability: Record<string, string[]>;
}) {
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setStep('service'); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setNote('');
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d;
  });

  const availableTimes = selectedDate ? (availability[selectedDate] || []) : [];

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    try {
      const { createAppointment } = await import('../../src/services/customer/appointmentService');
      const { useAuthStore } = await import('../../src/stores/authStore');
      const user = useAuthStore.getState().user;
      if (!user) return;

      await createAppointment({
        customerId: user.uid,
        customerName: user.displayName,
        customerEmoji: '👤',
        hairdresserId: hairdresser.id,
        hairdresserName: hairdresser.salonName,
        salonName: hairdresser.salonName,
        service: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        status: 'pending',
        chatId: null,
        note: note || null,
        beforePhotoUrl: null,
        afterPhotoUrl: null,
      });

      Alert.alert('Randevu Oluşturuldu! 🎉',
        `${hairdresser.salonName} ile ${selectedDate} tarihinde ${selectedTime} saatinde randevunuz oluşturuldu.`,
        [{ text: 'Tamam', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Hata', 'Randevu oluşturulamadı. Tekrar deneyin.');
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={aptStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[aptStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />
          <View style={aptStyles.handle} />
          <View style={aptStyles.header}>
            <TouchableOpacity onPress={() => { if (step === 'datetime') setStep('service'); else if (step === 'confirm') setStep('datetime'); else onClose(); }} style={aptStyles.backBtn}>
              <Ionicons name={step === 'service' ? 'close' : 'arrow-back'} size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={aptStyles.headerCenter}>
              <Text style={aptStyles.headerTitle}>Randevu Al</Text>
              <Text style={aptStyles.headerSub}>{hairdresser.salonName}</Text>
            </View>
            <View style={aptStyles.stepIndicator}>
              {['service', 'datetime', 'confirm'].map((s, i) => (
                <View key={s} style={[aptStyles.stepDot, { backgroundColor: ['service', 'datetime', 'confirm'].indexOf(step) >= i ? COLORS.primary : COLORS.border }]} />
              ))}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            {step === 'service' && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Hizmet Seçin</Text>
                {services.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.lg }}>Hizmet bilgisi bulunamadı.</Text>
                ) : services.map((service) => (
                  <TouchableOpacity key={service.id} style={[aptStyles.serviceCard, selectedService?.id === service.id && aptStyles.serviceCardActive]} onPress={() => setSelectedService(service)}>
                    <LinearGradient colors={selectedService?.id === service.id ? [COLORS.primary + '33', COLORS.primaryDark + '22'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']} style={aptStyles.serviceCardGradient}>
                      <View style={aptStyles.serviceCardLeft}>
                        <View style={aptStyles.serviceIconWrapper}>
                          <Ionicons name="cut-outline" size={18} color={COLORS.primary} />
                        </View>
                        <View>
                          <Text style={aptStyles.serviceName}>{service.name}</Text>
                          <View style={aptStyles.serviceMeta}>
                            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                            <Text style={aptStyles.serviceMetaText}>{service.duration} dk</Text>
                            <Text style={aptStyles.serviceMetaDot}>·</Text>
                            <Text style={aptStyles.serviceCategory}>{service.category}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={aptStyles.serviceCardRight}>
                        <Text style={aptStyles.servicePrice}>₺{service.price}</Text>
                        {selectedService?.id === service.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 'datetime' && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Tarih & Saat</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={aptStyles.dayScroll}>
                  {weekDays.map((day) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const avail = availability[dateStr] || [];
                    const isSelected = selectedDate === dateStr;
                    const hasSlots = avail.length > 0;
                    return (
                      <TouchableOpacity key={dateStr} style={[aptStyles.dayCard, isSelected && aptStyles.dayCardActive, !hasSlots && aptStyles.dayCardDisabled]} onPress={() => { if (hasSlots) { setSelectedDate(dateStr); setSelectedTime(null); } }} disabled={!hasSlots}>
                        <Text style={[aptStyles.dayCardName, isSelected && aptStyles.dayCardNameActive, !hasSlots && aptStyles.dayCardDisabledText]}>{TR_DAYS_SHORT[day.getDay()]}</Text>
                        <Text style={[aptStyles.dayCardNumber, isSelected && aptStyles.dayCardNumberActive, !hasSlots && aptStyles.dayCardDisabledText]}>{day.getDate()}</Text>
                        <Text style={[aptStyles.dayCardSlots, !hasSlots && aptStyles.dayCardDisabledText]}>{hasSlots ? `${avail.length} slot` : 'Dolu'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {selectedDate && (
                  <View style={aptStyles.timesSection}>
                    <Text style={aptStyles.timesSectionTitle}>Müsait Saatler</Text>
                    <View style={aptStyles.timesGrid}>
                      {availableTimes.map((time) => (
                        <TouchableOpacity key={time} style={[aptStyles.timeChip, selectedTime === time && aptStyles.timeChipActive]} onPress={() => setSelectedTime(time)}>
                          <Text style={[aptStyles.timeChipText, selectedTime === time && aptStyles.timeChipTextActive]}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <View style={aptStyles.noteSection}>
                  <Text style={aptStyles.noteLabel}>Not (opsiyonel)</Text>
                  <TextInput style={aptStyles.noteInput} value={note} onChangeText={setNote} placeholder="Kuaföre not bırakın..." placeholderTextColor={COLORS.textMuted} multiline maxLength={200} />
                </View>
              </View>
            )}

            {step === 'confirm' && selectedService && selectedDate && selectedTime && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Randevu Özeti</Text>
                <View style={aptStyles.confirmSalon}>
                  <LinearGradient colors={[COLORS.primary + '33', COLORS.primaryDark + '22']} style={aptStyles.confirmSalonGradient}>
                    <View style={aptStyles.confirmSalonAvatar}>
                      <Text style={{ fontSize: 28 }}>{hairdresser.emoji}</Text>
                    </View>
                    <View>
                      <Text style={aptStyles.confirmSalonName}>{hairdresser.salonName}</Text>
                      <Text style={aptStyles.confirmSalonLocation}>{hairdresser.district}, {hairdresser.city}</Text>
                    </View>
                  </LinearGradient>
                </View>
                <View style={aptStyles.confirmDetails}>
                  {[
                    { icon: 'cut-outline', label: 'Hizmet', value: selectedService.name },
                    { icon: 'calendar-outline', label: 'Tarih', value: `${new Date(selectedDate).getDate()} ${TR_MONTHS[new Date(selectedDate).getMonth()]}` },
                    { icon: 'time-outline', label: 'Saat', value: selectedTime },
                    { icon: 'hourglass-outline', label: 'Süre', value: `${selectedService.duration} dakika` },
                    { icon: 'cash-outline', label: 'Ücret', value: `₺${selectedService.price}` },
                  ].map((item, index, arr) => (
                    <View key={item.label}>
                      <View style={aptStyles.confirmDetailRow}>
                        <View style={aptStyles.confirmDetailIcon}>
                          <Ionicons name={item.icon as any} size={16} color={COLORS.primary} />
                        </View>
                        <View style={aptStyles.confirmDetailInfo}>
                          <Text style={aptStyles.confirmDetailLabel}>{item.label}</Text>
                          <Text style={[aptStyles.confirmDetailValue, item.label === 'Ücret' && { color: '#34D399' }]}>{item.value}</Text>
                        </View>
                      </View>
                      {index < arr.length - 1 && <View style={aptStyles.confirmDivider} />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={aptStyles.footer}>
            {step === 'service' && (
              <TouchableOpacity style={[aptStyles.nextBtn, !selectedService && aptStyles.nextBtnDisabled]} onPress={() => selectedService && setStep('datetime')} disabled={!selectedService}>
                <LinearGradient colors={selectedService ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={aptStyles.nextBtnGradient}>
                  <Text style={aptStyles.nextBtnText}>Devam Et</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            {step === 'datetime' && (
              <TouchableOpacity style={[aptStyles.nextBtn, (!selectedDate || !selectedTime) && aptStyles.nextBtnDisabled]} onPress={() => selectedDate && selectedTime && setStep('confirm')} disabled={!selectedDate || !selectedTime}>
                <LinearGradient colors={selectedDate && selectedTime ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={aptStyles.nextBtnGradient}>
                  <Text style={aptStyles.nextBtnText}>İncele</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            )}
            {step === 'confirm' && (
              <TouchableOpacity style={aptStyles.nextBtn} onPress={handleConfirm}>
                <LinearGradient colors={['#34D399', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={aptStyles.nextBtnGradient}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={aptStyles.nextBtnText}>Randevuyu Onayla</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const aptStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '92%', overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.small, color: COLORS.textMuted },
  stepIndicator: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepContent: { padding: SPACING.lg, gap: SPACING.md },
  stepTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  serviceCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  serviceCardActive: { borderColor: COLORS.primary },
  serviceCardGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  serviceCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  serviceIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  serviceMetaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  serviceMetaDot: { color: COLORS.textMuted, fontSize: 10 },
  serviceCategory: { fontSize: FONTS.small, color: COLORS.primary },
  serviceCardRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  servicePrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  dayScroll: { marginBottom: SPACING.md },
  dayCard: { width: 70, marginRight: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 3 },
  dayCardActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  dayCardDisabled: { opacity: 0.4 },
  dayCardName: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  dayCardNameActive: { color: COLORS.primary },
  dayCardNumber: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  dayCardNumberActive: { color: COLORS.primary },
  dayCardSlots: { fontSize: 10, color: '#34D399', fontWeight: '600' },
  dayCardDisabledText: { color: COLORS.textMuted },
  timesSection: { gap: SPACING.sm },
  timesSectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  timeChipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  timeChipText: { fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '600' },
  timeChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  noteSection: { gap: SPACING.xs },
  noteLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  noteInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.regular, minHeight: 80, textAlignVertical: 'top' },
  confirmSalon: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  confirmSalonGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  confirmSalonAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  confirmSalonName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  confirmSalonLocation: { fontSize: FONTS.small, color: COLORS.textMuted },
  confirmDetails: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  confirmDetailRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  confirmDetailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  confirmDetailInfo: { flex: 1 },
  confirmDetailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: 2 },
  confirmDetailValue: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  confirmDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  nextBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [hairdresser, setHairdresser] = useState<HairdresserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [existingChatId, setExistingChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [showAppointment, setShowAppointment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeServiceCategory, setActiveServiceCategory] = useState('Tümü');

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });

  // ─── Firestore'dan veri çek (GERÇEK ZAMANLI LİVE DİNLEYİCİ) ───
  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    const unsubs: (() => void)[] = [];

    try {
      // 1. Profil ve Hizmetleri Dinle
      const profileRef = doc(db, 'hairdresserProfiles', id);
      unsubs.push(onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const profData = docSnap.data();
          setHairdresser({
            id: docSnap.id,
            ...profData,
            ownerName: profData.ownerName || profData.bio || '',
            emoji: profData.emoji || '✂️',
          } as HairdresserProfile);

          if (profData.services) {
            const rawServices = profData.services as any[];
            setServices(rawServices.map(s => ({
              id: s.serviceId || s.id || '',
              category: s.category || 'Diğer',
              name: s.name || 'Hizmet',
              price: s.price || 0,
              duration: s.duration || 30,
            })));
          }
        }
        setIsLoading(false);
      }));

      // 2. Portfolyoyu Dinle (Gerçek resimler için)
      const portfolioQuery = query(
        collection(db, 'portfolio'),
        where('hairdresserId', '==', id)
      );
      unsubs.push(onSnapshot(portfolioQuery, (snap) => {
        console.log('PORTFOLIO COUNT:', snap.docs.length);
        const portItems = snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
        // Yeniden eskiye sıralama (createdAt alanı yoksa bile patlamaz)
        portItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setPortfolio(portItems);
      }));

      // 3. Yorumları Dinle
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('hairdresserId', '==', id)
      );
      unsubs.push(onSnapshot(reviewsQuery, (snap) => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      }));

      // 4. Müsaitlik Dinle
      const availRef = doc(db, 'availability', id);
      unsubs.push(onSnapshot(availRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAvailability(data.availableSlots || {});
        }
      }));

      // 5. Mevcut chat kontrolü
      const chatQuery = query(
        collection(db, 'chats'),
        where('customerId', '==', user?.uid || ''),
        where('hairdresserId', '==', id)
      );
      getDocs(chatQuery).then(chatSnap => {
        if (!chatSnap.empty) {
          setExistingChatId(chatSnap.docs[0].id);
        }
      });

      // 6. Takip durumu Dinle
      if (user?.uid) {
        const followRef = doc(db, 'follows', `${user.uid}_${id}`);
        unsubs.push(onSnapshot(followRef, (docSnap) => {
          setIsFollowing(docSnap.exists());
        }));
      }

    } catch (error) {
      console.error('Profil dinlenirken kritik hata:', error);
    }

    return () => unsubs.forEach(u => u());
  }, [id, user?.uid]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!hairdresser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 56, left: 20 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textPrimary, marginTop: SPACING.md, fontSize: FONTS.large }}>Profil bulunamadı</Text>
      </View>
    );
  }

  const serviceCategories = ['Tümü', ...Array.from(new Set(services.map(s => s.category)))];
  const filteredServices = activeServiceCategory === 'Tümü' ? services : services.filter(s => s.category === activeServiceCategory);

  const handleMessagePress = () => {
    if (existingChatId) {
      router.push({
        pathname: '/(customer)/chat/[chatId]',
        params: { chatId: existingChatId },
      } as any);
    } else {
      Alert.alert(
        'Sohbet Bulunamadı',
        'Bu kuaförle henüz bir sohbetiniz yok. Önce bir teklif kabul edin veya iş ilanı oluşturun.',
        [{ text: 'Tamam' }]
      );
    }
  };
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Sticky header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#1A0533EE', '#1A0533EE']} style={styles.stickyHeaderBg}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.stickyHeaderTitle}>{hairdresser.salonName}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.topBackBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* ── PROFİL BAŞLIĞI ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {/* GERÇEK PROFİL FOTOĞRAFI BAĞLANDI */}
            {(hairdresser.profileImageUrl || (hairdresser as any).avatarUri) ? (
              <Image source={{ uri: hairdresser.profileImageUrl || (hairdresser as any).avatarUri }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{hairdresser.emoji || '✂️'}</Text>
              </LinearGradient>
            )}
            {hairdresser.isOnline && <View style={styles.onlineDot} />}
          </View>

          <Text style={styles.salonName}>{hairdresser.salonName}</Text>
          <Text style={styles.ownerName}>{hairdresser.ownerName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.location}>{hairdresser.district}, {hairdresser.city}</Text>
          </View>

          <View style={styles.statsRow}>
            {[
              { value: hairdresser.totalJobs || 0, label: 'İş' },
              { value: hairdresser.averageRating || 5.0, label: 'Puan', isRating: true },
              { value: hairdresser.followersCount || 0, label: 'Takipçi' },
              { value: hairdresser.experience ? `${hairdresser.experience}y` : '-', label: 'Deneyim' },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={{ flexDirection: 'row', flex: 1 }}>
                <View style={styles.statItem}>
                  {stat.isRating ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color="#FFB844" />
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  ) : (
                    <Text style={styles.statValue}>{stat.value}</Text>
                  )}
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </View>
            ))}
          </View>

          {hairdresser.description ? (
            <Text style={styles.description}>{hairdresser.description}</Text>
          ) : null}

          {hairdresser.specializations?.length > 0 && (
            <View style={styles.specTags}>
              {hairdresser.specializations.map((spec) => (
                <View key={spec} style={styles.specTag}>
                  <Text style={styles.specTagText}>{spec}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={async () => {
                if (!user?.uid) return;
                const followId = `${user.uid}_${id}`;
                try {
                  const { deleteDoc, setDoc, doc: firestoreDoc, updateDoc, increment } = await import('firebase/firestore');
                  if (isFollowing) {
                    await deleteDoc(firestoreDoc(db, 'follows', followId));
                    await updateDoc(firestoreDoc(db, 'hairdresserProfiles', id), { followersCount: increment(-1) });
                  } else {
                    await setDoc(firestoreDoc(db, 'follows', followId), {
                      userId: user.uid, hairdresserId: id, salonName: hairdresser.salonName, emoji: hairdresser.emoji || '✂️', isOnline: hairdresser.isOnline, createdAt: Date.now(),
                    });
                    await updateDoc(firestoreDoc(db, 'hairdresserProfiles', id), { followersCount: increment(1) });
                  }
                } catch (e) { Alert.alert('Hata', 'İşlem gerçekleştirilemedi.'); }
              }}>
              <Ionicons name={isFollowing ? 'checkmark' : 'person-add-outline'} size={14} color={isFollowing ? COLORS.primary : COLORS.white} />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>{isFollowing ? 'Takip ' : 'Takip Et'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appointmentBtn} onPress={() => setShowAppointment(true)}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.appointmentGradient}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
                <Text style={styles.appointmentBtnText}>Randevu Al</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageBtn} onPress={handleMessagePress}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
              <Text style={styles.messageBtnText}>Mesaj</Text>
            </TouchableOpacity>
          </View>

          {hairdresser.ratings && (
            <View style={styles.ratingDetails}>
              {[
                { label: 'İletişim', value: hairdresser.ratings.communication },
                { label: 'Kalite', value: hairdresser.ratings.quality },
                { label: 'Dakiklik', value: hairdresser.ratings.punctuality },
                { label: 'Fiyat/Kalite', value: hairdresser.ratings.valueForMoney },
              ].map((r) => (
                <View key={r.label} style={styles.ratingDetailItem}>
                  <Text style={styles.ratingDetailLabel}>{r.label}</Text>
                  <View style={styles.ratingDetailBar}>
                    <View style={[styles.ratingDetailFill, { width: `${(r.value / 5) * 100}%` as any }]} />
                  </View>
                  <Text style={styles.ratingDetailValue}>{r.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'portfolio', label: 'Portfolyo', icon: 'grid-outline' },
            { key: 'services', label: 'Hizmetler', icon: 'cut-outline' },
            { key: 'reviews', label: 'Yorumlar', icon: 'star-outline' },
          ].map((tab) => (
            <TouchableOpacity key={tab.key} style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]} onPress={() => setActiveTab(tab.key as TabType)}>
              <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'portfolio' && (
          portfolio.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="images-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTabText}>Henüz portfolyo yok</Text>
            </View>
          ) : (
            <View style={styles.portfolioGrid}>
              {portfolio.map((item) => (
                <PortfolioGridCard key={item.id} item={item} onPress={() => setSelectedPortfolio(item)} />
              ))}
            </View>
          )
        )}

        {activeTab === 'services' && (
          <View style={styles.servicesContainer}>
            {services.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="cut-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTabText}>Henüz hizmet eklenmemiş</Text>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {serviceCategories.map((cat) => (
                    <TouchableOpacity key={cat} style={[styles.categoryChip, activeServiceCategory === cat && styles.categoryChipActive]} onPress={() => setActiveServiceCategory(cat)}>
                      <Text style={[styles.categoryChipText, activeServiceCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.serviceList}>
                  {filteredServices.map((item) => (
                    <View key={item.id} style={styles.serviceCard}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <View style={styles.serviceMeta}>
                          <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                          <Text style={styles.serviceDuration}>{item.duration} dk</Text>
                        </View>
                      </View>
                      <Text style={styles.servicePrice}>₺{item.price}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {hairdresser.workingHours && (
              <>
                <Text style={styles.workingHoursTitle}>Çalışma Saatleri</Text>
                <View style={styles.workingHoursList}>
                  {Object.entries(hairdresser.workingHours).map(([day, hours]) => (
                    <View key={day} style={styles.workingHourItem}>
                      <Text style={styles.workingHourDay}>{day}</Text>
                      <Text style={[styles.workingHourTime, !hours.isOpen && styles.workingHourClosed]}>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Kapalı'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {reviews.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="star-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTabText}>Henüz yorum yok</Text>
              </View>
            ) : reviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarEmoji}>{item.reviewerEmoji || '👤'}</Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{item.reviewerName}</Text>
                    <View style={styles.reviewMeta}>
                      <StarRating rating={item.rating} size={12} />
                      <Text style={styles.reviewDate}>{item.date}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reviewServiceBadge}>
                  <Text style={styles.reviewServiceText}>{item.service}</Text>
                </View>
                <Text style={styles.reviewComment}>{item.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <AppointmentModal visible={showAppointment} onClose={() => setShowAppointment(false)} hairdresser={hairdresser} services={services} availability={availability} />
      <PortfolioDetailModal
        visible={selectedPortfolio !== null}
        onClose={() => setSelectedPortfolio(null)}
        item={selectedPortfolio}
        userId={user?.uid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, justifyContent: 'space-between', columnGap: 12, rowGap: 16, paddingBottom: SPACING.xl },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  stickyHeaderBg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg },
  stickyHeaderTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  scrollContent: { paddingBottom: 160 },
  topBackBtn: { marginTop: 56, marginLeft: SPACING.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary, overflow: 'hidden' },
  avatarEmoji: { fontSize: 48 },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  salonName: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 3 },
  ownerName: { fontSize: FONTS.regular, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.lg },
  location: { fontSize: FONTS.small, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, width: '100%' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  description: { fontSize: FONTS.small, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  specTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.xs, marginBottom: SPACING.lg },
  specTag: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: COLORS.primary + '22', borderWidth: 1, borderColor: COLORS.primary + '44' },
  specTagText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg, width: '100%' },
  followBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: COLORS.border },
  followingBtn: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  followBtnText: { fontSize: 11, color: COLORS.textPrimary, fontWeight: '700' },
  followingBtnText: { color: COLORS.primary },
  appointmentBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  appointmentGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  appointmentBtnText: { fontSize: 11, color: COLORS.white, fontWeight: '700' },
  messageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '22', borderWidth: 1, borderColor: COLORS.primary + '44' },
  messageBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  ratingDetails: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.lg },
  ratingDetailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ratingDetailLabel: { fontSize: FONTS.small, color: COLORS.textSecondary, width: 80 },
  ratingDetailBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  ratingDetailFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  ratingDetailValue: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: 'bold', width: 28, textAlign: 'right' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '700' },
  emptyTab: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTabText: { fontSize: FONTS.regular, color: COLORS.textMuted },
  servicesContainer: { paddingHorizontal: SPACING.lg },
  categoryScroll: { gap: SPACING.sm, marginBottom: SPACING.md },
  categoryChip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  categoryChipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  categoryChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  serviceList: { gap: SPACING.sm, marginBottom: SPACING.xl },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md },
  serviceInfo: { gap: 4 },
  serviceName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceDuration: { fontSize: FONTS.small, color: COLORS.textMuted },
  servicePrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  workingHoursTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  workingHoursList: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.xl },
  workingHourItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  workingHourDay: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  workingHourTime: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: '600' },
  workingHourClosed: { color: COLORS.error },
  reviewsContainer: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md, gap: SPACING.sm },
  reviewHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarEmoji: { fontSize: 22 },
  reviewerInfo: { gap: 4 },
  reviewerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewDate: { fontSize: 11, color: COLORS.textMuted },
  reviewServiceBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primary + '22', paddingVertical: 3, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  reviewServiceText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  reviewComment: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
});