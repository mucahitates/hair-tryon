// ─────────────────────────────────────────────────────────────
// KUAFÖR SOHBET DETAY (app/(hairdresser)/chat/[chatId].tsx)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../../src/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_CHAT_INFO: Record<string, {
  id: string;
  customerId: string;
  customerName: string;
  customerEmoji: string;
  isOnline: boolean;
  jobService: string;
  jobStatus: string;
  bidPrice: number;
  customerBudget: number;
  appointmentDate: string | null;
  note: string | null;
  beforeEmoji: string;
  afterEmoji: string;
}> = {
  chat1: {
    id: 'chat1', customerId: 'c1', customerName: 'Ayşe Kaya', customerEmoji: '👩',
    isOnline: true, jobService: 'Balayage', jobStatus: 'bidding',
    bidPrice: 750, customerBudget: 800, appointmentDate: null,
    note: 'Doğal görünümlü, yüzüme uygun bir balayage istiyorum.',
    beforeEmoji: '😐', afterEmoji: '✨',
  },
  chat2: {
    id: 'chat2', customerId: 'c2', customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱',
    isOnline: false, jobService: 'Keratin Bakım', jobStatus: 'accepted',
    bidPrice: 580, customerBudget: 600, appointmentDate: '24 Mayıs, 14:00',
    note: 'Saçlarım çok kuru, keratin sonrası düzgün görünüm istiyorum.',
    beforeEmoji: '😔', afterEmoji: '💫',
  },
  chat3: {
    id: 'chat3', customerId: 'c3', customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰',
    isOnline: true, jobService: 'Wolf Cut', jobStatus: 'pending',
    bidPrice: 350, customerBudget: 400, appointmentDate: null,
    note: 'Wolf cut yaptırmak istiyorum, layered ve textured bir kesim.',
    beforeEmoji: '😶', afterEmoji: '🔥',
  },
  chat4: {
    id: 'chat4', customerId: 'c4', customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
    isOnline: false, jobService: 'Ombre', jobStatus: 'pending',
    bidPrice: 700, customerBudget: 700, appointmentDate: null,
    note: 'Koyu kahveden sarıya geçiş istiyorum.',
    beforeEmoji: '😑', afterEmoji: '🌟',
  },
};

const DUMMY_MESSAGES: Record<string, any[]> = {
  chat1: [
    { id: 'm1', senderId: 'c1', senderRole: 'customer', text: 'Merhaba! Balayage için teklif almak istiyorum.', messageType: 'text', isRead: true, createdAt: '14:10' },
    { id: 'm2', senderId: 'h1', senderRole: 'hairdresser', text: 'Merhaba! İlanınızı inceledim, size yardımcı olabilirim.', messageType: 'text', isRead: true, createdAt: '14:15' },
    { id: 'm3', senderId: 'h1', senderRole: 'hairdresser', text: 'Balayage için fiyatımız 750₺ olacak.', messageType: 'text', isRead: true, createdAt: '14:20' },
    { id: 'm4', senderId: 'system', senderRole: 'system', text: '💼 Teklif verildi: ₺750', messageType: 'system', isRead: true, createdAt: '14:20' },
    { id: 'm5', senderId: 'c1', senderRole: 'customer', text: 'Teşekkürler, düşüneceğim.', messageType: 'text', isRead: true, createdAt: '14:32' },
  ],
  chat2: [
    { id: 'm1', senderId: 'system', senderRole: 'system', text: '✅ Teklif kabul edildi', messageType: 'system', isRead: true, createdAt: 'Dün 10:00' },
    { id: 'm2', senderId: 'h1', senderRole: 'hairdresser', text: "Randevunuz onaylandı! 24 Mayıs saat 14:00'de sizi bekliyoruz 🎉", messageType: 'text', isRead: true, createdAt: 'Dün 10:05' },
    { id: 'm3', senderId: 'system', senderRole: 'system', text: '📅 Randevu oluşturuldu: 24 Mayıs, 14:00', messageType: 'system', isRead: true, createdAt: 'Dün 10:05' },
    { id: 'm4', senderId: 'c2', senderRole: 'customer', text: 'Teşekkürler, o saatte orada olacağım!', messageType: 'text', isRead: true, createdAt: 'Dün 10:10' },
  ],
  chat3: [
    { id: 'm1', senderId: 'c3', senderRole: 'customer', text: 'Merhaba, wolf cut için fiyat alabilir miyim?', messageType: 'text', isRead: true, createdAt: 'Pazartesi 15:00' },
    { id: 'm2', senderId: 'h1', senderRole: 'hairdresser', text: 'Merhaba! Wolf cut için 350₺ fiyatımız var.', messageType: 'text', isRead: true, createdAt: 'Pazartesi 15:10' },
  ],
  chat4: [
    { id: 'm1', senderId: 'c4', senderRole: 'customer', text: 'Ombre için referans fotoğraf gönderdim.', messageType: 'text', isRead: true, createdAt: '10:00' },
  ],
};

