// app/(customer)/booking.tsx
import { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import {
    doc, getDoc, addDoc, collection, updateDoc,
    increment, serverTimestamp, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../src/services/firebase';

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function BookingScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { campaignId, hairdresserId } = useLocalSearchParams<{ campaignId?: string; hairdresserId: string }>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hairdresser, setHairdresser] = useState<any>(null);
    const [campaign, setCampaign] = useState<any>(null);

    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');

    const [dates, setDates] = useState<{ day: string; date: string; full: string; dayIndex: number }[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [isDayOff, setIsDayOff] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Tarihleri hazırla
    useEffect(() => {
        const nextDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            nextDays.push({
                day: TR_DAYS[d.getDay()],
                date: d.getDate().toString(),
                full: d.toISOString().split('T')[0],
                dayIndex: d.getDay(),
            });
        }
        setDates(nextDays);
        setSelectedDate(nextDays[0].full);
    }, []);

    // Kuaför + Kampanya verisi
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (hairdresserId) {
                    const hdDoc = await getDoc(doc(db, 'hairdresserProfiles', hairdresserId));
                    if (hdDoc.exists()) setHairdresser({ id: hdDoc.id, ...hdDoc.data() });
                }
                if (campaignId) {
                    const campDoc = await getDoc(doc(db, 'campaigns', campaignId));
                    if (campDoc.exists()) setCampaign({ id: campDoc.id, ...campDoc.data() });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            }
        };
        fetchData();
    }, [campaignId, hairdresserId]);

    // Saat slotları + dolu randevular
    useEffect(() => {
        if (!hairdresser || !selectedDate) return;

        const selectedDayObj = dates.find(d => d.full === selectedDate);
        const dayIndex = selectedDayObj?.dayIndex ?? 0;

        let openTime = '09:00';
        let closeTime = '18:00';
        let interval = 60;
        let offDay = false;


        const TR_DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const dayName = TR_DAY_NAMES[dayIndex];

        if (hairdresser.workingHours?.[dayName]) {
            const settings = hairdresser.workingHours[dayName];
            if (!settings.isOpen) {
                offDay = true;
            } else {
                openTime = settings.open || '09:00';
                closeTime = settings.close || '18:00';
                interval = Number(settings.interval) || 60;
            }
        }

        setIsDayOff(offDay);
        setSelectedTime('');

        if (!offDay) {
            const slots: string[] = [];
            let current = new Date(`2000-01-01T${openTime}:00`);
            const end = new Date(`2000-01-01T${closeTime}:00`);
            while (current < end) {
                slots.push(current.toTimeString().substring(0, 5));
                current.setMinutes(current.getMinutes() + interval);
            }
            setAvailableTimeSlots(slots);
        } else {
            setAvailableTimeSlots([]);
        }

        // Dolu saatleri Firestore'dan dinle
        const q = query(
            collection(db, 'appointments'),
            where('hairdresserId', '==', hairdresserId),
            where('date', '==', selectedDate),
            where('status', 'in', ['pending', 'confirmed'])
        );
        const unsub = onSnapshot(q, (snap) => {
            setBookedTimes(snap.docs.map(d => d.data().time));
        });
        return () => unsub();
    }, [selectedDate, hairdresser, hairdresserId, dates]);

    // Hizmet listesi: kampanya varsa kampanyanın hizmetleri, yoksa kuaförün tümü
    // Sadece aktif hizmetleri al
    const hairdresserServices: any[] = (hairdresser?.services || []).filter((s: any) => s.isActive !== false);

    // Kampanya hizmetlerini kuaförün gerçek hizmetleriyle eşleştir
    const matchedServices = campaign?.services?.length > 0
        ? campaign.services
            .map((s: string) => hairdresserServices.find((hs: any) => hs.name === s))
            .filter(Boolean)
        : [];

    // Eşleşen varsa onları göster, yoksa kuaförün tüm hizmetlerini göster
    const availableServices: any[] = matchedServices.length > 0
        ? matchedServices
        : hairdresserServices;
    // console.log('hairdresser services:', hairdresser?.services);
    // console.log('campaign:', JSON.stringify(campaign));


    const discountRate = campaign?.discount || 0;
    const originalPrice = selectedService?.price || 0;
    const finalPrice = Math.round(originalPrice - (originalPrice * discountRate / 100));

    const handleConfirmBooking = async () => {
        if (!selectedService) return Alert.alert('Eksik', 'Lütfen hizmet seçin.');
        if (!selectedTime) return Alert.alert('Eksik', 'Lütfen saat seçin.');
        if (!user?.uid) return;

        setSaving(true);
        try {
            await addDoc(collection(db, 'appointments'), {
                customerId: user.uid,
                customerName: user.displayName || 'Müşteri',
                customerEmoji: '👤',
                hairdresserId,
                hairdresserName: hairdresser?.salonName || '',
                salonName: hairdresser?.salonName || '',
                service: selectedService.name,
                date: selectedDate,
                time: selectedTime,
                duration: selectedService.duration || 60,
                price: finalPrice,
                originalPrice: originalPrice,
                discountApplied: discountRate > 0,
                campaignId: campaign?.id || null,
                status: 'pending',
                chatId: null,
                note: null,
                createdAt: serverTimestamp(),
            });

            if (campaign?.id) {
                await updateDoc(doc(db, 'campaigns', campaign.id), {
                    usageCount: increment(1),
                });
            }

            Alert.alert(
                'Randevu Talebiniz Alındı! 🎉',
                `${hairdresser?.salonName} ile ${selectedDate} tarihinde ${selectedTime} saatinde görüşmek üzere.`,
                [{ text: 'Tamam', onPress: () => router.replace('/(customer)' as any) }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Hata', 'Randevu oluşturulamadı. Tekrar deneyin.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
                start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.orb} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(customer)') as any}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Randevu Al</Text>
                <View style={{ width: 40 }} />
            </View>

            <Animated.ScrollView
                style={{ opacity: fadeAnim }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Kuaför & Kampanya Bilgisi */}
                {hairdresser && (
                    <View style={styles.salonCard}>
                        <LinearGradient
                            colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
                            style={styles.salonCardGradient}
                        >
                            <View style={styles.salonAvatar}>
                                <Text style={{ fontSize: 28 }}>✂️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.salonName}>{hairdresser.salonName}</Text>
                                <Text style={styles.salonLocation}>
                                    {hairdresser.district}, {hairdresser.city}
                                </Text>
                                <View style={styles.salonMeta}>
                                    <Ionicons name="star" size={12} color="#FFB844" />
                                    <Text style={styles.salonRating}>{hairdresser.averageRating || '-'}</Text>
                                </View>
                            </View>
                            {campaign && (
                                <View style={styles.campaignBadge}>
                                    <Text style={styles.campaignEmoji}>{campaign.emoji || '🎉'}</Text>
                                    <Text style={styles.campaignDiscount}>%{campaign.discount} İndirim</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </View>
                )}

                {/* Adım 1: Hizmet */}
                <Text style={styles.stepTitle}>
                    <Text style={styles.stepNumber}>1</Text>  Hizmet Seçin
                </Text>

                {availableServices.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="cut-outline" size={32} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Hizmet bilgisi bulunamadı</Text>
                    </View>
                ) : (
                    <View style={styles.serviceList}>
                        {availableServices.map((srv: any, i: number) => {
                            const isSelected = selectedService?.name === srv.name;
                            const discounted = Math.round(srv.price - (srv.price * discountRate / 100));
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                                    onPress={() => setSelectedService(srv)}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={isSelected
                                            ? [COLORS.primary + '33', COLORS.primaryDark + '22']
                                            : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                                        style={styles.serviceCardGradient}
                                    >
                                        <View style={styles.serviceLeft}>
                                            <View style={styles.serviceIconBox}>
                                                <Ionicons name="cut-outline" size={18} color={COLORS.primary} />
                                            </View>
                                            <View>
                                                <Text style={styles.serviceName}>{srv.name}</Text>
                                                {srv.duration && (
                                                    <View style={styles.serviceDurationRow}>
                                                        <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                                                        <Text style={styles.serviceDuration}>{srv.duration} dk</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.serviceRight}>
                                            {discountRate > 0 && (
                                                <Text style={styles.servicePriceOld}>₺{srv.price}</Text>
                                            )}
                                            <Text style={styles.servicePrice}>₺{discounted}</Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Adım 2: Tarih */}
                <Text style={styles.stepTitle}>
                    <Text style={styles.stepNumber}>2</Text>  Tarih Seçin
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateScroll}
                >
                    {dates.map((d, i) => {
                        const isSelected = selectedDate === d.full;
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                                onPress={() => setSelectedDate(d.full)}
                            >
                                <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{d.day}</Text>
                                <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{d.date}</Text>
                                <Text style={[styles.dateMonth, isSelected && { color: COLORS.white }]}>
                                    {TR_MONTHS[new Date(d.full).getMonth()].slice(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Adım 3: Saat */}
                <Text style={styles.stepTitle}>
                    <Text style={styles.stepNumber}>3</Text>  Saat Seçin
                </Text>

                {isDayOff ? (
                    <View style={styles.offDayBox}>
                        <Ionicons name="close-circle-outline" size={32} color={COLORS.error} />
                        <Text style={styles.offDayText}>Bu gün kapalı</Text>
                    </View>
                ) : availableTimeSlots.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="time-outline" size={32} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Müsait saat bulunamadı</Text>
                    </View>
                ) : (
                    <View style={styles.timeGrid}>
                        {availableTimeSlots.map((time, i) => {
                            const isBooked = bookedTimes.includes(time);
                            const isSelected = selectedTime === time;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.timeCard,
                                        isSelected && styles.timeCardActive,
                                        isBooked && styles.timeCardBooked,
                                    ]}
                                    onPress={() => !isBooked && setSelectedTime(time)}
                                    disabled={isBooked}
                                    activeOpacity={isBooked ? 1 : 0.8}
                                >
                                    {isBooked ? (
                                        <Ionicons name="close" size={14} color={COLORS.textMuted} />
                                    ) : (
                                        <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>
                                            {time}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 160 }} />
            </Animated.ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <LinearGradient
                    colors={['rgba(18,10,31,0)', 'rgba(18,10,31,0.98)']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
                <View style={styles.footerContent}>
                    <View>
                        <Text style={styles.footerLabel}>Toplam Tutar</Text>
                        {discountRate > 0 && selectedService && (
                            <Text style={styles.footerPriceOld}>₺{originalPrice}</Text>
                        )}
                        <Text style={styles.footerPrice}>
                            {selectedService ? `₺${finalPrice}` : '—'}
                        </Text>
                        {discountRate > 0 && (
                            <Text style={styles.footerDiscount}>%{discountRate} kampanya indirimi</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.confirmBtn,
                            (!selectedService || !selectedTime || saving) && styles.confirmBtnDisabled,
                        ]}
                        onPress={handleConfirmBooking}
                        disabled={!selectedService || !selectedTime || saving}
                    >
                        <LinearGradient
                            colors={selectedService && selectedTime && !saving
                                ? [COLORS.primary, COLORS.primaryDark]
                                : ['#333', '#222']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.confirmBtnGradient}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <>
                                    <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
                                    <Text style={styles.confirmBtnText}>Randevu Talep Et</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    orb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
    headerTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

    scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },

    // Salon kartı
    salonCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl },
    salonCardGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
    salonAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
    salonName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
    salonLocation: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
    salonMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    salonRating: { fontSize: FONTS.small, color: '#FFB844', fontWeight: 'bold' },
    campaignBadge: { alignItems: 'center', backgroundColor: COLORS.primary + '22', borderRadius: RADIUS.lg, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary + '44' },
    campaignEmoji: { fontSize: 20 },
    campaignDiscount: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },

    // Adım başlığı
    stepTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
    stepNumber: { color: COLORS.primary },

    // Hizmet listesi
    serviceList: { gap: SPACING.sm, marginBottom: SPACING.xl },
    serviceCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    serviceCardActive: { borderColor: COLORS.primary },
    serviceCardGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
    serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
    serviceIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
    serviceName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
    serviceDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    serviceDuration: { fontSize: 11, color: COLORS.textMuted },
    serviceRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    servicePriceOld: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
    servicePrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },

    // Tarih
    dateScroll: { gap: SPACING.sm, marginBottom: SPACING.xl, paddingBottom: 4 },
    dateCard: { width: 68, paddingVertical: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 3 },
    dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dateDay: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    dateDayActive: { color: 'rgba(255,255,255,0.8)' },
    dateNum: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
    dateNumActive: { color: COLORS.white },
    dateMonth: { fontSize: 10, color: COLORS.textMuted },

    // Saat
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
    timeCard: { width: '31%', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    timeCardActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
    timeCardBooked: { opacity: 0.3, backgroundColor: 'rgba(255,255,255,0.03)' },
    timeText: { fontSize: FONTS.regular, color: COLORS.textSecondary, fontWeight: '600' },
    timeTextActive: { color: COLORS.primary, fontWeight: 'bold' },

    // Boş/kapalı durumlar
    emptyBox: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl, marginBottom: SPACING.xl },
    emptyText: { fontSize: FONTS.small, color: COLORS.textMuted },
    offDayBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.error + '11', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.error + '33', marginBottom: SPACING.xl },
    offDayText: { fontSize: FONTS.medium, color: COLORS.error, fontWeight: '600' },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 40 },
    footerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 36, paddingTop: SPACING.md, backgroundColor: '#120A1F', borderTopWidth: 1, borderTopColor: COLORS.border },
    footerLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 2 },
    footerPriceOld: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through' },
    footerPrice: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
    footerDiscount: { fontSize: 11, color: '#34D399', fontWeight: '600', marginTop: 2 },
    confirmBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 16, paddingHorizontal: 20 },
    confirmBtnText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.white },
});