// ─────────────────────────────────────────────────────────────
// SOHBET DETAY EKRANI (app/chat/[chatId].tsx)
// ─────────────────────────────────────────────────────────────
// Müşteri ve kuaför arasındaki mesajlaşma ekranı
// Hem müşteri hem kuaför kullanır
//
// BAĞLANTILAR:
// - useLocalSearchParams → URL'den chatId alır
// - authStore → kim gönderdiğini belirler (customer/hairdresser)
// - Firestore: chats/{chatId}/messages → mesajlar (şimdilik dummy)
// - /hairdresser/[id] → üstteki başlığa tıklayınca profil sayfası
//
// ÖZELLİKLER:
// - Mesaj gönderme (text)
// - Fotoğraf gönderme (expo-image-picker)
// - Banner'a tıklayınca teklif detay modalı
// - Mesaj okundu durumu
// - Teklif/randevu bilgisi banner
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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────

// Firestore: chats/{chatId} — sohbet bilgileri
const DUMMY_CHAT_INFO: Record<string, {
  id: string;
  hairdresserId: string;
  hairdresserName: string;
  hairdresserEmoji: string;
  isOnline: boolean;
  jobService: string;
  jobStatus: string;
  bidPrice: number;
  customerBudget: number;
  appointmentDate: string | null;
}> = {
  chat1: {
    id: 'chat1',
    hairdresserId: '1',
    hairdresserName: 'Salon Elegance',
    hairdresserEmoji: '💇‍♀️',
    isOnline: true,
    jobService: 'Balayage',
    jobStatus: 'bidding',
    bidPrice: 750,
    customerBudget: 800,
    appointmentDate: null,
  },
  chat2: {
    id: 'chat2',
    hairdresserId: '3',
    hairdresserName: 'Style Studio',
    hairdresserEmoji: '👑',
    isOnline: false,
    jobService: 'Keratin Bakım',
    jobStatus: 'completed',
    bidPrice: 580,
    customerBudget: 600,
    appointmentDate: '24 Mayıs, 14:00',
  },
  chat3: {
    id: 'chat3',
    hairdresserId: '4',
    hairdresserName: 'Hair Lab',
    hairdresserEmoji: '🎨',
    isOnline: true,
    jobService: 'Wolf Cut',
    jobStatus: 'pending',
    bidPrice: 700,
    customerBudget: 400,
    appointmentDate: null,
  },
};

// Firestore: chats/{chatId}/messages — mesaj listesi
const DUMMY_MESSAGES: Record<string, any[]> = {
  chat1: [
    {
      id: 'm1',
      senderId: 'hairdresser1',
      senderRole: 'hairdresser',
      text: 'Merhaba! İlanınızı inceledim, balayage konusunda size yardımcı olabilirim.',
      messageType: 'text',
      imageUri: null,
      isRead: true,
      createdAt: '14:20',
    },
    {
      id: 'm2',
      senderId: 'customer1',
      senderRole: 'customer',
      text: 'Merhaba, teşekkürler! Fiyatınız ne kadar olur?',
      messageType: 'text',
      imageUri: null,
      isRead: true,
      createdAt: '14:25',
    },
    {
      id: 'm3',
      senderId: 'hairdresser1',
      senderRole: 'hairdresser',
      text: 'Balayage için fiyatımız 750₺ olacak.',
      messageType: 'text',
      imageUri: null,
      isRead: true,
      createdAt: '14:32',
    },
    {
      id: 'm4',
      senderId: 'system',
      senderRole: 'system',
      text: '💼 Kuaför teklif verdi: ₺750',
      messageType: 'system',
      imageUri: null,
      isRead: true,
      createdAt: '14:32',
    },
  ],
  chat2: [
    {
      id: 'm1',
      senderId: 'system',
      senderRole: 'system',
      text: '✅ Teklif kabul edildi',
      messageType: 'system',
      imageUri: null,
      isRead: true,
      createdAt: 'Dün 10:00',
    },
    {
      id: 'm2',
      senderId: 'hairdresser3',
      senderRole: 'hairdresser',
      text: 'Randevunuz onaylandı! 24 Mayıs saat 14:00\'de sizi bekliyoruz 🎉',
      messageType: 'text',
      imageUri: null,
      isRead: true,
      createdAt: 'Dün 10:05',
    },
    {
      id: 'm3',
      senderId: 'system',
      senderRole: 'system',
      text: '📅 Randevu oluşturuldu: 24 Mayıs, 14:00',
      messageType: 'system',
      imageUri: null,
      isRead: true,
      createdAt: 'Dün 10:05',
    },
  ],
  chat3: [
    {
      id: 'm1',
      senderId: 'hairdresser4',
      senderRole: 'hairdresser',
      text: 'Merhaba! Wolf cut ilanınızı gördüm, harika bir seçim!',
      messageType: 'text',
      imageUri: null,
      isRead: true,
      createdAt: 'Pazartesi 15:00',
    },
  ],
};

