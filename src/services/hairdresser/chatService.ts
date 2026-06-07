// src/services/hairdresser/chatService.ts
// Kuaför chat servisleri

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Chat } from '../shared/messageService';

// Chat iş durumunu güncelle
export const updateJobStatus = async (
  chatId: string,
  jobStatus: Chat['jobStatus']
): Promise<void> => {
  await updateDoc(doc(db, 'chats', chatId), { jobStatus });
};

// Teklif fiyatını güncelle
export const updateBidPrice = async (
  chatId: string,
  newPrice: number
): Promise<void> => {
  await updateDoc(doc(db, 'chats', chatId), { bidPrice: newPrice });
};