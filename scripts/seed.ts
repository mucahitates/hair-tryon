// scripts/seed.ts
// Firestore komple test verisi — tüm ekranlar ve aksiyonlar için
// Çalıştır: npx tsx scripts/seed.ts

import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, addDoc, collection, getDocs, deleteDoc,
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// ─── CONFIG ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA9mnHuMLzvi0P2IMYplOzzITdIcvGhidY",
  authDomain: "hair-tryon-41cea.firebaseapp.com",
  projectId: "hair-tryon-41cea",
  storageBucket: "hair-tryon-41cea.firebasestorage.app",
  messagingSenderId: "1068244825260",
  appId: "1:1068244825260:web:cdc6bf57d7b28c7c19db09",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── YARDIMCI ──────────────────────────────────────────────
const now = Date.now();
const daysAgo = (n: number) => now - n * 24 * 60 * 60 * 1000;
const daysLater = (n: number) => now + n * 24 * 60 * 60 * 1000;
const dateStr = (ts: number) => new Date(ts).toISOString().split('T')[0];

// ─── VERİ: KUAFÖRLER ───────────────────────────────────────
const HAIRDRESSERS = [
  {
    email: 'aylin@salonelegance.com',
    password: 'test123456',
    user: {
      displayName: 'Aylin Çelik',
      phone: '05321234567',
      role: 'hairdresser',
      city: 'İstanbul',
      coinBalance: 150,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(90),
      lastActiveAt: now,
    },
    profile: {
      salonName: 'Salon Elegance',
      description: 'Profesyonel saç boyama ve kesim uzmanı. 8 yıllık deneyimle İstanbul Kadıköy\'de hizmet veriyoruz. Balayage, ombre ve keratin konularında uzmanız.',
      city: 'İstanbul',
      district: 'Kadıköy',
      address: 'Moda Caddesi No:42, Kadıköy',
      phone: '05321234567',
      experience: 8,
      specializations: ['Balayage', 'Ombre', 'Wolf Cut', 'Keratin'],
      followersCount: 892,
      portfolioCount: 12,
      averageRating: 4.8,
      totalJobs: 124,
      completionRate: 96,
      isOnline: true,
      workingHours: {
        'Pazartesi': { isOpen: true, open: '09:00', close: '19:00' },
        'Salı': { isOpen: true, open: '09:00', close: '19:00' },
        'Çarşamba': { isOpen: true, open: '09:00', close: '19:00' },
        'Perşembe': { isOpen: true, open: '09:00', close: '19:00' },
        'Cuma': { isOpen: true, open: '09:00', close: '20:00' },
        'Cumartesi': { isOpen: true, open: '10:00', close: '18:00' },
        'Pazar': { isOpen: false, open: '', close: '' },
      },
      services: [
        { serviceId: 's1', name: 'Klasik Kesim', category: 'Kesim', price: 200, duration: 45, isActive: true },
        { serviceId: 's2', name: 'Özel Tasarım Kesim', category: 'Kesim', price: 350, duration: 60, isActive: true },
        { serviceId: 's3', name: 'Tek Renk Boyama', category: 'Renk', price: 400, duration: 90, isActive: true },
        { serviceId: 's4', name: 'Balayage', category: 'Renk', price: 800, duration: 180, isActive: true },
        { serviceId: 's5', name: 'Ombre', category: 'Renk', price: 700, duration: 150, isActive: true },
        { serviceId: 's6', name: 'Keratin Bakım', category: 'Bakım', price: 600, duration: 120, isActive: true },
        { serviceId: 's7', name: 'Protein Bakım', category: 'Bakım', price: 300, duration: 60, isActive: true },
        { serviceId: 's8', name: 'Fön', category: 'Şekillendirme', price: 150, duration: 30, isActive: true },
      ],
      ratings: { communication: 4.9, quality: 4.8, punctuality: 4.7, valueForMoney: 4.6 },
    },
  },
  {
    email: 'mehmet@stylestudio.com',
    password: 'test123456',
    user: {
      displayName: 'Mehmet Yıldız',
      phone: '05359876543',
      role: 'hairdresser',
      city: 'İstanbul',
      coinBalance: 80,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(60),
      lastActiveAt: daysAgo(1),
    },
    profile: {
      salonName: 'Style Studio',
      description: '10 yıllık deneyimle modern kesim ve renk teknikleri. Trendleri yakından takip ediyoruz. Wolf cut ve saç boyama konularında uzmanız.',
      city: 'İstanbul',
      district: 'Beşiktaş',
      address: 'Sinanpaşa Mah. No:15, Beşiktaş',
      phone: '05359876543',
      experience: 10,
      specializations: ['Wolf Cut', 'Saç Boyama', 'Perma', 'Kesim'],
      followersCount: 654,
      portfolioCount: 8,
      averageRating: 4.6,
      totalJobs: 89,
      completionRate: 92,
      isOnline: false,
      workingHours: {
        'Pazartesi': { isOpen: true, open: '10:00', close: '20:00' },
        'Salı': { isOpen: true, open: '10:00', close: '20:00' },
        'Çarşamba': { isOpen: false, open: '', close: '' },
        'Perşembe': { isOpen: true, open: '10:00', close: '20:00' },
        'Cuma': { isOpen: true, open: '10:00', close: '21:00' },
        'Cumartesi': { isOpen: true, open: '11:00', close: '19:00' },
        'Pazar': { isOpen: false, open: '', close: '' },
      },
      services: [
        { serviceId: 's1', name: 'Erkek Kesim', category: 'Kesim', price: 150, duration: 30, isActive: true },
        { serviceId: 's2', name: 'Kadın Kesim', category: 'Kesim', price: 250, duration: 45, isActive: true },
        { serviceId: 's3', name: 'Wolf Cut', category: 'Kesim', price: 350, duration: 60, isActive: true },
        { serviceId: 's4', name: 'Saç Boyama', category: 'Renk', price: 400, duration: 90, isActive: true },
        { serviceId: 's5', name: 'Perma', category: 'Kimyasal', price: 500, duration: 120, isActive: true },
        { serviceId: 's6', name: 'Fön', category: 'Şekillendirme', price: 120, duration: 25, isActive: true },
      ],
      ratings: { communication: 4.7, quality: 4.6, punctuality: 4.5, valueForMoney: 4.8 },
    },
  },
  {
    email: 'zehra@hairlab.com',
    password: 'test123456',
    user: {
      displayName: 'Zehra Kaya',
      phone: '05441112233',
      role: 'hairdresser',
      city: 'Ankara',
      coinBalance: 200,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(120),
      lastActiveAt: daysAgo(2),
    },
    profile: {
      salonName: 'Hair Lab',
      description: 'Ankara\'nın en iyi saç bakım merkezi. Organik ürünlerle sağlıklı saçlar. Keratin ve protein bakım konularında uzmanız.',
      city: 'Ankara',
      district: 'Çankaya',
      address: 'Tunalı Hilmi Cad. No:88, Çankaya',
      phone: '05441112233',
      experience: 5,
      specializations: ['Keratin', 'Protein Bakım', 'Renk', 'Kesim'],
      followersCount: 423,
      portfolioCount: 15,
      averageRating: 4.9,
      totalJobs: 201,
      completionRate: 98,
      isOnline: true,
      workingHours: {
        'Pazartesi': { isOpen: true, open: '09:00', close: '18:00' },
        'Salı': { isOpen: true, open: '09:00', close: '18:00' },
        'Çarşamba': { isOpen: true, open: '09:00', close: '18:00' },
        'Perşembe': { isOpen: true, open: '09:00', close: '18:00' },
        'Cuma': { isOpen: true, open: '09:00', close: '18:00' },
        'Cumartesi': { isOpen: true, open: '10:00', close: '16:00' },
        'Pazar': { isOpen: false, open: '', close: '' },
      },
      services: [
        { serviceId: 's1', name: 'Keratin Bakım', category: 'Bakım', price: 650, duration: 120, isActive: true },
        { serviceId: 's2', name: 'Protein Bakım', category: 'Bakım', price: 350, duration: 60, isActive: true },
        { serviceId: 's3', name: 'Saç Boyama', category: 'Renk', price: 450, duration: 90, isActive: true },
        { serviceId: 's4', name: 'Balayage', category: 'Renk', price: 850, duration: 180, isActive: true },
        { serviceId: 's5', name: 'Kesim', category: 'Kesim', price: 200, duration: 45, isActive: true },
        { serviceId: 's6', name: 'Fön', category: 'Şekillendirme', price: 130, duration: 30, isActive: true },
      ],
      ratings: { communication: 4.9, quality: 4.9, punctuality: 4.8, valueForMoney: 4.7 },
    },
  },
];