// ─── TEKLİF DETAY MODALI ───────────────────────────────────
// Banner'a tıklayınca açılır
// Teklif fiyatı, bütçe, hizmet, durum, randevu detaylarını gösterir
// Kabul Et / Reddet — Firestore bağlantısı sonra eklenecek
function BidDetailModal({ visible, chatInfo, onClose }: {
  visible: boolean;
  chatInfo: typeof DUMMY_CHAT_INFO['chat1'] | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  if (!chatInfo) return null;

  const statusConfig = {
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844', icon: 'time-outline' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary, icon: 'pricetag-outline' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', icon: 'checkmark-circle-outline' },
    completed: { label: 'Tamamlandı', color: '#34D399', icon: 'checkmark-done-outline' },
    cancelled: { label: 'İptal Edildi', color: '#F87171', icon: 'close-circle-outline' },
  }[chatInfo.jobStatus] || { label: chatInfo.jobStatus, color: COLORS.textMuted, icon: 'help-outline' };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.container, { transform: [{ translateY: slideAnim }] }]}>

          {/* Başlık */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Teklif Detayı</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Durum kartı */}
            <View style={modalStyles.statusCard}>
              <LinearGradient
                colors={[statusConfig.color + '22', statusConfig.color + '11']}
                style={modalStyles.statusGradient}
              >
                <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
                <Text style={[modalStyles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </LinearGradient>
            </View>

            {/* Detaylar */}
            <View style={modalStyles.detailCard}>

              {/* Hizmet */}
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}>
                  <Ionicons name="cut-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Hizmet</Text>
                  <Text style={modalStyles.detailValue}>{chatInfo.jobService}</Text>
                </View>
              </View>

              <View style={modalStyles.divider} />

              {/* Teklif fiyatı */}
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}>
                  <Ionicons name="pricetag-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Teklif Fiyatı</Text>
                  <Text style={[modalStyles.detailValue, { color: COLORS.primary }]}>
                    ₺{chatInfo.bidPrice}
                  </Text>
                </View>
              </View>

              <View style={modalStyles.divider} />

              {/* Bütçe + uygunluk */}
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}>
                  <Ionicons name="wallet-outline" size={18} color={COLORS.success} />
                </View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Bütçen</Text>
                  <Text style={[modalStyles.detailValue, { color: COLORS.success }]}>
                    ₺{chatInfo.customerBudget}
                  </Text>
                </View>
                {chatInfo.bidPrice <= chatInfo.customerBudget ? (
                  <View style={[modalStyles.fitBadge, { backgroundColor: COLORS.success + '18', borderColor: COLORS.success + '44' }]}>
                    <Ionicons name="checkmark" size={12} color={COLORS.success} />
                    <Text style={[modalStyles.fitBadgeText, { color: COLORS.success }]}>
                      Bütçene uygun
                    </Text>
                  </View>
                ) : (
                  <View style={[modalStyles.fitBadge, { backgroundColor: COLORS.error + '18', borderColor: COLORS.error + '44' }]}>
                    <Ionicons name="alert" size={12} color={COLORS.error} />
                    <Text style={[modalStyles.fitBadgeText, { color: COLORS.error }]}>
                      Bütçeni aşıyor
                    </Text>
                  </View>
                )}
              </View>

              {/* Randevu varsa */}
              {chatInfo.appointmentDate && (
                <>
                  <View style={modalStyles.divider} />
                  <View style={modalStyles.detailRow}>
                    <View style={modalStyles.detailIcon}>
                      <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={modalStyles.detailInfo}>
                      <Text style={modalStyles.detailLabel}>Randevu Tarihi</Text>
                      <Text style={modalStyles.detailValue}>{chatInfo.appointmentDate}</Text>
                    </View>
                  </View>
                </>
              )}

            </View>

            {/* Kabul Et / Reddet — sadece bidding durumunda */}
            {chatInfo.jobStatus === 'bidding' && (
              <View style={modalStyles.actionButtons}>
                {/* Reddet — Firestore: bids.status = rejected */}
                <TouchableOpacity style={modalStyles.rejectBtn}>
                  <Text style={modalStyles.rejectBtnText}>Teklifi Reddet</Text>
                </TouchableOpacity>

                {/* Kabul Et — Firestore: bids.status = accepted */}
                <TouchableOpacity style={modalStyles.acceptBtn}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={modalStyles.acceptGradient}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                    <Text style={modalStyles.acceptBtnText}>Teklifi Kabul Et</Text>
                  </LinearGradient>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A0533',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.xlarge,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    margin: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  statusText: {
    fontSize: FONTS.large,
    fontWeight: 'bold',
  },
  detailCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: FONTS.small,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  fitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  fitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONTS.regular,
  },
  acceptBtn: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONTS.regular,
  },
});

