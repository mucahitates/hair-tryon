// src/services/customer/appointmentService.ts
// Müşteri randevu servisleri

import {
  collection, doc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Appointment {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmoji: string;
  hairdresserId: string;
  hairdresserName: string;
  salonName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  chatId: string;
  note: string | null;
  createdAt: any;
}

// Randevu oluştur
export const createAppointment = async (
  apt: Omit<Appointment, 'id' | 'createdAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'appointments'), {
    ...apt,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Müşterinin randevularını dinle
export const listenCustomerAppointments = (
  customerId: string,
  callback: (apts: Appointment[]) => void
) => {
  const q = query(
    collection(db, 'appointments'),
    where('customerId', '==', customerId),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const apts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    callback(apts);
  });
};

// Randevu iptal et
export const cancelAppointment = async (aptId: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', aptId), { status: 'cancelled' });
};