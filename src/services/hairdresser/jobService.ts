// src/services/hairdresser/jobService.ts
// Kuaför iş ilanı ve teklif servisleri

import {
  collection, doc, addDoc, updateDoc, getDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Job } from '../customer/jobService';

export interface Bid {
  id?: string;
  jobId: string;
  hairdresserId: string;
  hairdresserName: string;
  hairdresserEmoji: string;
  price: number;
  note: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  chatId: string | null;
  createdAt: any;
}

// Tüm açık iş ilanlarını dinle
export const listenOpenJobs = (callback: (jobs: Job[]) => void) => {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    callback(jobs);
  });
};

// Teklif ver
export const createBid = async (bid: Omit<Bid, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'bids'), {
    ...bid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Kuaförün tekliflerini dinle
export const listenHairdresserBids = (
  hairdresserId: string,
  callback: (bids: Bid[]) => void
) => {
  const q = query(
    collection(db, 'bids'),
    where('hairdresserId', '==', hairdresserId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const bids = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bid));
    callback(bids);
  });
};

// Teklif güncelle (fiyat değiştir, geri çek)
export const updateBid = async (bidId: string, data: Partial<Bid>): Promise<void> => {
  await updateDoc(doc(db, 'bids', bidId), data);
};

// Teklif kabul et → chat güncelle
export const acceptBid = async (bidId: string, jobId: string): Promise<void> => {
  await updateDoc(doc(db, 'bids', bidId), { status: 'accepted' });
  await updateDoc(doc(db, 'jobs', jobId), { status: 'in_progress' });
};

// Teklif reddet
export const rejectBid = async (bidId: string): Promise<void> => {
  await updateDoc(doc(db, 'bids', bidId), { status: 'rejected' });
};