// ─── MESAJ BALONU ──────────────────────────────────────────
// Her mesaj için balon bileşeni
// Kendi mesajları sağda, karşı tarafın mesajları solda
// Sistem mesajları ortada
// imageUri varsa fotoğraf mesajı olarak gösterir
function MessageBubble({ message, isOwn }: {
  message: any;
  isOwn: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(isOwn ? 20 : -20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Sistem mesajı — ortada
  if (message.senderRole === 'system') {
    return (
      <Animated.View style={[styles.systemMessage, { opacity: opacityAnim }]}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </Animated.View>
    );
  }

  // Fotoğraf mesajı
  if (message.messageType === 'image' && message.imageUri) {
    return (
      <Animated.View style={[
        styles.messageRow,
        isOwn ? styles.messageRowOwn : styles.messageRowOther,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }
      ]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, { padding: 4 }]}>
          <Image
            source={{ uri: message.imageUri }}
            style={styles.imageBubble}
            resizeMode="cover"
          />
          <Text style={isOwn ? styles.bubbleTime : styles.bubbleTimeOther}>
            {message.createdAt}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Normal metin mesajı
  return (
    <Animated.View style={[
      styles.messageRow,
      isOwn ? styles.messageRowOwn : styles.messageRowOther,
      { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }
    ]}>
      {isOwn ? (
        // Kendi mesajı — sağ, mor
        <View style={[styles.bubble, styles.bubbleOwn]}>
          <Text style={styles.bubbleTextOwn}>{message.text}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{message.createdAt}</Text>
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.isRead ? COLORS.primaryLight : 'rgba(255,255,255,0.5)'}
            />
          </View>
        </View>
      ) : (
        // Karşı taraf mesajı — sol, koyu
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.bubbleTextOther}>{message.text}</Text>
          <Text style={styles.bubbleTimeOther}>{message.createdAt}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── TEKLİF/RANDEVU BANNER ─────────────────────────────────
// Sohbet başında teklif ve randevu bilgisini gösterir
// Tıklanabilir — BidDetailModal açar
function ChatInfoBanner({ chatInfo }: {
  chatInfo: typeof DUMMY_CHAT_INFO['chat1'];
}) {
  const statusConfig = {
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary },
    accepted: { label: 'Kabul Edildi', color: '#34D399' },
    completed: { label: 'Tamamlandı', color: '#34D399' },
    cancelled: { label: 'İptal Edildi', color: '#F87171' },
  }[chatInfo.jobStatus] || { label: chatInfo.jobStatus, color: COLORS.textMuted };

  return (
    <View style={styles.banner}>
      <LinearGradient
        colors={['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.1)']}
        style={styles.bannerGradient}
      >
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerService}>{chatInfo.jobService}</Text>
          <View style={[styles.bannerStatus, { backgroundColor: statusConfig.color + '22' }]}>
            <View style={[styles.bannerStatusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.bannerStatusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View style={styles.bannerRight}>
          <View style={styles.bannerPriceRow}>
            <Text style={styles.bannerPriceLabel}>Teklif</Text>
            <Text style={styles.bannerPrice}>₺{chatInfo.bidPrice}</Text>
          </View>
          <View style={styles.bannerPriceRow}>
            <Text style={styles.bannerPriceLabel}>Bütçe</Text>
            <Text style={styles.bannerBudget}>₺{chatInfo.customerBudget}</Text>
          </View>
        </View>
        {/* Detay için ok ikonu */}
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </LinearGradient>

      {chatInfo.appointmentDate && (
        <View style={styles.appointmentBar}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.appointmentText}>
            Randevu: {chatInfo.appointmentDate}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(DUMMY_MESSAGES[chatId as string] || []);
  const [showBidDetail, setShowBidDetail] = useState(false);

  // chatId'ye göre sohbet bilgisi
  const chatInfo = DUMMY_CHAT_INFO[chatId as string];

  const flatListRef = useRef<FlatList>(null);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  // Input focus animasyonu — gold border
  const handleInputFocus = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.timing(inputBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const inputBorderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  // Metin mesajı gönder
  // Firestore: chats/{chatId}/messages koleksiyonuna yeni mesaj ekler
  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      senderId: user?.uid || 'customer1',
      senderRole: user?.role || 'customer',
      text: message.trim(),
      messageType: 'text',
      imageUri: null,
      isRead: false,
      createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Fotoğraf gönder
  // expo-image-picker ile galeri açar
  // TODO: Firebase Storage'a yükle, URL al, Firestore'a kaydet
  const handleSendPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const newMessage = {
          id: Date.now().toString(),
          senderId: user?.uid || 'customer1',
          senderRole: user?.role || 'customer',
          text: '📷 Fotoğraf',
          messageType: 'image',
          imageUri: result.assets[0].uri,
          isRead: false,
          createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    }
  };

  if (!chatInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textPrimary }}>Sohbet bulunamadı</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── ÜST BAR ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        {/* Geri butonu */}
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Kuaför bilgisi — tıklayınca profil sayfasına gider */}
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => router.push(`/hairdresser/${chatInfo.hairdresserId}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatarWrapper}>
            <LinearGradient
              colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarEmoji}>{chatInfo.hairdresserEmoji}</Text>
            </LinearGradient>
            {chatInfo.isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View>
            <Text style={styles.headerName}>{chatInfo.hairdresserName}</Text>
            <Text style={styles.headerStatus}>
              {chatInfo.isOnline ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Profil butonu */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push(`/hairdresser/${chatInfo.hairdresserId}` as any)}
        >
          <Ionicons name="person-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── TEKLİF BANNER — tıklayınca detay modalı açılır ── */}
      <TouchableOpacity onPress={() => setShowBidDetail(true)} activeOpacity={0.85}>
        <ChatInfoBanner chatInfo={chatInfo} />
      </TouchableOpacity>

      {/* ── MESAJ LİSTESİ ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.senderRole === (user?.role || 'customer')}
          />
        )}
      />

      {/* ── MESAJ GİRİŞ ALANI ── */}
      <View style={styles.inputContainer}>
        {/* Fotoğraf gönder butonu */}
        <TouchableOpacity style={styles.attachBtn} onPress={handleSendPhoto}>
          <Ionicons name="image-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Mesaj input — focus animasyonlu border */}
        <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </Animated.View>

        {/* Gönder butonu — mesaj varsa aktif */}
        <TouchableOpacity
          style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={message.trim() ? COLORS.white : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Teklif detay modalı — banner'a tıklayınca açılır */}
      <BidDetailModal
        visible={showBidDetail}
        chatInfo={chatInfo}
        onClose={() => setShowBidDetail(false)}
      />

    </KeyboardAvoidingView>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Üst bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
    backgroundColor: 'rgba(26,5,51,0.95)',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Kuaför bilgisi
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatarWrapper: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarEmoji: { fontSize: 20 },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerName: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerStatus: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // Teklif banner
  banner: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  bannerLeft: { flex: 1, gap: 4 },
  bannerService: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  bannerStatusDot: { width: 6, height: 6, borderRadius: 3 },
  bannerStatusText: { fontSize: 11, fontWeight: '700' },
  bannerRight: { alignItems: 'flex-end', gap: 4 },
  bannerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerPriceLabel: { fontSize: 11, color: COLORS.textMuted },
  bannerPrice: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bannerBudget: {
    fontSize: FONTS.medium,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  // Randevu bar
  appointmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '18',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appointmentText: {
    fontSize: FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Mesaj listesi
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  // Mesaj balonu
  bubble: {
    maxWidth: width * 0.72,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: 4,
  },
  bubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTextOwn: {
    fontSize: FONTS.regular,
    color: COLORS.white,
    lineHeight: 20,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleTextOther: {
    fontSize: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  bubbleTimeOther: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  // Fotoğraf mesajı
  imageBubble: {
    width: 200,
    height: 200,
    borderRadius: RADIUS.md,
  },
  // Sistem mesajı
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  systemMessageText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Mesaj giriş alanı
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: 'rgba(26,5,51,0.95)',
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 42,
    maxHeight: 120,
  },
  input: {
    color: COLORS.textPrimary,
    fontSize: FONTS.regular,
    lineHeight: 20,
    textAlignVertical: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});