// src/services/hairdresser/portfolioService.ts
// Kuaför portfolyo servisleri

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadPortfolioPhoto } from '../shared/uploadService';

export interface PortfolioItem {
  id?: string;
  hairdresserId: string;
  service: string;
  category: string;
  colorInfo: string | null;
  price: number;
  duration: number;
  note: string;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  beforeEmoji: string;
  afterEmoji: string;
  likes: number;
  comments: number;
  views: number;
  saves: number;
  isHidden: boolean;
  isAnonymous: boolean;
  customerName: string | null;
  fromJob: boolean;
  date: string;
  createdAt: any;
}

// Portfolyo öğesi ekle
export const addPortfolioItem = async (
  item: Omit<PortfolioItem, 'id' | 'createdAt' | 'likes' | 'comments' | 'views' | 'saves'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'portfolioItems'), {
    ...item,
    likes: 0,
    comments: 0,
    views: 0,
    saves: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// Kuaförün portfolyosunu dinle
export const listenPortfolioItems = (
  hairdresserId: string,
  callback: (items: PortfolioItem[]) => void
) => {
  const q = query(
    collection(db, 'portfolioItems'),
    where('hairdresserId', '==', hairdresserId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
    callback(items);
  });
};

// Portfolyo güncelle (gizle/göster)
export const updatePortfolioItem = async (
  itemId: string,
  data: Partial<PortfolioItem>
): Promise<void> => {
  await updateDoc(doc(db, 'portfolioItems', itemId), data);
};

// Portfolyo sil
export const deletePortfolioItem = async (itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'portfolioItems', itemId));
};

// Fotoğraf yükle ve portfolyoya ekle
export const addPortfolioWithPhotos = async (
  hairdresserId: string,
  item: Omit<PortfolioItem, 'id' | 'createdAt' | 'likes' | 'comments' | 'views' | 'saves' | 'beforePhotoUrl' | 'afterPhotoUrl'>,
  beforePhotoUri: string | null,
  afterPhotoUri: string | null
): Promise<string> => {
  let beforePhotoUrl = null;
  let afterPhotoUrl = null;

  if (beforePhotoUri) {
    beforePhotoUrl = await uploadPortfolioPhoto(hairdresserId, beforePhotoUri, 'before');
  }
  if (afterPhotoUri) {
    afterPhotoUrl = await uploadPortfolioPhoto(hairdresserId, afterPhotoUri, 'after');
  }

  return await addPortfolioItem({
    ...item,
    beforePhotoUrl,
    afterPhotoUrl,
  });
};

// Beğeni güncelle
export const updateLikes = async (itemId: string, increment: boolean): Promise<void> => {
  const itemRef = doc(db, 'portfolioItems', itemId);
  await updateDoc(itemRef, {
    likes: increment ? 1 : -1,
  });
};