// ─── VERİ: MÜŞTERİLER ─────────────────────────────────────
const CUSTOMERS = [
  {
    email: 'ayse@test.com',
    password: 'test123456',
    user: {
      displayName: 'Ayşe Kaya',
      phone: '05301234567',
      role: 'customer',
      city: 'İstanbul',
      coinBalance: 50,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(30),
      lastActiveAt: now,
    },
    profile: {
      totalJobs: 8,
      totalSpent: 4800,
      cancelRate: 0,
      hairDNA: {
        type: 'wavy',
        length: 'long',
        thickness: 'medium',
        condition: 'normal',
        scalp: 'normal',
        allergies: [],
        chemicalHistory: ['Ombre - 6 ay önce'],
        preferredStyles: ['Balayage', 'Ombre'],
        budgetRange: { min: 300, max: 1000 },
      },
    },
  },
  {
    email: 'fatma@test.com',
    password: 'test123456',
    user: {
      displayName: 'Fatma Şahin',
      phone: '05359871234',
      role: 'customer',
      city: 'İstanbul',
      coinBalance: 20,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(45),
      lastActiveAt: daysAgo(1),
    },
    profile: {
      totalJobs: 5,
      totalSpent: 2750,
      cancelRate: 0,
      hairDNA: {
        type: 'straight',
        length: 'medium',
        thickness: 'thin',
        condition: 'damaged',
        scalp: 'dry',
        allergies: [],
        chemicalHistory: ['Perma - 1 yıl önce'],
        preferredStyles: ['Keratin', 'Protein Bakım'],
        budgetRange: { min: 200, max: 700 },
      },
    },
  },
  {
    email: 'zeynep@test.com',
    password: 'test123456',
    user: {
      displayName: 'Zeynep Mart',
      phone: '05441239876',
      role: 'customer',
      city: 'Ankara',
      coinBalance: 0,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(15),
      lastActiveAt: daysAgo(2),
    },
    profile: {
      totalJobs: 2,
      totalSpent: 700,
      cancelRate: 0,
      hairDNA: {
        type: 'curly',
        length: 'short',
        thickness: 'thick',
        condition: 'healthy',
        scalp: 'oily',
        allergies: [],
        chemicalHistory: [],
        preferredStyles: ['Wolf Cut', 'Kesim'],
        budgetRange: { min: 150, max: 500 },
      },
    },
  },
  {
    email: 'merve@test.com',
    password: 'test123456',
    user: {
      displayName: 'Merve Yıldız',
      phone: '05321239988',
      role: 'customer',
      city: 'İstanbul',
      coinBalance: 100,
      isActive: true,
      isBlocked: false,
      createdAt: daysAgo(60),
      lastActiveAt: daysAgo(3),
    },
    profile: {
      totalJobs: 12,
      totalSpent: 8400,
      cancelRate: 0.08,
      hairDNA: {
        type: 'straight',
        length: 'very_long',
        thickness: 'thick',
        condition: 'healthy',
        scalp: 'normal',
        allergies: [],
        chemicalHistory: ['Balayage - 3 ay önce', 'Keratin - 6 ay önce'],
        preferredStyles: ['Ombre', 'Balayage', 'Saç Boyama'],
        budgetRange: { min: 500, max: 1500 },
      },
    },
  },
];

// ─── ESKİ VERİLERİ SİL ─────────────────────────────────────
async function clearCollections() {
  console.log('🗑️  Eski veriler siliniyor...');
  const cols = ['jobs', 'bids', 'chats', 'appointments', 'portfolioItems', 'reviews', 'availability', 'campaigns', 'follows'];
  for (const col of cols) {
    try {
      const snap = await getDocs(collection(db, col));
      for (const d of snap.docs) await deleteDoc(d.ref);
      console.log(`  ✅ ${col} temizlendi (${snap.size} döküman)`);
    } catch (e) {
      console.log(`  ⚠️  ${col} zaten boş`);
    }
  }
}

