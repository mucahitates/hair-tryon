// src/services/customer/aiService.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const saveAiTryOn = async (customerId: string, data: any) => {
  return await addDoc(collection(db, 'aiTries'), {
    ...data,
    customerId,
    createdAt: serverTimestamp(),
  });
};

export const saveToFavorites = async (customerId: string, data: any) => {
  return await addDoc(collection(db, 'favorites'), {
    ...data,
    customerId,
    createdAt: serverTimestamp(),
  });
};