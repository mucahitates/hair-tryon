// src/services/hairdresser/profileService.ts
// Kuaför profil servisleri

import {
  doc, getDoc, updateDoc, setDoc,
  collection, query, orderBy, limit,
  onSnapshot, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { HairdresserProfile } from '../../types';
import { uploadProfilePhoto } from '../shared/uploadService';

// Kuaför profilini getir
export const getHairdresserProfile = async (uid: string): Promise<HairdresserProfile | null> => {
  const snap = await getDoc(doc(db, 'hairdresserProfiles', uid));
  if (snap.exists()) return { uid: snap.id, ...snap.data() } as HairdresserProfile;
  return null;
};

// Kuaför profilini dinle (gerçek zamanlı)
export const listenHairdresserProfile = (
  uid: string,
  callback: (profile: HairdresserProfile | null) => void
) => {
  return onSnapshot(doc(db, 'hairdresserProfiles', uid), (snap) => {
    if (snap.exists()) callback({ uid: snap.id, ...snap.data() } as HairdresserProfile);
    else callback(null);
  });
};

// Profil güncelle
export const updateHairdresserProfile = async (
  uid: string,
  data: Partial<HairdresserProfile>
): Promise<void> => {
  await updateDoc(doc(db, 'hairdresserProfiles', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Profil fotoğrafı güncelle
export const updateProfilePhoto = async (uid: string, photoUri: string): Promise<string> => {
  const url = await uploadProfilePhoto(uid, photoUri);
  await updateDoc(doc(db, 'hairdresserProfiles', uid), { photoURL: url });
  return url;
};

// Tüm kuaförleri getir (keşfet ekranı)
export const listenHairdressers = (
  callback: (hairdressers: HairdresserProfile[]) => void
) => {
  const q = query(
    collection(db, 'hairdresserProfiles'),
    orderBy('averageRating', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const hairdressers = snap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as HairdresserProfile));
    callback(hairdressers);
  });
};

// Şehre göre filtrele
export const listenHairdressersByCity = (
  city: string,
  callback: (hairdressers: HairdresserProfile[]) => void
) => {
  const q = query(
    collection(db, 'hairdresserProfiles'),
    where('city', '==', city),
    orderBy('averageRating', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const hairdressers = snap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as HairdresserProfile));
    callback(hairdressers);
  });
};

// Takip et / bırak
export const toggleFollow = async (
  userId: string,
  hairdresserId: string,
  isFollowing: boolean
): Promise<void> => {
  const followRef = doc(db, 'follows', `${userId}_${hairdresserId}`);
  if (isFollowing) {
    await setDoc(followRef, { userId, hairdresserId, createdAt: serverTimestamp() });
    await updateDoc(doc(db, 'hairdresserProfiles', hairdresserId), {
      followersCount: (await getDoc(doc(db, 'hairdresserProfiles', hairdresserId))).data()?.followersCount + 1 || 1,
    });
  } else {
    const profile = await getDoc(doc(db, 'hairdresserProfiles', hairdresserId));
    const current = profile.data()?.followersCount || 0;
    await updateDoc(doc(db, 'hairdresserProfiles', hairdresserId), {
      followersCount: Math.max(0, current - 1),
    });
  }
};