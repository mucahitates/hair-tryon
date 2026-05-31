// Uygulamanın tüm TypeScript tipleri
// Servisler, store'lar ve ekranlar bu tipleri import eder

// ─── KULLANICI ROLLERİ ───────────────────────────────────────────
export type UserRole = 'customer' | 'hairdresser' | 'admin';

// ─── ANA KULLANICI (users/{uid}) ────────────────────────────────
export interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  city?: string;
  district?: string;
  coinBalance: number;
  pushToken?: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: number;
  lastActiveAt: number;
}

// ─── MÜŞTERİ PROFİLİ (customerProfiles/{uid}) ───────────────────
export interface HairDNA {
  type?: 'straight' | 'wavy' | 'curly' | 'afro';
  length?: 'short' | 'medium' | 'long' | 'very_long';
  thickness?: 'thin' | 'medium' | 'thick';
  condition?: 'healthy' | 'normal' | 'damaged' | 'very_damaged';
  scalp?: 'normal' | 'oily' | 'dry' | 'sensitive' | 'dandruff';
  allergies?: string[];
  chemicalHistory?: string[];
  preferredStyles?: string[];
  budgetRange?: { min: number; max: number };
}

export interface CustomerProfile {
  uid: string;
  hairDNA?: HairDNA;
  totalJobs: number;
  totalSpent: number;
  cancelRate: number;
}

// ─── KUAFÖR PROFİLİ (hairdresserProfiles/{uid}) ─────────────────
export interface WorkingHours {
  [day: string]: {
    isOpen: boolean;
    open: string;
    close: string;
  };
}

export interface HairdresserService {
  serviceId: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface HairdresserProfile {
  uid: string;
  salonName: string;
  description?: string;
  address?: string;
  city: string;
  phone?: string;
  experience?: number;
  specializations?: string[];
  workingHours?: WorkingHours;
  services?: HairdresserService[];
  followersCount: number;
  portfolioCount: number;
  averageRating: number;
  totalJobs: number;
  completionRate: number;
}

// ─── AUTH STORE TİPİ ─────────────────────────────────────────────
// authStore.ts bu tipi kullanır
export interface AuthState {
  firebaseUser: any | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}