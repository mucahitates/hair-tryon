// ─────────────────────────────────────────────────────────────
// KUAFÖR TAKVİM EKRANI (app/(hairdresser)/appointments.tsx)
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
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── TİPLER ────────────────────────────────────────────────
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerEmoji: string;
  hairdresserId: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  chatId: string;
  note?: string;
}

// ─── DUMMY VERİ ────────────────────────────────────────────
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getDateOffset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

const DUMMY_APPOINTMENTS: Appointment[] = [
  { id: 'a1', customerId: 'c1', customerName: 'Ayşe Kaya', customerEmoji: '👩', hairdresserId: 'h1', service: 'Balayage', date: getDateOffset(0), time: '10:00', duration: 120, price: 750, status: 'confirmed', chatId: 'chat1', note: 'Doğal geçiş istedi' },
  { id: 'a2', customerId: 'c2', customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱', hairdresserId: 'h1', service: 'Keratin', date: getDateOffset(0), time: '13:00', duration: 90, price: 600, status: 'confirmed', chatId: 'chat2' },
  { id: 'a3', customerId: 'c3', customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', hairdresserId: 'h1', service: 'Wolf Cut', date: getDateOffset(0), time: '15:30', duration: 60, price: 350, status: 'pending', chatId: 'chat3' },
  { id: 'a4', customerId: 'c4', customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', hairdresserId: 'h1', service: 'Ombre', date: getDateOffset(1), time: '11:00', duration: 150, price: 700, status: 'confirmed', chatId: 'chat4' },
  { id: 'a5', customerId: 'c5', customerName: 'Selin Arslan', customerEmoji: '👩‍🦳', hairdresserId: 'h1', service: 'Saç Boyama', date: getDateOffset(1), time: '14:00', duration: 90, price: 400, status: 'pending', chatId: 'chat5' },
  { id: 'a6', customerId: 'c6', customerName: 'Elif Demir', customerEmoji: '👩‍🦱', hairdresserId: 'h1', service: 'Balayage', date: getDateOffset(2), time: '10:00', duration: 120, price: 750, status: 'confirmed', chatId: 'chat6' },
  { id: 'a7', customerId: 'c7', customerName: 'Hande Koç', customerEmoji: '👩', hairdresserId: 'h1', service: 'Keratin', date: getDateOffset(2), time: '13:00', duration: 90, price: 600, status: 'confirmed', chatId: 'chat7' },
  { id: 'a8', customerId: 'c8', customerName: 'Büşra Aktaş', customerEmoji: '👱‍♀️', hairdresserId: 'h1', service: 'Kesim', date: getDateOffset(2), time: '15:00', duration: 45, price: 200, status: 'pending', chatId: 'chat8' },
  { id: 'a9', customerId: 'c9', customerName: 'Nilay Yurt', customerEmoji: '👩‍🦰', hairdresserId: 'h1', service: 'Perma', date: getDateOffset(2), time: '16:30', duration: 140, price: 450, status: 'confirmed', chatId: 'chat9' },
  { id: 'a10', customerId: 'c10', customerName: 'Ceyda Öz', customerEmoji: '👩‍🦱', hairdresserId: 'h1', service: 'Ombre', date: getDateOffset(3), time: '09:30', duration: 150, price: 700, status: 'confirmed', chatId: 'chat10' },
  { id: 'a11', customerId: 'c11', customerName: 'Pınar Kara', customerEmoji: '👩', hairdresserId: 'h1', service: 'Saç Boyama', date: getDateOffset(4), time: '11:00', duration: 90, price: 400, status: 'pending', chatId: 'chat11' },
  { id: 'a12', customerId: 'c12', customerName: 'Deniz Ay', customerEmoji: '👩‍🦳', hairdresserId: 'h1', service: 'Wolf Cut', date: getDateOffset(4), time: '14:30', duration: 60, price: 350, status: 'confirmed', chatId: 'chat12' },
];

// ─── YARDIMCI FONKSİYONLAR ─────────────────────────────────
const getDayColor = (count: number): { bg: string; border: string; text: string } => {
  if (count === 0) return { bg: 'transparent', border: 'transparent', text: COLORS.textMuted };
  if (count <= 2) return { bg: '#34D399' + '33', border: '#34D399', text: '#34D399' };
  if (count <= 4) return { bg: '#FFB844' + '33', border: '#FFB844', text: '#FFB844' };
  return { bg: '#F87171' + '33', border: '#F87171', text: '#F87171' };
};

const getStatusConfig = (status: AppointmentStatus) => ({
  pending: { label: 'Bekliyor', color: '#FFB844', icon: 'time-outline' },
  confirmed: { label: 'Onaylandı', color: '#34D399', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'İptal', color: '#F87171', icon: 'close-circle-outline' },
  completed: { label: 'Tamamlandı', color: '#60A5FA', icon: 'checkmark-done-outline' },
}[status]);

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// ─── GÜN DETAY MODALI ──────────────────────────────────────
function DayDetailModal({ visible, onClose, date, appointments, onCancel, onMessage }: {
  visible: boolean;
  onClose: () => void;
  date: string;
  appointments: Appointment[];
  onCancel: (id: string) => void;
  onMessage: (chatId: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const dateObj = new Date(date);
  const dayStr = `${TR_DAYS[dateObj.getDay()]} ${dateObj.getDate()} ${TR_MONTHS[dateObj.getMonth()]}`;
  const totalEarning = appointments.filter(a => a.status !== 'cancelled').reduce((acc, a) => acc + a.price, 0);
  const totalDuration = appointments.filter(a => a.status !== 'cancelled').reduce((acc, a) => acc + a.duration, 0);

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[modalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          {/* Handle */}
          <View style={modalStyles.handle} />

          {/* Başlık */}
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.dateTitle}>{dayStr}</Text>
              <Text style={modalStyles.dateSubtitle}>{appointments.length} randevu</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Özet */}
          <View style={modalStyles.summaryRow}>
            <View style={modalStyles.summaryItem}>
              <Ionicons name="cash-outline" size={16} color="#34D399" />
              <Text style={modalStyles.summaryValue}>₺{totalEarning}</Text>
              <Text style={modalStyles.summaryLabel}>Kazanç</Text>
            </View>
            <View style={modalStyles.summaryDivider} />
            <View style={modalStyles.summaryItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={modalStyles.summaryValue}>{Math.floor(totalDuration / 60)}s {totalDuration % 60}dk</Text>
              <Text style={modalStyles.summaryLabel}>Toplam Süre</Text>
            </View>
            <View style={modalStyles.summaryDivider} />
            <View style={modalStyles.summaryItem}>
              <Ionicons name="people-outline" size={16} color="#FFB844" />
              <Text style={modalStyles.summaryValue}>{appointments.filter(a => a.status === 'confirmed').length}</Text>
              <Text style={modalStyles.summaryLabel}>Onaylı</Text>
            </View>
          </View>

          {/* Randevular */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.list}>
            {appointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => {
              const statusConf = getStatusConfig(apt.status);
              return (
                <View key={apt.id} style={modalStyles.aptCard}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
                    style={modalStyles.aptCardGradient}
                  >
                    {/* Sol renkli çizgi */}
                    <View style={[modalStyles.aptColorBar, { backgroundColor: statusConf.color }]} />

                    <View style={modalStyles.aptContent}>
                      {/* Üst satır */}
                      <View style={modalStyles.aptTopRow}>
                        <View style={modalStyles.aptCustomer}>
                          <LinearGradient
                            colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
                            style={modalStyles.aptAvatar}
                          >
                            <Text style={modalStyles.aptEmoji}>{apt.customerEmoji}</Text>
                          </LinearGradient>
                          <View>
                            <Text style={modalStyles.aptName}>{apt.customerName}</Text>
                            <Text style={modalStyles.aptService}>{apt.service}</Text>
                          </View>
                        </View>
                        <View style={[modalStyles.statusBadge, { backgroundColor: statusConf.color + '22', borderColor: statusConf.color + '44' }]}>
                          <Ionicons name={statusConf.icon as any} size={11} color={statusConf.color} />
                          <Text style={[modalStyles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                        </View>
                      </View>

                      {/* Orta bilgiler */}
                      <View style={modalStyles.aptMeta}>
                        <View style={modalStyles.aptMetaItem}>
                          <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                          <Text style={modalStyles.aptMetaText}>{apt.time}</Text>
                        </View>
                        <View style={modalStyles.aptMetaItem}>
                          <Ionicons name="hourglass-outline" size={13} color={COLORS.textMuted} />
                          <Text style={modalStyles.aptMetaText}>{apt.duration} dk</Text>
                        </View>
                        <View style={modalStyles.aptMetaItem}>
                          <Ionicons name="cash-outline" size={13} color="#34D399" />
                          <Text style={[modalStyles.aptMetaText, { color: '#34D399' }]}>₺{apt.price}</Text>
                        </View>
                      </View>

                      {apt.note && (
                        <View style={modalStyles.aptNote}>
                          <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.textMuted} />
                          <Text style={modalStyles.aptNoteText}>{apt.note}</Text>
                        </View>
                      )}

                      {/* Butonlar */}
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <View style={modalStyles.aptActions}>
                          {/* Mesaj at */}
                          <TouchableOpacity
                            style={modalStyles.msgBtn}
                            onPress={() => onMessage(apt.chatId)}
                          >
                            <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                            <Text style={modalStyles.msgBtnText}>Mesaj At</Text>
                          </TouchableOpacity>

                          {/* Onayla — sadece pending için */}
                          {apt.status === 'pending' && (
                            <TouchableOpacity style={modalStyles.confirmBtn}>
                              <LinearGradient
                                colors={['#34D399', '#059669']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={modalStyles.confirmBtnGradient}
                              >
                                <Ionicons name="checkmark" size={14} color={COLORS.white} />
                                <Text style={modalStyles.confirmBtnText}>Onayla</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          )}

                          {/* İptal */}
                          <TouchableOpacity
                            style={modalStyles.cancelBtn}
                            onPress={() => Alert.alert('Randevuyu İptal Et', `${apt.customerName} ile ${apt.time} randevusunu iptal etmek istediğine emin misin?`, [
                              { text: 'Vazgeç', style: 'cancel' },
                              { text: 'İptal Et', style: 'destructive', onPress: () => onCancel(apt.id) },
                            ])}
                          >
                            <Ionicons name="close-outline" size={14} color="#F87171" />
                            <Text style={modalStyles.cancelBtnText}>İptal</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.md },
  dateTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  dateSubtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  summaryRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, backgroundColor: COLORS.border },
  summaryValue: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  summaryLabel: { fontSize: 10, color: COLORS.textMuted },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 40, gap: SPACING.sm },
  aptCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  aptCardGradient: { flexDirection: 'row' },
  aptColorBar: { width: 4 },
  aptContent: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
  aptTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aptCustomer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aptAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  aptEmoji: { fontSize: 20 },
  aptName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  aptService: { fontSize: FONTS.small, color: COLORS.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  aptMeta: { flexDirection: 'row', gap: SPACING.md },
  aptMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aptMetaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  aptNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.sm, padding: SPACING.sm },
  aptNoteText: { flex: 1, fontSize: FONTS.small, color: COLORS.textMuted, lineHeight: 16 },
  aptActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  msgBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  confirmBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  confirmBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7 },
  confirmBtnText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '700' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: '#F87171' + '18', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#F87171' + '44' },
  cancelBtnText: { fontSize: FONTS.small, color: '#F87171', fontWeight: '600' },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState(DUMMY_APPOINTMENTS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Haftanın günlerini oluştur
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + currentWeekOffset * 7 + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayStr = formatDate(today);

  // O güne ait randevular
  const getAppointmentsForDate = (date: string) =>
    appointments.filter(a => a.date === date);

  // Seçili güne ait randevular
  const selectedAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Randevu iptal
  const handleCancel = (id: string) => {
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
    );
  };

  // Mesaj at
  const handleMessage = (chatId: string) => {
    setShowDayModal(false);
    setTimeout(() => router.push(`/(hairdresser)/chats` as any), 300);
  };

  // Bugünkü özet
  const todayApts = getAppointmentsForDate(todayStr);
  const todayEarning = todayApts.filter(a => a.status !== 'cancelled').reduce((acc, a) => acc + a.price, 0);
  const confirmedCount = todayApts.filter(a => a.status === 'confirmed').length;
  const pendingCount = todayApts.filter(a => a.status === 'pending').length;

  // Hafta başlığı
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekTitle = `${weekStart.getDate()} - ${weekEnd.getDate()} ${TR_MONTHS[weekEnd.getMonth()]}`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View>
            <Text style={styles.title}>Takvim</Text>
            <Text style={styles.subtitle}>Randevularını yönet</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>

          {/* ── BUGÜN ÖZETİ ── */}
          <View style={styles.todaySummary}>
            <LinearGradient
              colors={[COLORS.primaryDark + '66', COLORS.primary + '33']}
              style={styles.todaySummaryGradient}
            >
              <View style={styles.todaySummaryLeft}>
                <Text style={styles.todaySummaryLabel}>Bugün</Text>
                <Text style={styles.todaySummaryDate}>
                  {today.getDate()} {TR_MONTHS[today.getMonth()]}
                </Text>
              </View>
              <View style={styles.todaySummaryStats}>
                <View style={styles.todaySummaryStat}>
                  <Text style={[styles.todaySummaryStatValue, { color: '#34D399' }]}>{confirmedCount}</Text>
                  <Text style={styles.todaySummaryStatLabel}>Onaylı</Text>
                </View>
                <View style={styles.todaySummaryDivider} />
                <View style={styles.todaySummaryStat}>
                  <Text style={[styles.todaySummaryStatValue, { color: '#FFB844' }]}>{pendingCount}</Text>
                  <Text style={styles.todaySummaryStatLabel}>Bekleyen</Text>
                </View>
                <View style={styles.todaySummaryDivider} />
                <View style={styles.todaySummaryStat}>
                  <Text style={[styles.todaySummaryStatValue, { color: COLORS.primary }]}>₺{todayEarning}</Text>
                  <Text style={styles.todaySummaryStatLabel}>Kazanç</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ── HAFTALIK TAKVİM ── */}
          <View style={styles.calendarSection}>
            {/* Hafta navigasyonu */}
            <View style={styles.weekNav}>
              <TouchableOpacity
                style={styles.weekNavBtn}
                onPress={() => setCurrentWeekOffset(prev => prev - 1)}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.weekTitle}>{weekTitle}</Text>
              <TouchableOpacity
                style={styles.weekNavBtn}
                onPress={() => setCurrentWeekOffset(prev => prev + 1)}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Gün isimleri */}
            <View style={styles.dayNamesRow}>
              {TR_DAYS.map((d) => (
                <Text key={d} style={styles.dayName}>{d}</Text>
              ))}
            </View>

            {/* Günler */}
            <View style={styles.daysRow}>
              {weekDays.map((day) => {
                const dateStr = formatDate(day);
                const dayApts = getAppointmentsForDate(dateStr);
                const count = dayApts.filter(a => a.status !== 'cancelled').length;
                const colors = getDayColor(count);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isPast = day < today && !isToday;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.dayBtn,
                      count > 0 && { backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1.5 },
                      isToday && styles.dayBtnToday,
                      isSelected && styles.dayBtnSelected,
                    ]}
                    onPress={() => {
                      if (count > 0) {
                        setSelectedDate(dateStr);
                        setShowDayModal(true);
                      }
                    }}
                    activeOpacity={count > 0 ? 0.7 : 1}
                  >
                    <Text style={[
                      styles.dayNumber,
                      { color: count > 0 ? colors.text : isPast ? COLORS.textMuted + '88' : COLORS.textSecondary },
                      isToday && styles.dayNumberToday,
                    ]}>
                      {day.getDate()}
                    </Text>

                    {/* Randevu sayısı */}
                    {count > 0 && (
                      <Text style={[styles.dayCount, { color: colors.text }]}>{count}</Text>
                    )}

                    {/* Bugün nokta */}
                    {isToday && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Renk açıklaması */}
            <View style={styles.legend}>
              {[
                { color: '#34D399', label: '1-2 randevu' },
                { color: '#FFB844', label: '3-4 randevu' },
                { color: '#F87171', label: '5+ randevu' },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── YAKIN RANDEVULAR ── */}
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
            {appointments
              .filter(a => a.date >= todayStr && a.status !== 'cancelled')
              .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
              .slice(0, 5)
              .map((apt) => {
                const statusConf = getStatusConfig(apt.status);
                const aptDate = new Date(apt.date);
                const isAptToday = apt.date === todayStr;
                return (
                  <TouchableOpacity
                    key={apt.id}
                    style={styles.upcomingCard}
                    onPress={() => {
                      setSelectedDate(apt.date);
                      setShowDayModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']}
                      style={styles.upcomingCardGradient}
                    >
                      {/* Sol renk çizgisi */}
                      <View style={[styles.upcomingColorBar, { backgroundColor: statusConf.color }]} />

                      {/* Tarih kolonu */}
                      <View style={styles.upcomingDateCol}>
                        <Text style={[styles.upcomingDay, { color: isAptToday ? COLORS.primary : COLORS.textSecondary }]}>
                          {isAptToday ? 'Bugün' : TR_DAYS[aptDate.getDay()]}
                        </Text>
                        <Text style={styles.upcomingDate}>{aptDate.getDate()}</Text>
                        <Text style={styles.upcomingMonth}>{TR_MONTHS[aptDate.getMonth()].slice(0, 3)}</Text>
                      </View>

                      {/* Saat çizgisi */}
                      <View style={styles.upcomingTimeCol}>
                        <View style={styles.upcomingTimeDot} />
                        <Text style={styles.upcomingTime}>{apt.time}</Text>
                      </View>

                      {/* İçerik */}
                      <View style={styles.upcomingContent}>
                        <View style={styles.upcomingTop}>
                          <Text style={styles.upcomingName}>{apt.customerName}</Text>
                          <View style={[styles.upcomingStatusBadge, { backgroundColor: statusConf.color + '22', borderColor: statusConf.color + '44' }]}>
                            <Text style={[styles.upcomingStatusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.upcomingService}>{apt.service}</Text>
                        <View style={styles.upcomingMeta}>
                          <View style={styles.upcomingMetaItem}>
                            <Ionicons name="hourglass-outline" size={11} color={COLORS.textMuted} />
                            <Text style={styles.upcomingMetaText}>{apt.duration} dk</Text>
                          </View>
                          <View style={styles.upcomingMetaItem}>
                            <Ionicons name="cash-outline" size={11} color="#34D399" />
                            <Text style={[styles.upcomingMetaText, { color: '#34D399' }]}>₺{apt.price}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Sağ ok */}
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Gün detay modalı */}
      {selectedDate && (
        <DayDetailModal
          visible={showDayModal}
          onClose={() => setShowDayModal(false)}
          date={selectedDate}
          appointments={getAppointmentsForDate(selectedDate)}
          onCancel={handleCancel}
          onMessage={handleMessage}
        />
      )}
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.12, top: -80, right: -80 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#A78BFA', opacity: 0.06, bottom: 200, left: -60 },
  scrollContent: { paddingTop: 56, paddingBottom: 140 },

  // Header
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },

  // Bugün özeti
  todaySummary: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  todaySummaryGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.lg },
  todaySummaryLeft: { gap: 2 },
  todaySummaryLabel: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.6)' },
  todaySummaryDate: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  todaySummaryStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  todaySummaryStat: { alignItems: 'center', gap: 2 },
  todaySummaryStatValue: { fontSize: FONTS.large, fontWeight: 'bold' },
  todaySummaryStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  todaySummaryDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Takvim
  calendarSection: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  weekNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  weekNavBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  weekTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  dayNamesRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  dayName: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  daysRow: { flexDirection: 'row', marginBottom: SPACING.md },
  dayBtn: { flex: 1, aspectRatio: 1, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', margin: 2, position: 'relative' },
  dayBtnToday: { borderWidth: 1.5, borderColor: COLORS.primary + '88', backgroundColor: COLORS.primary + '18' },
  dayBtnSelected: { borderWidth: 2, borderColor: COLORS.primary },
  dayNumber: { fontSize: FONTS.small, fontWeight: '600' },
  dayNumberToday: { color: COLORS.primary, fontWeight: 'bold' },
  dayCount: { fontSize: 9, fontWeight: 'bold', marginTop: 1 },
  todayDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },

  // Renk açıklaması
  legend: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.textMuted },

  // Yaklaşan randevular
  upcomingSection: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  upcomingCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  upcomingCardGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  upcomingColorBar: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  upcomingDateCol: { width: 48, alignItems: 'center', paddingLeft: SPACING.sm },
  upcomingDay: { fontSize: 10, fontWeight: '600' },
  upcomingDate: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  upcomingMonth: { fontSize: 10, color: COLORS.textMuted },
  upcomingTimeCol: { alignItems: 'center', gap: 3 },
  upcomingTimeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  upcomingTime: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.primary },
  upcomingContent: { flex: 1, gap: 3 },
  upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upcomingName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  upcomingStatusBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  upcomingStatusText: { fontSize: 10, fontWeight: '700' },
  upcomingService: { fontSize: FONTS.small, color: COLORS.textMuted },
  upcomingMeta: { flexDirection: 'row', gap: SPACING.md },
  upcomingMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  upcomingMetaText: { fontSize: 11, color: COLORS.textMuted },
});