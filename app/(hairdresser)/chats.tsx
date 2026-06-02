// ─────────────────────────────────────────────────────────────
// KUAFÖR SOHBET LİSTESİ (app/(hairdresser)/chats.tsx)
// ─────────────────────────────────────────────────────────────
// Kuaförün müşterilerle sohbetlerini listeler
// Tümü / Okunmamış / Gruplar filtresi
// Her karta tıklayınca kuaför chat detay ekranına gider
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_CHATS = [
  {
    id: 'chat1',
    customerId: 'c1',
    customerName: 'Ayşe Kaya',
    customerEmoji: '👩',
    isOnline: true,
    lastMessage: 'Balayage için ne zaman müsaitsiniz?',
    lastMessageAt: '14:32',
    lastMessageType: 'text',
    unreadCount: 2,
    jobService: 'Balayage',
    jobStatus: 'bidding',
    bidPrice: 750,
    appointmentDate: null as string | null,
  },
  {
    id: 'chat2',
    customerId: 'c2',
    customerName: 'Fatma Şahin',
    customerEmoji: '👩‍🦱',
    isOnline: false,
    lastMessage: 'Randevuyu onayladım, teşekkürler!',
    lastMessageAt: 'Dün',
    lastMessageType: 'text',
    unreadCount: 0,
    jobService: 'Keratin Bakım',
    jobStatus: 'accepted',
    bidPrice: 580,
    appointmentDate: '28 Mayıs, 14:00' as string | null,
  },
  {
    id: 'chat3',
    customerId: 'c3',
    customerName: 'Zeynep Mart',
    customerEmoji: '👩‍🦰',
    isOnline: true,
    lastMessage: 'Wolf cut için fotoğraf gönderdim.',
    lastMessageAt: 'Pazartesi',
    lastMessageType: 'image',
    unreadCount: 1,
    jobService: 'Wolf Cut',
    jobStatus: 'pending',
    bidPrice: 350,
    appointmentDate: null as string | null,
  },
  {
    id: 'chat4',
    customerId: 'c4',
    customerName: 'Merve Yıldız',
    customerEmoji: '👱‍♀️',
    isOnline: false,
    lastMessage: 'Harika sonuç, teşekkürler! ⭐⭐⭐⭐⭐',
    lastMessageAt: '2 gün önce',
    lastMessageType: 'text',
    unreadCount: 0,
    jobService: 'Ombre',
    jobStatus: 'completed',
    bidPrice: 700,
    appointmentDate: null as string | null,
  },
];

