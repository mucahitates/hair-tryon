// Firebase başlatma dosyası
// Auth, Firestore ve Storage instance'larını dışa aktarır
// Tüm servis dosyaları (authService, userService vb.) buradan import eder
// KRİTİK: initializeAuth değil getAuth kullanıyoruz — persistence eklersek
// ilk açılışta null→user sırası bozuluyor

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase proje yapılandırması
// Bu bilgiler Firebase Console → Project Settings → Web App'ten alındı
const firebaseConfig = {
  apiKey: 'AIzaSyA9mnHuMLzvi0P2IMYplOzzITdIcvGhidY',
  authDomain: 'hair-tryon-41cea.firebaseapp.com',
  projectId: 'hair-tryon-41cea',
  storageBucket: 'hair-tryon-41cea.firebasestorage.app',
  messagingSenderId: '1068244825260',
  appId: '1:1068244825260:web:cdc6bf57d7b28c7c19db09',
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