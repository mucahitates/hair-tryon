// ─────────────────────────────────────────────────────────────
// KUAFÖR PROFİL SAYFASI (app/hairdresser/[id].tsx)
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
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── TİPLER ────────────────────────────────────────────────
type TabType = 'portfolio' | 'services' | 'reviews';

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_HAIRDRESSER = {
  id: '1',
  salonName: 'Salon Elegance',
  ownerName: 'Aylin Çelik',
  description: 'Profesyonel saç boyama ve kesim uzmanı. 8 yıllık deneyimle İstanbul Kadıköy\'de hizmet veriyoruz.',
  city: 'İstanbul',
  district: 'Kadıköy',
  address: 'Moda Caddesi No:42, Kadıköy',
  phone: '0532 123 45 67',
  instagram: '@salonelegance',
  emoji: '✂️',
  specializations: ['Renk', 'Kesim', 'Balayage', 'Ombre', 'Keratin'],
  averageRating: 4.8,
  totalJobs: 124,
  followersCount: 892,
  experience: 8,
  isOnline: true,
  ratings: {
    communication: 4.9,
    quality: 4.8,
    punctuality: 4.7,
    valueForMoney: 4.6,
  },
  workingHours: {
    'Pazartesi': { isOpen: true, open: '09:00', close: '19:00' },
    'Salı': { isOpen: true, open: '09:00', close: '19:00' },
    'Çarşamba': { isOpen: true, open: '09:00', close: '19:00' },
    'Perşembe': { isOpen: true, open: '09:00', close: '19:00' },
    'Cuma': { isOpen: true, open: '09:00', close: '20:00' },
    'Cumartesi': { isOpen: true, open: '10:00', close: '18:00' },
    'Pazar': { isOpen: false, open: '', close: '' },
  },
};

const DUMMY_SERVICES = [
  { id: '1', category: 'Kesim', name: 'Klasik Kesim', price: 200, duration: 45 },
  { id: '2', category: 'Kesim', name: 'Özel Tasarım Kesim', price: 350, duration: 60 },
  { id: '3', category: 'Renk', name: 'Tek Renk Boyama', price: 400, duration: 90 },
  { id: '4', category: 'Renk', name: 'Balayage', price: 800, duration: 180 },
  { id: '5', category: 'Renk', name: 'Ombre', price: 700, duration: 150 },
  { id: '6', category: 'Bakım', name: 'Keratin Bakım', price: 600, duration: 120 },
  { id: '7', category: 'Bakım', name: 'Protein Bakım', price: 300, duration: 60 },
  { id: '8', category: 'Şekillendirme', name: 'Fön', price: 150, duration: 30 },
];

const DUMMY_PORTFOLIO = [
  { id: 'p1', service: 'Balayage', category: 'Renk', colorInfo: 'Karamel & Bal Sarısı', price: 750, duration: 180, date: '24 Mayıs 2025', beforeEmoji: '😐', afterEmoji: '✨', likes: 48, comments: 12, isLiked: false, note: 'Doğal geçişli balayage.' },
  { id: 'p2', service: 'Wolf Cut', category: 'Kesim', colorInfo: null, price: 350, duration: 60, date: '20 Mayıs 2025', beforeEmoji: '😶', afterEmoji: '🔥', likes: 92, comments: 24, isLiked: true, note: 'Textured wolf cut.' },
  { id: 'p3', service: 'Keratin', category: 'Bakım', colorInfo: null, price: 600, duration: 120, date: '15 Mayıs 2025', beforeEmoji: '😔', afterEmoji: '💫', likes: 31, comments: 7, isLiked: false, note: 'Brezilya keratin.' },
  { id: 'p4', service: 'Ombre', category: 'Renk', colorInfo: 'Koyu Kahve → Karamel', price: 700, duration: 150, date: '10 Mayıs 2025', beforeEmoji: '😑', afterEmoji: '🌟', likes: 156, comments: 38, isLiked: true, note: 'Doğal geçişli ombre.' },
  { id: 'p5', service: 'Kesim', category: 'Kesim', colorInfo: null, price: 200, duration: 45, date: '5 Mayıs 2025', beforeEmoji: '😪', afterEmoji: '😎', likes: 67, comments: 15, isLiked: false, note: 'Klasik kesim.' },
  { id: 'p6', service: 'Boyama', category: 'Renk', colorInfo: 'Bakır Kırmızı', price: 400, duration: 90, date: '1 Mayıs 2025', beforeEmoji: '😒', afterEmoji: '🎨', likes: 203, comments: 52, isLiked: false, note: 'Bakır kırmızı boyama.' },
];

