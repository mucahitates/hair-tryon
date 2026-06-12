// src/services/notificationService.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType =
  | 'bid_received'       // Müşteriye: kuaför teklif verdi
  | 'appointment_request' // Kuaföre: müşteri randevu istedi
  | 'message'            // Karşı tarafa: yeni mesaj
  | 'bid_withdrawn'      // Müşteriye: teklif geri çekildi
  | 'appointment_confirmed' // Müşteriye: randevu onaylandı
  | 'appointment_cancelled'; // Müşteriye: randevu iptal edildi

interface CreateNotificationParams {
  userId: string;       // Bildirimi alacak kişinin UID'i
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;   // chatId, jobId, appointmentId gibi
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      relatedId: params.relatedId || null,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Bildirim oluşturulamadı:', e);
  }
}