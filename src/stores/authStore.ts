// Auth state yönetimi — Zustand store
// Kullanıcı oturum bilgilerini tutar
// app/index.tsx → onAuthStateChanged sonucu buraya yazılır
// Tüm ekranlar kullanıcı bilgisine buradan erişir

import { create } from 'zustand';
import { auth } from '../services/firebase';
import { getUser } from '../services/userService';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  // Oturum açma sonrası state'i günceller
  setAuth: (firebaseUser: any, user: User) => void;
  // Oturumu kapatır ve state'i sıfırlar
  signOut: () => Promise<void>;
  // Loading durumunu günceller
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Başlangıç state'i
  firebaseUser: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Firebase auth sonrası çağrılır
  // app/index.tsx'deki onAuthStateChanged içinde kullanılır
  setAuth: (firebaseUser, user) => {
    set({
      firebaseUser,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Oturumu kapat — Firebase auth + store sıfırla
  signOut: async () => {
    try {
      await auth.signOut();
      set({
        firebaseUser: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('signOut hatası:', error);
      throw error;
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));