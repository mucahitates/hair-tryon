// ─────────────────────────────────────────────────────────────
// SOHBET LİSTESİ EKRANI (app/(customer)/chats.tsx)
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

// FİREBASE IMPORTLARI
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/services/firebase'; 

const { width } = Dimensions.get('window');

// ─── TİP TANIMLAMALARI ─────────────────────────────────────
export interface Chat {
  id: string;
  hairdresserId: string;
  hairdresserName: string;
  hairdresserEmoji: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageAt: any; // Firestore Timestamp
  lastMessageType: string;
  unreadCustomer: number;
  jobId: string;
  jobService: string;
  jobStatus: string;
  appointmentDate: string | null;
}

// ─── SOHBET KARTI ──────────────────────────────────────────
function ChatCard({ chat, onPress }: { chat: Chat; onPress: () => void; }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const unreadAnim = useRef(new Animated.Value(0)).current;

  // Firestore Timestamp'i güvenli bir şekilde saate çevirme
  const timeStr = chat.lastMessageAt?.toDate
    ? chat.lastMessageAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  useEffect(() => {
    if (chat.unreadCustomer > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(unreadAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(unreadAnim, { toValue: 0.7, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [chat.unreadCustomer]);

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
        chat.unreadCustomer > 0 && styles.chatCardUnread,
      ]}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => router.push(`/hairdresser/${chat.hairdresserId}` as any)}
          activeOpacity={0.7}
        >
          <LinearGradient colors={[COLORS.primary + '44', COLORS.primaryDark + '33']} style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{chat.hairdresserEmoji || '💈'}</Text>
          </LinearGradient>
          {chat.isOnline && <View style={styles.onlineDot} />}
        </TouchableOpacity>

        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text style={[styles.hairdresserName, chat.unreadCustomer > 0 && styles.hairdresserNameBold]}>
              {chat.hairdresserName}
            </Text>
            <Text style={styles.messageTime}>{timeStr}</Text>
          </View>

          <View style={styles.jobBadgeRow}>
            <View style={[styles.jobBadge, { borderColor: jobStatusColor + '44', backgroundColor: jobStatusColor + '18' }]}>
              <View style={[styles.jobBadgeDot, { backgroundColor: jobStatusColor }]} />
              <Text style={[styles.jobBadgeText, { color: jobStatusColor }]}>{chat.jobService}</Text>
            </View>
            {chat.appointmentDate && (
              <View style={styles.appointmentBadge}>
                <Ionicons name="calendar-outline" size={10} color={COLORS.primary} />
                <Text style={styles.appointmentText}>{chat.appointmentDate}</Text>
              </View>
            )}
          </View>

          <View style={styles.lastMessageRow}>
            <Text style={[styles.lastMessage, chat.unreadCustomer > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {chat.lastMessage}
            </Text>
          </View>
        </View>

        {chat.unreadCustomer > 0 && (
          <Animated.View style={[styles.unreadBadge, { opacity: unreadAnim }]}>
            <Text style={styles.unreadCount}>{chat.unreadCustomer}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── BOŞ DURUM ─────────────────────────────────────────────
function EmptyChats() {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;

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
      <Animated.View style={[styles.emptyIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
        <LinearGradient colors={[COLORS.primary + '33', COLORS.primaryDark + '22']} style={styles.emptyIcon}>
          <Ionicons name="chatbubbles-outline" size={52} color={COLORS.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
      <Text style={styles.emptyDesc}>
        Kuaförlerden teklif alınca veya mesaj atınca sohbetler burada görünür
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace('/(customer)/explore')}>
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGradient}>
          <Ionicons name="search-outline" size={18} color={COLORS.white} />
          <Text style={styles.emptyBtnText}>Kuaför Bul</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animasyonlar
  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(30)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  // ─── FİREBASE SOHBET DİNLEYİCİSİ ───
  useEffect(() => {
    if (!user?.uid) return;

    // customerId'si mevcut kullanıcı olan sohbetleri son mesaja göre sırala
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('customerId', '==', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];

      setChats(fetchedChats);
      setIsLoading(false);
    }, (error) => {
      console.error("Sohbetler çekilirken hata:", error);
      setIsLoading(false);
    });

    return () => unsub(); // Component unmount olduğunda dinlemeyi bırak
  }, [user?.uid]);

  // Sayfa açılış animasyonları
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(listOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(listAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  const filteredChats = chats.filter(c =>
    (c.hairdresserName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.jobService || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCustomer || 0), 0);

  // Veriler yüklenirken gösterilecek ekran
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.orb1} />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Sohbetler</Text>
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
          placeholder="Kuaför veya mesaj ara..."
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

      {/* ── SOHBET LİSTESİ ── */}
      <Animated.View style={[styles.listContainer, { opacity: listOpacity, transform: [{ translateY: listAnim }] }]}>
        {filteredChats.length > 0 ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Animated.View style={{ opacity: listOpacity, transform: [{ translateY: listAnim }] }}>
                <ChatCard
                  chat={item}
                  onPress={() => {
                    router.push({
                      pathname: '/(customer)/chat/[chatId]',
                      params: { chatId: item.id },
                    } as any);
                  }}
                />
              </Animated.View>
            )}
          />
        ) : (
          search.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
              <Text style={styles.emptyDesc}>"{search}" için sohbet bulunamadı</Text>
            </View>
          ) : (
            <EmptyChats />
          )
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
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md, height: 46, marginBottom: SPACING.md },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.regular },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160 },
  separator: { height: SPACING.sm },
  chatCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.md },
  chatCardUnread: { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: COLORS.primary + '44' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 26 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  chatContent: { flex: 1, gap: 4 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hairdresserName: { fontSize: FONTS.medium, color: COLORS.textPrimary, fontWeight: '600' },
  hairdresserNameBold: { fontWeight: 'bold' },
  messageTime: { fontSize: 11, color: COLORS.textMuted },
  jobBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  jobBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  jobBadgeDot: { width: 5, height: 5, borderRadius: 3 },
  jobBadgeText: { fontSize: 10, fontWeight: '700' },
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
  emptyBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.sm },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
  emptyIconWrapper:{},
});