// ─── TEKLİF DETAY MODALI ───────────────────────────────────
function BidDetailModal({ visible, chatInfo, onClose, onUpdatePrice, onWithdraw }: {
  visible: boolean;
  chatInfo: typeof DUMMY_CHAT_INFO['chat1'] | null;
  onClose: () => void;
  onUpdatePrice: (newPrice: number) => void;
  onWithdraw: () => void;
}) {
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setShowPriceUpdate(false);
      setNewPrice('');
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!chatInfo) return null;

  const statusConfig = ({
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844', icon: 'time-outline' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary, icon: 'pricetag-outline' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', icon: 'checkmark-circle-outline' },
    completed: { label: 'Tamamlandı', color: '#34D399', icon: 'checkmark-done-outline' },
    cancelled: { label: 'İptal Edildi', color: '#F87171', icon: 'close-circle-outline' },
  } as Record<string, { label: string; color: string; icon: string }>)[chatInfo.jobStatus]
    || { label: chatInfo.jobStatus, color: COLORS.textMuted, icon: 'help-outline' };

  const handleUpdatePrice = () => {
    if (!newPrice || parseInt(newPrice) <= 0) {
      Alert.alert('Hata', 'Geçerli bir fiyat girin');
      return;
    }
    onUpdatePrice(parseInt(newPrice));
    setShowPriceUpdate(false);
    setNewPrice('');
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[mStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          {/* Handle + Header */}
          <View style={mStyles.handle} />
          <View style={mStyles.header}>
            <Text style={mStyles.title}>Teklif Detayı</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* İçerik */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80}
          >
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={mStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Müşteri kartı */}
              <View style={mStyles.customerCard}>
                <LinearGradient
                  colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
                  style={mStyles.customerGradient}
                >
                  <View style={mStyles.customerAvatar}>
                    <Text style={{ fontSize: 28 }}>{chatInfo.customerEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={mStyles.customerName}>{chatInfo.customerName}</Text>
                    <Text style={mStyles.customerService}>{chatInfo.jobService}</Text>
                  </View>
                  <View style={[mStyles.statusBadge, {
                    backgroundColor: statusConfig.color + '22',
                    borderColor: statusConfig.color + '44',
                  }]}>
                    <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                    <Text style={[mStyles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Öncesi / Sonrası */}
              <View style={mStyles.photosRow}>
                <View style={mStyles.photoCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={mStyles.photoGradient}
                  >
                    <Text style={mStyles.photoEmoji}>{chatInfo.beforeEmoji}</Text>
                    <View style={mStyles.photoLabel}>
                      <Text style={mStyles.photoLabelText}>Şu An</Text>
                    </View>
                  </LinearGradient>
                </View>
                <View style={mStyles.photoArrow}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={mStyles.photoArrowBg}
                  >
                    <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={mStyles.photoArrowLabel}>AI</Text>
                </View>
                <View style={mStyles.photoCard}>
                  <LinearGradient
                    colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                    style={mStyles.photoGradient}
                  >
                    <Text style={mStyles.photoEmoji}>{chatInfo.afterEmoji}</Text>
                    <View style={[mStyles.photoLabel, { backgroundColor: COLORS.primary + 'CC' }]}>
                      <Text style={mStyles.photoLabelText}>İstenen</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Detay satırları */}
              <View style={mStyles.detailCard}>
                {([
                  { icon: 'cut-outline', label: 'Hizmet', value: chatInfo.jobService, color: COLORS.primary },
                  { icon: 'pricetag-outline', label: 'Teklifim', value: `₺${chatInfo.bidPrice}`, color: COLORS.primary, showBudgetBadge: true },
                  { icon: 'wallet-outline', label: 'Müşteri Bütçesi', value: `₺${chatInfo.customerBudget}`, color: COLORS.success },
                ] as any[]).map((item, index, arr) => (
                  <View key={item.label}>
                    <View style={mStyles.detailRow}>
                      <View style={[mStyles.detailIcon, { backgroundColor: item.color + '22' }]}>
                        <Ionicons name={item.icon} size={16} color={item.color} />
                      </View>
                      <View style={mStyles.detailInfo}>
                        <Text style={mStyles.detailLabel}>{item.label}</Text>
                        <Text style={[mStyles.detailValue, { color: item.color }]}>{item.value}</Text>
                      </View>
                      {item.showBudgetBadge && (
                        chatInfo.bidPrice <= chatInfo.customerBudget ? (
                          <View style={[mStyles.budgetBadge, { backgroundColor: '#34D399' + '18', borderColor: '#34D399' + '44' }]}>
                            <Ionicons name="checkmark" size={11} color="#34D399" />
                            <Text style={[mStyles.budgetBadgeText, { color: '#34D399' }]}>Uygun</Text>
                          </View>
                        ) : (
                          <View style={[mStyles.budgetBadge, { backgroundColor: '#F87171' + '18', borderColor: '#F87171' + '44' }]}>
                            <Ionicons name="alert" size={11} color="#F87171" />
                            <Text style={[mStyles.budgetBadgeText, { color: '#F87171' }]}>Aşıyor</Text>
                          </View>
                        )
                      )}
                    </View>
                    {index < arr.length - 1 && <View style={mStyles.divider} />}
                  </View>
                ))}

                {chatInfo.appointmentDate && (
                  <>
                    <View style={mStyles.divider} />
                    <View style={mStyles.detailRow}>
                      <View style={[mStyles.detailIcon, { backgroundColor: COLORS.primary + '22' }]}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                      </View>
                      <View style={mStyles.detailInfo}>
                        <Text style={mStyles.detailLabel}>Randevu</Text>
                        <Text style={mStyles.detailValue}>{chatInfo.appointmentDate}</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Müşteri notu */}
              {chatInfo.note && (
                <View style={mStyles.noteCard}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.textMuted} />
                  <Text style={mStyles.noteText}>{chatInfo.note}</Text>
                </View>
              )}

              {/* Fiyat güncelleme alanı — koşullu inline */}
              {showPriceUpdate && (
                <View style={mStyles.priceUpdateCard}>
                  <Text style={mStyles.priceUpdateTitle}>Yeni Fiyat Gir</Text>
                  <View style={mStyles.priceInputRow}>
                    <Text style={mStyles.priceSymbol}>₺</Text>
                    <TextInput
                      style={mStyles.priceInput}
                      value={newPrice}
                      onChangeText={(t) => setNewPrice(t.replace(/\D/g, ''))}
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      autoFocus
                    />
                  </View>
                  {!!newPrice && parseInt(newPrice) > chatInfo.customerBudget && (
                    <View style={mStyles.warningRow}>
                      <Ionicons name="alert-circle-outline" size={13} color="#FFB844" />
                      <Text style={mStyles.warningText}>Müşteri bütçesini aşıyor</Text>
                    </View>
                  )}
                  <View style={mStyles.priceActions}>
                    <TouchableOpacity
                      style={mStyles.cancelBtn}
                      onPress={() => { setShowPriceUpdate(false); setNewPrice(''); }}
                    >
                      <Text style={mStyles.cancelBtnText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={mStyles.confirmBtn} onPress={handleUpdatePrice}>
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={mStyles.confirmBtnGradient}
                      >
                        <Text style={mStyles.confirmBtnText}>Güncelle</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Bidding aksiyonları */}
              {chatInfo.jobStatus === 'bidding' && !showPriceUpdate && (
                <View style={mStyles.actionRow}>
                  <TouchableOpacity
                    style={mStyles.withdrawBtn}
                    onPress={() => Alert.alert(
                      'Teklifi Geri Çek',
                      'Teklifinizi geri çekmek istediğinize emin misiniz?',
                      [
                        { text: 'Vazgeç', style: 'cancel' },
                        { text: 'Geri Çek', style: 'destructive', onPress: onWithdraw },
                      ]
                    )}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#F87171" />
                    <Text style={mStyles.withdrawBtnText}>Geri Çek</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={mStyles.updatePriceBtn}
                    onPress={() => setShowPriceUpdate(true)}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={mStyles.updatePriceBtnGradient}
                    >
                      <Ionicons name="pencil-outline" size={16} color={COLORS.white} />
                      <Text style={mStyles.updatePriceBtnText}>Fiyat Güncelle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.85, overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 50 },
  customerCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  customerGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  customerService: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  photosRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  photoCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  photoGradient: { aspectRatio: 3 / 4, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  photoEmoji: { fontSize: 36 },
  photoLabel: { position: 'absolute', bottom: 5, left: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm, paddingVertical: 2, alignItems: 'center' },
  photoLabelText: { fontSize: 9, color: COLORS.white, fontWeight: '800' },
  photoArrow: { alignItems: 'center', gap: 3 },
  photoArrowBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  photoArrowLabel: { fontSize: 9, color: COLORS.primary, fontWeight: 'bold' },
  detailCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  detailIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  budgetBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  budgetBadgeText: { fontSize: 10, fontWeight: '700' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  noteText: { flex: 1, fontSize: FONTS.small, color: COLORS.textMuted, lineHeight: 18 },
  priceUpdateCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.primary + '44', gap: SPACING.md },
  priceUpdateTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  priceSymbol: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginRight: SPACING.sm },
  priceInput: { flex: 1, fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, paddingVertical: SPACING.md },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  warningText: { fontSize: FONTS.small, color: '#FFB844' },
  priceActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: FONTS.regular, color: COLORS.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  confirmBtnGradient: { paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
  actionRow: { flexDirection: 'row', gap: SPACING.md },
  withdrawBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#F87171' + '44', backgroundColor: '#F87171' + '11' },
  withdrawBtnText: { color: '#F87171', fontWeight: '700', fontSize: FONTS.regular },
  updatePriceBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  updatePriceBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  updatePriceBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.regular },
});

// ─── MESAJ BALONU ──────────────────────────────────────────
function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  const slideAnim = useRef(new Animated.Value(isOwn ? 20 : -20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  if (message.senderRole === 'system') {
    return (
      <Animated.View style={[styles.systemMessage, { opacity: opacityAnim }]}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </Animated.View>
    );
  }

  // ── FOTOĞRAF MESAJI ──
  if (message.messageType === 'image' && message.imageUri) {
    return (
      <Animated.View style={[
        styles.messageRow,
        isOwn ? styles.messageRowOwn : styles.messageRowOther,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, { padding: 4 }]}>
          <Image
            source={{ uri: message.imageUri }}
            style={{ width: 200, height: 200, borderRadius: RADIUS.md }}
            resizeMode="cover"
          />
          <Text style={[isOwn ? styles.bubbleTime : styles.bubbleTimeOther, { marginTop: 4 }]}>
            {message.createdAt}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── METİN MESAJI ──
  return (
    <Animated.View style={[
      styles.messageRow,
      isOwn ? styles.messageRowOwn : styles.messageRowOther,
      { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
    ]}>
      {isOwn ? (
        <View style={[styles.bubble, styles.bubbleOwn]}>
          <Text style={styles.bubbleTextOwn}>{message.text}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{message.createdAt}</Text>
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.isRead ? COLORS.primaryLight : 'rgba(255,255,255,0.5)'}
            />
          </View>
        </View>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.bubbleTextOther}>{message.text}</Text>
          <Text style={styles.bubbleTimeOther}>{message.createdAt}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── BANNER ────────────────────────────────────────────────
function ChatInfoBanner({ chatInfo }: { chatInfo: typeof DUMMY_CHAT_INFO['chat1'] }) {
  const statusConfig = ({
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary },
    accepted: { label: 'Kabul Edildi', color: '#34D399' },
    completed: { label: 'Tamamlandı', color: '#34D399' },
    cancelled: { label: 'İptal Edildi', color: '#F87171' },
  } as Record<string, { label: string; color: string }>)[chatInfo.jobStatus]
    || { label: chatInfo.jobStatus, color: COLORS.textMuted };

  return (
    <View style={styles.banner}>
      <LinearGradient
        colors={['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.1)']}
        style={styles.bannerGradient}
      >
        <Text style={styles.bannerEmoji}>{chatInfo.customerEmoji}</Text>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerService}>{chatInfo.jobService}</Text>
          <View style={[styles.bannerStatus, { backgroundColor: statusConfig.color + '22' }]}>
            <View style={[styles.bannerStatusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.bannerStatusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View style={styles.bannerRight}>
          <View style={styles.bannerPriceRow}>
            <Text style={styles.bannerPriceLabel}>Teklifim</Text>
            <Text style={styles.bannerPrice}>₺{chatInfo.bidPrice}</Text>
          </View>
          <View style={styles.bannerPriceRow}>
            <Text style={styles.bannerPriceLabel}>Bütçe</Text>
            <Text style={styles.bannerBudget}>₺{chatInfo.customerBudget}</Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </LinearGradient>
      {chatInfo.appointmentDate && (
        <View style={styles.appointmentBar}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.appointmentText}>Randevu: {chatInfo.appointmentDate}</Text>
        </View>
      )}
    </View>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(DUMMY_MESSAGES[chatId as string] || []);
  const [showBidDetail, setShowBidDetail] = useState(false);
  const [chatInfo, setChatInfo] = useState(DUMMY_CHAT_INFO[chatId as string]);

  const flatListRef = useRef<FlatList>(null);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  const inputBorderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  // ── MESAJ GÖNDER ──
  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      senderId: 'h1',
      senderRole: 'hairdresser',
      text: message.trim(),
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── FOTOĞRAF GÖNDER ──
  const handleSendPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const newMsg = {
          id: Date.now().toString(),
          senderId: 'h1',
          senderRole: 'hairdresser',
          text: '📷 Fotoğraf',
          messageType: 'image',
          imageUri: result.assets[0].uri,
          isRead: false,
          createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    }
  };

  // ── FİYAT GÜNCELLE ──
  const handleUpdatePrice = (newPrice: number) => {
    setChatInfo(prev => ({ ...prev, bidPrice: newPrice }));
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), senderId: 'system', senderRole: 'system', text: `💼 Teklif güncellendi: ₺${newPrice}`, messageType: 'system', isRead: true, createdAt: time },
      { id: (Date.now() + 1).toString(), senderId: 'h1', senderRole: 'hairdresser', text: `Fiyatımı ₺${newPrice} olarak güncelledim.`, messageType: 'text', isRead: false, createdAt: time },
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    setShowBidDetail(false);
  };

  // ── TEKLİF GERİ ÇEK ──
  const handleWithdraw = () => {
    setChatInfo(prev => ({ ...prev, jobStatus: 'cancelled' }));
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), senderId: 'system', senderRole: 'system', text: '❌ Teklif geri çekildi', messageType: 'system', isRead: true, createdAt: time },
    ]);
    setShowBidDetail(false);
  };

  // ── 3 NOKTA MENÜ ──
  const handleMoreOptions = () => {
    Alert.alert(
      chatInfo?.customerName || 'Seçenekler',
      'Ne yapmak istiyorsunuz?',
      [
        {
          text: '📅 Randevuya Git',
          onPress: () => router.push('/(hairdresser)/appointments' as any),
        },
        {
          text: '🔔 Bildirimleri Kapat',
          onPress: () => Alert.alert('Bildirimler kapatıldı', 'Bu sohbetten bildirim almayacaksınız.'),
        },
        {
          text: '🚫 Müşteriyi Engelle',
          style: 'destructive',
          onPress: () => Alert.alert(
            'Engelle',
            `${chatInfo?.customerName} adlı kullanıcıyı engellemek istediğinize emin misiniz?`,
            [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Engelle', style: 'destructive', onPress: () => router.back() },
            ]
          ),
        },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  if (!chatInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 56, left: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary }}>Sohbet bulunamadı</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatarWrapper}>
            <LinearGradient
              colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarEmoji}>{chatInfo.customerEmoji}</Text>
            </LinearGradient>
            {chatInfo.isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View>
            <Text style={styles.headerName}>{chatInfo.customerName}</Text>
            <Text style={styles.headerStatus}>
              {chatInfo.isOnline ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── BANNER ── */}
      <TouchableOpacity onPress={() => setShowBidDetail(true)} activeOpacity={0.85}>
        <ChatInfoBanner chatInfo={chatInfo} />
      </TouchableOpacity>

      {/* ── MESAJ LİSTESİ ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderRole === 'hairdresser'} />
        )}
      />

      {/* ── GİRİŞ ALANI ── */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={handleSendPhoto}>
          <Ionicons name="image-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            onFocus={() => Animated.timing(inputBorderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
            onBlur={() => Animated.timing(inputBorderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
          />
        </Animated.View>

        <TouchableOpacity
          style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color={message.trim() ? COLORS.white : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── TEKLİF DETAY MODALI ── */}
      <BidDetailModal
        visible={showBidDetail}
        chatInfo={chatInfo}
        onClose={() => setShowBidDetail(false)}
        onUpdatePrice={handleUpdatePrice}
        onWithdraw={handleWithdraw}
      />
    </KeyboardAvoidingView>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm, backgroundColor: 'rgba(26,5,51,0.95)' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerAvatarWrapper: { position: 'relative', width: 42, height: 42 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  headerAvatarEmoji: { fontSize: 20 },
  headerOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  headerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  headerStatus: { fontSize: 11, color: COLORS.textMuted },
  banner: { marginHorizontal: SPACING.md, marginVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  bannerEmoji: { fontSize: 24 },
  bannerLeft: { flex: 1, gap: 4 },
  bannerService: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  bannerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  bannerStatusDot: { width: 6, height: 6, borderRadius: 3 },
  bannerStatusText: { fontSize: 11, fontWeight: '700' },
  bannerRight: { alignItems: 'flex-end', gap: 4 },
  bannerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerPriceLabel: { fontSize: 11, color: COLORS.textMuted },
  bannerPrice: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.primary },
  bannerBudget: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.success },
  appointmentBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary + '18', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  appointmentText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  messageList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.lg },
  messageRow: { flexDirection: 'row', marginVertical: 2 },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.72, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, gap: 4 },
  bubbleOwn: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTextOwn: { fontSize: FONTS.regular, color: COLORS.white, lineHeight: 20 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  bubbleOther: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleTextOther: { fontSize: FONTS.regular, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTimeOther: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  systemMessage: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.sm },
  systemMessageText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: 'rgba(26,5,51,0.95)', paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md },
  attachBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  inputWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minHeight: 42, maxHeight: 120 },
  input: { color: COLORS.textPrimary, fontSize: FONTS.regular, lineHeight: 20, textAlignVertical: 'center', paddingTop: 0, paddingBottom: 0 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sendBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
});