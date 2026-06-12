// app/(hairdresser)/chat/[chatId].tsx
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, TextInput, KeyboardAvoidingView, Platform,
  Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, onSnapshot, collection, query, orderBy,
  addDoc, updateDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../../../src/services/firebase';
import { useAuthStore } from '../../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../../src/constants/theme';

const { width } = Dimensions.get('window');

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  if (message.senderRole === 'system' || message.type === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      {isOwn ? (
        <View style={[styles.bubble, styles.bubbleOwn]}>
          <Text style={styles.bubbleTextOwn}>{message.text}</Text>
          <Text style={styles.bubbleTime}>
            {message.createdAt?.toDate
              ? message.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.bubbleTextOther}>{message.text}</Text>
          <Text style={styles.bubbleTimeOther}>
            {message.createdAt?.toDate
              ? message.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HairdresserChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;

  const toggleBanner = () => {
    const toValue = bannerExpanded ? 0 : 1;
    Animated.spring(bannerAnim, { toValue, tension: 60, friction: 10, useNativeDriver: false }).start();
    setBannerExpanded(!bannerExpanded);
  };

  const bannerHeight = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 220],
  });

  const flatListRef = useRef<FlatList>(null);
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

  // Chat bilgisini dinle
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (snap.exists()) {
        setChatInfo({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  // Mesajları dinle
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [chatId]);

  const handleSend = async () => {
    if (!message.trim() || !chatId) return;
    const text = message.trim();
    setMessage('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: user?.uid,
        senderRole: 'hairdresser',
        messageType: 'text',
        isRead: false,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadByCustomer: true,
      });
      {/*

      // Müşteriye bildirim gönder
      if (chatInfo?.customerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: chatInfo.customerId,
          type: 'message',
          title: 'Yeni Mesaj 💬',
          body: text.length > 50 ? text.substring(0, 50) + '...' : text,
          relatedId: chatId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
      */}
    } catch (e) {
      Alert.alert('Hata', 'Mesaj gönderilemedi.');
    }
  };

  const inputBorderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!chatInfo) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 56, left: 20 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="chatbubble-outline" size={48} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textPrimary, marginTop: SPACING.md }}>Sohbet bulunamadı</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small, marginTop: 4 }}>ID: {chatId}</Text>
      </View>
    );
  }

  const customerName = chatInfo.customerName || 'Müşteri';
  const customerEmoji = chatInfo.customerEmoji || '👤';
  const jobService = chatInfo.jobService || chatInfo.service || 'Hizmet';
  const bidPrice = chatInfo.bidPrice || chatInfo.myPrice || 0;
  const customerBudget = chatInfo.customerBudget || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* ── ÜST BAR ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <LinearGradient colors={[COLORS.primary + '44', COLORS.primaryDark + '33']} style={styles.headerAvatar}>
            <Text style={{ fontSize: 20 }}>{customerEmoji}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.headerName}>{customerName}</Text>
            <Text style={styles.headerSub}>{jobService}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert(
          customerName,
          'Seçenekler',
          [
            { text: '📅 Randevuya Git', onPress: () => router.push('/(hairdresser)/appointments' as any) },
            { text: 'İptal', style: 'cancel' },
          ]
        )}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── BANNER ── */}
      <TouchableOpacity onPress={toggleBanner} activeOpacity={0.9}>
        <Animated.View style={[styles.banner, { height: bannerHeight, overflow: 'hidden' }]}>
          <LinearGradient colors={['rgba(167,139,250,0.15)', 'rgba(124,58,237,0.1)']} style={{ flex: 1, padding: SPACING.md }}>

            {/* Her zaman görünen kısım */}
            <View style={styles.bannerTop}>
              <Text style={{ fontSize: 24 }}>{customerEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerService}>{jobService}</Text>
                <Text style={styles.bannerStatus}>{chatInfo.jobStatus || 'pending'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {bidPrice > 0 && <Text style={styles.bannerPrice}>₺{bidPrice}</Text>}
                {customerBudget > 0 && <Text style={styles.bannerBudget}>Bütçe ₺{customerBudget}</Text>}
              </View>
              <Ionicons
                name={bannerExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textMuted}
                style={{ marginLeft: 6 }}
              />
            </View>

            {/* Genişleyince görünen detaylar */}
            <Animated.View style={{ opacity: bannerAnim, marginTop: SPACING.md }}>
              <View style={styles.bannerDivider} />
              {[
                { icon: 'cut-outline', label: 'Hizmet Türü', value: jobService },
                {
                  icon: 'flag-outline', label: 'Durum', value: {
                    pending: '⏳ Bekliyor',
                    bidding: '💬 Teklif Verildi',
                    accepted: '✅ Kabul Edildi',
                    completed: '🎉 Tamamlandı',
                    cancelled: '❌ İptal Edildi',
                  }[chatInfo.jobStatus as string] || '⏳ Bekliyor'
                },
                { icon: 'wallet-outline', label: 'Müşteri Bütçesi', value: customerBudget > 0 ? `₺${customerBudget}` : '-', color: '#34D399' },

              ].map((item: any) => (
                <View key={item.label} style={styles.bannerDetailRow}>
                  <View style={styles.bannerDetailIcon}>
                    <Ionicons name={item.icon as any} size={15} color={item.color || COLORS.textMuted} />
                  </View>
                  <Text style={styles.bannerDetailLabel}>{item.label}</Text>
                  <Text style={[styles.bannerDetailValue, item.color && { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
              {chatInfo.note && (
                <View style={styles.bannerNoteBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.bannerNoteText} numberOfLines={3}>{chatInfo.note}</Text>
                </View>

              )}
              {chatInfo.aiResultUrl && (
                <View style={[styles.bannerNoteBox, { marginTop: SPACING.sm }]}>
                  <Ionicons name="sparkles-outline" size={13} color={COLORS.primary} />
                  <Text style={[styles.bannerNoteText, { color: COLORS.primary }]}>İstenen görünüm fotoğrafı mevcut</Text>
                </View>
              )}
            </Animated.View>

          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* ── MESAJLAR ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.senderId === user?.uid || item.senderRole === 'hairdresser'}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textMuted, marginTop: SPACING.md }}>Henüz mesaj yok</Text>
          </View>
        }
      />

      {/* ── GİRİŞ ALANI ── */}
      <View style={styles.inputContainer}>
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
        <TouchableOpacity
          style={[styles.sendBtn, message.trim() && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color={message.trim() ? COLORS.white : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm, backgroundColor: 'rgba(26,5,51,0.95)' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  headerName: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  banner: { marginHorizontal: SPACING.md, marginVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  bannerService: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  bannerStatus: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  bannerPrice: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.primary },
  bannerBudget: { fontSize: 11, color: COLORS.textMuted },
  messageList: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.lg },
  messageRow: { flexDirection: 'row', marginVertical: 2 },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: width * 0.72, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg, gap: 4 },
  bubbleOwn: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTextOwn: { fontSize: FONTS.regular, color: COLORS.white, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  bubbleOther: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleTextOther: { fontSize: FONTS.regular, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTimeOther: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  systemMessage: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, paddingVertical: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.sm },
  systemMessageText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: 'rgba(26,5,51,0.95)', paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.md },
  inputWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, minHeight: 42, maxHeight: 120 },
  input: { color: COLORS.textPrimary, fontSize: FONTS.regular, lineHeight: 20, paddingTop: 0, paddingBottom: 0 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  sendBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bannerTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  bannerDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md },
  bannerDetailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  bannerDetailIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  bannerDetailLabel: { fontSize: FONTS.small, color: COLORS.textMuted, width: 110 },
  bannerDetailValue: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: '600', flex: 1 },
  bannerNoteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm },
  bannerNoteText: { flex: 1, fontSize: FONTS.small, color: COLORS.textMuted, lineHeight: 18 },
});