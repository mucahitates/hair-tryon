// app/(hairdresser)/jobs.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, Dimensions, Modal, TextInput, Image, Alert,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, doc, getDocs, setDoc, runTransaction
} from 'firebase/firestore';
import { db } from '../../src/services/firebase';


const { width } = Dimensions.get('window');

const formatTime = (timestamp: any) => {
  if (!timestamp) return 'Şimdi';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHrs < 24) return `${diffHrs} saat önce`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

// ─── TEKLİF VER MODALI ─────────────────────────────────────
function BidModal({ visible, onClose, job, hairdresserId }: {
  visible: boolean;
  onClose: () => void;
  job: any | null;
  hairdresserId: string;
}) {
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    } else {
      slideAnim.setValue(500);
      setPrice('');
      setNote('');
    }
  }, [visible]);

  if (!job) return null;
  const handleSend = async () => {
    if (!price) {
      Alert.alert('Hata', 'Fiyat giriniz');
      return;
    }
    try {
      // AuthStore'dan kuaförün aktif bilgilerini çekiyoruz
      const { useAuthStore } = await import('../../src/stores/authStore');
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.uid) return;

      // ─── 1) COIN KONTROLÜ VE DÜŞÜMÜ (YENİ EKLENEN KISIM) ───
      const { processCoinTransaction } = await import('../../src/services/shared/coinService');
      const coinResult = await processCoinTransaction(
        currentUser.uid,
        'hairdresser',
        -10, // Teklif vermek 10 coin düşürür
        `${job.customerName || 'Müşteri'} ilanına teklif verildi`
      );

      if (!coinResult.success) {
        Alert.alert(
          'Yetersiz Bakiye 🪙',
          'Teklif vermek için 10 Coin gereklidir. Lütfen Coin satın alın.',
          [{ text: 'Tamam' }]
        );
        return; // Bakiye yetersizse teklif kodunu hiç çalıştırmadan durdur!
      }
      // ────────────────────────────────────────────────────────

      const chatId = `chat_${job.id}_${hairdresserId}`;
      const autoMessage = `Merhaba, iş ilanınızı inceledim ve ₺${price} teklif ediyorum. ${note ? note : ''}`.trim();

      // 2) Teklif kaydı
      await addDoc(collection(db, 'bids'), {
        jobId: job.id,
        hairdresserId,
        hairdresserName: currentUser?.displayName || 'Kuaför',
        hairdresserPhotoUrl: currentUser?.photoURL || null,
        customerId: job.customerId || '',
        customerName: job.customerName || 'Kullanıcı',
        customerEmoji: job.customerEmoji || '👩',
        service: job.service || '',
        myPrice: parseInt(price),
        customerBudget: job.budget || 0,
        status: 'pending',
        note: note || '',
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        chatId,
      });

      // 3) Otomatik mesaj
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: autoMessage,
        senderId: hairdresserId,
        senderRole: 'hairdresser',
        messageType: 'text',
        isRead: false,
        createdAt: serverTimestamp(),
      });

      // 4) Chat dokümanı
      await setDoc(doc(db, 'chats', chatId), {
        jobId: job.id || '',
        hairdresserId,
        hairdresserName: currentUser?.displayName || 'Kuaför',
        hairdresserPhotoUrl: currentUser?.photoURL || null,
        customerId: job.customerId || '',
        customerName: job.customerName || 'Müşteri',
        customerEmoji: job.customerEmoji || '👩',
        jobService: job.service || '',
        bidPrice: parseInt(price) || 0,
        customerBudget: job.budget || 0,
        jobStatus: 'bidding',
        lastMessage: autoMessage,
        lastMessageTime: serverTimestamp(),
        unreadByCustomer: true,
        unreadByHairdresser: false,
      }, { merge: true });

      // Coin bakiyesini AuthStore'da da anında güncelle (Ekranda anında düşmesi için)
      useAuthStore.getState().updateCoinBalance(coinResult.newBalance || 0);

      Alert.alert('Teklif Gönderildi ✅', `₺${price} teklifiniz başarıyla gönderildi!\nKalan Bakiyeniz: ${coinResult.newBalance} 🪙`);
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Teklif iletilemedi, lütfen tekrar deneyin.');
    }
  };



  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={bidModalStyles.overlay}>
        <KeyboardAvoidingView
          style={bidModalStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={bidModalStyles.header}>
            <Text style={bidModalStyles.title}>Teklif Ver</Text>
            <TouchableOpacity onPress={onClose} style={bidModalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={bidModalStyles.jobSummary}>
              <LinearGradient
                colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
                style={bidModalStyles.jobSummaryGradient}
              >
                <Text style={bidModalStyles.jobSummaryEmoji}>{job.customerEmoji || '👩'}</Text>
                <View style={bidModalStyles.jobSummaryInfo}>
                  <Text style={bidModalStyles.jobSummaryName}>{job.customerName}</Text>
                  <Text style={bidModalStyles.jobSummaryService}>{job.service}</Text>
                  <View style={bidModalStyles.jobSummaryBudget}>
                    <Ionicons name="wallet-outline" size={13} color={COLORS.success} />
                    <Text style={bidModalStyles.jobSummaryBudgetText}>Bütçe: ₺{job.budget}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={bidModalStyles.section}>
              <Text style={bidModalStyles.label}>Teklif Fiyatınız (₺) *</Text>
              <View style={bidModalStyles.priceInputWrapper}>
                <Text style={bidModalStyles.priceSymbol}>₺</Text>
                <TextInput
                  style={bidModalStyles.priceInput}
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              {!!price && parseInt(price) > job.budget && (
                <View style={bidModalStyles.warningRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
                  <Text style={bidModalStyles.warningText}>Müşteri bütçesini aşıyor</Text>
                </View>
              )}
              {!!price && parseInt(price) <= job.budget && (
                <View style={bidModalStyles.successRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
                  <Text style={bidModalStyles.successText}>Bütçeye uygun</Text>
                </View>
              )}
            </View>

            <View style={bidModalStyles.section}>
              <Text style={bidModalStyles.label}>Ek not (opsiyonel)</Text>
              <View style={bidModalStyles.noteWrapper}>
                <TextInput
                  style={bidModalStyles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Kendinizi tanıtın, deneyiminizden bahsedin..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={200}
                />
              </View>
              <Text style={bidModalStyles.charCount}>{note.length}/200</Text>
            </View>

            {/* Mesaj önizleme */}
            {!!price && (
              <View style={bidModalStyles.previewCard}>
                <Text style={bidModalStyles.previewLabel}>Gönderilecek mesaj:</Text>
                <Text style={bidModalStyles.previewText}>
                  {`Merhaba, iş ilanınızı inceledim ve ₺${price} teklif ediyorum.${note ? ' ' + note : ''}`}
                </Text>
              </View>
            )}

            <View style={{ height: SPACING.xl }} />
          </ScrollView>

          <View style={bidModalStyles.footer}>
            <TouchableOpacity style={bidModalStyles.sendBtn} onPress={handleSend}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={bidModalStyles.sendBtnGradient}
              >
                <Ionicons name="send-outline" size={18} color={COLORS.white} />
                <Text style={bidModalStyles.sendBtnText}>Teklifi Gönder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── İŞ KARTI ──────────────────────────────────────────────
function JobCard({ job, allBids, onBid, onOpenPhoto }: {
  job: any;
  allBids: any[];
  onBid: () => void;
  onOpenPhoto: (uri: string | null, emoji: string, label: string) => void;
}) {
  const { user } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const jobBids = allBids.filter(b => b.jobId === job.id);
  const myBid = jobBids.find(b => b.hairdresserId === user?.uid);
  const hasBid = !!myBid;

  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: false }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[styles.jobCard, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={styles.jobCardGradient}
        >
          {/* Müşteri bilgisi */}
          <View style={styles.jobCardHeader}>
            <View style={styles.customerInfo}>
              <LinearGradient
                colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
                style={styles.customerAvatar}
              >
                {job.currentPhotoUrl ? (
                  <Image source={{ uri: job.currentPhotoUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.customerEmoji}>{job.customerEmoji || '👩'}</Text>
                )}
              </LinearGradient>
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{job.customerName || 'Müşteri'}</Text>
                <View style={styles.customerMeta}>
                  <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.customerMetaText}>{job.customerCity || 'Belirtilmemiş'}</Text>
                </View>
                <View style={styles.customerStats}>
                  <Ionicons name="star" size={11} color="#FFB844" />
                  <Text style={styles.customerRating}>{(job.customerRating ?? 5.0).toFixed(1)}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.customerJobCount}>{job.customerJobCount ?? 1} iş</Text>
                </View>
              </View>
            </View>
            <View style={styles.jobBadges}>
              {jobBids.length > 0 && (
                <View style={[styles.badge, { backgroundColor: '#FFB844', marginBottom: 4 }]}>
                  <Text style={styles.badgeText}>{jobBids.length} TEKLİF</Text>
                </View>
              )}
              {hasBid && (
                <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.badgeText}>TEKLİF VERİLDİ</Text>
                </View>
              )}
            </View>
          </View>

          {/* Hizmet */}
          <View style={styles.serviceRow}>
            <View style={styles.serviceBadge}>
              <Ionicons name="cut-outline" size={13} color={COLORS.primary} />
              <Text style={styles.serviceText}>{job.service}</Text>
            </View>
            {job.colorPreference && (
              <View style={styles.colorBadge}>
                <View style={styles.colorDot} />
                <Text style={styles.colorText}>{job.colorPreference}</Text>
              </View>
            )}
          </View>

          {/* Fotoğraflar */}
          {(job.currentPhotoUrl || job.beforePhotoUrl || job.aiResultUrl || job.afterPhotoUrl) && (
            <View style={styles.photosRow}>
              <TouchableOpacity
                style={styles.photoCard}
                onPress={() => onOpenPhoto(job.currentPhotoUrl || job.beforePhotoUrl, job.customerEmoji || '👩', 'Mevcut Saç')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.photoGradient}>
                  {(job.currentPhotoUrl || job.beforePhotoUrl)
                    ? <Image source={{ uri: job.currentPhotoUrl || job.beforePhotoUrl }} style={styles.photoImage} />
                    : <Text style={styles.photoEmoji}>{job.customerEmoji || '👩'}</Text>
                  }
                  <View style={styles.photoLabel}><Text style={styles.photoLabelText}>Şu An</Text></View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.photoArrow}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.arrowBg}>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.aiLabel}>AI</Text>
              </View>

              <TouchableOpacity
                style={styles.photoCard}
                onPress={() => onOpenPhoto(job.aiResultUrl || job.afterPhotoUrl, '✨', 'İstenen Görünüm')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[COLORS.primary + '33', COLORS.primaryDark + '22']} style={styles.photoGradient}>
                  {(job.aiResultUrl || job.afterPhotoUrl)
                    ? <Image source={{ uri: job.aiResultUrl || job.afterPhotoUrl }} style={styles.photoImage} />
                    : <Text style={styles.photoEmoji}>✨</Text>
                  }
                  <View style={[styles.photoLabel, { backgroundColor: COLORS.primary + 'CC' }]}>
                    <Text style={styles.photoLabelText}>İstenen</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Not */}
          {job.note && (
            <View style={styles.noteCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.noteText} numberOfLines={2}>{job.note}</Text>
            </View>
          )}

          {/* Alt: Bütçe + Teklif */}
          <View style={styles.cardFooter}>
            <View style={styles.budgetBadge}>
              <Ionicons name="wallet-outline" size={14} color={COLORS.success} />
              <Text style={styles.budgetText}>₺{job.budget}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.timeText}>{formatTime(job.createdAt)}</Text>
            </View>
            <TouchableOpacity style={styles.bidBtn} onPress={onBid}>
              <LinearGradient
                colors={hasBid ? ['#FFB844', '#F59E0B'] : [COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.bidBtnGradient}
              >
                <Ionicons name={hasBid ? 'refresh-outline' : 'send-outline'} size={14} color={COLORS.white} />
                <Text style={styles.bidBtnText}>{hasBid ? 'Güncelle' : 'Teklif Ver'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── ANA EKRAN ──────────────────────────────────────────────
export default function HairdresserJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'jobs' | 'mybids'>('jobs');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'nearby' | 'matched'>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{ uri: string | null; emoji: string; label: string } | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(
      query(collection(db, 'jobs'), orderBy('createdAt', 'desc')),
      (snap) => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    ));

    unsubs.push(onSnapshot(
      query(collection(db, 'bids'), where('hairdresserId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snap) => {
        setMyBids(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    ));

    return () => unsubs.forEach(u => u());
  }, [user?.uid]);

  const handleGoToChat = async (bid: any) => {
    try {
      if (bid.chatId) {
        router.push(`/(hairdresser)/chat/${bid.chatId}` as any);
        return;
      }
      const snap = await getDocs(query(
        collection(db, 'chats'),
        where('jobId', '==', bid.jobId || ''),
        where('hairdresserId', '==', user?.uid)
      ));
      if (!snap.empty) {
        router.push(`/(hairdresser)/chat/${snap.docs[0].id}` as any);
        return;
      }
      Alert.alert('Sohbet bulunamadı', 'Henüz sohbet oluşturulmamış.');
    } catch (e) {
      Alert.alert('Hata', 'Sohbet açılamadı.');
    }
  };

  const filteredJobs = jobs.filter(j => {
    // Sadece durumu "open" (açık) olan ilanları göster
    if (j.status !== 'open') return false;

    if (activeFilter === 'new') {
      if (!j.createdAt) return true;
      const jobDate = j.createdAt.toDate ? j.createdAt.toDate() : new Date(j.createdAt);
      const isRecent = (new Date().getTime() - jobDate.getTime()) < 24 * 60 * 60 * 1000;
      return isRecent;
    }

    if (activeFilter === 'nearby') {
      // Kuaförün kendi şehri ile müşterinin şehrini eşleştir
      if (!user?.city) return true;
      return j.customerCity === user.city;
    }

    if (activeFilter === 'matched') {
      const myServices = (user as any)?.services || [];
      if (myServices.length > 0) {
        return myServices.includes(j.serviceCategory) || myServices.includes(j.service);
      }
      return true;
    }

    return true;
  });

  const bidStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: '#FFB844', icon: 'time-outline' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', icon: 'checkmark-circle-outline' },
    rejected: { label: 'Reddedildi', color: '#F87171', icon: 'close-circle-outline' },
    withdrawn: { label: 'Geri Çekildi', color: '#F87171', icon: 'close-circle-outline' },
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
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.orb} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>İş Havuzu</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'jobs' ? `${filteredJobs.length} ilan` : `${myBids.length} teklif`}
          </Text>
        </View>
      </Animated.View>

      {/* Sekmeler */}
      <View style={styles.tabRow}>
        {[
          { key: 'jobs', label: 'İş İlanları', count: jobs.filter(j => j.status === 'open').length },
          { key: 'mybids', label: 'Tekliflerim', count: myBids.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            <View style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
              <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'jobs' ? (
        <>
          {/* Filtreler */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {[
              { key: 'all', label: 'Tümü', icon: 'grid-outline' },
              { key: 'new', label: 'Yeni', icon: 'sparkles-outline' },
              { key: 'nearby', label: 'Yakınımda', icon: 'location-outline' },
              { key: 'matched', label: 'Uygun', icon: 'checkmark-circle-outline' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key as any)}
              >
                <Ionicons name={f.icon as any} size={13} color={activeFilter === f.key ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            renderItem={({ item }) => (
              <JobCard
                job={item}
                allBids={myBids}
                onBid={() => { setSelectedJob(item); setShowBidModal(true); }}
                onOpenPhoto={(uri, emoji, label) => setFullscreenPhoto({ uri, emoji, label })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="briefcase-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>İlan bulunamadı</Text>
                <Text style={styles.emptyDesc}>Filtre değiştirmeyi deneyin</Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={myBids}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          renderItem={({ item }) => {
            const conf = bidStatusConfig[item.status] || bidStatusConfig.pending;
            return (
              <TouchableOpacity style={styles.bidCard} onPress={() => handleGoToChat(item)}>
                <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={styles.bidCardGradient}>
                  <View style={styles.bidCardHeader}>
                    <View style={styles.bidCustomerInfo}>
                      <Text style={styles.bidEmoji}>{item.customerEmoji || '👩'}</Text>
                      <View>
                        <Text style={styles.bidCustomerName}>{item.customerName}</Text>
                        <Text style={styles.bidService}>{item.service}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: conf.color + '22', borderColor: conf.color + '44' }]}>
                      <Ionicons name={conf.icon as any} size={12} color={conf.color} />
                      <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
                    </View>
                  </View>

                  <View style={styles.bidPriceRow}>
                    <Text style={styles.bidPriceLabel}>Teklifim</Text>
                    <Text style={styles.bidPrice}>₺{item.myPrice}</Text>
                    <Text style={styles.dot}>/</Text>
                    <Text style={styles.bidBudget}>Bütçe ₺{item.customerBudget}</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                    <Text style={styles.bidTime}>{formatTime(item.sentAt)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <TouchableOpacity
                      style={[styles.goToChatBtn, { flex: 1 }]}
                      onPress={() => handleGoToChat(item)}
                    >
                      <Text style={styles.goToChatText}>Sohbete Git</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>

                    {item.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.withdrawBtn}
                        onPress={() => Alert.alert(
                          'Teklifi Geri Çek',
                          'Teklifinizi geri çekmek istediğinize emin misiniz?',
                          [
                            { text: 'Vazgeç', style: 'cancel' },
                            {
                              text: 'Geri Çek', style: 'destructive',
                              onPress: async () => {
                                try {
                                  const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
                                  await updateDoc(firestoreDoc(db, 'bids', item.id), { status: 'withdrawn' });
                                  const cancelMsg = `${item.service} işiniz için ₺${item.myPrice}'lik teklifimi iptal ediyorum.`;
                                  await addDoc(collection(db, 'chats', item.chatId, 'messages'), {
                                    text: cancelMsg,
                                    senderId: user?.uid,
                                    senderRole: 'hairdresser',
                                    messageType: 'text',
                                    isRead: false,
                                    createdAt: serverTimestamp(),
                                  });
                                } catch (e) {
                                  Alert.alert('Hata', 'İptal işlemi gerçekleştirilemedi.');
                                }
                              }
                            },
                          ]
                        )}
                      >
                        <Ionicons name="close-circle-outline" size={14} color="#F87171" />
                        <Text style={styles.withdrawBtnText}>Geri Çek</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="send-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Henüz teklif vermediniz</Text>
              <Text style={styles.emptyDesc}>İş ilanları sekmesinden teklif verin</Text>
            </View>
          }
        />
      )}

      {/* Teklif Ver Modali */}
      <BidModal
        visible={showBidModal}
        onClose={() => { setShowBidModal(false); setSelectedJob(null); }}
        job={selectedJob}
        hairdresserId={user?.uid || ''}
      />

      {/* Fotoğraf Büyütme */}
      <Modal visible={!!fullscreenPhoto} animationType="fade" transparent onRequestClose={() => setFullscreenPhoto(null)}>
        <TouchableOpacity style={styles.photoModalOverlay} onPress={() => setFullscreenPhoto(null)} activeOpacity={1}>
          <Text style={styles.photoModalLabel}>{fullscreenPhoto?.label}</Text>
          <View style={styles.photoModalBox}>
            {fullscreenPhoto?.uri
              ? <Image source={{ uri: fullscreenPhoto.uri }} style={{ width: '100%', height: '100%', borderRadius: RADIUS.xl }} resizeMode="contain" />
              : <Text style={{ fontSize: 100 }}>{fullscreenPhoto?.emoji}</Text>
            }
          </View>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setFullscreenPhoto(null)}>
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const bidModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  jobSummary: { margin: SPACING.lg, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  jobSummaryGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  jobSummaryEmoji: { fontSize: 36 },
  jobSummaryInfo: { flex: 1 },
  jobSummaryName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  jobSummaryService: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  jobSummaryBudget: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  jobSummaryBudgetText: { fontSize: FONTS.small, color: COLORS.success, fontWeight: '600' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.sm },
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  priceSymbol: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.primary, marginRight: SPACING.sm },
  priceInput: { flex: 1, fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary, paddingVertical: SPACING.md },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.sm },
  warningText: { fontSize: FONTS.small, color: COLORS.warning },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: SPACING.sm },
  successText: { fontSize: FONTS.small, color: COLORS.success },
  noteWrapper: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md },
  noteInput: { color: COLORS.textPrimary, fontSize: FONTS.regular, minHeight: 60, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  previewCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.primary + '11', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '33' },
  previewLabel: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
  previewText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  sendBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  sendBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14 },
  sendBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.background },
  tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 10, borderRadius: RADIUS.lg },
  tabActive: { backgroundColor: COLORS.primary + '33', borderWidth: 1, borderColor: COLORS.primary + '66' },
  tabText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabCount: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabCountActive: { backgroundColor: COLORS.primary + '44' },
  tabCountText: { fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold' },
  tabCountTextActive: { color: COLORS.primary },
  filterScroll: { marginBottom: 10, flexGrow: 0, height: 44 },
  filterContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, flexDirection: 'row', alignItems: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: COLORS.primary, fontWeight: '700' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 160, paddingTop: SPACING.sm },
  jobCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  jobCardGradient: { padding: SPACING.md, gap: SPACING.md },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, flex: 1 },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  customerEmoji: { fontSize: 24 },
  customerDetails: { flex: 1, gap: 2 },
  customerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  customerMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  customerMetaText: { fontSize: 11, color: COLORS.textMuted },
  customerStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerRating: { fontSize: 11, color: '#FFB844', fontWeight: '600' },
  dot: { fontSize: 11, color: COLORS.textMuted },
  customerJobCount: { fontSize: 11, color: COLORS.textMuted },
  jobBadges: { gap: 4, alignItems: 'flex-end' },
  badge: { borderRadius: RADIUS.full, paddingVertical: 2, paddingHorizontal: 8 },
  badgeText: { fontSize: 9, color: COLORS.white, fontWeight: 'bold' },
  serviceRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  serviceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.primary + '18', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  serviceText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  colorBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  colorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c68642' },
  colorText: { fontSize: FONTS.small, color: COLORS.textSecondary },
  photosRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  photoCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  photoGradient: { aspectRatio: 3 / 4, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoEmoji: { fontSize: 40 },
  photoLabel: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.sm, paddingVertical: 3, alignItems: 'center' },
  photoLabelText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  photoArrow: { alignItems: 'center', gap: 4 },
  arrowBg: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aiLabel: { fontSize: 9, color: COLORS.primary, fontWeight: 'bold' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACING.sm },
  noteText: { flex: 1, fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  budgetBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '18', paddingVertical: 5, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.success + '44' },
  budgetText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.success },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  bidBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  bidBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 14 },
  bidBtnText: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.white },
  bidCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  bidCardGradient: { padding: SPACING.md, gap: SPACING.md },
  bidCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidCustomerInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  bidEmoji: { fontSize: 32 },
  bidCustomerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  bidService: { fontSize: FONTS.small, color: COLORS.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1 },
  statusText: { fontSize: FONTS.small, fontWeight: '700' },
  bidPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bidPriceLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidPrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  bidBudget: { fontSize: FONTS.small, color: COLORS.textMuted },
  bidTime: { fontSize: 11, color: COLORS.textMuted },
  goToChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 8, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  goToChatText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted },
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  photoModalLabel: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  photoModalBox: { width: width * 0.85, height: width * 0.85, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  photoModalClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F87171' + '18', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#F87171' + '44' },
  withdrawBtnText: { fontSize: FONTS.small, color: '#F87171', fontWeight: '700' },
});