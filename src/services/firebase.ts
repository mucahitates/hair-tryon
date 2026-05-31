// Firebase başlatma dosyası
// Auth, Firestore ve Storage instance'larını dışa aktarır
// Tüm servis dosyaları buradan import eder
// KRİTİK: initializeAuth değil getAuth kullanıyoruz
// Değerler .env dosyasından EXPO_PUBLIC_ prefix ile okunur
// EXPO_PUBLIC_ prefix'i olmayan değerler client'ta görünmez

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Uygulama zaten başlatılmışsa tekrar başlatma
// React strict mode ve hot reload'da çift başlatmayı önler
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth instance — getAuth kullanıyoruz (initializeAuth değil)
export const auth = getAuth(app);

// Firestore instance — tüm veritabanı işlemleri buradan
export const db = getFirestore(app);

// Storage instance — fotoğraf yükleme işlemleri buradan
export const storage = getStorage(app);

export default app;