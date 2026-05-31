// Kullanıcı servisi
// Firestore users/ koleksiyonundan okuma ve yazma işlemleri
// authStore.ts ve app/index.tsx bu servisi kullanır

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

// Firestore'dan kullanıcı bilgisini getirir
// app/index.tsx'de onAuthStateChanged içinde çağrılır
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('getUser hatası:', error);
    return null;
  }
};

// Yeni kullanıcı oluşturur
// register ekranında kayıt sonrası çağrılır
export const createUser = async (user: User): Promise<void> => {
  try {
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, user);
  } catch (error) {
    console.error('createUser hatası:', error);
    throw error;
  }
};

// Kullanıcı bilgisini günceller
// Profil düzenleme ekranında çağrılır
export const updateUser = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { ...data, lastActiveAt: Date.now() });
  } catch (error) {
    console.error('updateUser hatası:', error);
    throw error;
  }
};