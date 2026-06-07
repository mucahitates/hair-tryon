// src/services/shared/messageService.ts
// Ortak mesaj fonksiyonları — customer ve hairdresser chat ekranları kullanır

import {
  collection, doc, addDoc, updateDoc, getDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  senderRole: 'customer' | 'hairdresser' | 'system';
  text: string;
  messageType: 'text' | 'image' | 'system';
  imageUrl: string | null;
  isRead: boolean;
  createdAt: any;
}

export interface Chat {
  id?: string;
  jobId: string;
  customerId: string;
  customerName: string;
  customerEmoji: string;
  hairdresserId: string;
  hairdresserName: string;
  hairdresserEmoji: string;
  jobService: string;
  jobStatus: 'pending' | 'bidding' | 'accepted' | 'completed' | 'cancelled';
  bidPrice: number;
  customerBudget: number;
  appointmentDate: string | null;
  note: string | null;
  beforeEmoji: string;
  afterEmoji: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadCustomer: number;
  unreadHairdresser: number;
  isOnline: boolean;
  createdAt: any;
}

// Mesaj gönder
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderRole: Message['senderRole'],
  text: string,
  messageType: Message['messageType'] = 'text',
  imageUrl: string | null = null
): Promise<void> => {
  // Mesajı kaydet
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId,
    senderRole,
    text,
    messageType,
    imageUrl,
    isRead: false,
    createdAt: serverTimestamp(),
  });

  // Chat son mesajını güncelle
  const unreadField = senderRole === 'customer' ? 'unreadHairdresser' : 'unreadCustomer';
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  const currentUnread = chatSnap.data()?.[unreadField] || 0;

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    [unreadField]: currentUnread + 1,
  });
};

// Sistem mesajı gönder
export const sendSystemMessage = async (chatId: string, text: string): Promise<void> => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    chatId,
    senderId: 'system',
    senderRole: 'system',
    text,
    messageType: 'system',
    imageUrl: null,
    isRead: true,
    createdAt: serverTimestamp(),
  });
};

// Mesajları gerçek zamanlı dinle
export const listenMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    callback(messages);
  });
};

// Mesajları okundu yap
export const markAsRead = async (
  chatId: string,
  role: 'customer' | 'hairdresser'
): Promise<void> => {
  const field = role === 'customer' ? 'unreadCustomer' : 'unreadHairdresser';
  await updateDoc(doc(db, 'chats', chatId), { [field]: 0 });
};

// Chat bilgisini getir
export const getChat = async (chatId: string): Promise<Chat | null> => {
  const snap = await getDoc(doc(db, 'chats', chatId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as Chat;
  return null;
};

// Chat güncelle
export const updateChat = async (chatId: string, data: Partial<Chat>): Promise<void> => {
  await updateDoc(doc(db, 'chats', chatId), data);
};

// Kullanıcının chatlerini dinle
export const listenUserChats = (
  userId: string,
  role: 'customer' | 'hairdresser',
  callback: (chats: Chat[]) => void
) => {
  const field = role === 'customer' ? 'customerId' : 'hairdresserId';
  const q = query(
    collection(db, 'chats'),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const chats = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
      .filter(chat => (role === 'customer' ? chat.customerId : chat.hairdresserId) === userId);
    callback(chats);
  });
};