// ─── SOHBET KARTI ──────────────────────────────────────────
function ChatCard({ chat, onPress }: {
  chat: typeof DUMMY_CHATS[0];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const unreadAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (chat.unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(unreadAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(unreadAnim, { toValue: 0.7, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [chat.unreadCount]);

  const jobStatusColor = {
    pending: '#FFB844',
    bidding: COLORS.primary,
    accepted: '#34D399',
    completed: '#34D399',
    cancelled: '#F87171',
  }[chat.jobStatus] || COLORS.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.chatCard,
        { transform: [{ scale: scaleAnim }] },
        chat.unreadCount > 0 && styles.chatCardUnread,
      ]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
            style={styles.avatar}
          >
            <Text style={styles.avatarEmoji}>{chat.customerEmoji}</Text>
          </LinearGradient>
          {chat.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* İçerik */}
        <View style={styles.chatContent}>
          {/* Üst satır — isim + saat */}
          <View style={styles.chatTopRow}>
            <Text style={[styles.customerName, chat.unreadCount > 0 && styles.customerNameBold]}>
              {chat.customerName}
            </Text>
            <Text style={styles.messageTime}>{chat.lastMessageAt}</Text>
          </View>

          {/* Badge satırı — iş durumu + fiyat + randevu */}
          <View style={styles.badgeRow}>
            <View style={[styles.jobBadge, { borderColor: jobStatusColor + '44', backgroundColor: jobStatusColor + '18' }]}>
              <View style={[styles.jobBadgeDot, { backgroundColor: jobStatusColor }]} />
              <Text style={[styles.jobBadgeText, { color: jobStatusColor }]}>{chat.jobService}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>₺{chat.bidPrice}</Text>
            </View>
            {chat.appointmentDate && (
              <View style={styles.appointmentBadge}>
                <Ionicons name="calendar-outline" size={10} color={COLORS.primary} />
                <Text style={styles.appointmentText}>{chat.appointmentDate}</Text>
              </View>
            )}
          </View>

          {/* Son mesaj */}
          <View style={styles.lastMessageRow}>
            {chat.lastMessageType === 'image' && (
              <Ionicons name="image-outline" size={12} color={COLORS.textMuted} />
            )}
            <Text
              style={[styles.lastMessage, chat.unreadCount > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {chat.lastMessage}
            </Text>
          </View>
        </View>

        {/* Okunmamış badge */}
        {chat.unreadCount > 0 && (
          <Animated.View style={[styles.unreadBadge, { opacity: unreadAnim }]}>
            <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── BOŞ DURUM ─────────────────────────────────────────────
function EmptyChats({ search, activeFilter }: {
  search: string;
  activeFilter: 'all' | 'unread' | 'groups';
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  if (activeFilter === 'groups') {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
          style={styles.emptyIcon}
        >
          <Ionicons name="people-outline" size={52} color={COLORS.primary} />
        </LinearGradient>
        <Text style={styles.emptyTitle}>Gruplar yakında</Text>
        <Text style={styles.emptyDesc}>
          Müşterilerinizi gruplandırarak toplu mesaj atabileceksiniz
        </Text>
      </View>
    );
  }

  if (search.length > 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
        <Text style={styles.emptyDesc}>"{search}" için sohbet bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <LinearGradient
          colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
          style={styles.emptyIcon}
        >
          <Ionicons name="chatbubbles-outline" size={52} color={COLORS.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
      <Text style={styles.emptyDesc}>
        Müşteriler iş ilanı açınca veya mesaj atınca sohbetler burada görünür
      </Text>
    </View>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(listOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(listAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  const filteredChats = DUMMY_CHATS.filter(c => {
    const matchSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.jobService.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'unread' ? c.unreadCount > 0 :
      false;

    return matchSearch && matchFilter;
  });

  const totalUnread = DUMMY_CHATS.reduce((acc, c) => acc + c.unreadCount, 0);

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
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mesajlar</Text>
            {totalUnread > 0 && (
              <View style={styles.totalUnreadBadge}>
                <Text style={styles.totalUnreadText}>{totalUnread}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{filteredChats.length} sohbet</Text>
        </View>
      </Animated.View>

      {/* ── ARAMA ── */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri veya hizmet ara..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── FİLTRE CHİPLERİ ── */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Tümü', count: DUMMY_CHATS.length },
          { key: 'unread', label: 'Okunmamış', count: DUMMY_CHATS.filter(c => c.unreadCount > 0).length },
          { key: 'groups', label: '👥 Gruplar', count: 0 },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.key as any)}
          >
            <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <View style={[styles.filterCount, activeFilter === filter.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === filter.key && styles.filterCountTextActive]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SOHBET LİSTESİ ── */}
      <Animated.View style={[styles.listContainer, { opacity: listOpacity, transform: [{ translateY: listAnim }] }]}>
        {filteredChats.length > 0 && activeFilter !== 'groups' ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
            renderItem={({ item }) => (
              <ChatCard
                chat={item}
                onPress={() => router.push(`/(hairdresser)/chat/${item.id}` as any)}
              />
            )}
          />
        ) : (
          <EmptyChats search={search} activeFilter={activeFilter} />
        )}
      </Animated.View>
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  totalUnreadBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  totalUnreadText: { fontSize: 11, color: COLORS.white, fontWeight: 'bold' },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md, height: 46, marginBottom: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.regular },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  filterChipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  filterCount: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterCountActive: { backgroundColor: COLORS.primary + '44' },
  filterCountText: { fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold' },
  filterCountTextActive: { color: COLORS.primary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
  chatCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md },
  chatCardUnread: { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: COLORS.primary + '44' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 26 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  chatContent: { flex: 1, gap: 4 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: FONTS.medium, color: COLORS.textPrimary, fontWeight: '600' },
  customerNameBold: { fontWeight: 'bold' },
  messageTime: { fontSize: 11, color: COLORS.textMuted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  jobBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  jobBadgeDot: { width: 5, height: 5, borderRadius: 3 },
  jobBadgeText: { fontSize: 10, fontWeight: '700' },
  priceBadge: { backgroundColor: COLORS.primary + '18', paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS.full },
  priceBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
  appointmentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primary + '18', paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full },
  appointmentText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  lastMessageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastMessage: { fontSize: FONTS.small, color: COLORS.textMuted, flex: 1 },
  lastMessageUnread: { color: COLORS.textSecondary, fontWeight: '600' },
  unreadBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadCount: { fontSize: 11, color: COLORS.white, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});