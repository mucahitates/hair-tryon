// src/services/customer/chatService.ts
// Müşteri chat servisleri

import {
  collection, doc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Chat } from '../shared/messageService';

// Yeni chat oluştur (teklif kabul edilince)
export const createChat = async (
  chat: Omit<Chat, 'id' | 'createdAt' | 'lastMessageAt' | 'lastMessage' | 'unreadCustomer' | 'unreadHairdresser'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'chats'), {
    ...chat,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCustomer: 0,
    unreadHairdresser: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};