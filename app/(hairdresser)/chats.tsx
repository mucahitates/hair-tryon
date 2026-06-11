// app/(hairdresser)/chats.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import {
  collection, query, where, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db } from '../../src/services/firebase';

// ─── SOHBET KARTI ──────────────────────────────────────────
function ChatCard({ chat, onPress }: { chat: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const jobStatusColor = ({
    pending: '#FFB844',
    bidding: COLORS.primary,
    accepted: '#34D399',
    completed: '#34D399',
    cancelled: '#F87171',
  } as Record<string, string>)[chat.jobStatus] || COLORS.textMuted;

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHrs < 24) return `${diffHrs} sa`;
    if (diffDays === 1) return 'Dün';
    return `${diffDays} gün`;
  };

  const unreadCount = chat.unreadByHairdresser ? 1 : 0;

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
        unreadCount > 0 && styles.chatCardUnread,
      ]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
            style={styles.avatar}
          >
            <Text style={styles.avatarEmoji}>{chat.customerEmoji || '👤'}</Text>
          </LinearGradient>
        </View>

        {/* İçerik */}
        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text style={[styles.customerName, unreadCount > 0 && styles.customerNameBold]}>
              {chat.customerName || 'Müşteri'}
            </Text>
            <Text style={styles.messageTime}>{formatTime(chat.lastMessageTime)}</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.jobBadge, { borderColor: jobStatusColor + '44', backgroundColor: jobStatusColor + '18' }]}>
              <View style={[styles.jobBadgeDot, { backgroundColor: jobStatusColor }]} />
              <Text style={[styles.jobBadgeText, { color: jobStatusColor }]}>
                {chat.jobService || chat.service || 'Hizmet'}
              </Text>
            </View>
            {(chat.bidPrice > 0) && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>₺{chat.bidPrice}</Text>
              </View>
            )}
          </View>

          <View style={styles.lastMessageRow}>
            <Text
              style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {chat.lastMessage || 'Sohbet başladı'}
            </Text>
          </View>
        </View>

        {/* Okunmamış badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>●</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'chats'),
      where('hairdresserId', '==', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  const filteredChats = chats.filter(c => {
    const matchSearch =
      (c.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.jobService || c.service || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessage || '').toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === 'unread' ? c.unreadByHairdresser === true : true;

    return matchSearch && matchFilter;
  });

  const unreadCount = chats.filter(c => c.unreadByHairdresser).length;

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
      <View style={styles.orb1} />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mesajlar</Text>
            {unreadCount > 0 && (
              <View style={styles.totalUnreadBadge}>
                <Text style={styles.totalUnreadText}>{unreadCount}</Text>
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

      {/* ── FİLTRELER ── */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Tümü', count: chats.length },
          { key: 'unread', label: 'Okunmamış', count: unreadCount },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key as any)}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
            {f.count > 0 && (
              <View style={[styles.filterCount, activeFilter === f.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === f.key && styles.filterCountTextActive]}>
                  {f.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SOHBET LİSTESİ ── */}
      {filteredChats.length > 0 ? (
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
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
            style={styles.emptyIcon}
          >
            <Ionicons name="chatbubbles-outline" size={52} color={COLORS.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>
            {search.length > 0 ? 'Sonuç bulunamadı' : 'Henüz sohbet yok'}
          </Text>
          <Text style={styles.emptyDesc}>
            {search.length > 0
              ? `"${search}" için sohbet bulunamadı`
              : 'Müşterilere teklif verince sohbetler burada görünür'}
          </Text>
        </View>
      )}
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
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
  chatCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md },
  chatCardUnread: { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: COLORS.primary + '44' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 26 },
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
  lastMessageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastMessage: { fontSize: FONTS.small, color: COLORS.textMuted, flex: 1 },
  lastMessageUnread: { color: COLORS.textSecondary, fontWeight: '600' },
  unreadBadge: { justifyContent: 'center', alignItems: 'center' },
  unreadCount: { fontSize: 18, color: COLORS.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});