// src/services/shared/coinService.ts
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type UserType = 'customer' | 'hairdresser';

export const processCoinTransaction = async (
  userId: string,
  userType: UserType,
  amount: number, // Düşmek için eksi (örn: -10), eklemek için artı (örn: +50)
  description: string
): Promise<{ success: boolean; message: string; newBalance?: number }> => {
  try {
    const collectionName = userType === 'customer' ? 'users' : 'hairdresserProfiles';
    const userRef = doc(db, collectionName, userId);
    const transactionRef = doc(collection(db, 'coinTransactions'));

    const newBalance = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Mevcut bakiye (Eğer daha önce hiç coin alanı açılmadıysa 0 kabul et)
      const currentBalance = userDoc.data().coinBalance || 0;
      const updatedBalance = currentBalance + amount;

      // Eğer bakiye yetersizse işlemi iptal et
      if (updatedBalance < 0) {
        throw new Error('Yetersiz bakiye');
      }

      // 1. Kullanıcının bakiyesini güncelle
      transaction.update(userRef, { coinBalance: updatedBalance });

      // 2. İşlem geçmişine (Log) kaydet (Makbuz kesiyoruz)
      transaction.set(transactionRef, {
        userId,
        userType,
        amount,
        type: amount > 0 ? 'earn' : 'spend', // earn: kazanma, spend: harcama
        description,
        createdAt: serverTimestamp(),
      });

      return updatedBalance;
    });

    return { success: true, message: 'İşlem başarılı', newBalance };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};