const DUMMY_REVIEWS = [
  { id: 'r1', reviewerName: 'Ayşe K.', reviewerEmoji: '👩', rating: 5, comment: 'Harika bir deneyimdi! Balayage tam istediğim gibi çıktı.', date: '2 gün önce', service: 'Balayage' },
  { id: 'r2', reviewerName: 'Fatma S.', reviewerEmoji: '👩‍🦱', rating: 4, comment: 'Çok profesyonel bir ekip. Saçım çok güzel oldu.', date: '1 hafta önce', service: 'Keratin Bakım' },
  { id: 'r3', reviewerName: 'Zeynep M.', reviewerEmoji: '👩‍🦰', rating: 5, comment: 'Yıllardır gittiğim en iyi kuaför.', date: '2 hafta önce', service: 'Kesim & Renk' },
];

// Müsait saatler — gerçekte Firestore'dan gelecek
const DUMMY_AVAILABILITY: Record<string, string[]> = {
  [getDateOffset(0)]: ['10:00', '11:30', '14:00', '16:30'],
  [getDateOffset(1)]: ['09:00', '11:00', '13:30', '15:00', '17:00'],
  [getDateOffset(2)]: ['10:30', '14:00'],
  [getDateOffset(3)]: ['09:00', '10:00', '11:00', '13:00', '14:30', '16:00'],
  [getDateOffset(4)]: ['11:00', '15:30'],
  [getDateOffset(5)]: ['10:00', '12:00', '14:00'],
  [getDateOffset(6)]: [],
};

function getDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// ─── YILDIZ BİLEŞENİ ───────────────────────────────────────
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

