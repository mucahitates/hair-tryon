// src/services/customer/jobService.ts
// Müşteri iş ilanı servisleri

import {
  collection, doc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Job {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmoji: string;
  customerCity: string;
  customerRating: number;
  customerJobCount: number;
  service: string;
  colorPreference: string | null;
  budget: number;
  note: string;
  tags: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  createdAt: any;
  serviceCategory?: string;
}

export interface JobBid {
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

// Yeni iş ilanı oluştur
export const createJob = async (job: Omit<Job, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...job,
    status: 'open',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Müşterinin iş ilanlarını dinle
export const listenCustomerJobs = (
  customerId: string,
  callback: (jobs: Job[]) => void
) => {
  const q = query(
    collection(db, 'jobs'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    callback(jobs);
  });
};

// Müşterinin ilanına gelen teklifleri dinle
export const listenJobBids = (
  jobId: string,
  callback: (bids: JobBid[]) => void
) => {
  const q = query(
    collection(db, 'bids'),
    where('jobId', '==', jobId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const bids = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobBid));
    callback(bids);
  });
};

// İş ilanı güncelle
export const updateJob = async (jobId: string, data: Partial<Job>): Promise<void> => {
  await updateDoc(doc(db, 'jobs', jobId), data);
};

// İş ilanı iptal et
export const cancelJob = async (jobId: string): Promise<void> => {
  await updateDoc(doc(db, 'jobs', jobId), { status: 'cancelled' });
};