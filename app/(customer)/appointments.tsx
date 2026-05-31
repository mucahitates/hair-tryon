// ─────────────────────────────────────────────────────────────
// RANDEVULAR EKRANI (app/(customer)/appointments.tsx)
// ─────────────────────────────────────────────────────────────
// Müşterinin randevularını listeler
//
// SEKMELER:
// 1. Yaklaşan — onaylı/bekleyen randevular + geri sayım
// 2. Geçmiş — tamamlanan/iptal edilen randevular
//
// BAĞLANTILAR:
// - authStore → kullanıcı bilgisi
// - Firestore: appointments/{appointmentId} → randevular (şimdilik dummy)
// - /hairdresser/[id] → kuaför profil sayfası
// - chat/[chatId] → sohbet ekranı
//
// ÖZELLİKLER:
// - Haftalık takvim görünümü
// - Geri sayım sayacı
// - Randevu detay modalı
// - İptal etme akışı
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────

// Firestore: appointments koleksiyonu
const DUMMY_UPCOMING = [
  {
    id: 'a1',
    hairdresserId: '1',
    hairdresserName: 'Salon Elegance',
    hairdresserEmoji: '💇‍♀️',
    hairdresserAddress: 'Moda Caddesi No:42, Kadıköy, İstanbul',
    service: 'Balayage',
    date: '2025-06-05',
    time: '14:00',
    duration: 180,
    price: 750,
    status: 'confirmed',   // confirmed | pending
    chatId: 'chat1',
    notes: 'Doğal görünümlü balayage istiyorum',
  },
  {
    id: 'a2',
    hairdresserId: '4',
    hairdresserName: 'Hair Lab',
    hairdresserEmoji: '🎨',
    hairdresserAddress: 'Bağdat Caddesi No:88, Suadiye, İstanbul',
    service: 'Wolf Cut',
    date: '2025-06-10',
    time: '11:00',
    duration: 60,
    price: 700,
    status: 'pending',
    chatId: 'chat3',
    notes: '',
  },
];

const DUMMY_PAST = [
  {
    id: 'a3',
    hairdresserId: '3',
    hairdresserName: 'Style Studio',
    hairdresserEmoji: '👑',
    hairdresserAddress: 'Nişantaşı, İstanbul',
    service: 'Keratin Bakım',
    date: '2025-05-24',
    time: '14:00',
    duration: 120,
    price: 580,
    status: 'completed',
    chatId: 'chat2',
    notes: '',
    rating: 5,
  },
  {
    id: 'a4',
    hairdresserId: '5',
    hairdresserName: 'Glam House',
    hairdresserEmoji: '💅',
    hairdresserAddress: 'Etiler, İstanbul',
    service: 'Tek Renk Boyama',
    date: '2025-05-17',
    time: '10:00',
    duration: 90,
    price: 0,
    status: 'cancelled',
    chatId: 'chat4',
    notes: '',
    rating: 0,
  },
];

// ─── YARDIMCI FONKSİYONLAR ─────────────────────────────────

// Tarihi güzel formatta göster
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return {
    day: date.getDate(),
    month: months[date.getMonth()],
    dayName: days[date.getDay()],
    full: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`,
  };
};

// Randevuya kalan süreyi hesapla
const getCountdown = (dateStr: string, timeStr: string) => {
  const appointmentDate = new Date(`${dateStr}T${timeStr}:00`);
  const now = new Date();
  const diff = appointmentDate.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} gün ${hours} saat`;
  if (hours > 0) return `${hours} saat ${minutes} dk`;
  return `${minutes} dakika`;
};

// ─── DURUM BADGE ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = {
    confirmed: { label: 'Onaylandı', color: '#34D399', bg: '#34D39922' },
    pending: { label: 'Onay Bekleniyor', color: '#FFB844', bg: '#FFB84422' },
    completed: { label: 'Tamamlandı', color: '#A78BFA', bg: '#A78BFA22' },
    cancelled: { label: 'İptal Edildi', color: '#F87171', bg: '#F8717122' },
  }[status] || { label: status, color: COLORS.textMuted, bg: 'rgba(255,255,255,0.08)' };

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