// ─── KULLANICILARI OLUŞTUR ─────────────────────────────────
async function seedUsers() {
  console.log('\n👤 Kullanıcılar yükleniyor...');
  const uids: Record<string, string> = {};

  for (const h of HAIRDRESSERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, h.email, h.password);
      const uid = cred.user.uid;
      uids[h.email] = uid;
      await setDoc(doc(db, 'users', uid), { uid, email: h.email, ...h.user });
      await setDoc(doc(db, 'hairdresserProfiles', uid), { uid, ...h.profile });
      console.log(`  ✅ Kuaför: ${h.user.displayName} — ${uid}`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️  Zaten var: ${h.email} — UID alınamadı, diğer veriler atlanacak`);
      } else {
        console.error(`  ❌ ${h.email}:`, e.message);
      }
    }
  }

  for (const c of CUSTOMERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, c.email, c.password);
      const uid = cred.user.uid;
      uids[c.email] = uid;
      await setDoc(doc(db, 'users', uid), { uid, email: c.email, ...c.user });
      await setDoc(doc(db, 'customerProfiles', uid), { uid, ...c.profile });
      console.log(`  ✅ Müşteri: ${c.user.displayName} — ${uid}`);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`  ⚠️  Zaten var: ${c.email}`);
      } else {
        console.error(`  ❌ ${c.email}:`, e.message);
      }
    }
  }

  return uids;
}

// ─── MÜSAİTLİK ────────────────────────────────────────────
async function seedAvailability(hairdresserUids: string[]) {
  console.log('\n📅 Müsaitlik verileri yükleniyor...');
  const slots: Record<string, string[]> = {};
  for (let i = 0; i < 21; i++) {
    const ts = daysLater(i);
    const date = dateStr(ts);
    const dayOfWeek = new Date(ts).getDay();
    if (dayOfWeek === 0) continue;
    if (dayOfWeek === 3) {
      slots[date] = ['10:00', '14:00', '16:00'];
    } else {
      slots[date] = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];
    }
  }
  for (const uid of hairdresserUids) {
    await setDoc(doc(db, 'availability', uid), {
      hairdresserId: uid,
      availableSlots: slots,
      updatedAt: now,
    });
    console.log(`  ✅ Müsaitlik: ${uid.slice(0, 8)}...`);
  }
}

// ─── İŞ İLANLARI ──────────────────────────────────────────
async function seedJobs(customerUids: Record<string, string>) {
  console.log('\n💼 İş ilanları yükleniyor...');
  const ayse = customerUids['ayse@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const zeynep = customerUids['zeynep@test.com'];
  const merve = customerUids['merve@test.com'];

  const jobs = [
    // ── OPEN ilanlar (teklif bekleyen) ──
    {
      customerId: ayse,
      customerName: 'Ayşe Kaya',
      customerEmoji: '👩',
      customerCity: 'İstanbul / Kadıköy',
      customerRating: 4.9,
      customerJobCount: 8,
      service: 'Balayage',
      serviceCategory: 'Renk',
      colorPreference: 'Karamel & Bal Sarısı',
      budget: 800,
      note: 'Doğal görünümlü, yüzüme uygun bir balayage istiyorum. Saçlarım daha önce boyandı, buna dikkat edilmeli.',
      tags: ['Balayage', 'Renk', 'Uzun Saç'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(0),
    },
    {
      customerId: fatma,
      customerName: 'Fatma Şahin',
      customerEmoji: '👩‍🦱',
      customerCity: 'İstanbul / Beşiktaş',
      customerRating: 5.0,
      customerJobCount: 5,
      service: 'Keratin Bakım',
      serviceCategory: 'Bakım',
      colorPreference: null,
      budget: 600,
      note: 'Saçlarım çok kuru ve kırılgan. Keratin sonrası düzgün ve parlak görünüm istiyorum.',
      tags: ['Keratin', 'Bakım', 'Orta Boy'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(1),
    },
    {
      customerId: zeynep,
      customerName: 'Zeynep Mart',
      customerEmoji: '👩‍🦰',
      customerCity: 'Ankara / Çankaya',
      customerRating: 4.7,
      customerJobCount: 2,
      service: 'Wolf Cut',
      serviceCategory: 'Kesim',
      colorPreference: 'Doğal Renk',
      budget: 400,
      note: 'Wolf cut yaptırmak istiyorum, layered ve textured bir kesim istiyorum.',
      tags: ['Kesim', 'Wolf Cut', 'Kısa'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(2),
    },
    {
      customerId: merve,
      customerName: 'Merve Yıldız',
      customerEmoji: '👱‍♀️',
      customerCity: 'İstanbul / Üsküdar',
      customerRating: 4.5,
      customerJobCount: 12,
      service: 'Ombre',
      serviceCategory: 'Renk',
      colorPreference: 'Koyu Kahve → Karamel',
      budget: 700,
      note: 'Koyu kahveden sarıya geçiş istiyorum. Daha önce hiç ombre yaptırmadım.',
      tags: ['Ombre', 'Renk', 'Uzun Saç'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(3),
    },
    {
      customerId: ayse,
      customerName: 'Ayşe Kaya',
      customerEmoji: '👩',
      customerCity: 'İstanbul / Kadıköy',
      customerRating: 4.9,
      customerJobCount: 8,
      service: 'Protein Bakım',
      serviceCategory: 'Bakım',
      colorPreference: null,
      budget: 350,
      note: 'Saçlarım yıpranmış, protein bakımı yaptırmak istiyorum.',
      tags: ['Bakım', 'Protein', 'Uzun Saç'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(4),
    },
    {
      customerId: merve,
      customerName: 'Merve Yıldız',
      customerEmoji: '👱‍♀️',
      customerCity: 'İstanbul / Üsküdar',
      customerRating: 4.5,
      customerJobCount: 12,
      service: 'Saç Boyama',
      serviceCategory: 'Renk',
      colorPreference: 'Ash Blonde',
      budget: 600,
      note: 'Ash blonde renk istiyorum. Saçlarım doğal kahverengi.',
      tags: ['Renk', 'Boyama', 'Uzun Saç'],
      status: 'open',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(5),
    },
    // ── IN_PROGRESS ilanlar (devam eden) ──
    {
      customerId: fatma,
      customerName: 'Fatma Şahin',
      customerEmoji: '👩‍🦱',
      customerCity: 'İstanbul / Beşiktaş',
      customerRating: 5.0,
      customerJobCount: 5,
      service: 'Saç Boyama',
      serviceCategory: 'Renk',
      colorPreference: 'Bakır Kırmızı',
      budget: 500,
      note: 'Bakır kırmızı renk istiyorum, tek renk boyama.',
      tags: ['Renk', 'Boyama', 'Orta Boy'],
      status: 'in_progress',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(7),
    },
    {
      customerId: zeynep,
      customerName: 'Zeynep Mart',
      customerEmoji: '👩‍🦰',
      customerCity: 'Ankara / Çankaya',
      customerRating: 4.7,
      customerJobCount: 2,
      service: 'Kesim',
      serviceCategory: 'Kesim',
      colorPreference: null,
      budget: 250,
      note: 'Klasik kadın kesimi istiyorum.',
      tags: ['Kesim'],
      status: 'in_progress',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(5),
    },
    // ── COMPLETED ilanlar (tamamlanan) ──
    {
      customerId: merve,
      customerName: 'Merve Yıldız',
      customerEmoji: '👱‍♀️',
      customerCity: 'İstanbul / Üsküdar',
      customerRating: 4.5,
      customerJobCount: 12,
      service: 'Balayage',
      serviceCategory: 'Renk',
      colorPreference: 'Altın Sarısı',
      budget: 900,
      note: 'Ash blonde balayage yaptırdım.',
      tags: ['Balayage', 'Renk', 'Uzun Saç'],
      status: 'completed',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(14),
    },
    {
      customerId: ayse,
      customerName: 'Ayşe Kaya',
      customerEmoji: '👩',
      customerCity: 'İstanbul / Kadıköy',
      customerRating: 4.9,
      customerJobCount: 8,
      service: 'Keratin Bakım',
      serviceCategory: 'Bakım',
      colorPreference: null,
      budget: 600,
      note: 'Keratin bakımı yaptırdım, çok memnun kaldım.',
      tags: ['Keratin', 'Bakım'],
      status: 'completed',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(21),
    },
    {
      customerId: fatma,
      customerName: 'Fatma Şahin',
      customerEmoji: '👩‍🦱',
      customerCity: 'İstanbul / Beşiktaş',
      customerRating: 5.0,
      customerJobCount: 5,
      service: 'Protein Bakım',
      serviceCategory: 'Bakım',
      colorPreference: null,
      budget: 300,
      note: 'Protein bakımı yaptırdım.',
      tags: ['Bakım', 'Protein'],
      status: 'completed',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(30),
    },
    // ── CANCELLED ilanlar (iptal edilen) ──
    {
      customerId: ayse,
      customerName: 'Ayşe Kaya',
      customerEmoji: '👩',
      customerCity: 'İstanbul / Kadıköy',
      customerRating: 4.9,
      customerJobCount: 8,
      service: 'Perma',
      serviceCategory: 'Kimyasal',
      colorPreference: null,
      budget: 500,
      note: 'Perma yaptırmayı düşünüyordum ama vazgeçtim.',
      tags: ['Kimyasal', 'Perma'],
      status: 'cancelled',
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      createdAt: daysAgo(10),
    },
  ];

  const jobIds: string[] = [];
  for (const job of jobs) {
    const ref = await addDoc(collection(db, 'jobs'), job);
    jobIds.push(ref.id);
    console.log(`  ✅ [${job.status.toUpperCase()}] ${job.service} — ${job.customerName}`);
  }
  return jobIds;
}

// ─── TEKLİFLER ────────────────────────────────────────────
async function seedBids(
  hairdresserUids: Record<string, string>,
  jobIds: string[]
) {
  console.log('\n💰 Teklifler yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];

  // jobIds[0]  = Ayşe Balayage (open)
  // jobIds[1]  = Fatma Keratin (open)
  // jobIds[2]  = Zeynep Wolf Cut (open)
  // jobIds[3]  = Merve Ombre (open)
  // jobIds[4]  = Ayşe Protein (open)
  // jobIds[5]  = Merve Saç Boyama (open)
  // jobIds[6]  = Fatma Saç Boyama (in_progress)
  // jobIds[7]  = Zeynep Kesim (in_progress)
  // jobIds[8]  = Merve Balayage (completed)
  // jobIds[9]  = Ayşe Keratin (completed)
  // jobIds[10] = Fatma Protein (completed)
  // jobIds[11] = Ayşe Perma (cancelled)

  const bids = [
    // ── jobIds[0] Ayşe Balayage — 3 teklif (PENDING) ──
    {
      jobId: jobIds[0],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 750,
      note: 'Balayage konusunda 8 yıllık deneyimim var. Doğal geçişli renk konusunda uzmanım. Portföyüme bakabilirsiniz.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(0),
    },
    {
      jobId: jobIds[0],
      hairdresserId: mehmet,
      hairdresserName: 'Style Studio',
      hairdresserEmoji: '👑',
      price: 700,
      note: 'Uygun fiyata kaliteli balayage hizmeti sunuyoruz. İstanbul Beşiktaş\'ta sizi bekliyoruz.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(0),
    },
    {
      jobId: jobIds[0],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 820,
      note: 'Premium organik ürünlerle doğal balayage yapıyoruz. Saçınıza zarar vermez.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(0),
    },

    // ── jobIds[1] Fatma Keratin — 2 teklif, 1 kabul ──
    {
      jobId: jobIds[1],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 580,
      note: 'Keratin bakımda uzmanız. Brezilya keratin ile 2-3 ay kalıcı sonuç.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(1),
    },
    {
      jobId: jobIds[1],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 620,
      note: 'Organik keratin bakımı, saçınıza zarar vermez.',
      status: 'rejected',
      chatId: null,
      createdAt: daysAgo(1),
    },

    // ── jobIds[2] Zeynep Wolf Cut — 2 teklif (PENDING) ──
    {
      jobId: jobIds[2],
      hairdresserId: mehmet,
      hairdresserName: 'Style Studio',
      hairdresserEmoji: '👑',
      price: 350,
      note: 'Wolf cut konusunda çok deneyimliyim. Textured ve layered kesimde uzmanım.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(1),
    },
    {
      jobId: jobIds[2],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 320,
      note: 'Wolf cut ve modern kesimler konusunda deneyimliyim.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(1),
    },

    // ── jobIds[3] Merve Ombre — 2 teklif (PENDING) ──
    {
      jobId: jobIds[3],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 680,
      note: 'Ombre konusunda uzmanız. Doğal geçişli renkler yapıyoruz.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(2),
    },
    {
      jobId: jobIds[3],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 720,
      note: 'Premium malzemelerle doğal geçişli ombre yapıyoruz.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(2),
    },

    // ── jobIds[4] Ayşe Protein — 1 teklif (PENDING) ──
    {
      jobId: jobIds[4],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 340,
      note: 'Protein bakımda uzmanız. Saçlarınız çok daha sağlıklı olacak.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(3),
    },

    // ── jobIds[5] Merve Saç Boyama — 1 teklif (PENDING) ──
    {
      jobId: jobIds[5],
      hairdresserId: mehmet,
      hairdresserName: 'Style Studio',
      hairdresserEmoji: '👑',
      price: 420,
      note: 'Ash blonde renk için doğru adresiniz. Harika sonuçlar.',
      status: 'pending',
      chatId: null,
      createdAt: daysAgo(4),
    },

    // ── jobIds[6] Fatma Saç Boyama (in_progress) — accepted bid ──
    {
      jobId: jobIds[6],
      hairdresserId: mehmet,
      hairdresserName: 'Style Studio',
      hairdresserEmoji: '👑',
      price: 400,
      note: 'Bakır kırmızı tek renk boyama yapıyoruz.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(6),
    },

    // ── jobIds[7] Zeynep Kesim (in_progress) — accepted bid ──
    {
      jobId: jobIds[7],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 220,
      note: 'Klasik kadın kesimi için uygun fiyat.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(4),
    },

    // ── jobIds[8] Merve Balayage (completed) — accepted bid ──
    {
      jobId: jobIds[8],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 850,
      note: 'Altın sarısı balayage için en iyi adres.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(13),
    },

    // ── jobIds[9] Ayşe Keratin (completed) ──
    {
      jobId: jobIds[9],
      hairdresserId: aylin,
      hairdresserName: 'Salon Elegance',
      hairdresserEmoji: '✂️',
      price: 580,
      note: 'Keratin bakım konusunda uzmanız.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(20),
    },

    // ── jobIds[10] Fatma Protein (completed) ──
    {
      jobId: jobIds[10],
      hairdresserId: zehra,
      hairdresserName: 'Hair Lab',
      hairdresserEmoji: '🎨',
      price: 290,
      note: 'Organik protein bakımı.',
      status: 'accepted',
      chatId: null,
      createdAt: daysAgo(29),
    },
  ];

  const bidIds: string[] = [];
  for (const bid of bids) {
    const ref = await addDoc(collection(db, 'bids'), bid);
    bidIds.push(ref.id);
    console.log(`  ✅ [${bid.status.toUpperCase()}] ${bid.hairdresserName} → ₺${bid.price}`);
  }
  return bidIds;
}

// ─── PORTFOLYO ────────────────────────────────────────────
async function seedPortfolio(hairdresserUids: Record<string, string>) {
  console.log('\n🖼️  Portfolyo verileri yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];

  const items = [
    // ── Aylin ──
    {
      hairdresserId: aylin, service: 'Balayage', category: 'Renk',
      colorInfo: 'Karamel & Bal Sarısı', price: 750, duration: 180,
      note: 'Doğal geçişli balayage. İşlem süresi 3 saat.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😐', afterEmoji: '✨',
      likes: 48, comments: 12, views: 234, saves: 18,
      isHidden: false, isAnonymous: false,
      customerName: 'Ayşe K.', fromJob: true,
      date: '24 Mayıs 2025', createdAt: daysAgo(10),
    },
    {
      hairdresserId: aylin, service: 'Ombre', category: 'Renk',
      colorInfo: 'Koyu Kahve → Karamel', price: 700, duration: 150,
      note: 'Doğal geçişli ombre, 3 aşamalı renk.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😑', afterEmoji: '🌟',
      likes: 156, comments: 38, views: 891, saves: 67,
      isHidden: false, isAnonymous: false,
      customerName: 'Merve Y.', fromJob: true,
      date: '10 Mayıs 2025', createdAt: daysAgo(25),
    },
    {
      hairdresserId: aylin, service: 'Keratin Bakım', category: 'Bakım',
      colorInfo: null, price: 600, duration: 120,
      note: 'Brezilya keratin, 2 ay kalıcı.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😔', afterEmoji: '💫',
      likes: 31, comments: 7, views: 189, saves: 12,
      isHidden: false, isAnonymous: false,
      customerName: 'Fatma Ş.', fromJob: true,
      date: '15 Mayıs 2025', createdAt: daysAgo(20),
    },
    {
      hairdresserId: aylin, service: 'Wolf Cut', category: 'Kesim',
      colorInfo: null, price: 350, duration: 60,
      note: 'Textured wolf cut, layered kesim.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😶', afterEmoji: '🔥',
      likes: 92, comments: 24, views: 567, saves: 41,
      isHidden: false, isAnonymous: true,
      customerName: null, fromJob: true,
      date: '20 Mayıs 2025', createdAt: daysAgo(15),
    },
    {
      hairdresserId: aylin, service: 'Protein Bakım', category: 'Bakım',
      colorInfo: null, price: 300, duration: 60,
      note: 'Yoğun protein tedavisi.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😓', afterEmoji: '💪',
      likes: 22, comments: 5, views: 143, saves: 9,
      isHidden: false, isAnonymous: false,
      customerName: 'Selin K.', fromJob: false,
      date: '5 Mayıs 2025', createdAt: daysAgo(30),
    },
    // ── Mehmet ──
    {
      hairdresserId: mehmet, service: 'Wolf Cut', category: 'Kesim',
      colorInfo: null, price: 350, duration: 60,
      note: 'Modern wolf cut, textured finish.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😪', afterEmoji: '😎',
      likes: 67, comments: 15, views: 312, saves: 28,
      isHidden: false, isAnonymous: true,
      customerName: null, fromJob: false,
      date: '18 Mayıs 2025', createdAt: daysAgo(17),
    },
    {
      hairdresserId: mehmet, service: 'Saç Boyama', category: 'Renk',
      colorInfo: 'Bakır Kırmızı', price: 400, duration: 90,
      note: 'Bakır kırmızı tek renk boyama.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😒', afterEmoji: '🎨',
      likes: 203, comments: 52, views: 1243, saves: 89,
      isHidden: false, isAnonymous: false,
      customerName: 'Selin A.', fromJob: true,
      date: '1 Mayıs 2025', createdAt: daysAgo(35),
    },
    {
      hairdresserId: mehmet, service: 'Perma', category: 'Kimyasal',
      colorInfo: null, price: 480, duration: 120,
      note: 'Doğal görünümlü perma.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😐', afterEmoji: '💁‍♀️',
      likes: 44, comments: 11, views: 267, saves: 19,
      isHidden: false, isAnonymous: false,
      customerName: 'Büşra T.', fromJob: true,
      date: '8 Mayıs 2025', createdAt: daysAgo(27),
    },
    // ── Zehra ──
    {
      hairdresserId: zehra, service: 'Keratin Bakım', category: 'Bakım',
      colorInfo: null, price: 650, duration: 120,
      note: 'Premium keratin tedavisi.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😓', afterEmoji: '✨',
      likes: 88, comments: 19, views: 445, saves: 33,
      isHidden: false, isAnonymous: false,
      customerName: 'Hande K.', fromJob: true,
      date: '5 Mayıs 2025', createdAt: daysAgo(30),
    },
    {
      hairdresserId: zehra, service: 'Balayage', category: 'Renk',
      colorInfo: 'Altın Sarısı', price: 850, duration: 180,
      note: 'Doğal altın sarısı geçiş.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😕', afterEmoji: '🌟',
      likes: 134, comments: 31, views: 678, saves: 55,
      isHidden: false, isAnonymous: false,
      customerName: 'Elif D.', fromJob: true,
      date: '12 Mayıs 2025', createdAt: daysAgo(23),
    },
    {
      hairdresserId: zehra, service: 'Protein Bakım', category: 'Bakım',
      colorInfo: null, price: 350, duration: 60,
      note: 'Organik protein bakımı.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😞', afterEmoji: '🌸',
      likes: 56, comments: 14, views: 321, saves: 24,
      isHidden: false, isAnonymous: false,
      customerName: 'Nihan Y.', fromJob: true,
      date: '20 Mayıs 2025', createdAt: daysAgo(15),
    },
    {
      hairdresserId: zehra, service: 'Kesim', category: 'Kesim',
      colorInfo: null, price: 200, duration: 45,
      note: 'Klasik kadın kesimi.',
      beforePhotoUrl: null, afterPhotoUrl: null,
      beforeEmoji: '😌', afterEmoji: '💇‍♀️',
      likes: 28, comments: 6, views: 187, saves: 11,
      isHidden: false, isAnonymous: false,
      customerName: 'Ceyda Ö.', fromJob: false,
      date: '25 Mayıs 2025', createdAt: daysAgo(10),
    },
  ];

  for (const item of items) {
    await addDoc(collection(db, 'portfolioItems'), item);
    console.log(`  ✅ ${item.service} — ${item.hairdresserId.slice(0, 8)}...`);
  }
}

// ─── CHAT VE MESAJLAR ─────────────────────────────────────
async function seedChatsAndMessages(
  hairdresserUids: Record<string, string>,
  customerUids: Record<string, string>,
  jobIds: string[]
) {
  console.log('\n💬 Chat ve mesajlar yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const ayse = customerUids['ayse@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const zeynep = customerUids['zeynep@test.com'];
  const merve = customerUids['merve@test.com'];

  const chatDefs = [
    // Chat 1: Ayşe + Aylin — Balayage teklifi görüşülüyor
    {
      jobId: jobIds[0],
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️',
      jobService: 'Balayage', jobStatus: 'bidding',
      bidPrice: 750, customerBudget: 800,
      appointmentDate: null,
      note: 'Doğal görünümlü balayage istiyorum.',
      beforeEmoji: '😐', afterEmoji: '✨',
      lastMessage: 'Balayage için fiyatımız 750₺ olacak. Referans fotoğraflarımı gönderdim.',
      lastMessageAt: daysAgo(0),
      unreadCustomer: 2, unreadHairdresser: 0,
      isOnline: true, createdAt: daysAgo(1),
      messages: [
        { role: 'customer', uid: ayse, text: 'Merhaba! Balayage ilanımı gördünüz mü?', daysAgo: 1 },
        { role: 'hairdresser', uid: aylin, text: 'Merhaba Ayşe Hanım! Evet inceledim, size yardımcı olabilirim.', daysAgo: 1 },
        { role: 'hairdresser', uid: aylin, text: 'Karamel & bal sarısı geçiş istiyorsunuz, doğru mu?', daysAgo: 1 },
        { role: 'customer', uid: ayse, text: 'Evet aynen öyle. Doğal görünümlü olmasını istiyorum.', daysAgo: 0 },
        { role: 'hairdresser', uid: aylin, text: 'Balayage için fiyatımız 750₺ olacak. Referans fotoğraflarımı gönderdim.', daysAgo: 0 },
        { role: 'system', uid: 'system', text: '💼 Teklif verildi: ₺750', daysAgo: 0 },
      ],
    },
    // Chat 2: Fatma + Aylin — Keratin — Teklif kabul edildi, randevu var
    {
      jobId: jobIds[1],
      customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱',
      hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️',
      jobService: 'Keratin Bakım', jobStatus: 'accepted',
      bidPrice: 580, customerBudget: 600,
      appointmentDate: dateStr(daysLater(3)),
      note: 'Saçlarım çok kuru.',
      beforeEmoji: '😔', afterEmoji: '💫',
      lastMessage: 'Görüşmek üzere! 💫',
      lastMessageAt: daysAgo(1),
      unreadCustomer: 0, unreadHairdresser: 0,
      isOnline: false, createdAt: daysAgo(5),
      messages: [
        { role: 'customer', uid: fatma, text: 'Merhaba, keratin için teklif almak istiyorum.', daysAgo: 5 },
        { role: 'hairdresser', uid: aylin, text: 'Merhaba! Saçlarınızın durumunu inceledim, Brezilya keratin öneriyorum.', daysAgo: 4 },
        { role: 'system', uid: 'system', text: '💼 Teklif verildi: ₺580', daysAgo: 4 },
        { role: 'customer', uid: fatma, text: 'Çok teşekkürler, teklifi kabul ediyorum!', daysAgo: 3 },
        { role: 'system', uid: 'system', text: '✅ Teklif kabul edildi', daysAgo: 3 },
        { role: 'hairdresser', uid: aylin, text: `Harika! Randevunuzu ${dateStr(daysLater(3))} tarihine aldım.`, daysAgo: 2 },
        { role: 'customer', uid: fatma, text: 'Mükemmel, sizi bekliyorum.', daysAgo: 2 },
        { role: 'hairdresser', uid: aylin, text: 'Görüşmek üzere! 💫', daysAgo: 1 },
      ],
    },
    // Chat 3: Merve + Mehmet — Ombre teklifi görüşülüyor
    {
      jobId: jobIds[3],
      customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
      hairdresserId: mehmet, hairdresserName: 'Style Studio', hairdresserEmoji: '👑',
      jobService: 'Ombre', jobStatus: 'bidding',
      bidPrice: 680, customerBudget: 700,
      appointmentDate: null,
      note: 'Koyu kahveden geçiş istiyorum.',
      beforeEmoji: '😑', afterEmoji: '🌟',
      lastMessage: 'Elbette, randevu günü detaylı konuşabiliriz.',
      lastMessageAt: daysAgo(1),
      unreadCustomer: 1, unreadHairdresser: 0,
      isOnline: false, createdAt: daysAgo(3),
      messages: [
        { role: 'customer', uid: merve, text: 'Merhaba! Ombre için teklif verdiniz, detay alabilir miyim?', daysAgo: 3 },
        { role: 'hairdresser', uid: mehmet, text: 'Merhaba Merve Hanım! Koyu kahveden karamel geçiş için 680₺ teklif verdim.', daysAgo: 2 },
        { role: 'system', uid: 'system', text: '💼 Teklif verildi: ₺680', daysAgo: 2 },
        { role: 'customer', uid: merve, text: 'Bu fiyata ne kadar sürer?', daysAgo: 2 },
        { role: 'hairdresser', uid: mehmet, text: 'Yaklaşık 2.5-3 saat sürecek. Saçınızın uzunluğuna göre değişebilir.', daysAgo: 1 },
        { role: 'customer', uid: merve, text: 'Peki bakım ürünü de dahil mi?', daysAgo: 1 },
        { role: 'hairdresser', uid: mehmet, text: 'Elbette, randevu günü detaylı konuşabiliriz.', daysAgo: 1 },
      ],
    },
    // Chat 4: Zeynep + Zehra — Kesim devam ediyor
    {
      jobId: jobIds[7],
      customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰',
      hairdresserId: zehra, hairdresserName: 'Hair Lab', hairdresserEmoji: '🎨',
      jobService: 'Kesim', jobStatus: 'accepted',
      bidPrice: 220, customerBudget: 250,
      appointmentDate: dateStr(daysLater(1)),
      note: 'Klasik kesim.',
      beforeEmoji: '😌', afterEmoji: '💇‍♀️',
      lastMessage: 'Yarın görüşürüz!',
      lastMessageAt: daysAgo(0),
      unreadCustomer: 0, unreadHairdresser: 1,
      isOnline: true, createdAt: daysAgo(4),
      messages: [
        { role: 'customer', uid: zeynep, text: 'Merhaba, kesim için teklif verdiniz.', daysAgo: 4 },
        { role: 'hairdresser', uid: zehra, text: 'Merhaba! Klasik kadın kesimi için 220₺ teklif verdim.', daysAgo: 3 },
        { role: 'system', uid: 'system', text: '💼 Teklif verildi: ₺220', daysAgo: 3 },
        { role: 'customer', uid: zeynep, text: 'Tamam, kabul ediyorum!', daysAgo: 2 },
        { role: 'system', uid: 'system', text: '✅ Teklif kabul edildi', daysAgo: 2 },
        { role: 'hairdresser', uid: zehra, text: `Randevunuz ${dateStr(daysLater(1))} saat 14:00 olarak onaylandı.`, daysAgo: 1 },
        { role: 'customer', uid: zeynep, text: 'Yarın görüşürüz!', daysAgo: 0 },
      ],
    },
    // Chat 5: Merve + Aylin — Tamamlanan balayage
    {
      jobId: jobIds[8],
      customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
      hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️',
      jobService: 'Balayage', jobStatus: 'completed',
      bidPrice: 850, customerBudget: 900,
      appointmentDate: dateStr(daysAgo(7)),
      note: 'Ash blonde istiyorum.',
      beforeEmoji: '😊', afterEmoji: '🌟',
      lastMessage: 'Teşekkürler, çok memnun kaldım! ⭐⭐⭐⭐⭐',
      lastMessageAt: daysAgo(7),
      unreadCustomer: 0, unreadHairdresser: 0,
      isOnline: false, createdAt: daysAgo(14),
      messages: [
        { role: 'customer', uid: merve, text: 'Merhaba, balayage randevum için geldim.', daysAgo: 14 },
        { role: 'hairdresser', uid: aylin, text: 'Hoş geldiniz! Başlayalım mı?', daysAgo: 14 },
        { role: 'system', uid: 'system', text: '✅ Teklif kabul edildi', daysAgo: 14 },
        { role: 'hairdresser', uid: aylin, text: 'İşleminiz tamamlandı, nasıl buldunuz?', daysAgo: 7 },
        { role: 'system', uid: 'system', text: '🎉 İş tamamlandı', daysAgo: 7 },
        { role: 'customer', uid: merve, text: 'Teşekkürler, çok memnun kaldım! ⭐⭐⭐⭐⭐', daysAgo: 7 },
      ],
    },
    // Chat 6: Ayşe + Aylin — Tamamlanan keratin
    {
      jobId: jobIds[9],
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️',
      jobService: 'Keratin Bakım', jobStatus: 'completed',
      bidPrice: 580, customerBudget: 600,
      appointmentDate: dateStr(daysAgo(21)),
      note: 'Keratin bakımı.',
      beforeEmoji: '😐', afterEmoji: '💫',
      lastMessage: 'Harika sonuç! Teşekkürler 🙏',
      lastMessageAt: daysAgo(21),
      unreadCustomer: 0, unreadHairdresser: 0,
      isOnline: false, createdAt: daysAgo(28),
      messages: [
        { role: 'customer', uid: ayse, text: 'Keratin için randevuma geldim.', daysAgo: 28 },
        { role: 'system', uid: 'system', text: '✅ Teklif kabul edildi', daysAgo: 28 },
        { role: 'hairdresser', uid: aylin, text: 'İşleminiz tamamlandı!', daysAgo: 21 },
        { role: 'system', uid: 'system', text: '🎉 İş tamamlandı', daysAgo: 21 },
        { role: 'customer', uid: ayse, text: 'Harika sonuç! Teşekkürler 🙏', daysAgo: 21 },
      ],
    },
  ];

  const chatIds: string[] = [];
  for (const chatDef of chatDefs) {
    const { messages, ...chatData } = chatDef;
    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    const chatId = chatRef.id;
    chatIds.push(chatId);
    console.log(`  ✅ Chat: ${chatDef.jobService} — ${chatDef.customerName} ↔ ${chatDef.hairdresserName}`);

    for (const msg of messages) {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: msg.uid,
        senderRole: msg.role,
        text: msg.text,
        messageType: msg.role === 'system' ? 'system' : 'text',
        imageUrl: null,
        isRead: true,
        createdAt: daysAgo(msg.daysAgo),
      });
    }
    console.log(`    ✅ ${messages.length} mesaj eklendi`);
  }
  return chatIds;
}

// ─── RANDEVULAR ───────────────────────────────────────────
async function seedAppointments(
  hairdresserUids: Record<string, string>,
  customerUids: Record<string, string>
) {
  console.log('\n📅 Randevular yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const ayse = customerUids['ayse@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const zeynep = customerUids['zeynep@test.com'];
  const merve = customerUids['merve@test.com'];

  const appointments = [
    // ── YAKLAŞAN RANDEVULAR ──
    {
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance',
      service: 'Balayage', date: dateStr(daysLater(1)), time: '10:00',
      duration: 180, price: 750, status: 'confirmed',
      chatId: null, note: 'Doğal geçişli istiyorum',
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(2),
    },
    {
      customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱',
      hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance',
      service: 'Keratin Bakım', date: dateStr(daysLater(1)), time: '13:30',
      duration: 120, price: 580, status: 'confirmed',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(3),
    },
    {
      customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
      hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance',
      service: 'Ombre', date: dateStr(daysLater(1)), time: '16:00',
      duration: 150, price: 700, status: 'pending',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(1),
    },
    {
      customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰',
      hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio',
      service: 'Wolf Cut', date: dateStr(daysLater(2)), time: '11:00',
      duration: 60, price: 350, status: 'confirmed',
      chatId: null, note: 'Layered cut istiyorum',
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(4),
    },
    {
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: zehra, hairdresserName: 'Zehra Kaya', salonName: 'Hair Lab',
      service: 'Protein Bakım', date: dateStr(daysLater(3)), time: '14:00',
      duration: 60, price: 350, status: 'pending',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(1),
    },
    {
      customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰',
      hairdresserId: zehra, hairdresserName: 'Zehra Kaya', salonName: 'Hair Lab',
      service: 'Kesim', date: dateStr(daysLater(1)), time: '14:00',
      duration: 45, price: 220, status: 'confirmed',
      chatId: null, note: 'Klasik kesim',
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(4),
    },
    {
      customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
      hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio',
      service: 'Saç Boyama', date: dateStr(daysLater(4)), time: '10:30',
      duration: 90, price: 400, status: 'pending',
      chatId: null, note: 'Ash blonde istiyorum',
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(2),
    },
    // ── TAMAMLANAN RANDEVULAR ──
    {
      customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️',
      hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance',
      service: 'Balayage', date: dateStr(daysAgo(7)), time: '10:00',
      duration: 180, price: 850, status: 'completed',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(10),
    },
    {
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance',
      service: 'Keratin Bakım', date: dateStr(daysAgo(21)), time: '11:00',
      duration: 120, price: 580, status: 'completed',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(25),
    },
    {
      customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱',
      hairdresserId: zehra, hairdresserName: 'Zehra Kaya', salonName: 'Hair Lab',
      service: 'Protein Bakım', date: dateStr(daysAgo(30)), time: '14:00',
      duration: 60, price: 290, status: 'completed',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(33),
    },
    {
      customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰',
      hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio',
      service: 'Wolf Cut', date: dateStr(daysAgo(14)), time: '15:00',
      duration: 60, price: 350, status: 'completed',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(17),
    },
    // ── İPTAL EDİLEN RANDEVULAR ──
    {
      customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱',
      hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio',
      service: 'Saç Boyama', date: dateStr(daysAgo(5)), time: '15:00',
      duration: 90, price: 400, status: 'cancelled',
      chatId: null, note: 'Randevu günü iptal ettim',
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(8),
    },
    {
      customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩',
      hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio',
      service: 'Fön', date: dateStr(daysAgo(3)), time: '12:00',
      duration: 30, price: 120, status: 'cancelled',
      chatId: null, note: null,
      beforePhotoUrl: null, afterPhotoUrl: null, createdAt: daysAgo(5),
    },
  ];

  for (const apt of appointments) {
    await addDoc(collection(db, 'appointments'), apt);
    console.log(`  ✅ [${apt.status.toUpperCase()}] ${apt.service} — ${apt.customerName} @ ${apt.date}`);
  }
}

// ─── YORUMLAR ─────────────────────────────────────────────
async function seedReviews(
  hairdresserUids: Record<string, string>,
  customerUids: Record<string, string>
) {
  console.log('\n⭐ Yorumlar yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const ayse = customerUids['ayse@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const zeynep = customerUids['zeynep@test.com'];
  const merve = customerUids['merve@test.com'];

  const reviews = [
    // Aylin yorumları
    { hairdresserId: aylin, customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', rating: 5, comment: 'Harika bir deneyimdi! Balayage tam istediğim gibi çıktı. Kesinlikle tavsiye ederim.', service: 'Balayage', createdAt: daysAgo(7) },
    { hairdresserId: aylin, customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', rating: 5, comment: 'Çok başarılı keratin uygulaması. Saçlarım çok güzel oldu, uzun süre kalıcı.', service: 'Keratin Bakım', createdAt: daysAgo(21) },
    { hairdresserId: aylin, customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱', rating: 4, comment: 'Çok profesyonel bir ekip. Salon çok temiz ve düzenli. Bir dahaki sefere de geleceğim.', service: 'Protein Bakım', createdAt: daysAgo(35) },
    { hairdresserId: aylin, customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', rating: 5, comment: 'Wolf cut harika çıktı! Tam istediğim gibi.', service: 'Wolf Cut', createdAt: daysAgo(45) },
    // Mehmet yorumları
    { hairdresserId: mehmet, customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', rating: 4, comment: 'Wolf cut çok iyi çıktı, memnunum. Salon biraz kalabalıktı ama hizmet iyiydi.', service: 'Wolf Cut', createdAt: daysAgo(14) },
    { hairdresserId: mehmet, customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', rating: 3, comment: 'Hizmet iyiydi ama bekleme süresi biraz uzun oldu.', service: 'Saç Boyama', createdAt: daysAgo(25) },
    { hairdresserId: mehmet, customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', rating: 5, comment: 'Saç boyama mükemmeldi! Renk tam istediğim gibi çıktı.', service: 'Saç Boyama', createdAt: daysAgo(40) },
    // Zehra yorumları
    { hairdresserId: zehra, customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱', rating: 5, comment: 'En iyi keratin uygulaması! Organik ürünler kullanıyorlar, saçlarım harika.', service: 'Keratin Bakım', createdAt: daysAgo(30) },
    { hairdresserId: zehra, customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', rating: 5, comment: 'Zehra Hanım çok ilgili ve profesyonel. Kesinlikle tavsiye ederim.', service: 'Protein Bakım', createdAt: daysAgo(20) },
    { hairdresserId: zehra, customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', rating: 4, comment: 'Güzel kesim, salon çok temiz.', service: 'Kesim', createdAt: daysAgo(10) },
  ];

  for (const review of reviews) {
    await addDoc(collection(db, 'reviews'), review);
    console.log(`  ✅ ${review.customerName} → ${review.hairdresserId.slice(0, 8)}... ${review.rating}⭐`);
  }
}

// ─── KAMPANYALAR ──────────────────────────────────────────
async function seedCampaigns(hairdresserUids: Record<string, string>) {
  console.log('\n🎯 Kampanyalar yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];

  const campaigns = [
    // Aylin kampanyaları
    {
      hairdresserId: aylin,
      title: 'Yaz Sezonu İndirimi',
      description: 'Tüm boyama hizmetlerinde %20 indirim! Bu fırsatı kaçırmayın.',
      type: 'discount', status: 'active', discount: 20,
      services: ['Balayage', 'Ombre', 'Saç Boyama'],
      targetAudience: 'all',
      startDate: '1 Haz 2025', endDate: '30 Haz 2025',
      maxUsage: 50, usageCount: 23, viewCount: 412,
      earning: 8625, potentialEarning: 11500,
      emoji: '☀️', dailyUsage: [2, 1, 3, 2, 4, 3, 2, 1, 2, 3, 0, 1, 2, 3],
      createdAt: daysAgo(28),
    },
    {
      hairdresserId: aylin,
      title: 'İlk Ziyaret Paketi',
      description: 'İlk kez gelen müşterilerimize özel kesim + bakım paketi.',
      type: 'firsttime', status: 'active', discount: 30,
      services: ['Kesim', 'Protein Bakım'],
      targetAudience: 'new',
      startDate: '1 May 2025', endDate: '31 Tem 2025',
      maxUsage: 100, usageCount: 41, viewCount: 689,
      earning: 12300, potentialEarning: 18000,
      emoji: '🎁', dailyUsage: [3, 2, 4, 3, 5, 4, 3, 2, 3, 4, 2, 3, 4, 5],
      createdAt: daysAgo(60),
    },
    {
      hairdresserId: aylin,
      title: 'Sadık Müşteri Ödülü',
      description: '5 ve üzeri ziyarette keratin bakımda %25 indirim.',
      type: 'loyalty', status: 'active', discount: 25,
      services: ['Keratin Bakım'],
      targetAudience: 'loyal',
      startDate: '15 May 2025', endDate: '15 Ağu 2025',
      maxUsage: 30, usageCount: 12, viewCount: 203,
      earning: 5400, potentialEarning: 9000,
      emoji: '👑', dailyUsage: [1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1],
      createdAt: daysAgo(45),
    },
    {
      hairdresserId: aylin,
      title: 'Kış Bakım Kampanyası',
      description: 'Kış aylarına özel saç bakım paketi.',
      type: 'package', status: 'draft', discount: 15,
      services: ['Keratin', 'Protein Bakım', 'Fön'],
      targetAudience: 'all',
      startDate: '1 Ara 2025', endDate: '28 Şub 2026',
      maxUsage: 40, usageCount: 0, viewCount: 0,
      earning: 0, potentialEarning: 12000,
      emoji: '❄️', dailyUsage: [],
      createdAt: daysAgo(5),
    },
    // Mehmet kampanyaları
    {
      hairdresserId: mehmet,
      title: 'Wolf Cut Özel',
      description: 'Wolf cut hizmetinde %15 indirim!',
      type: 'discount', status: 'active', discount: 15,
      services: ['Wolf Cut'],
      targetAudience: 'all',
      startDate: '1 Haz 2025', endDate: '30 Haz 2025',
      maxUsage: 30, usageCount: 8, viewCount: 156,
      earning: 2380, potentialEarning: 8925,
      emoji: '🐺', dailyUsage: [1, 0, 1, 1, 2, 0, 1, 2],
      createdAt: daysAgo(20),
    },
  ];

  for (const campaign of campaigns) {
    await addDoc(collection(db, 'campaigns'), campaign);
    console.log(`  ✅ [${campaign.status.toUpperCase()}] ${campaign.title}`);
  }
}

// ─── ANA FONKSİYON ────────────────────────────────────────
async function main() {
  console.log('🚀 Seed başlıyor...\n');

  try {
    // 1. Eski verileri temizle
    await clearCollections();

    // 2. Kullanıcıları oluştur
    const allUids = await seedUsers();

    const hairdresserUids: Record<string, string> = {};
    const customerUids: Record<string, string> = {};

    for (const h of HAIRDRESSERS) {
      if (allUids[h.email]) hairdresserUids[h.email] = allUids[h.email];
    }
    for (const c of CUSTOMERS) {
      if (allUids[c.email]) customerUids[c.email] = allUids[c.email];
    }

    // UID kontrolü
    const missingH = HAIRDRESSERS.filter(h => !hairdresserUids[h.email]);
    const missingC = CUSTOMERS.filter(c => !customerUids[c.email]);
    if (missingH.length > 0 || missingC.length > 0) {
      console.log('\n⚠️  Bazı kullanıcılar oluşturulamadı.');
      console.log('Firebase Authentication\'dan mevcut kullanıcıları silip tekrar deneyin.');
      console.log('Yine de devam ediliyor...');
    }

    // Geçerli UID'leri filtrele
    const validHairdresserUids = Object.values(hairdresserUids).filter(Boolean) as string[];

    // 3. Müsaitlik
    if (validHairdresserUids.length > 0) {
      await seedAvailability(validHairdresserUids);
    }

    // 4. İş ilanları
    const jobIds = await seedJobs(customerUids);

    // 5. Teklifler
    await seedBids(hairdresserUids, jobIds);

    // 6. Portfolyo
    await seedPortfolio(hairdresserUids);

    // 7. Chat ve mesajlar
    await seedChatsAndMessages(hairdresserUids, customerUids, jobIds);

    // 8. Randevular
    await seedAppointments(hairdresserUids, customerUids);

    // 9. Yorumlar
    await seedReviews(hairdresserUids, customerUids);

    // 10. Kampanyalar
    await seedCampaigns(hairdresserUids);

    console.log('\n✅ Seed tamamlandı!\n');
    console.log('─────────────────────────────────');
    console.log('📋 TEST HESAPLARI');
    console.log('─────────────────────────────────');
    console.log('KUAFÖRLER:');
    console.log('  aylin@salonelegance.com  / test123456');
    console.log('  mehmet@stylestudio.com   / test123456');
    console.log('  zehra@hairlab.com        / test123456');
    console.log('MÜŞTERİLER:');
    console.log('  ayse@test.com   / test123456  (8 iş, 50 coin)');
    console.log('  fatma@test.com  / test123456  (5 iş, 20 coin)');
    console.log('  zeynep@test.com / test123456  (2 iş, 0 coin)');
    console.log('  merve@test.com  / test123456  (12 iş, 100 coin)');
    console.log('─────────────────────────────────');
    console.log('📊 YÜKLENEN VERİLER:');
    console.log('  • 3 kuaför + 4 müşteri');
    console.log('  • 13 iş ilanı (open/in_progress/completed/cancelled)');
    console.log('  • 15 teklif (pending/accepted/rejected)');
    console.log('  • 12 portfolyo öğesi');
    console.log('  • 6 chat + mesajlar');
    console.log('  • 14 randevu (pending/confirmed/completed/cancelled)');
    console.log('  • 10 yorum');
    console.log('  • 5 kampanya (active/draft)');
    console.log('─────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed hatası:', error);
    process.exit(1);
  }
}

main();