// ─── RANDEVU AL MODALI ─────────────────────────────────────
function AppointmentModal({ visible, onClose, hairdresser }: {
  visible: boolean;
  onClose: () => void;
  hairdresser: typeof DUMMY_HAIRDRESSER;
}) {
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<typeof DUMMY_SERVICES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setStep('service');
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setNote('');
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  // 7 günlük tarihler
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const availableTimes = selectedDate ? (DUMMY_AVAILABILITY[selectedDate] || []) : [];

  const handleConfirm = () => {
    // TODO: Firestore'a randevu kaydet
    Alert.alert(
      'Randevu Oluşturuldu! 🎉',
      `${hairdresser.salonName} ile ${selectedDate} tarihinde ${selectedTime} saatinde ${selectedService?.name} randevunuz oluşturuldu.`,
      [{ text: 'Tamam', onPress: onClose }]
    );
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={aptStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[aptStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

          {/* Handle */}
          <View style={aptStyles.handle} />

          {/* Header */}
          <View style={aptStyles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step === 'datetime') setStep('service');
                else if (step === 'confirm') setStep('datetime');
                else onClose();
              }}
              style={aptStyles.backBtn}
            >
              <Ionicons name={step === 'service' ? 'close' : 'arrow-back'} size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={aptStyles.headerCenter}>
              <Text style={aptStyles.headerTitle}>Randevu Al</Text>
              <Text style={aptStyles.headerSub}>{hairdresser.salonName}</Text>
            </View>
            {/* Adım göstergesi */}
            <View style={aptStyles.stepIndicator}>
              {['service', 'datetime', 'confirm'].map((s, i) => (
                <View
                  key={s}
                  style={[
                    aptStyles.stepDot,
                    { backgroundColor: ['service', 'datetime', 'confirm'].indexOf(step) >= i ? COLORS.primary : COLORS.border }
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

            {/* ── ADIM 1: HİZMET SEÇ ── */}
            {step === 'service' && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Hizmet Seçin</Text>
                <Text style={aptStyles.stepSub}>Hangi hizmeti almak istiyorsunuz?</Text>

                {DUMMY_SERVICES.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[aptStyles.serviceCard, selectedService?.id === service.id && aptStyles.serviceCardActive]}
                    onPress={() => setSelectedService(service)}
                  >
                    <LinearGradient
                      colors={selectedService?.id === service.id
                        ? [COLORS.primary + '33', COLORS.primaryDark + '22']
                        : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']
                      }
                      style={aptStyles.serviceCardGradient}
                    >
                      <View style={aptStyles.serviceCardLeft}>
                        <View style={[aptStyles.serviceIconWrapper, { backgroundColor: COLORS.primary + '22' }]}>
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
                        {selectedService?.id === service.id && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── ADIM 2: TARİH & SAAT ── */}
            {step === 'datetime' && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Tarih & Saat</Text>
                <Text style={aptStyles.stepSub}>Müsait bir gün ve saat seçin</Text>

                {/* Gün seçici */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={aptStyles.dayScroll}>
                  {weekDays.map((day) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const avail = DUMMY_AVAILABILITY[dateStr] || [];
                    const isSelected = selectedDate === dateStr;
                    const hasSlots = avail.length > 0;

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          aptStyles.dayCard,
                          isSelected && aptStyles.dayCardActive,
                          !hasSlots && aptStyles.dayCardDisabled,
                        ]}
                        onPress={() => {
                          if (hasSlots) {
                            setSelectedDate(dateStr);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={!hasSlots}
                      >
                        <Text style={[aptStyles.dayCardName, isSelected && aptStyles.dayCardNameActive, !hasSlots && aptStyles.dayCardDisabledText]}>
                          {TR_DAYS_SHORT[day.getDay()]}
                        </Text>
                        <Text style={[aptStyles.dayCardNumber, isSelected && aptStyles.dayCardNumberActive, !hasSlots && aptStyles.dayCardDisabledText]}>
                          {day.getDate()}
                        </Text>
                        <Text style={[aptStyles.dayCardSlots, !hasSlots && aptStyles.dayCardDisabledText]}>
                          {hasSlots ? `${avail.length} slot` : 'Dolu'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Saat seçici */}
                {selectedDate && (
                  <View style={aptStyles.timesSection}>
                    <Text style={aptStyles.timesSectionTitle}>
                      Müsait Saatler — {new Date(selectedDate).getDate()} {TR_MONTHS[new Date(selectedDate).getMonth()]}
                    </Text>
                    <View style={aptStyles.timesGrid}>
                      {availableTimes.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[aptStyles.timeChip, selectedTime === time && aptStyles.timeChipActive]}
                          onPress={() => setSelectedTime(time)}
                        >
                          <Text style={[aptStyles.timeChipText, selectedTime === time && aptStyles.timeChipTextActive]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Not */}
                <View style={aptStyles.noteSection}>
                  <Text style={aptStyles.noteLabel}>Not (opsiyonel)</Text>
                  <TextInput
                    style={aptStyles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Kuaföre not bırakın..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    maxLength={200}
                  />
                </View>
              </View>
            )}

            {/* ── ADIM 3: ONAY ── */}
            {step === 'confirm' && selectedService && selectedDate && selectedTime && (
              <View style={aptStyles.stepContent}>
                <Text style={aptStyles.stepTitle}>Randevu Özeti</Text>
                <Text style={aptStyles.stepSub}>Bilgileri kontrol edin ve onaylayın</Text>

                {/* Kuaför bilgisi */}
                <View style={aptStyles.confirmSalon}>
                  <LinearGradient
                    colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                    style={aptStyles.confirmSalonGradient}
                  >
                    <View style={aptStyles.confirmSalonAvatar}>
                      <Text style={{ fontSize: 28 }}>{hairdresser.emoji}</Text>
                    </View>
                    <View>
                      <Text style={aptStyles.confirmSalonName}>{hairdresser.salonName}</Text>
                      <Text style={aptStyles.confirmSalonLocation}>{hairdresser.district}, {hairdresser.city}</Text>
                      <View style={aptStyles.confirmSalonRating}>
                        <Ionicons name="star" size={12} color="#FFB844" />
                        <Text style={aptStyles.confirmSalonRatingText}>{hairdresser.averageRating}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Randevu detayları */}
                <View style={aptStyles.confirmDetails}>
                  {[
                    { icon: 'cut-outline', label: 'Hizmet', value: selectedService.name, color: COLORS.primary },
                    { icon: 'calendar-outline', label: 'Tarih', value: `${new Date(selectedDate).getDate()} ${TR_MONTHS[new Date(selectedDate).getMonth()]}`, color: COLORS.primary },
                    { icon: 'time-outline', label: 'Saat', value: selectedTime, color: COLORS.primary },
                    { icon: 'hourglass-outline', label: 'Süre', value: `${selectedService.duration} dakika`, color: COLORS.textMuted },
                    { icon: 'cash-outline', label: 'Ücret', value: `₺${selectedService.price}`, color: '#34D399' },
                  ].map((item, index, arr) => (
                    <View key={item.label}>
                      <View style={aptStyles.confirmDetailRow}>
                        <View style={[aptStyles.confirmDetailIcon, { backgroundColor: item.color + '22' }]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
                        </View>
                        <View style={aptStyles.confirmDetailInfo}>
                          <Text style={aptStyles.confirmDetailLabel}>{item.label}</Text>
                          <Text style={[aptStyles.confirmDetailValue, item.label === 'Ücret' && { color: '#34D399' }]}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                      {index < arr.length - 1 && <View style={aptStyles.confirmDivider} />}
                    </View>
                  ))}

                  {note ? (
                    <>
                      <View style={aptStyles.confirmDivider} />
                      <View style={aptStyles.confirmDetailRow}>
                        <View style={[aptStyles.confirmDetailIcon, { backgroundColor: COLORS.primary + '22' }]}>
                          <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                        </View>
                        <View style={aptStyles.confirmDetailInfo}>
                          <Text style={aptStyles.confirmDetailLabel}>Not</Text>
                          <Text style={aptStyles.confirmDetailValue}>{note}</Text>
                        </View>
                      </View>
                    </>
                  ) : null}
                </View>

                {/* Uyarı */}
                <View style={aptStyles.warningCard}>
                  <Ionicons name="information-circle-outline" size={16} color="#FFB844" />
                  <Text style={aptStyles.warningText}>
                    Randevuyu iptal etmek için en az 2 saat öncesinde bildirim yapınız.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Alt buton */}
          <View style={aptStyles.footer}>
            {step === 'service' && (
              <TouchableOpacity
                style={[aptStyles.nextBtn, !selectedService && aptStyles.nextBtnDisabled]}
                onPress={() => selectedService && setStep('datetime')}
                disabled={!selectedService}
              >
                <LinearGradient
                  colors={selectedService ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={aptStyles.nextBtnGradient}
                >
                  <Text style={aptStyles.nextBtnText}>Devam Et</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {step === 'datetime' && (
              <TouchableOpacity
                style={[aptStyles.nextBtn, (!selectedDate || !selectedTime) && aptStyles.nextBtnDisabled]}
                onPress={() => selectedDate && selectedTime && setStep('confirm')}
                disabled={!selectedDate || !selectedTime}
              >
                <LinearGradient
                  colors={selectedDate && selectedTime ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={aptStyles.nextBtnGradient}
                >
                  <Text style={aptStyles.nextBtnText}>İncele</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {step === 'confirm' && (
              <TouchableOpacity style={aptStyles.nextBtn} onPress={handleConfirm}>
                <LinearGradient
                  colors={['#34D399', '#059669']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={aptStyles.nextBtnGradient}
                >
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
  stepSub: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: -SPACING.xs },
  // Hizmet kartları
  serviceCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  serviceCardActive: { borderColor: COLORS.primary },
  serviceCardGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  serviceCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  serviceIconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  serviceMetaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  serviceMetaDot: { color: COLORS.textMuted, fontSize: 10 },
  serviceCategory: { fontSize: FONTS.small, color: COLORS.primary },
  serviceCardRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  servicePrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  // Gün seçici
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
  // Saat seçici
  timesSection: { gap: SPACING.sm },
  timesSectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  timeChipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  timeChipText: { fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '600' },
  timeChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  // Not
  noteSection: { gap: SPACING.xs },
  noteLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  noteInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.regular, minHeight: 80, textAlignVertical: 'top' },
  // Onay
  confirmSalon: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  confirmSalonGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  confirmSalonAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  confirmSalonName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  confirmSalonLocation: { fontSize: FONTS.small, color: COLORS.textMuted },
  confirmSalonRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  confirmSalonRatingText: { fontSize: FONTS.small, color: '#FFB844', fontWeight: '600' },
  confirmDetails: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  confirmDetailRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  confirmDetailIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  confirmDetailInfo: { flex: 1 },
  confirmDetailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: 2 },
  confirmDetailValue: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  confirmDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  warningCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: '#FFB844' + '18', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#FFB844' + '44' },
  warningText: { flex: 1, fontSize: FONTS.small, color: '#FFB844', lineHeight: 18 },
  // Footer
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  nextBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});

// ─── PORTFOLYo DETAY MODALI ────────────────────────────────
function PortfolioDetailModal({ visible, onClose, item }: {
  visible: boolean;
  onClose: () => void;
  item: typeof DUMMY_PORTFOLIO[0] | null;
}) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const slideAnim = useRef(new Animated.Value(600)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && item) {
      setIsLiked(item.isLiked);
      setActiveTab('after');
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
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

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[portDetailStyles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#140824', '#090514']} style={StyleSheet.absoluteFill} />

        <TouchableOpacity style={portDetailStyles.closeBtn} onPress={onClose}>
          <Ionicons name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Fotoğraf */}
          <View style={portDetailStyles.photoBox}>
            <LinearGradient
              colors={activeTab === 'before' ? ['#1A1C29', '#12141F'] : ['#2A1F3D', '#1A0F2E']}
              style={portDetailStyles.photoGradient}
            >
              <Text style={portDetailStyles.photoEmoji}>
                {activeTab === 'before' ? item.beforeEmoji : item.afterEmoji}
              </Text>
              {/* Toggle */}
              <View style={portDetailStyles.toggleWrapper}>
                <TouchableOpacity
                  style={[portDetailStyles.toggleBtn, activeTab === 'before' && portDetailStyles.toggleActive]}
                  onPress={() => setActiveTab('before')}
                >
                  <Text style={[portDetailStyles.toggleText, activeTab === 'before' && portDetailStyles.toggleActiveText]}>Önce</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[portDetailStyles.toggleBtn, activeTab === 'after' && portDetailStyles.toggleActive]}
                  onPress={() => setActiveTab('after')}
                >
                  <Text style={[portDetailStyles.toggleText, activeTab === 'after' && portDetailStyles.toggleActiveText]}>Sonra</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={portDetailStyles.content}>
            {/* Başlık */}
            <View style={portDetailStyles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={portDetailStyles.serviceName}>{item.service}</Text>
                {item.colorInfo && <Text style={portDetailStyles.colorInfo}>{item.colorInfo}</Text>}
              </View>
              <View style={portDetailStyles.priceBadge}>
                <Text style={portDetailStyles.priceText}>₺{item.price}</Text>
              </View>
            </View>

            {/* Detay badge'leri */}
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

            {/* Not */}
            {item.note && (
              <View style={portDetailStyles.noteBox}>
                <Text style={portDetailStyles.noteText}>{item.note}</Text>
              </View>
            )}

            {/* Aksiyon */}
            <View style={portDetailStyles.actionsRow}>
              <TouchableOpacity style={portDetailStyles.actionBtn} onPress={handleLike}>
                <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                  <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? '#F87171' : COLORS.textSecondary} />
                </Animated.View>
                <Text style={portDetailStyles.actionCount}>{item.likes + (isLiked && !item.isLiked ? 1 : 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={portDetailStyles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
                <Text style={portDetailStyles.actionCount}>{item.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={portDetailStyles.actionBtn}>
                <Ionicons name="bookmark-outline" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={portDetailStyles.actionBtn}>
                <Ionicons name="share-outline" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Yorum yaz */}
            <View style={portDetailStyles.commentInput}>
              <TextInput
                style={portDetailStyles.commentField}
                value={comment}
                onChangeText={setComment}
                placeholder="Yorum yaz..."
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={[portDetailStyles.commentSendBtn, comment.trim() && portDetailStyles.commentSendBtnActive]}
                disabled={!comment.trim()}
              >
                <Ionicons name="send" size={16} color={comment.trim() ? COLORS.white : COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const portDetailStyles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeBtn: { position: 'absolute', top: 56, left: SPACING.lg, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  photoBox: { width, height: width * 1.1 },
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
  priceBadge: { backgroundColor: COLORS.success + '22', paddingVertical: 7, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.success + '44' },
  priceText: { color: COLORS.success, fontWeight: '800', fontSize: FONTS.medium },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  noteBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md },
  noteText: { fontSize: FONTS.regular, color: COLORS.textMuted, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: SPACING.xl, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { fontSize: FONTS.small, color: COLORS.textMuted },
  commentInput: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  commentField: { flex: 1, color: COLORS.white, fontSize: FONTS.regular },
  commentSendBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  commentSendBtnActive: { backgroundColor: COLORS.primary },
});

// ─── PORTFOLYo GRID KARTI ──────────────────────────────────
function PortfolioGridCard({ item, onPress }: {
  item: typeof DUMMY_PORTFOLIO[0];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // 2x Grid Hesaplaması:
  // Ekran Genişliği - (Sağ/Sol Padding) - (Ortadaki Boşluk) / 2
  const ITEM_SIZE = (width - (SPACING.lg * 2) - 12) / 2;

  // Kategorilere göre dinamik tema renkleri
  const categoryColors: Record<string, string> = {
    'Renk': '#A78BFA',       
    'Kesim': '#34D399',      
    'Bakım': '#60A5FA',      
    'Şekillendirme': '#F472B6', 
    'Kimyasal': '#FB923C',   
  };
  const catColor = categoryColors[item.category] || COLORS.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      activeOpacity={0.9}
    >
      {/* marginBottom'u kaldırdık, çünkü grid ayarlarından yöneteceğiz */}
      <Animated.View style={[{ width: ITEM_SIZE }, { transform: [{ scale: scaleAnim }] }]}>
        {/* Ana Kart Konteyneri */}
        <View style={[
          portGridStyles.cardContainer,
          { borderColor: catColor + '55', shadowColor: catColor } 
        ]}>
          
          <View style={portGridStyles.splitContainer}>
            <LinearGradient colors={['#1A1C29', '#12141F']} style={portGridStyles.halfSide}>
              <Text style={portGridStyles.emojiBefore}>{item.beforeEmoji}</Text>
            </LinearGradient>
            
            <LinearGradient colors={['#2A1F3D', '#1A0F2E']} style={portGridStyles.halfSide}>
              <Text style={portGridStyles.emojiAfter}>{item.afterEmoji}</Text>
            </LinearGradient>
            
            <View style={portGridStyles.centerDivider} />
          </View>

          <View style={[portGridStyles.topBadge, { backgroundColor: catColor + '33', borderColor: catColor + '55' }]}>
            <Text style={[portGridStyles.topBadgeText, { color: catColor }]}>{item.category}</Text>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(10, 5, 20, 0.98)']}
            style={portGridStyles.bottomOverlay}
          >
            <Text style={portGridStyles.serviceText} numberOfLines={1}>
              {item.service}
            </Text>
            
            <View style={portGridStyles.metaRow}>
              <View style={portGridStyles.metaItem}>
                <Ionicons name="heart" size={13} color="#F87171" />
                <Text style={portGridStyles.metaText}>{item.likes}</Text>
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

// ... portGridStyles kısmı aynı kalacak, sadece yazı boyutlarını 2x grid için biraz büyütmek istersen serviceText'i fontSize: 14 yapabilirsin.

// Portfolyo Grid Kartına Özel Stiller
const portGridStyles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    aspectRatio: 0.75, // Saç modelleri için ideal portre oranı
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#1A1C29',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  halfSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBefore: {
    fontSize: 26,
    opacity: 0.4,
  },
  emojiAfter: {
    fontSize: 36,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  centerDivider: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    left: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  topBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 32,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  priceBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserPublicProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [selectedPortfolio, setSelectedPortfolio] = useState<typeof DUMMY_PORTFOLIO[0] | null>(null);
  const [showAppointment, setShowAppointment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeServiceCategory, setActiveServiceCategory] = useState('Tümü');

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });

  const hairdresser = DUMMY_HAIRDRESSER;
  const serviceCategories = ['Tümü', ...Array.from(new Set(DUMMY_SERVICES.map(s => s.category)))];
  const filteredServices = activeServiceCategory === 'Tümü' ? DUMMY_SERVICES : DUMMY_SERVICES.filter(s => s.category === activeServiceCategory);

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
        {/* Geri */}
        <TouchableOpacity onPress={() => router.back()} style={styles.topBackBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* ── PROFİL BAŞLIĞI ── */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarWrapper}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{hairdresser.emoji}</Text>
            </LinearGradient>
            {hairdresser.isOnline && <View style={styles.onlineDot} />}
          </TouchableOpacity>

          <Text style={styles.salonName}>{hairdresser.salonName}</Text>
          <Text style={styles.ownerName}>{hairdresser.ownerName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.location}>{hairdresser.district}, {hairdresser.city}</Text>
          </View>

          {/* İstatistikler */}
          <View style={styles.statsRow}>
            {[
              { value: hairdresser.totalJobs, label: 'İş' },
              { value: hairdresser.averageRating, label: 'Puan', isRating: true },
              { value: hairdresser.followersCount, label: 'Takipçi' },
              { value: `${hairdresser.experience}y`, label: 'Deneyim' },
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

          {/* Bio */}
          <Text style={styles.description}>{hairdresser.description}</Text>

          {/* Uzmanlık */}
          <View style={styles.specTags}>
            {hairdresser.specializations.map((spec) => (
              <View key={spec} style={styles.specTag}>
                <Text style={styles.specTagText}>{spec}</Text>
              </View>
            ))}
          </View>

          {/* Aksiyon butonları */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Ionicons name={isFollowing ? 'checkmark' : 'person-add-outline'} size={14} color={isFollowing ? COLORS.primary : COLORS.white} />
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appointmentBtn} onPress={() => setShowAppointment(true)}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.appointmentGradient}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.white} />
                <Text style={styles.appointmentBtnText}>Randevu Al</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageBtn} onPress={() => router.push('/chat/chat1' as any)}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
              <Text style={styles.messageBtnText}>Mesaj</Text>
            </TouchableOpacity>
          </View>

          {/* Detaylı puanlar */}
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
        </View>

        {/* ── SEKMELER ── */}
        <View style={styles.tabBar}>
          {[
            { key: 'portfolio', label: 'Portfolyo', icon: 'grid-outline' },
            { key: 'services', label: 'Hizmetler', icon: 'cut-outline' },
            { key: 'reviews', label: 'Yorumlar', icon: 'star-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted} />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PORTFOLYo ── */}
        {activeTab === 'portfolio' && (
          <View style={styles.portfolioGrid}>
            {DUMMY_PORTFOLIO.map((item) => (
              <PortfolioGridCard
                key={item.id}
                item={item}
                onPress={() => setSelectedPortfolio(item)}
              />
            ))}
          </View>
        )}

        {/* ── HİZMETLER ── */}
        {activeTab === 'services' && (
          <View style={styles.servicesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {serviceCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, activeServiceCategory === cat && styles.categoryChipActive]}
                  onPress={() => setActiveServiceCategory(cat)}
                >
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
          </View>
        )}

        {/* ── YORUMLAR ── */}
        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {DUMMY_REVIEWS.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarEmoji}>{item.reviewerEmoji}</Text>
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

      {/* Randevu modalı */}
      <AppointmentModal
        visible={showAppointment}
        onClose={() => setShowAppointment(false)}
        hairdresser={hairdresser}
      />

      {/* Portfolyo detay */}
      <PortfolioDetailModal
        visible={selectedPortfolio !== null}
        onClose={() => setSelectedPortfolio(null)}
        item={selectedPortfolio}
      />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg, // Yanlardan genel boşluk
    justifyContent: 'space-between', // Kartları sağa ve sola yaslar, ortada boşluk bırakır (Ortalanmış görünüm)
    columnGap: 12, // Yan yana kartlar arası boşluk (ITEM_SIZE hesaplamasındaki 12 ile aynı olmalı)
    rowGap: 16, // Alt alta kartlar arası boşluk
    paddingBottom: SPACING.xl,
  },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  stickyHeaderBg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: SPACING.md, paddingHorizontal: SPACING.lg },
  stickyHeaderTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  scrollContent: { paddingBottom: 160 },
  topBackBtn: { marginTop: 56, marginLeft: SPACING.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  profileHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
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