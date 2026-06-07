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
  referralCode?: string;
  coinBalance: number;
  pushToken?: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: number;
  lastActiveAt: number;
  settings?: {
    profileVisible?: boolean;
    showActivity?: boolean;
    allowMessages?: boolean;
    notifications?: {
      newBid?: boolean;
      message?: boolean;
      appointment?: boolean;
      campaign?: boolean;
    };
  };
}

// ─── MÜŞTERİ PROFİLİ (customerProfiles/{uid}) ───────────────────
export interface HairDNA {
  type?: 'straight' | 'wavy' | 'curly' | 'afro' | string;
  length?: 'short' | 'medium' | 'long' | 'very_long' | string;
  thickness?: 'thin' | 'medium' | 'thick' | string;
  condition?: 'healthy' | 'normal' | 'damaged' | 'very_damaged' | string;
  scalp?: 'normal' | 'oily' | 'dry' | 'sensitive' | 'dandruff' | string;
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
  followingCount?: number;
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