// ─── RANDEVU DETAY MODALI ──────────────────────────────────
// Randevu kartına tıklayınca açılır
// Kuaför bilgisi, hizmet, tarih, saat, adres, fiyat, iptal butonu
function AppointmentDetailModal({ visible, appointment, onClose, onCancel }: {
  visible: boolean;
  appointment: typeof DUMMY_UPCOMING[0] | typeof DUMMY_PAST[0] | null;
  onClose: () => void;
  onCancel: (id: string) => void;
}) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  if (!appointment) return null;

  const dateInfo = formatDate(appointment.date);
  const countdown = getCountdown(appointment.date, appointment.time);
  const isUpcoming = appointment.status === 'confirmed' || appointment.status === 'pending';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <Animated.View style={[detailStyles.container, { transform: [{ translateY: slideAnim }] }]}>

          {/* Başlık */}
          <View style={detailStyles.header}>
            <Text style={detailStyles.title}>Randevu Detayı</Text>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Durum + geri sayım */}
            <View style={detailStyles.statusRow}>
              <StatusBadge status={appointment.status} />
              {countdown && (
                <View style={detailStyles.countdownBadge}>
                  <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                  <Text style={detailStyles.countdownText}>{countdown} kaldı</Text>
                </View>
              )}
            </View>

            {/* Kuaför kartı */}
            <TouchableOpacity
              style={detailStyles.hairdresserCard}
              onPress={() => {
                onClose();
                router.push(`/hairdresser/${appointment.hairdresserId}` as any);
              }}
            >
              <LinearGradient
                colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
                style={detailStyles.hairdresserGradient}
              >
                <View style={detailStyles.hairdresserAvatar}>
                  <Text style={detailStyles.hairdresserEmoji}>{appointment.hairdresserEmoji}</Text>
                </View>
                <View style={detailStyles.hairdresserInfo}>
                  <Text style={detailStyles.hairdresserName}>{appointment.hairdresserName}</Text>
                  <Text style={detailStyles.hairdresserService}>{appointment.service}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Detay bilgileri */}
            <View style={detailStyles.detailCard}>

              {/* Tarih */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Tarih</Text>
                  <Text style={detailStyles.detailValue}>{dateInfo.dayName}, {dateInfo.full}</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Saat */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Saat</Text>
                  <Text style={detailStyles.detailValue}>{appointment.time} ({appointment.duration} dk)</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Adres */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Adres</Text>
                  <Text style={detailStyles.detailValue}>{appointment.hairdresserAddress}</Text>
                </View>
              </View>

              <View style={detailStyles.divider} />

              {/* Fiyat */}
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailIcon}>
                  <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={detailStyles.detailInfo}>
                  <Text style={detailStyles.detailLabel}>Ücret</Text>
                  <Text style={[detailStyles.detailValue, { color: COLORS.primary }]}>
                    {appointment.price > 0 ? `₺${appointment.price}` : 'Ücretsiz'}
                  </Text>
                </View>
              </View>

              {/* Notlar varsa */}
              {appointment.notes && (
                <>
                  <View style={detailStyles.divider} />
                  <View style={detailStyles.detailRow}>
                    <View style={detailStyles.detailIcon}>
                      <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={detailStyles.detailInfo}>
                      <Text style={detailStyles.detailLabel}>Notlar</Text>
                      <Text style={detailStyles.detailValue}>{appointment.notes}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Tamamlandıysa puan */}
              {'rating' in appointment && appointment.rating > 0 && (
                <>
                  <View style={detailStyles.divider} />
                  <View style={detailStyles.detailRow}>
                    <View style={detailStyles.detailIcon}>
                      <Ionicons name="star-outline" size={18} color="#FFB844" />
                    </View>
                    <View style={detailStyles.detailInfo}>
                      <Text style={detailStyles.detailLabel}>Verdiğin Puan</Text>
                      <View style={{ flexDirection: 'row', gap: 3, marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= appointment.rating ? 'star' : 'star-outline'}
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

            {/* Aksiyon butonları — sadece yaklaşan randevular */}
            {isUpcoming && (
              <View style={detailStyles.actions}>
                {/* Mesaj At — chat ekranına gider */}
                <TouchableOpacity
                  style={detailStyles.chatBtn}
                  onPress={() => {
                    onClose();
                    router.push(`/chat/${appointment.chatId}` as any);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
                  <Text style={detailStyles.chatBtnText}>Mesaj At</Text>
                </TouchableOpacity>

                {/* İptal Et — Firestore: appointments.status = cancelled */}
                <TouchableOpacity
                  style={detailStyles.cancelBtn}
                  onPress={() => {
                    Alert.alert(
                      'Randevuyu İptal Et',
                      'Bu randevuyu iptal etmek istediğine emin misin?',
                      [
                        { text: 'Vazgeç', style: 'cancel' },
                        {
                          text: 'İptal Et',
                          style: 'destructive',
                          onPress: () => { onCancel(appointment.id); onClose(); }
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                  <Text style={detailStyles.cancelBtnText}>İptal Et</Text>
                </TouchableOpacity>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  countdownBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '18', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full },
  countdownText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  hairdresserCard: { marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  hairdresserGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  hairdresserAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  hairdresserEmoji: { fontSize: 26 },
  hairdresserInfo: { flex: 1 },
  hairdresserName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  hairdresserService: { fontSize: FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  detailCard: { marginHorizontal: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, gap: SPACING.md },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44', backgroundColor: COLORS.primary + '18' },
  chatBtnText: { fontSize: FONTS.regular, color: COLORS.primary, fontWeight: '700' },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error + '44', backgroundColor: COLORS.error + '18' },
  cancelBtnText: { fontSize: FONTS.regular, color: COLORS.error, fontWeight: '700' },
});

// ─── HAFTALIK TAKVİM ───────────────────────────────────────
// Yatay kaydırılabilir haftalık takvim
// Randevusu olan günler nokta ile işaretlenir
// Seçilen güne göre randevular filtrelenir
function WeeklyCalendar({ selectedDate, onSelectDate, appointmentDates }: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  appointmentDates: string[];
}) {
  const scrollRef = useRef<ScrollView>(null);

  // Bugünden itibaren 14 gün
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={calStyles.container}
    >
      {days.map((date, i) => {
        const dateKey = formatDateKey(date);
        const isSelected = selectedDate === dateKey;
        const hasAppointment = appointmentDates.includes(dateKey);
        const isToday = i === 0;

        return (
          <TouchableOpacity
            key={dateKey}
            onPress={() => onSelectDate(dateKey)}
            style={[calStyles.dayBtn, isSelected && calStyles.dayBtnSelected]}
          >
            {isSelected ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={calStyles.dayGradient}
              >
                <Text style={[calStyles.dayName, { color: COLORS.white }]}>
                  {isToday ? 'Bugün' : dayNames[date.getDay()]}
                </Text>
                <Text style={[calStyles.dayNum, { color: COLORS.white }]}>{date.getDate()}</Text>
                {hasAppointment && <View style={[calStyles.dot, { backgroundColor: COLORS.white }]} />}
              </LinearGradient>
            ) : (
              <View style={calStyles.dayInner}>
                <Text style={[calStyles.dayName, isToday && { color: COLORS.primary }]}>
                  {isToday ? 'Bugün' : dayNames[date.getDay()]}
                </Text>
                <Text style={[calStyles.dayNum, isToday && { color: COLORS.primary }]}>
                  {date.getDate()}
                </Text>
                {hasAppointment && <View style={calStyles.dot} />}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const calStyles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.sm },
  dayBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  dayBtnSelected: { borderColor: COLORS.primary },
  dayGradient: { width: 56, paddingVertical: SPACING.sm, alignItems: 'center', gap: 3 },
  dayInner: { width: 56, paddingVertical: SPACING.sm, alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg },
  dayName: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  dayNum: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
});

// ─── YAKLAŞAN RANDEVU KARTI ────────────────────────────────
// Onaylı/bekleyen randevu kartı
// Tıklayınca AppointmentDetailModal açılır
function UpcomingCard({ appointment, onPress }: {
  appointment: typeof DUMMY_UPCOMING[0];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
    ]).start();
  }, []);

  const dateInfo = formatDate(appointment.date);
  const countdown = getCountdown(appointment.date, appointment.time);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.upcomingCard,
        { transform: [{ scale: scaleAnim }, { translateY: slideAnim }], opacity: opacityAnim }
      ]}>
        <LinearGradient
          colors={
            appointment.status === 'confirmed'
              ? [COLORS.primary + '22', COLORS.primaryDark + '11']
              : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
          }
          style={styles.upcomingGradient}
        >
          {/* Üst satır — tarih + durum */}
          <View style={styles.upcomingTop}>
            {/* Tarih kutusu */}
            <View style={styles.dateBox}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.dateBoxGradient}
              >
                <Text style={styles.dateDay}>{dateInfo.day}</Text>
                <Text style={styles.dateMonth}>{dateInfo.month.slice(0, 3)}</Text>
              </LinearGradient>
            </View>

            {/* Bilgiler */}
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingService}>{appointment.service}</Text>
              <Text style={styles.upcomingHairdresser}>{appointment.hairdresserName}</Text>
              <View style={styles.upcomingMeta}>
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.upcomingMetaText}>{appointment.time} · {appointment.duration} dk</Text>
              </View>
            </View>

            {/* Durum + fiyat */}
            <View style={styles.upcomingRight}>
              <StatusBadge status={appointment.status} />
              <Text style={styles.upcomingPrice}>₺{appointment.price}</Text>
            </View>
          </View>

          {/* Geri sayım */}
          {countdown && (
            <View style={styles.countdownRow}>
              <LinearGradient
                colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                style={styles.countdownBar}
              >
                <Ionicons name="hourglass-outline" size={14} color={COLORS.primary} />
                <Text style={styles.countdownText}>{countdown} kaldı</Text>
              </LinearGradient>

              {/* Adres */}
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {appointment.hairdresserAddress.split(',')[0]}
                </Text>
              </View>
            </View>
          )}

        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── GEÇMİŞ RANDEVU KARTI ─────────────────────────────────
// Tamamlanan/iptal edilen randevu kartı
function PastCard({ appointment, onPress }: {
  appointment: typeof DUMMY_PAST[0];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dateInfo = formatDate(appointment.date);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.pastCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.pastLeft}>
          <View style={styles.pastDateBox}>
            <Text style={styles.pastDateDay}>{dateInfo.day}</Text>
            <Text style={styles.pastDateMonth}>{dateInfo.month.slice(0, 3)}</Text>
          </View>
          <View style={styles.pastInfo}>
            <Text style={styles.pastService}>{appointment.service}</Text>
            <Text style={styles.pastHairdresser}>{appointment.hairdresserName}</Text>
            {'rating' in appointment && appointment.rating > 0 && (
              <View style={styles.pastStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name={star <= appointment.rating ? 'star' : 'star-outline'} size={11} color="#FFB844" />
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.pastRight}>
          <StatusBadge status={appointment.status} />
          {appointment.price > 0 && (
            <Text style={styles.pastPrice}>₺{appointment.price}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── BOŞ DURUM ─────────────────────────────────────────────
function EmptyState({ isUpcoming }: { isUpcoming: boolean }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <LinearGradient
          colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
          style={styles.emptyIcon}
        >
          <Ionicons
            name={isUpcoming ? 'calendar-outline' : 'time-outline'}
            size={52}
            color={COLORS.primary}
          />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>
        {isUpcoming ? 'Yaklaşan randevu yok' : 'Geçmiş randevu yok'}
      </Text>
      <Text style={styles.emptyDesc}>
        {isUpcoming
          ? 'Kuaför teklifini kabul ettiğinde randevun burada görünür'
          : 'Tamamlanan randevularınız burada listelenecek'}
      </Text>
      {isUpcoming && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/(customer)/explore' as any)}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.emptyBtnGradient}
          >
            <Ionicons name="search-outline" size={18} color={COLORS.white} />
            <Text style={styles.emptyBtnText}>Kuaför Bul</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [upcomingList, setUpcomingList] = useState(DUMMY_UPCOMING);
  const [pastList, setPastList] = useState(DUMMY_PAST);

  // Takvim için seçili gün
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // Animasyonlar
  const headerAnim = useRef(new Animated.Value(0)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  }, []);

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    Animated.spring(tabSlide, { toValue: tab === 'upcoming' ? 0 : 1, tension: 70, friction: 10, useNativeDriver: false }).start();
    setActiveTab(tab);
  };

  const tabIndicatorLeft = tabSlide.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });

  // Randevu iptal et
  // TODO: Firestore: appointments/{id}.status = cancelled
  const handleCancel = (id: string) => {
    const appointment = upcomingList.find(a => a.id === id);
    if (appointment) {
      setUpcomingList(prev => prev.filter(a => a.id !== id));
      setPastList(prev => [{ ...appointment, status: 'cancelled', rating: 0 } as any, ...prev]);
    }
  };

  // Takvim için randevu tarihlerini hazırla
  const appointmentDates = upcomingList.map(a => a.date);

  // Seçili güne göre filtrele — hiç seçili yoksa tümünü göster
  const filteredUpcoming = selectedDate
    ? upcomingList.filter(a => a.date === selectedDate)
    : upcomingList;

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
          <Text style={styles.title}>Randevularım</Text>
          <Text style={styles.subtitle}>{upcomingList.length} yaklaşan randevu</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{upcomingList.length}</Text>
        </View>
      </Animated.View>

      {/* ── SEKME NAVİGASYONU ── */}
      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('upcoming')}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Yaklaşan</Text>
          {upcomingList.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => handleTabChange('past')}>
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Geçmiş</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {activeTab === 'upcoming' ? (
          <>
            {/* Haftalık takvim */}
            <WeeklyCalendar
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(selectedDate === date ? '' : date)}
              appointmentDates={appointmentDates}
            />

            {/* Seçili gün filtresi bilgisi */}
            {selectedDate && (
              <View style={styles.filterRow}>
                <Text style={styles.filterText}>
                  {selectedDate === todayKey ? 'Bugünün randevuları' : formatDate(selectedDate).full}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDate('')}>
                  <Text style={styles.filterClear}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredUpcoming.length > 0 ? (
              <View style={styles.cardList}>
                {filteredUpcoming.map((appointment) => (
                  <UpcomingCard
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => setSelectedAppointment(appointment)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState isUpcoming={true} />
            )}
          </>
        ) : (
          pastList.length > 0 ? (
            <View style={styles.cardList}>
              {pastList.map((appointment) => (
                <PastCard
                  key={appointment.id}
                  appointment={appointment}
                  onPress={() => setSelectedAppointment(appointment)}
                />
              ))}
            </View>
          ) : (
            <EmptyState isUpcoming={false} />
          )
        )}

      </ScrollView>

      {/* Randevu detay modalı */}
      <AppointmentDetailModal
        visible={selectedAppointment !== null}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCancel={handleCancel}
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
  totalBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 28, height: 28, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  totalBadgeText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: 3, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, position: 'relative', height: 42 },
  tabIndicator: { position: 'absolute', top: 3, bottom: 3, width: '50%', backgroundColor: COLORS.primary, borderRadius: RADIUS.sm },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  tabText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },
  tabBadge: { backgroundColor: COLORS.white + '33', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 160 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  filterText: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  filterClear: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  cardList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  // Yaklaşan randevu kartı
  upcomingCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  upcomingGradient: { padding: SPACING.md, gap: SPACING.sm },
  upcomingTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  dateBox: { borderRadius: RADIUS.md, overflow: 'hidden' },
  dateBoxGradient: { width: 52, paddingVertical: SPACING.sm, alignItems: 'center' },
  dateDay: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  dateMonth: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  upcomingInfo: { flex: 1, gap: 3 },
  upcomingService: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  upcomingHairdresser: { fontSize: FONTS.small, color: COLORS.textSecondary },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upcomingMetaText: { fontSize: 11, color: COLORS.textMuted },
  upcomingRight: { alignItems: 'flex-end', gap: 6 },
  upcomingPrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  countdownBar: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: RADIUS.full },
  countdownText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  addressRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  // Geçmiş randevu kartı
  pastCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md },
  pastLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  pastDateBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  pastDateDay: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  pastDateMonth: { fontSize: 9, color: COLORS.textMuted },
  pastInfo: { flex: 1, gap: 2 },
  pastService: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  pastHairdresser: { fontSize: FONTS.small, color: COLORS.textSecondary },
  pastStars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  pastRight: { alignItems: 'flex-end', gap: 4 },
  pastPrice: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.success },
  // Boş durum
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});