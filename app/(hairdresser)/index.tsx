// app/(hairdresser)/index.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

// FIREBASE IMPORTS
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/services/firebase';

const { width } = Dimensions.get('window');

// ─── BÖLÜM BAŞLIĞI ─────────────────────────────────────────
function SectionTitle({ title, icon, action, onAction }: {
  title: string; icon: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.left}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sectionStyles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  action: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
});

// ─── GERİ SAYIM BİLEŞENİ ───────────────────────────────────
function CountdownTimer({ minutes }: { minutes: number }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    setTimeLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <View style={countdownStyles.container}>
      {hrs > 0 && (
        <>
          <View style={countdownStyles.timeBox}>
            <Text style={countdownStyles.timeValue}>{String(hrs).padStart(2, '0')}</Text>
            <Text style={countdownStyles.timeLabel}>saat</Text>
          </View>
          <Text style={countdownStyles.timeSep}>:</Text>
        </>
      )}
      <View style={countdownStyles.timeBox}>
        <Text style={countdownStyles.timeValue}>{String(mins).padStart(2, '0')}</Text>
        <Text style={countdownStyles.timeLabel}>dk</Text>
      </View>
      <Text style={countdownStyles.timeSep}>:</Text>
      <View style={countdownStyles.timeBox}>
        <Text style={countdownStyles.timeValue}>{String(secs).padStart(2, '0')}</Text>
        <Text style={countdownStyles.timeLabel}>sn</Text>
      </View>
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, minWidth: 40 },
  timeValue: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  timeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  timeSep: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Canlı Veri State'leri
  const [isOnline, setIsOnline] = useState(true);
  const [salonName, setSalonName] = useState('Yükleniyor...');
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [cari, setCari] = useState({ totalEarning: 0, totalExpense: 0, netProfit: 0, totalJobs: 0, thisMonth: 0, lastMonth: 0 });
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(contentAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  // ── FIREBASE GERÇEK ZAMANLI BAĞLANTI ──
  useEffect(() => {
    if (!user?.uid) return;

    const unsubs: (() => void)[] = [];

    // 1. Profil ve Cari Durumu Dinle
    const profRef = doc(db, 'hairdresserProfiles', user.uid);
    unsubs.push(onSnapshot(profRef, (docSnap) => {
      if (docSnap.exists()) {
        const profData = docSnap.data();
        setSalonName(profData.salonName || 'Salon Adı Belirtilmemiş');
        setIsOnline(profData.isOnline ?? true);
        if (profData.cariSummary) {
          setCari(profData.cariSummary);
        }
      }
    }));

    // 2. Randevuları Dinle (Bugünkü Program & Sıradaki Randevu)
    const appQ = query(
      collection(db, 'appointments'),
      where('hairdresserId', '==', user.uid),
      orderBy('time', 'asc')
    );
    unsubs.push(onSnapshot(appQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedule(list);

      // Sıradaki ilk randevuyu ayarla (durumu 'upcoming' olan ilk randevu)
      const next = list.find((a: any) => a.status === 'upcoming');
      if (next) {
        setNextAppointment(next);
      } else {
        setNextAppointment(null);
      }
    }));

    // 3. Mesajları Dinle
    const msgQ = query(
      collection(db, 'chats'),
      where('hairdresserId', '==', user.uid),
      orderBy('lastMessageTime', 'desc'),
      limit(3)
    );
    unsubs.push(onSnapshot(msgQ, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    // 4. Aksiyon Sayaçlarını Dinle (Okunmamış Mesaj, Teklif, Onay Bekleyen)
    const actionQ = query(collection(db, 'hairdresserActions'), where('hairdresserId', '==', user.uid));
    unsubs.push(onSnapshot(actionQ, (snap) => {
      if (!snap.empty) {
        setActions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Altyapı dokümanı yoksa varsayılan şablonu koru
        setActions([
          { id: 'a1', type: 'message', text: 'Okunmamış mesajlar', icon: 'chatbubble-outline', color: '#A78BFA', count: 0 },
          { id: 'a2', type: 'bid', text: 'Bekleyen teklifler', icon: 'pricetag-outline', color: '#FFB844', count: 0 },
          { id: 'a3', type: 'appointment', text: 'Onay bekleyen randevular', icon: 'calendar-outline', color: '#F472B6', count: 0 },
        ]);
      }
      setLoading(false);
    }));

    return () => unsubs.forEach(u => u());
  }, [user?.uid]);

  // Çevrimiçi durumunu Firestore'da güncelleme fonksiyonu
  const handleOnlineToggle = async (value: boolean) => {
    if (!user?.uid) return;
    setIsOnline(value);
    try {
      await updateDoc(doc(db, 'hairdresserProfiles', user.uid), {
        isOnline: value
      });
    } catch (e) {
      console.error("Durum güncellenemedi:", e);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

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
      <View style={styles.orb2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── 1. HOŞGELDİN KARTI ── */}
        <Animated.View style={[styles.welcomeCard, { opacity: headerAnim }]}>
          <LinearGradient
            colors={[COLORS.primaryDark + '88', COLORS.primary + '44']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeTop}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeDate}>{dateStr}</Text>
                <Text style={styles.welcomeName}>
                  Merhaba, {user?.displayName?.split(' ')[0] || 'Kuaför'} 👋
                </Text>
                <Text style={styles.welcomeSub}>{salonName}</Text>
              </View>
              <View style={styles.onlineToggle}>
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
                <Text style={[styles.onlineText, { color: isOnline ? COLORS.success : COLORS.textMuted }]}>
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={handleOnlineToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.success + '88' }}
                  thumbColor={isOnline ? COLORS.success : COLORS.textMuted}
                />
              </View>
            </View>

            {/* Bugün özet */}
            <View style={styles.welcomeBadges}>
              <View style={styles.welcomeBadge}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                <Text style={styles.welcomeBadgeText}>{schedule.length} randevu</Text>
              </View>
              <View style={styles.welcomeBadgeDivider} />
              <View style={styles.welcomeBadge}>
                <Ionicons name="time-outline" size={14} color='#FFB844' />
                <Text style={styles.welcomeBadgeText}>
                  {(actions.find(a => a.type === 'bid')?.count || 0)} bekleyen
                </Text>
              </View>
              <View style={styles.welcomeBadgeDivider} />
              <View style={styles.welcomeBadge}>
                <Ionicons name="cash-outline" size={14} color='#34D399' />
                <Text style={styles.welcomeBadgeText}>₺{cari.thisMonth.toLocaleString()} bu ay</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentAnim }] }}>

          {/* ── 2. AKSİYONA İHTİYAÇ VAR ── */}
          <View style={styles.section}>
            <SectionTitle title="Aksiyona İhtiyaç Var" icon="alert-circle-outline" />
            <View style={styles.actionsNeededGrid}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionNeededCard}
                  onPress={() => {
                    if (action.type === 'message') router.push('/(hairdresser)/chats' as any);
                    else if (action.type === 'bid') router.push('/(hairdresser)/jobs' as any);
                    else router.push('/(hairdresser)/appointments' as any);
                  }}
                >
                  <LinearGradient
                    colors={[action.color + '22', action.color + '11']}
                    style={styles.actionNeededGradient}
                  >
                    <View style={styles.actionNeededTop}>
                      <View style={[styles.actionNeededIcon, { backgroundColor: action.color + '22' }]}>
                        <Ionicons name={action.icon as any} size={20} color={action.color} />
                      </View>
                      <View style={[styles.actionNeededBadge, { backgroundColor: action.color }]}>
                        <Text style={styles.actionNeededBadgeText}>{action.count}</Text>
                      </View>
                    </View>
                    <Text style={styles.actionNeededText}>{action.count} {action.text}</Text>
                    <View style={styles.actionNeededArrow}>
                      <Text style={[styles.actionNeededGo, { color: action.color }]}>Git →</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── 3. SIRADAKI RANDEVU — GERİ SAYIM ── */}
          {nextAppointment ? (
            <View style={styles.section}>
              <SectionTitle title="Sıradaki Randevu" icon="time-outline" />
              <LinearGradient
                colors={[(nextAppointment.color || '#A78BFA') + '44', (nextAppointment.color || '#A78BFA') + '22']}
                style={styles.nextAppCard}
              >
                <View style={styles.nextAppTop}>
                  <View style={styles.nextAppLeft}>
                    <View style={[styles.nextAppAvatar, { backgroundColor: (nextAppointment.color || '#A78BFA') + '33' }]}>
                      <Text style={styles.nextAppEmoji}>{nextAppointment.customerEmoji || '👩'}</Text>
                    </View>
                    <View>
                      <Text style={styles.nextAppName}>{nextAppointment.customerName}</Text>
                      <Text style={styles.nextAppService}>{nextAppointment.service}</Text>
                      <View style={styles.nextAppMeta}>
                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.nextAppTime}>{nextAppointment.time} · {nextAppointment.duration || '60 dk'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.countdownSection}>
                  <Text style={styles.countdownLabel}>Kalan Süre</Text>
                  <CountdownTimer minutes={nextAppointment.minutesLeft || 45} />
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.section}>
              <SectionTitle title="Sıradaki Randevu" icon="time-outline" />
              <View style={[styles.nextAppCard, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small }}>Yaklaşan randevunuz bulunmuyor.</Text>
              </View>
            </View>
          )}

          {/* ── 4. BUGÜNKÜ PROGRAM ── */}
          <View style={styles.section}>
            <SectionTitle
              title="Bugünkü Program"
              icon="list-outline"
              action="Takvim"
              onAction={() => router.push('/(hairdresser)/appointments' as any)}
            />
            <View style={styles.scheduleCard}>
              {schedule.length === 0 ? (
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center', padding: SPACING.md }}>Bugün için randevu planlanmadı.</Text>
              ) : (
                schedule.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.scheduleRow}>
                      {/* Sol zaman sütunu */}
                      <View style={styles.scheduleTimeCol}>
                        <Text style={[styles.scheduleTime, { color: item.color || '#A78BFA' }]}>{item.time}</Text>
                        <Text style={styles.scheduleDuration}>{item.duration || 60} dk</Text>
                      </View>

                      {/* Dikey çizgi */}
                      <View style={styles.scheduleLineCol}>
                        <View style={[styles.scheduleDot, { backgroundColor: item.color || '#A78BFA' }]} />
                        {index < schedule.length - 1 && (
                          <View style={[styles.scheduleLine, { backgroundColor: (item.color || '#A78BFA') + '44' }]} />
                        )}
                      </View>

                      {/* Sağ içerik */}
                      <View style={[styles.scheduleContent, { borderLeftColor: (item.color || '#A78BFA') + '44' }]}>
                        <View style={styles.scheduleContentInner}>
                          <Text style={styles.scheduleEmoji}>{item.customerEmoji || '👩'}</Text>
                          <View style={styles.scheduleInfo}>
                            <Text style={styles.scheduleName}>{item.customerName}</Text>
                            <Text style={styles.scheduleService}>{item.service}</Text>
                          </View>
                          <View style={[styles.scheduleStatusDot, { backgroundColor: item.color || '#A78BFA' }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── 5. HIZLI MESAJLAR ── */}
          <View style={styles.section}>
            <SectionTitle
              title="Hızlı Mesajlar"
              icon="chatbubbles-outline"
              action="Tümü"
              onAction={() => router.push('/(hairdresser)/chats' as any)}
            />
            <View style={styles.messagesCard}>
              {messages.length === 0 ? (
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center', padding: SPACING.md }}>Mesaj bulunmuyor.</Text>
              ) : (
                messages.map((msg, index) => (
                  <View key={msg.id}>
                    <TouchableOpacity
                      style={styles.messageRow}
                      onPress={() => router.push(`/(hairdresser)/chats` as any)}
                    >
                      <View style={styles.messageAvatarWrapper}>
                        <LinearGradient
                          colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
                          style={styles.messageAvatar}
                        >
                          <Text style={styles.messageEmoji}>{msg.customerEmoji || '👱‍♀️'}</Text>
                        </LinearGradient>
                        {msg.unread && <View style={styles.messageUnreadDot} />}
                      </View>
                      <View style={styles.messageContent}>
                        <View style={styles.messageTopRow}>
                          <Text style={[styles.messageName, msg.unread && styles.messageNameBold]}>
                            {msg.customerName}
                          </Text>
                          <Text style={styles.messageTime}>{msg.time || 'Şimdi'}</Text>
                        </View>
                        <Text style={[styles.messageText, msg.unread && styles.messageTextBold]} numberOfLines={1}>
                          {msg.message || msg.lastMessage}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => router.push(`/(hairdresser)/chats` as any)}
                      >
                        <Ionicons name="arrow-redo-outline" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {index < messages.length - 1 && <View style={styles.messageDivider} />}
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── 6. KAMPANYA YARAT ── */}
          <View style={styles.section}>
            <SectionTitle title="Kampanya" icon="megaphone-outline" />
            <TouchableOpacity style={styles.campaignCard} activeOpacity={0.85}
              onPress={() => router.push('/(hairdresser)/campaign' as any)}>
              <LinearGradient
                colors={['#7C3AED', '#A78BFA', '#C4B5FD']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.campaignGradient}
              >
                <View style={styles.campaignLeft}>
                  <Text style={styles.campaignTitle}>Kampanya Yarat 🎯</Text>
                  <Text style={styles.campaignDesc}>
                    Özel fiyat, indirim veya paket kampanyası oluşturarak daha fazla müşteri çek
                  </Text>
                  <View style={styles.campaignBtn}>
                    <Text style={styles.campaignBtnText}>Kampanya Oluştur</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                  </View>
                </View>
                <View style={styles.campaignRight}>
                  <Text style={styles.campaignEmoji}>📢</Text>
                  <Text style={styles.campaignStat}>+%40</Text>
                  <Text style={styles.campaignStatLabel}>müşteri artışı</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {/* ── 7. CARİ ÖZET ── */}
          <View style={[styles.section, { marginBottom: 140 }]}>
            <SectionTitle
              title="Cari Özet"
              icon="bar-chart-outline"
              action="Detay"
              onAction={() => router.push('/(hairdresser)/cari' as any)}
            />
            <View style={styles.cariCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={styles.cariGradient}
              >
                {/* Ana cari sayılar */}
                <View style={styles.cariTopRow}>
                  <View style={styles.cariMainItem}>
                    <Text style={styles.cariMainLabel}>Net Kazanç</Text>
                    <Text style={[styles.cariMainValue, { color: '#34D399' }]}>
                      ₺{cari.netProfit.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.cariDivider} />
                  <View style={styles.cariMainItem}>
                    <Text style={styles.cariMainLabel}>Bu Ay</Text>
                    <Text style={[styles.cariMainValue, { color: COLORS.primary }]}>
                      ₺{cari.thisMonth.toLocaleString()}
                    </Text>
                    <View style={styles.cariGrowth}>
                      <Ionicons name="trending-up" size={12} color="#34D399" />
                      <Text style={styles.cariGrowthText}>+%14</Text>
                    </View>
                  </View>
                  <View style={styles.cariDivider} />
                  <View style={styles.cariMainItem}>
                    <Text style={styles.cariMainLabel}>Toplam İş</Text>
                    <Text style={[styles.cariMainValue, { color: '#FFB844' }]}>
                      {cari.totalJobs}
                    </Text>
                  </View>
                </View>

                {/* Alt detay */}
                <View style={styles.cariBottomRow}>
                  <View style={styles.cariBottomItem}>
                    <View style={styles.cariBottomLeft}>
                      <View style={[styles.cariDot, { backgroundColor: '#34D399' }]} />
                      <Text style={styles.cariBottomLabel}>Toplam Gelir</Text>
                    </View>
                    <Text style={styles.cariBottomValue}>₺{cari.totalEarning.toLocaleString()}</Text>
                  </View>
                  <View style={styles.cariBottomItem}>
                    <View style={styles.cariBottomLeft}>
                      <View style={[styles.cariDot, { backgroundColor: '#F87171' }]} />
                      <Text style={styles.cariBottomLabel}>Toplam Gider</Text>
                    </View>
                    <Text style={[styles.cariBottomValue, { color: '#F87171' }]}>
                      ₺{cari.totalExpense.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.cariBottomItem}>
                    <View style={styles.cariBottomLeft}>
                      <View style={[styles.cariDot, { backgroundColor: '#A78BFA' }]} />
                      <Text style={styles.cariBottomLabel}>Geçen Ay</Text>
                    </View>
                    <Text style={styles.cariBottomValue}>₺{cari.lastMonth.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Detay butonu */}
                <TouchableOpacity
                  style={styles.cariDetailBtn}
                  onPress={() => router.push('/(hairdresser)/cari' as any)}
                >
                  <Text style={styles.cariDetailBtnText}>Tüm Cari Dökümü Gör</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>


        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.15, top: -100, right: -80 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#A78BFA', opacity: 0.08, bottom: 300, left: -60 },
  scrollContent: { paddingTop: 56 },

  // Hoşgeldin kartı
  welcomeCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  welcomeGradient: { padding: SPACING.lg },
  welcomeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  welcomeLeft: { flex: 1 },
  welcomeDate: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  welcomeName: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white, marginBottom: 2 },
  welcomeSub: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)' },
  onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: FONTS.small, fontWeight: '600' },
  welcomeBadges: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.lg, padding: SPACING.sm },
  welcomeBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  welcomeBadgeDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  welcomeBadgeText: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Bölümler
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },

  // Aksiyon kartları
  actionsNeededGrid: { flexDirection: 'row', gap: SPACING.sm },
  actionNeededCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  actionNeededGradient: { padding: SPACING.md, gap: SPACING.sm },
  actionNeededTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionNeededIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionNeededBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionNeededBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: 'bold' },
  actionNeededText: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600', lineHeight: 16 },
  actionNeededArrow: { alignItems: 'flex-end' },
  actionNeededGo: { fontSize: FONTS.small, fontWeight: '700' },

  // Sıradaki randevu
  nextAppCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, gap: SPACING.lg },
  nextAppTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextAppLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  nextAppAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  nextAppEmoji: { fontSize: 28 },
  nextAppName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  nextAppService: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  nextAppMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  nextAppTime: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)' },
  countdownSection: { alignItems: 'center', gap: SPACING.sm },
  countdownLabel: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  // Bugünkü program
  scheduleCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md },
  scheduleRow: { flexDirection: 'row', gap: SPACING.sm, minHeight: 60 },
  scheduleTimeCol: { width: 52, alignItems: 'flex-end', paddingTop: 2 },
  scheduleTime: { fontSize: FONTS.small, fontWeight: 'bold' },
  scheduleDuration: { fontSize: 10, color: COLORS.textMuted },
  scheduleLineCol: { alignItems: 'center', width: 20 },
  scheduleDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  scheduleLine: { flex: 1, width: 2, marginTop: 2 },
  scheduleContent: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderLeftWidth: 3 },
  scheduleContentInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm },
  scheduleEmoji: { fontSize: 22 },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.textPrimary },
  scheduleService: { fontSize: 11, color: COLORS.textMuted },
  scheduleStatusDot: { width: 8, height: 8, borderRadius: 4 },

  // Hızlı mesajlar
  messagesCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  messageRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  messageAvatarWrapper: { position: 'relative' },
  messageAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  messageEmoji: { fontSize: 22 },
  messageUnreadDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.background },
  messageContent: { flex: 1 },
  messageTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  messageName: { fontSize: FONTS.medium, color: COLORS.textPrimary, fontWeight: '500' },
  messageNameBold: { fontWeight: 'bold' },
  messageTime: { fontSize: 11, color: COLORS.textMuted },
  messageText: { fontSize: FONTS.small, color: COLORS.textMuted },
  messageTextBold: { color: COLORS.textSecondary, fontWeight: '600' },
  replyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  messageDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  // Kampanya
  campaignCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primary + '44' },
  campaignGradient: { padding: SPACING.lg, flexDirection: 'row', alignItems: 'center' },
  campaignLeft: { flex: 1, gap: SPACING.sm },
  campaignTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  campaignDesc: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  campaignBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  campaignBtnText: { fontSize: FONTS.small, color: COLORS.white, fontWeight: '700' },
  campaignRight: { alignItems: 'center', gap: 4, paddingLeft: SPACING.md },
  campaignEmoji: { fontSize: 40 },
  campaignStat: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.white },
  campaignStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  // Cari
  cariCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cariGradient: { padding: SPACING.lg, gap: SPACING.md },
  cariTopRow: { flexDirection: 'row', alignItems: 'center' },
  cariMainItem: { flex: 1, alignItems: 'center', gap: 4 },
  cariMainLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  cariMainValue: { fontSize: FONTS.xlarge, fontWeight: 'bold' },
  cariGrowth: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cariGrowthText: { fontSize: 11, color: '#34D399', fontWeight: '600' },
  cariDivider: { width: 1, height: 50, backgroundColor: COLORS.border },
  cariBottomRow: { gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.md },
  cariBottomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cariBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cariDot: { width: 8, height: 8, borderRadius: 4 },
  cariBottomLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  cariBottomValue: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.textPrimary },
  cariDetailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.primary + '44' },
  cariDetailBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
});