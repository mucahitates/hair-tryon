import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, TextInput, KeyboardAvoidingView, Platform,
  Dimensions, Image, Modal, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../../src/constants/theme';
import {
  getChat, listenMessages, markAsRead,
  sendMessage, Chat, Message,
} from '../../../src/services/shared/messageService';

const { width } = Dimensions.get('window');

function BidDetailModal({ visible, chatInfo, onClose }: {
  visible: boolean;
  chatInfo: Chat | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  if (!chatInfo) return null;

  const statusConfig = ({
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844', icon: 'time-outline' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary, icon: 'pricetag-outline' },
    accepted: { label: 'Kabul Edildi', color: '#34D399', icon: 'checkmark-circle-outline' },
    completed: { label: 'Tamamlandı', color: '#34D399', icon: 'checkmark-done-outline' },
    cancelled: { label: 'İptal Edildi', color: '#F87171', icon: 'close-circle-outline' },
  } as Record<string, any>)[chatInfo.jobStatus] || { label: chatInfo.jobStatus, color: COLORS.textMuted, icon: 'help-outline' };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Teklif Detayı</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.statusCard}>
              <LinearGradient colors={[statusConfig.color + '22', statusConfig.color + '11']} style={modalStyles.statusGradient}>
                <Ionicons name={statusConfig.icon} size={32} color={statusConfig.color} />
                <Text style={[modalStyles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </LinearGradient>
            </View>
            <View style={modalStyles.detailCard}>
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}><Ionicons name="cut-outline" size={18} color={COLORS.primary} /></View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Hizmet</Text>
                  <Text style={modalStyles.detailValue}>{chatInfo.jobService}</Text>
                </View>
              </View>
              <View style={modalStyles.divider} />
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}><Ionicons name="pricetag-outline" size={18} color={COLORS.primary} /></View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Teklif Fiyatı</Text>
                  <Text style={[modalStyles.detailValue, { color: COLORS.primary }]}>₺{chatInfo.bidPrice}</Text>
                </View>
              </View>
              <View style={modalStyles.divider} />
              <View style={modalStyles.detailRow}>
                <View style={modalStyles.detailIcon}><Ionicons name="wallet-outline" size={18} color={COLORS.success} /></View>
                <View style={modalStyles.detailInfo}>
                  <Text style={modalStyles.detailLabel}>Bütçen</Text>
                  <Text style={[modalStyles.detailValue, { color: COLORS.success }]}>₺{chatInfo.customerBudget}</Text>
                </View>
                {chatInfo.bidPrice <= chatInfo.customerBudget ? (
                  <View style={[modalStyles.fitBadge, { backgroundColor: COLORS.success + '18', borderColor: COLORS.success + '44' }]}>
                    <Ionicons name="checkmark" size={12} color={COLORS.success} />
                    <Text style={[modalStyles.fitBadgeText, { color: COLORS.success }]}>Bütçene uygun</Text>
                  </View>
                ) : (
                  <View style={[modalStyles.fitBadge, { backgroundColor: COLORS.error + '18', borderColor: COLORS.error + '44' }]}>
                    <Ionicons name="alert" size={12} color={COLORS.error} />
                    <Text style={[modalStyles.fitBadgeText, { color: COLORS.error }]}>Bütçeni aşıyor</Text>
                  </View>
                )}
              </View>
              {chatInfo.appointmentDate && (
                <>
                  <View style={modalStyles.divider} />
                  <View style={modalStyles.detailRow}>
                    <View style={modalStyles.detailIcon}><Ionicons name="calendar-outline" size={18} color={COLORS.primary} /></View>
                    <View style={modalStyles.detailInfo}>
                      <Text style={modalStyles.detailLabel}>Randevu Tarihi</Text>
                      <Text style={modalStyles.detailValue}>{chatInfo.appointmentDate}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  statusCard: { margin: SPACING.lg, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  statusGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  statusText: { fontSize: FONTS.large, fontWeight: 'bold' },
  detailCard: { marginHorizontal: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  fitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  fitBadgeText: { fontSize: 10, fontWeight: '700' },
});

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const slideAnim = useRef(new Animated.Value(isOwn ? 20 : -20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  }, []);

  const timeStr = message.createdAt?.toDate
    ? message.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  if (message.senderRole === 'system') {
    return (
      <Animated.View style={[styles.systemMessage, { opacity: opacityAnim }]}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </Animated.View>
    );
  }

  if (message.messageType === 'image' && message.imageUrl) {
    return (
      <Animated.View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther, { padding: 4 }]}>
          <Image source={{ uri: message.imageUrl }} style={styles.imageBubble} resizeMode="cover" />
          <Text style={isOwn ? styles.bubbleTime : styles.bubbleTimeOther}>{timeStr}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
      {isOwn ? (
        <View style={[styles.bubble, styles.bubbleOwn]}>
          <Text style={styles.bubbleTextOwn}>{message.text}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{timeStr}</Text>
            <Ionicons name={message.isRead ? 'checkmark-done' : 'checkmark'} size={12} color={message.isRead ? COLORS.primaryLight : 'rgba(255,255,255,0.5)'} />
          </View>
        </View>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.bubbleTextOther}>{message.text}</Text>
          <Text style={styles.bubbleTimeOther}>{timeStr}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function ChatInfoBanner({ chatInfo }: { chatInfo: Chat }) {
  const statusConfig = ({
    pending: { label: 'Teklif Bekleniyor', color: '#FFB844' },
    bidding: { label: 'Teklif Verildi', color: COLORS.primary },
    accepted: { label: 'Kabul Edildi', color: '#34D399' },
    completed: { label: 'Tamamlandı', color: '#34D399' },
    cancelled: { label: 'İptal Edildi', color: '#F87171' },
  } as Record<string, any>)[chatInfo.jobStatus] || { label: chatInfo.jobStatus, color: COLORS.textMuted };

  return (
    <View style={styles.banner}>
      <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.1)']} style={styles.bannerGradient}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerService}>{chatInfo.jobService}</Text>
          <View style={[styles.bannerStatus, { backgroundColor: statusConfig.color + '22' }]}>
            <View style={[styles.bannerStatusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.bannerStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
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
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </LinearGradient>
      {chatInfo.appointmentDate && (
        <View style={styles.appointmentBar}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.appointmentText}>Randevu: {chatInfo.appointmentDate}</Text>
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBidDetail, setShowBidDetail] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    setChatInfo(null);
    setMessages([]);
    setIsLoading(true);
    if (!chatId) return;

    getChat(chatId as string).then(chat => {
      setChatInfo(chat);
      setIsLoading(false);
    });

    const unsub = listenMessages(chatId as string, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    });

    if (user) {
      markAsRead(chatId as string, user.role as 'customer' | 'hairdresser');
    }

    return unsub;
  }, [chatId]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
  }, []);

  const inputBorderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, '#D4A017'],
  });

  const handleSend = async () => {
    if (!message.trim() || !user || !chatId) return;
    const text = message.trim();
    setMessage('');
    await sendMessage(chatId as string, user.uid, user.role as 'customer' | 'hairdresser', text);
  };

  const handleSendPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('İzin Gerekli', 'Galeri erişimi gerekiyor.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets[0] && user && chatId) {
        await sendMessage(chatId as string, user.uid, user.role as 'customer' | 'hairdresser', '📷 Fotoğraf', 'image', result.assets[0].uri);
      }
    } catch { Alert.alert('Hata', 'Fotoğraf seçilemedi.'); }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!chatInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 56, left: 20 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.textPrimary }}>Sohbet bulunamadı</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.replace('/(customer)/chats' as any)}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => router.push(`/hairdresser/${chatInfo.hairdresserId}` as any)} activeOpacity={0.7}>
          <View style={styles.headerAvatarWrapper}>
            <LinearGradient colors={[COLORS.primary + '44', COLORS.primaryDark + '33']} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarEmoji}>{chatInfo.hairdresserEmoji}</Text>
            </LinearGradient>
            {chatInfo.isOnline && <View style={styles.headerOnlineDot} />}
          </View>
          <View>
            <Text style={styles.headerName}>{chatInfo.hairdresserName}</Text>
            <Text style={styles.headerStatus}>{chatInfo.isOnline ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/hairdresser/${chatInfo.hairdresserId}` as any)}>
          <Ionicons name="person-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={() => setShowBidDetail(true)} activeOpacity={0.85}>
        <ChatInfoBanner chatInfo={chatInfo} />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.uid} />
        )}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={handleSendPhoto}>
          <Ionicons name="image-outline" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <Animated.View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            onFocus={() => Animated.timing(inputBorderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
            onBlur={() => Animated.timing(inputBorderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
          />
        </Animated.View>
        <TouchableOpacity style={[styles.sendBtn, message.trim() && styles.sendBtnActive]} onPress={handleSend} disabled={!message.trim()}>
          <Ionicons name="send" size={20} color={message.trim() ? COLORS.white : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <BidDetailModal visible={showBidDetail} chatInfo={chatInfo} onClose={() => setShowBidDetail(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm, backgroundColor: 'rgba(26,5,51,0.95)' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerAvatarWrapper: { position: 'relative', width: 42, height: 42 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  headerAvatarEmoji: { fontSize: 20 },
  headerOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
  headerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  headerStatus: { fontSize: 11, color: COLORS.textMuted },
  banner: { marginHorizontal: SPACING.md, marginVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  bannerGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  bannerLeft: { flex: 1, gap: 4 },
  bannerService: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  bannerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  bannerStatusDot: { width: 6, height: 6, borderRadius: 3 },
  bannerStatusText: { fontSize: 11, fontWeight: '700' },
  bannerRight: { alignItems: 'flex-end', gap: 4 },
  bannerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerPriceLabel: { fontSize: 11, color: COLORS.textMuted },
  bannerPrice: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.primary },
  bannerBudget: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.success },
  appointmentBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary + '18', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  appointmentText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  messageList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.lg },
  messageRow: { flexDirection: 'row', marginVertical: 2 },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.72, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, gap: 4 },
  bubbleOwn: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTextOwn: { fontSize: FONTS.regular, color: COLORS.white, lineHeight: 20 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  bubbleOther: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleTextOther: { fontSize: FONTS.regular, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTimeOther: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  imageBubble: { width: 200, height: 200, borderRadius: RADIUS.md },
  systemMessage: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.sm },
  systemMessageText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: 'rgba(26,5,51,0.95)', paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md },
  attachBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  inputWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minHeight: 42, maxHeight: 120 },
  input: { color: COLORS.textPrimary, fontSize: FONTS.regular, lineHeight: 20, textAlignVertical: 'center', paddingTop: 0, paddingBottom: 0 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sendBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
});