// src/services/hairdresser/appointmentService.ts
// Kuaför randevu servisleri

import {
  collection, doc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Appointment } from '../customer/appointmentService';

// Kuaförün randevularını dinle
export const listenHairdresserAppointments = (
  hairdresserId: string,
  callback: (apts: Appointment[]) => void
) => {
  const q = query(
    collection(db, 'appointments'),
    where('hairdresserId', '==', hairdresserId),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const apts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    callback(apts);
  });
};

// Randevu onayla
export const confirmAppointment = async (aptId: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', aptId), { status: 'confirmed' });
};

// Randevu iptal et
export const cancelAppointment = async (aptId: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', aptId), { status: 'cancelled' });
};

// Randevu tamamla
export const completeAppointment = async (aptId: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', aptId), { status: 'completed' });
};

// Müsait saatleri getir
export const getAvailability = async (
  hairdresserId: string
): Promise<Record<string, string[]>> => {
  const snap = await getDoc(doc(db, 'availability', hairdresserId));
  if (snap.exists()) return snap.data().availableSlots || {};
  return {};
};

// Müsait saatleri güncelle
export const updateAvailability = async (
  hairdresserId: string,
  slots: Record<string, string[]>
): Promise<void> => {
  await setDoc(doc(db, 'availability', hairdresserId), {
    hairdresserId,
    availableSlots: slots,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};