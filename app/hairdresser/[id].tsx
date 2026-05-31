// ─────────────────────────────────────────────────────────────
// KUAFÖR PROFİL SAYFASI (app/hairdresser/[id].tsx)
// ─────────────────────────────────────────────────────────────
// Herkese açık kuaför profil sayfası — Instagram benzeri
// Keşfet ekranından router.push(`/hairdresser/${id}`) ile açılır
//
// BAĞLANTILAR:
// - useLocalSearchParams → URL'den id parametresini alır
// - authStore → takip durumu ve beğeni için kullanıcı bilgisi
// - Firestore: hairdresserProfiles/{id} → kuaför bilgileri (şimdilik dummy)
// - Firestore: portfolioItems → portfolyo fotoğrafları (şimdilik dummy)
// - Firestore: reviews → yorumlar (şimdilik dummy)
//
// SEKMELER:
// 1. Portfolyo — Instagram grid
// 2. Hizmetler — fiyat listesi
// 3. Yorumlar — müşteri değerlendirmeleri
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
    FlatList,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────
// Firestore'dan gelecek: hairdresserProfiles/{id}
const DUMMY_HAIRDRESSER = {
    id: '1',
    salonName: 'Salon Elegance',
    description: 'Profesyonel saç boyama ve kesim uzmanı. 8 yıllık deneyimle İstanbul Kadıköy\'de hizmet veriyoruz. Balayage, ombre ve özel tasarım kesimler uzmanlık alanlarımız.',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Moda Caddesi No:42, Kadıköy',
    phone: '0532 123 45 67',
    instagram: '@salonelegance',
    emoji: '💇‍♀️',
    specializations: ['Renk', 'Kesim', 'Balayage', 'Ombre', 'Keratin'],
    averageRating: 4.8,
    totalJobs: 124,
    followersCount: 892,
    experience: 8,
    isOnline: true,
    // Detaylı puanlar
    ratings: {
        communication: 4.9,
        quality: 4.8,
        punctuality: 4.7,
        valueForMoney: 4.6,
    },
    // Çalışma saatleri
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

// Firestore'dan gelecek: hairdresserProfiles/{id}/services
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

// Firestore'dan gelecek: portfolioItems koleksiyonu
const DUMMY_PORTFOLIO = [
    { id: '1', emoji: '🌊', category: 'Balayage', likes: 124, isLiked: false },
    { id: '2', emoji: '⭐', category: 'Kesim', likes: 89, isLiked: true },
    { id: '3', emoji: '🎨', category: 'Renk', likes: 203, isLiked: false },
    { id: '4', emoji: '✨', category: 'Ombre', likes: 156, isLiked: false },
    { id: '5', emoji: '💫', category: 'Keratin', likes: 78, isLiked: true },
    { id: '6', emoji: '🌟', category: 'Kesim', likes: 92, isLiked: false },
    { id: '7', emoji: '🦋', category: 'Balayage', likes: 167, isLiked: false },
    { id: '8', emoji: '🌸', category: 'Renk', likes: 134, isLiked: false },
    { id: '9', emoji: '💎', category: 'Ombre', likes: 211, isLiked: true },
];

// Firestore'dan gelecek: reviews koleksiyonu
const DUMMY_REVIEWS = [
    {
        id: '1',
        reviewerName: 'Ayşe K.',
        reviewerEmoji: '👩',
        rating: 5,
        comment: 'Harika bir deneyimdi! Balayage tam istediğim gibi çıktı. Kesinlikle tavsiye ederim.',
        date: '2 gün önce',
        service: 'Balayage',
    },
    {
        id: '2',
        reviewerName: 'Fatma S.',
        reviewerEmoji: '👩‍🦱',
        rating: 4,
        comment: 'Çok profesyonel bir ekip. Saçım çok güzel oldu, fiyat biraz yüksek ama kaliteye değer.',
        date: '1 hafta önce',
        service: 'Keratin Bakım',
    },
    {
        id: '3',
        reviewerName: 'Zeynep M.',
        reviewerEmoji: '👩‍🦰',
        rating: 5,
        comment: 'Yıllardır gittiğim en iyi kuaför. Her seferinde mükemmel sonuç alıyorum.',
        date: '2 hafta önce',
        service: 'Kesim & Renk',
    },
];

// ─── YILDIZ BİLEŞENİ ───────────────────────────────────────
// Puan göstermek için kullanılır
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

// ─── PORTFOLYO KART ─────────────────────────────────────────
// Her portfolyo fotoğrafı için grid kartı
// Gerçek uygulamada Image bileşeni kullanılacak
function PortfolioCard({ item, onPress, onLike }: {
    item: typeof DUMMY_PORTFOLIO[0];
    onPress: () => void;
    onLike: () => void;
}) {
    const [liked, setLiked] = useState(item.isLiked);
    const [likeCount, setLikeCount] = useState(item.likes);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const heartAnim = useRef(new Animated.Value(1)).current;

    const handleLike = () => {
        // Beğeni animasyonu
        Animated.sequence([
            Animated.spring(heartAnim, { toValue: 1.4, useNativeDriver: false }),
            Animated.spring(heartAnim, { toValue: 1, useNativeDriver: false }),
        ]).start();

        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
        onLike();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: false }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
            activeOpacity={1}
        >
            <Animated.View style={[styles.portfolioCard, { transform: [{ scale: scaleAnim }] }]}>
                {/* Fotoğraf alanı — gerçek uygulamada Image */}
                <LinearGradient
                    colors={[COLORS.primary + '44', COLORS.primaryDark + '66']}
                    style={styles.portfolioImage}
                >
                    <Text style={styles.portfolioEmoji}>{item.emoji}</Text>
                    <Text style={styles.portfolioCategory}>{item.category}</Text>
                </LinearGradient>

                {/* Beğeni butonu */}
                <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                    <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={16}
                            color={liked ? COLORS.error : COLORS.white}
                        />
                    </Animated.View>
                    <Text style={styles.likeCount}>{likeCount}</Text>
                </TouchableOpacity>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── HİZMET KARTI ──────────────────────────────────────────
// Her hizmet için fiyat + süre kartı
function ServiceCard({ item }: { item: typeof DUMMY_SERVICES[0] }) {
    return (
        <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <View style={styles.serviceMeta}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.serviceDuration}>{item.duration} dk</Text>
                </View>
            </View>
            <Text style={styles.servicePrice}>₺{item.price}</Text>
        </View>
    );
}

// ─── YORUM KARTI ───────────────────────────────────────────
// Her müşteri yorumu için kart
function ReviewCard({ item }: { item: typeof DUMMY_REVIEWS[0] }) {
    return (
        <View style={styles.reviewCard}>
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
    );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserProfileScreen() {
    const { id } = useLocalSearchParams(); // URL'den kuaför ID'si
    const router = useRouter();
    const { user } = useAuthStore();

    // Aktif sekme: portfolyo / hizmetler / yorumlar
    const [activeTab, setActiveTab] = useState<'portfolio' | 'services' | 'reviews'>('portfolio');
    // Takip durumu — Firestore: follows/{userId_hairdresserId}
    const [isFollowing, setIsFollowing] = useState(false);
    // Hizmet kategorisi filtresi
    const [activeServiceCategory, setActiveServiceCategory] = useState('Tümü');

    // Animasyonlar
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Şu an dummy data kullanıyoruz — id parametresi ileride Firestore sorgusunda kullanılacak
    const hairdresser = DUMMY_HAIRDRESSER;

    // Hizmetleri kategoriye göre filtrele
    const serviceCategories = ['Tümü', ...Array.from(new Set(DUMMY_SERVICES.map(s => s.category)))];
    const filteredServices = activeServiceCategory === 'Tümü'
        ? DUMMY_SERVICES
        : DUMMY_SERVICES.filter(s => s.category === activeServiceCategory);

    const handleFollow = () => {
        // Firestore: follows/{userId_hairdresserId} ekle/sil
        setIsFollowing(!isFollowing);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* ── SCROLL OLUNCA GÖRÜNEN ÜST BAR ── */}
            <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
                <LinearGradient
                    colors={['#1A0533', '#1A0533']}
                    style={styles.stickyHeaderBg}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.stickyHeaderTitle}>{hairdresser.salonName}</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >

                {/* ── GERİ BUTONU (normal) ── */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.topBackBtn}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* ── PROFİL BAŞLIĞI ── */}
                <View style={styles.profileHeader}>

                    {/* Avatar + online */}
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarEmoji}>{hairdresser.emoji}</Text>
                        </LinearGradient>
                        {hairdresser.isOnline && <View style={styles.onlineDot} />}
                    </View>

                    {/* Salon adı + konum */}
                    <Text style={styles.salonName}>{hairdresser.salonName}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                        <Text style={styles.location}>{hairdresser.district}, {hairdresser.city}</Text>
                    </View>

                    {/* İstatistikler — iş sayısı / puan / takipçi */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{hairdresser.totalJobs}</Text>
                            <Text style={styles.statLabel}>İş</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#FFB844" />
                                <Text style={styles.statValue}>{hairdresser.averageRating}</Text>
                            </View>
                            <Text style={styles.statLabel}>Puan</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{hairdresser.followersCount}</Text>
                            <Text style={styles.statLabel}>Takipçi</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{hairdresser.experience} yıl</Text>
                            <Text style={styles.statLabel}>Deneyim</Text>
                        </View>
                    </View>

                    {/* Açıklama */}
                    <Text style={styles.description}>{hairdresser.description}</Text>

                    {/* Uzmanlık etiketleri */}
                    <View style={styles.specTags}>
                        {hairdresser.specializations.map((spec) => (
                            <View key={spec} style={styles.specTag}>
                                <Text style={styles.specTagText}>{spec}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Aksiyon butonları — Takip Et + Randevu Al + Mesaj */}
                    <View style={styles.actionButtons}>
                        {/* Takip Et butonu */}
                        <TouchableOpacity
                            style={[styles.followBtn, isFollowing && styles.followingBtn]}
                            onPress={handleFollow}
                        >
                            <Ionicons
                                name={isFollowing ? 'checkmark' : 'person-add-outline'}
                                size={16}
                                color={isFollowing ? COLORS.primary : COLORS.white}
                            />
                            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                                {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                            </Text>
                        </TouchableOpacity>

                        {/* Randevu Al butonu */}
                        <TouchableOpacity style={styles.appointmentBtn}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.appointmentGradient}
                            >
                                <Ionicons name="calendar-outline" size={16} color={COLORS.white} />
                                <Text style={styles.appointmentBtnText}>Randevu Al</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Mesaj butonu */}
                        {/* Mesaj butonu */}
                        <TouchableOpacity style={styles.messageBtn}>
                            <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.messageBtnText}>Mesaj At</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Detaylı puan değerlendirmeleri */}
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
                                    <View style={[styles.ratingDetailFill, { width: `${(r.value / 5) * 100}%` }]} />
                                </View>
                                <Text style={styles.ratingDetailValue}>{r.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── SEKME NAVİGASYONU ── */}
                <View style={styles.tabBar}>
                    {[
                        { key: 'portfolio', label: 'Portfolyo', icon: 'grid-outline' },
                        { key: 'services', label: 'Hizmetler', icon: 'cut-outline' },
                        { key: 'reviews', label: 'Yorumlar', icon: 'star-outline' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab.key as any)}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={18}
                                color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted}
                            />
                            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── PORTFOLYO SEKMESİ ── */}
                {activeTab === 'portfolio' && (
                    <View style={styles.portfolioGrid}>
                        {DUMMY_PORTFOLIO.map((item) => (
                            <PortfolioCard
                                key={item.id}
                                item={item}
                                onPress={() => { }}
                                onLike={() => { }}
                            />
                        ))}
                    </View>
                )}

                {/* ── HİZMETLER SEKMESİ ── */}
                {activeTab === 'services' && (
                    <View style={styles.servicesContainer}>
                        {/* Kategori filtreleri */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryScroll}
                        >
                            {serviceCategories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.categoryChip, activeServiceCategory === cat && styles.categoryChipActive]}
                                    onPress={() => setActiveServiceCategory(cat)}
                                >
                                    <Text style={[styles.categoryChipText, activeServiceCategory === cat && styles.categoryChipTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Hizmet listesi */}
                        <View style={styles.serviceList}>
                            {filteredServices.map((item) => (
                                <ServiceCard key={item.id} item={item} />
                            ))}
                        </View>

                        {/* Çalışma saatleri */}
                        <Text style={styles.workingHoursTitle}>Çalışma Saatleri</Text>
                        <View style={styles.workingHoursList}>
                            {Object.entries(hairdresser.workingHours).map(([day, hours]) => (
                                <View key={day} style={styles.workingHourItem}>
                                    <Text style={styles.workingHourDay}>{day}</Text>
                                    <Text style={[
                                        styles.workingHourTime,
                                        !hours.isOpen && styles.workingHourClosed,
                                    ]}>
                                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Kapalı'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── YORUMLAR SEKMESİ ── */}
                {activeTab === 'reviews' && (
                    <View style={styles.reviewsContainer}>
                        {DUMMY_REVIEWS.map((item) => (
                            <ReviewCard key={item.id} item={item} />
                        ))}
                    </View>
                )}

            </Animated.ScrollView>
        </View>
    );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Scroll olunca görünen sticky header
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    stickyHeaderBg: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    stickyHeaderTitle: {
        fontSize: FONTS.large,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },

    scrollContent: {
        paddingBottom: 160,
    },

    // Geri butonu (üstte)
    topBackBtn: {
        marginTop: 56,
        marginLeft: SPACING.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Profil başlığı
    profileHeader: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        alignItems: 'center',
    },

    // Avatar
    avatarWrapper: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarEmoji: { fontSize: 48 },
    onlineDot: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.background,
    },

    salonName: {
        fontSize: FONTS.xlarge,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: SPACING.lg,
    },
    location: {
        fontSize: FONTS.small,
        color: COLORS.textMuted,
    },

    // İstatistik satırı
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.lg,
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: FONTS.medium,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },

    description: {
        fontSize: FONTS.small,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.md,
    },

    // Uzmanlık etiketleri
    specTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.lg,
    },
    specTag: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary + '22',
        borderWidth: 1,
        borderColor: COLORS.primary + '44',
    },
    specTagText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },

    // Aksiyon butonları
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        width: '100%',

    },
    messageBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary + '22',
        borderWidth: 1,
        borderColor: COLORS.primary + '44',
    },
    messageBtnText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
    },
    followBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: 12,
        paddingHorizontal: SPACING.sm,  // md yerine sm
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    followingBtn: {
        backgroundColor: COLORS.primary + '22',
        borderColor: COLORS.primary,
    },
    followBtnText: {
        fontSize: 10,
        color: COLORS.textPrimary,
        fontWeight: '800',
    },
    followingBtnText: {
        color: COLORS.primary,
    },
    appointmentBtn: {
        flex: 2,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    appointmentGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
    },
    appointmentBtnText: {
        fontSize: FONTS.small,
        color: COLORS.white,
        fontWeight: '700',
    },
   

    // Detaylı puan
    ratingDetails: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    ratingDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    ratingDetailLabel: {
        fontSize: FONTS.small,
        color: COLORS.textSecondary,
        width: 80,
    },
    ratingDetailBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    ratingDetailFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
    },
    ratingDetailValue: {
        fontSize: FONTS.small,
        color: COLORS.primary,
        fontWeight: 'bold',
        width: 28,
        textAlign: 'right',
    },

    // Sekme navigasyonu
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: COLORS.primary,
    },
    tabLabel: {
        fontSize: FONTS.small,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    tabLabelActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },

    // Portfolyo grid — 3 sütun
    portfolioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.sm,
        gap: 2,
    },
    portfolioCard: {
        width: (width - SPACING.sm * 2 - 4) / 3,
        aspectRatio: 1,
        position: 'relative',
    },
    portfolioImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    portfolioEmoji: { fontSize: 36 },
    portfolioCategory: {
        fontSize: 9,
        color: COLORS.white,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: RADIUS.full,
    },
    likeButton: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderRadius: RADIUS.full,
    },
    likeCount: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: '600',
    },

    // Hizmetler
    servicesContainer: {
        paddingHorizontal: SPACING.lg,
    },
    categoryScroll: {
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    categoryChip: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: RADIUS.full,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary + '33',
        borderColor: COLORS.primary,
    },
    categoryChipText: {
        fontSize: FONTS.small,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    serviceList: {
        gap: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    serviceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
    },
    serviceInfo: {
        gap: 4,
    },
    serviceName: {
        fontSize: FONTS.medium,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    serviceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    serviceDuration: {
        fontSize: FONTS.small,
        color: COLORS.textMuted,
    },
    servicePrice: {
        fontSize: FONTS.large,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    workingHoursTitle: {
        fontSize: FONTS.large,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    workingHoursList: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    workingHourItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    workingHourDay: {
        fontSize: FONTS.small,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    workingHourTime: {
        fontSize: FONTS.small,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    workingHourClosed: {
        color: COLORS.error,
    },

    // Yorumlar
    reviewsContainer: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    reviewCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.xl,
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        gap: SPACING.md,
        alignItems: 'center',
    },
    reviewAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '22',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewAvatarEmoji: { fontSize: 22 },
    reviewerInfo: { gap: 4 },
    reviewerName: {
        fontSize: FONTS.medium,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    reviewMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    reviewDate: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    reviewServiceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primary + '22',
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.primary + '44',
    },
    reviewServiceText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '600',
    },
    reviewComment: {
        fontSize: FONTS.small,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
});