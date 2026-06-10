// scripts/seed.ts
// KULLANIM: npx tsx scripts/seed.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, addDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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

const now = Date.now();
const daysAgo = (n: number) => now - n * 24 * 60 * 60 * 1000;
const daysLater = (n: number) => now + n * 24 * 60 * 60 * 1000;
const dateStr = (ts: number) => new Date(ts).toISOString().split('T')[0];

// ─── VERİ SETLERİ (MİN 5 ADET) ──────────────────────────────────
const HAIRDRESSERS = [
  { email: 'aylin@salonelegance.com', password: 'test123456', user: { displayName: 'Aylin Çelik', phone: '05321234567', role: 'hairdresser', city: 'İstanbul', coinBalance: 150, isActive: true, isBlocked: false, createdAt: daysAgo(90), lastActiveAt: now }, profile: { salonName: 'Salon Elegance', description: 'Profesyonel saç boyama uzmanı.', city: 'İstanbul', district: 'Kadıköy', experience: 8, followersCount: 892, portfolioCount: 12, averageRating: 4.8, totalJobs: 124, completionRate: 96, isOnline: true } },
  { email: 'mehmet@stylestudio.com', password: 'test123456', user: { displayName: 'Mehmet Yıldız', phone: '05359876543', role: 'hairdresser', city: 'İstanbul', coinBalance: 80, isActive: true, isBlocked: false, createdAt: daysAgo(60), lastActiveAt: now }, profile: { salonName: 'Style Studio', description: 'Modern kesim teknikleri.', city: 'İstanbul', district: 'Beşiktaş', experience: 10, followersCount: 654, portfolioCount: 8, averageRating: 4.6, totalJobs: 89, completionRate: 92, isOnline: false } },
  { email: 'zehra@hairlab.com', password: 'test123456', user: { displayName: 'Zehra Kaya', phone: '05441112233', role: 'hairdresser', city: 'Ankara', coinBalance: 200, isActive: true, isBlocked: false, createdAt: daysAgo(120), lastActiveAt: now }, profile: { salonName: 'Hair Lab', description: 'Organik saç bakım merkezi.', city: 'Ankara', district: 'Çankaya', experience: 5, followersCount: 423, portfolioCount: 15, averageRating: 4.9, totalJobs: 201, completionRate: 98, isOnline: true } },
  { email: 'ece@glamhouse.com', password: 'test123456', user: { displayName: 'Ece Demir', phone: '05551112233', role: 'hairdresser', city: 'İzmir', coinBalance: 300, isActive: true, isBlocked: false, createdAt: daysAgo(50), lastActiveAt: now }, profile: { salonName: 'Glam House', description: 'Gelin saçı ve makyajı.', city: 'İzmir', district: 'Konak', experience: 7, followersCount: 1205, portfolioCount: 22, averageRating: 4.9, totalJobs: 310, completionRate: 99, isOnline: false } },
  { email: 'canan@modernsac.com', password: 'test123456', user: { displayName: 'Canan Öz', phone: '05332224455', role: 'hairdresser', city: 'Bursa', coinBalance: 50, isActive: true, isBlocked: false, createdAt: daysAgo(10), lastActiveAt: now }, profile: { salonName: 'Modern Saç', description: 'Yenilikçi renklendirme.', city: 'Bursa', district: 'Nilüfer', experience: 4, followersCount: 210, portfolioCount: 5, averageRating: 4.5, totalJobs: 45, completionRate: 90, isOnline: true } }
];

const CUSTOMERS = [
  { email: 'ayse@test.com', password: 'test123456', user: { displayName: 'Ayşe Kaya', role: 'customer', coinBalance: 50, isActive: true, isBlocked: false, createdAt: daysAgo(30), lastActiveAt: now }, profile: { totalJobs: 8, totalSpent: 4800, cancelRate: 0 } },
  { email: 'fatma@test.com', password: 'test123456', user: { displayName: 'Fatma Şahin', role: 'customer', coinBalance: 20, isActive: true, isBlocked: false, createdAt: daysAgo(45), lastActiveAt: now }, profile: { totalJobs: 5, totalSpent: 2750, cancelRate: 0 } },
  { email: 'zeynep@test.com', password: 'test123456', user: { displayName: 'Zeynep Mart', role: 'customer', coinBalance: 0, isActive: true, isBlocked: false, createdAt: daysAgo(15), lastActiveAt: now }, profile: { totalJobs: 2, totalSpent: 700, cancelRate: 0 } },
  { email: 'merve@test.com', password: 'test123456', user: { displayName: 'Merve Yıldız', role: 'customer', coinBalance: 100, isActive: true, isBlocked: false, createdAt: daysAgo(60), lastActiveAt: now }, profile: { totalJobs: 12, totalSpent: 8400, cancelRate: 0.08 } },
  { email: 'burcu@test.com', password: 'test123456', user: { displayName: 'Burcu Yılmaz', role: 'customer', coinBalance: 250, isActive: true, isBlocked: false, createdAt: daysAgo(5), lastActiveAt: now }, profile: { totalJobs: 1, totalSpent: 150, cancelRate: 0 } }
];

// ─── 0. VERİLERİ SIFIRLAMA ──────────────────────────────────────
async function clearAllData() {
  console.log('🗑️ Veritabanı temizleniyor (Koleksiyonlar sıfırlanıyor)...');
  const collectionsToClear = [
    'jobs', 'bids', 'appointments', 'portfolioItems', 'campaigns', 
    'follows', 'aiTries', 'favorites', 'trending', 'sponsoredSalons', 
    'reviews', 'availability'
  ];

  for (const col of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, col));
      for (const d of snap.docs) await deleteDoc(d.ref);
    } catch (e) { /* Ignore empty/missing */ }
  }

  // Chats ve altındaki Messages koleksiyonunu temizleme
  try {
    const chatSnap = await getDocs(collection(db, 'chats'));
    for (const chat of chatSnap.docs) {
      const msgSnap = await getDocs(collection(db, 'chats', chat.id, 'messages'));
      for (const msg of msgSnap.docs) await deleteDoc(msg.ref);
      await deleteDoc(chat.ref);
    }
  } catch (e) { /* Ignore */ }
  console.log('  ✅ Temizlik tamamlandı.');
}

// ─── 1. KULLANICILAR ────────────────────────────────────────────
async function seedUsers() {
  console.log('\n👤 Kullanıcılar yükleniyor...');
  const uids: Record<string, string> = {};

  const processUser = async (data: any, profileCollection: string) => {
    let uid = '';
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      uid = cred.user.uid;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
        uid = cred.user.uid;
      } else throw e;
    }
    uids[data.email] = uid;
    await setDoc(doc(db, 'users', uid), { uid, email: data.email, ...data.user });
    await setDoc(doc(db, profileCollection, uid), { uid, ...data.profile });
  };

  for (const h of HAIRDRESSERS) await processUser(h, 'hairdresserProfiles');
  for (const c of CUSTOMERS) await processUser(c, 'customerProfiles');
  console.log(`  ✅ ${Object.keys(uids).length} kullanıcı hazır.`);
  return uids;
}

// ─── 2. MÜSAİTLİK ───────────────────────────────────────────────
async function seedAvailability(hairdresserUids: string[]) {
  console.log('\n📅 Müsaitlik verileri yükleniyor...');
  const slots: Record<string, string[]> = {};
  for (let i = 0; i < 7; i++) {
    slots[dateStr(daysLater(i))] = ['09:00', '10:30', '14:00', '15:30'];
  }
  for (const uid of hairdresserUids) {
    await setDoc(doc(db, 'availability', uid), { hairdresserId: uid, availableSlots: slots, updatedAt: serverTimestamp() });
  }
}

// ─── 3. İŞ İLANLARI ─────────────────────────────────────────────
async function seedJobs(customerUids: Record<string, string>) {
  console.log('\n💼 İş ilanları yükleniyor...');
  const ayse = customerUids['ayse@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const zeynep = customerUids['zeynep@test.com'];
  const merve = customerUids['merve@test.com'];
  const burcu = customerUids['burcu@test.com'];

  const jobs = [
    { customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', customerCity: 'İstanbul', customerRating: 4.9, customerJobCount: 8, service: 'Balayage', colorPreference: 'Karamel', budget: 800, note: 'Doğal balayage', tags: ['Renk', 'Balayage'], status: 'open', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Renk' },
    { customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱', customerCity: 'İstanbul', customerRating: 5.0, customerJobCount: 5, service: 'Keratin Bakım', colorPreference: null, budget: 600, note: 'Kuru saç', tags: ['Bakım', 'Keratin'], status: 'open', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Bakım' },
    { customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', customerCity: 'Ankara', customerRating: 4.7, customerJobCount: 2, service: 'Wolf Cut', colorPreference: null, budget: 350, note: 'Katlı kesim', tags: ['Kesim'], status: 'open', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Kesim' },
    { customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', customerCity: 'İstanbul', customerRating: 4.5, customerJobCount: 12, service: 'Ombre', colorPreference: 'Sarı', budget: 700, note: 'Koyu kahveden sarıya', tags: ['Renk', 'Ombre'], status: 'in_progress', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Renk' },
    { customerId: burcu, customerName: 'Burcu Yılmaz', customerEmoji: '💃', customerCity: 'İzmir', customerRating: 5.0, customerJobCount: 1, service: 'Gelin Başı', colorPreference: null, budget: 2500, note: 'Düğün hazırlığı', tags: ['Özel'], status: 'completed', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Özel' },
    { customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', customerCity: 'İstanbul', customerRating: 4.9, customerJobCount: 8, service: 'Perma', colorPreference: null, budget: 500, note: 'Vazgeçildi', tags: ['Kimyasal'], status: 'cancelled', beforePhotoUrl: null, afterPhotoUrl: null, serviceCategory: 'Kimyasal' },
  ];

  const jobIds: string[] = [];
  for (const job of jobs) {
    const ref = await addDoc(collection(db, 'jobs'), { ...job, createdAt: serverTimestamp() });
    jobIds.push(ref.id);
  }
  return jobIds;
}

// ─── 4. TEKLİFLER VE CHAT ───────────────────────────────────────
async function seedBidsAndChats(hairdresserUids: Record<string, string>, jobIds: string[], customerUids: Record<string, string>) {
  console.log('\n💬 Teklifler ve Sohbetler yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const ece = hairdresserUids['ece@glamhouse.com'];
  const canan = hairdresserUids['canan@modernsac.com'];

  const ayse = customerUids['ayse@test.com'];
  const merve = customerUids['merve@test.com'];

  // Chat 1
  const chat1 = await addDoc(collection(db, 'chats'), {
    jobId: jobIds[3], customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️', jobService: 'Ombre', jobStatus: 'accepted', bidPrice: 700, customerBudget: 700, lastMessage: 'Harika, anlaştık.', lastMessageAt: serverTimestamp(), unreadCustomer: 0, unreadHairdresser: 0, createdAt: serverTimestamp()
  });
  await addDoc(collection(db, 'chats', chat1.id, 'messages'), { chatId: chat1.id, senderId: aylin, senderRole: 'hairdresser', text: 'Harika, anlaştık.', messageType: 'text', isRead: true, createdAt: serverTimestamp() });

  // Chat 2
  const chat2 = await addDoc(collection(db, 'chats'), {
    jobId: jobIds[4], customerId: customerUids['burcu@test.com'], customerName: 'Burcu Yılmaz', customerEmoji: '💃', hairdresserId: ece, hairdresserName: 'Glam House', hairdresserEmoji: '💅', jobService: 'Gelin Başı', jobStatus: 'completed', bidPrice: 2500, customerBudget: 2500, lastMessage: 'Teşekkürler.', lastMessageAt: serverTimestamp(), unreadCustomer: 0, unreadHairdresser: 0, createdAt: serverTimestamp()
  });

  const bids = [
    { jobId: jobIds[0], hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️', price: 750, note: 'Uzmanıyım', status: 'pending', chatId: null },
    { jobId: jobIds[0], hairdresserId: mehmet, hairdresserName: 'Style Studio', hairdresserEmoji: '👑', price: 700, note: 'Uygun fiyat', status: 'pending', chatId: null },
    { jobId: jobIds[1], hairdresserId: zehra, hairdresserName: 'Hair Lab', hairdresserEmoji: '🎨', price: 620, note: 'Organik ürünler', status: 'pending', chatId: null },
    { jobId: jobIds[2], hairdresserId: canan, hairdresserName: 'Modern Saç', hairdresserEmoji: '✨', price: 300, note: 'Modern kesim', status: 'pending', chatId: null },
    { jobId: jobIds[3], hairdresserId: aylin, hairdresserName: 'Salon Elegance', hairdresserEmoji: '✂️', price: 700, note: 'Kabul edildi', status: 'accepted', chatId: chat1.id },
    { jobId: jobIds[4], hairdresserId: ece, hairdresserName: 'Glam House', hairdresserEmoji: '💅', price: 2500, note: 'Tamamlandı', status: 'accepted', chatId: chat2.id },
  ];

  for (const bid of bids) await addDoc(collection(db, 'bids'), { ...bid, createdAt: serverTimestamp() });
}

// ─── 5. RANDEVULAR VE PORTFOLYO ─────────────────────────────────
async function seedAppointmentsAndPortfolio(hairdresserUids: Record<string, string>, customerUids: Record<string, string>) {
  console.log('\n🌟 Randevular ve Portfolyo yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const ece = hairdresserUids['ece@glamhouse.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const canan = hairdresserUids['canan@modernsac.com'];

  const ayse = customerUids['ayse@test.com'];
  const merve = customerUids['merve@test.com'];

  const appointments = [
    { customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance', service: 'Balayage', date: dateStr(daysLater(1)), time: '10:00', duration: 180, price: 750, status: 'confirmed', chatId: null, note: 'Doğal', beforePhotoUrl: null, afterPhotoUrl: null },
    { customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', hairdresserId: aylin, hairdresserName: 'Aylin Çelik', salonName: 'Salon Elegance', service: 'Ombre', date: dateStr(daysLater(2)), time: '14:00', duration: 150, price: 700, status: 'pending', chatId: null, note: null, beforePhotoUrl: null, afterPhotoUrl: null },
    { customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', hairdresserId: zehra, hairdresserName: 'Zehra Kaya', salonName: 'Hair Lab', service: 'Keratin', date: dateStr(daysAgo(5)), time: '14:00', duration: 120, price: 600, status: 'completed', chatId: null, note: null, beforePhotoUrl: null, afterPhotoUrl: null },
    { customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', hairdresserId: mehmet, hairdresserName: 'Mehmet Yıldız', salonName: 'Style Studio', service: 'Kesim', date: dateStr(daysAgo(10)), time: '10:00', duration: 60, price: 300, status: 'cancelled', chatId: null, note: null, beforePhotoUrl: null, afterPhotoUrl: null },
    { customerId: customerUids['burcu@test.com'], customerName: 'Burcu Yılmaz', customerEmoji: '💃', hairdresserId: ece, hairdresserName: 'Ece Demir', salonName: 'Glam House', service: 'Gelin Başı', date: dateStr(daysAgo(1)), time: '09:00', duration: 240, price: 2500, status: 'completed', chatId: null, note: null, beforePhotoUrl: null, afterPhotoUrl: null },
  ];
  for (const apt of appointments) await addDoc(collection(db, 'appointments'), { ...apt, createdAt: serverTimestamp() });

  const portfolioItems = [
    { hairdresserId: aylin, service: 'Balayage', category: 'Renk', colorInfo: 'Karamel', price: 750, duration: 180, note: 'Doğal geçiş', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '😐', afterEmoji: '✨', likes: 48, comments: 12, views: 234, saves: 18, isHidden: false, isAnonymous: false, customerName: 'Ayşe K.', fromJob: true, date: '24 Mayıs' },
    { hairdresserId: aylin, service: 'Ombre', category: 'Renk', colorInfo: 'Sarı', price: 700, duration: 150, note: '3 aşamalı', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '😑', afterEmoji: '🌟', likes: 156, comments: 38, views: 891, saves: 67, isHidden: false, isAnonymous: false, customerName: 'Merve Y.', fromJob: true, date: '10 Mayıs' },
    { hairdresserId: ece, service: 'Gelin Başı', category: 'Özel', colorInfo: null, price: 2500, duration: 180, note: 'Düğün saçı', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '😌', afterEmoji: '👰', likes: 300, comments: 45, views: 1500, saves: 110, isHidden: false, isAnonymous: false, customerName: 'Bahar D.', fromJob: true, date: '12 Haz' },
    { hairdresserId: zehra, service: 'Keratin Bakım', category: 'Bakım', colorInfo: null, price: 600, duration: 120, note: 'Organik', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '😐', afterEmoji: '🌿', likes: 90, comments: 10, views: 500, saves: 20, isHidden: false, isAnonymous: false, customerName: 'Selin T.', fromJob: false, date: '1 Haz' },
    { hairdresserId: mehmet, service: 'Wolf Cut', category: 'Kesim', colorInfo: null, price: 350, duration: 60, note: 'Modern kesim', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '😪', afterEmoji: '😎', likes: 67, comments: 15, views: 312, saves: 28, isHidden: false, isAnonymous: true, customerName: null, fromJob: false, date: '18 Mayıs' },
    { hairdresserId: canan, service: 'Pixie Cut', category: 'Kesim', colorInfo: null, price: 250, duration: 40, note: 'Kısa modern', beforePhotoUrl: null, afterPhotoUrl: null, beforeEmoji: '👩', afterEmoji: '✂️', likes: 110, comments: 22, views: 600, saves: 40, isHidden: false, isAnonymous: true, customerName: null, fromJob: false, date: '5 Haz' },
  ];
  for (const item of portfolioItems) await addDoc(collection(db, 'portfolioItems'), { ...item, createdAt: serverTimestamp() });
}

// ─── 6. ARAYÜZ, YORUMLAR VE KAMPANYALAR ─────────────────────────
async function seedUIAndReviews(hairdresserUids: Record<string, string>, customerUids: Record<string, string>) {
  console.log('\n🎯 Kampanyalar, Yorumlar, AI ve Keşfet yükleniyor...');
  const aylin = hairdresserUids['aylin@salonelegance.com'];
  const mehmet = hairdresserUids['mehmet@stylestudio.com'];
  const zehra = hairdresserUids['zehra@hairlab.com'];
  const ece = hairdresserUids['ece@glamhouse.com'];
  const canan = hairdresserUids['canan@modernsac.com'];

  const ayse = customerUids['ayse@test.com'];
  const merve = customerUids['merve@test.com'];
  const fatma = customerUids['fatma@test.com'];
  const burcu = customerUids['burcu@test.com'];
  const zeynep = customerUids['zeynep@test.com'];

  // Kampanyalar
  const campaigns = [
    { hairdresserId: aylin, salon: 'Salon Elegance', title: 'Yaz Sezonu', desc: 'Tüm boyamalar %20', type: 'discount', status: 'active', discount: 20, services: ['Balayage'], targetAudience: 'all', startDate: '1 Haz', endDate: '30 Haz', validUntil: '30 Haz', maxUsage: 50, usageCount: 23, viewCount: 412, earning: 8625, potentialEarning: 11500, emoji: '☀️', dailyUsage: [2, 1] },
    { hairdresserId: mehmet, salon: 'Style Studio', title: 'Wolf Cut Özel', desc: '%15 indirim!', type: 'discount', status: 'active', discount: 15, services: ['Wolf Cut'], targetAudience: 'all', startDate: '1 Haz', endDate: '30 Haz', validUntil: '30 Haz', maxUsage: 30, usageCount: 8, viewCount: 156, earning: 2380, potentialEarning: 8925, emoji: '🐺', dailyUsage: [1, 0] },
    { hairdresserId: zehra, salon: 'Hair Lab', title: 'Hoş Geldin', desc: 'İlk kesimde %25.', type: 'firsttime', status: 'active', discount: 25, services: ['Kesim'], targetAudience: 'new', startDate: '1 Haz', endDate: '31 Ağu', validUntil: '31 Ağu', maxUsage: 100, usageCount: 15, viewCount: 220, earning: 3000, potentialEarning: 20000, emoji: '✨', dailyUsage: [2, 3] },
    { hairdresserId: ece, salon: 'Glam House', title: 'Gelin Makyajı', desc: 'Paket alımında %10.', type: 'package', status: 'active', discount: 10, services: ['Gelin Başı'], targetAudience: 'all', startDate: '1 May', endDate: '30 Eyl', validUntil: '30 Eyl', maxUsage: 20, usageCount: 2, viewCount: 100, earning: 4500, potentialEarning: 45000, emoji: '👰', dailyUsage: [] },
    { hairdresserId: canan, salon: 'Modern Saç', title: 'Öğrenci', desc: 'Öğrencilere %10', type: 'discount', status: 'active', discount: 10, services: ['Kesim'], targetAudience: 'all', startDate: '1 Eyl', endDate: '30 Eyl', validUntil: '30 Eyl', maxUsage: 50, usageCount: 0, viewCount: 10, earning: 0, potentialEarning: 5000, emoji: '🎓', dailyUsage: [] },
  ];
  for (const c of campaigns) await addDoc(collection(db, 'campaigns'), { ...c, createdAt: serverTimestamp() });

  // Yorumlar
  const reviews = [
    { hairdresserId: aylin, customerId: merve, customerName: 'Merve Yıldız', customerEmoji: '👱‍♀️', rating: 5, comment: 'Harika oldu!', service: 'Balayage', createdAt: serverTimestamp() },
    { hairdresserId: aylin, customerId: ayse, customerName: 'Ayşe Kaya', customerEmoji: '👩', rating: 5, comment: 'Çok ilgililer.', service: 'Kesim', createdAt: serverTimestamp() },
    { hairdresserId: ece, customerId: burcu, customerName: 'Burcu Yılmaz', customerEmoji: '💃', rating: 5, comment: 'Makyajım efsane oldu.', service: 'Gelin Başı', createdAt: serverTimestamp() },
    { hairdresserId: zehra, customerId: fatma, customerName: 'Fatma Şahin', customerEmoji: '👩‍🦱', rating: 4, comment: 'Saçım yumuşacık oldu.', service: 'Keratin', createdAt: serverTimestamp() },
    { hairdresserId: mehmet, customerId: zeynep, customerName: 'Zeynep Mart', customerEmoji: '👩‍🦰', rating: 4, comment: 'İyi kesim.', service: 'Wolf Cut', createdAt: serverTimestamp() },
  ];
  for (const r of reviews) await addDoc(collection(db, 'reviews'), r);

  // Takip
  const follows = [
    { userId: ayse, hairdresserId: aylin, salonName: 'Salon Elegance', emoji: '💇‍♀️', isOnline: true },
    { userId: ayse, hairdresserId: mehmet, salonName: 'Style Studio', emoji: '👑', isOnline: false },
    { userId: fatma, hairdresserId: zehra, salonName: 'Hair Lab', emoji: '🎨', isOnline: true },
    { userId: merve, hairdresserId: ece, salonName: 'Glam House', emoji: '💅', isOnline: false },
    { userId: burcu, hairdresserId: canan, salonName: 'Modern Saç', emoji: '✨', isOnline: true },
  ];
  for (const f of follows) await setDoc(doc(db, 'follows', `${f.userId}_${f.hairdresserId}`), { ...f, createdAt: serverTimestamp() });

  // AI Denemeleri
  const aiTries = [
    { customerId: ayse, style: 'Dalgalı Bob', color: 'Karamel', emoji: '🌊' },
    { customerId: ayse, style: 'Uzun Düz', color: 'Platin', emoji: '⚡' },
    { customerId: merve, style: 'Pixie Cut', color: 'Doğal', emoji: '🌿' },
    { customerId: burcu, style: 'Kızıl Kıvırcık', color: 'Kızıl', emoji: '🔥' },
    { customerId: fatma, style: 'Asimetrik', color: 'Siyah', emoji: '✂️' },
  ];
  for (const t of aiTries) await addDoc(collection(db, 'aiTries'), { ...t, createdAt: serverTimestamp() });

  // Favoriler
  const favorites = [
    { customerId: ayse, style: 'Balayage', color: 'Altın', emoji: '🌟' },
    { customerId: ayse, style: 'Wolf Cut', color: 'Koyu', emoji: '🐺' },
    { customerId: merve, style: 'Butterfly', color: 'Kahve', emoji: '🦋' },
    { customerId: burcu, style: 'Bob Kesim', color: 'Siyah', emoji: '✂️' },
    { customerId: fatma, style: 'Permalı', color: 'Doğal', emoji: '🌀' },
  ];
  for (const f of favorites) await addDoc(collection(db, 'favorites'), { ...f, createdAt: serverTimestamp() });

  // Keşfet: Trending
  const trending = [
    { style: 'Wolf Cut', likes: '12.4K', emoji: '🐺', trend: '↑ Trend' },
    { style: 'Curtain Bangs', likes: '8.9K', emoji: '✂️', trend: '🔥 Ateş' },
    { style: 'Butterfly Cut', likes: '6.2K', emoji: '🦋', trend: '⭐ Yeni' },
    { style: 'Bixie Cut', likes: '4.8K', emoji: '💫', trend: '↑ Trend' },
    { style: 'French Bob', likes: '3.5K', emoji: '🥐', trend: '⭐ Yeni' },
  ];
  for (const t of trending) await addDoc(collection(db, 'trending'), t);

  // Keşfet: Sponsorlu
  const sponsored = [
    { name: 'Premium Salon', speciality: 'Boyama Uzmanı', rating: 4.9, price: '₺250+', emoji: '⭐', tag: 'Reklam' },
    { name: 'Luxury Hair', speciality: 'Keratin Uzmanı', rating: 4.7, price: '₺400+', emoji: '💎', tag: 'Önerilen' },
    { name: 'Elite Studio', speciality: 'Gelin Başı', rating: 5.0, price: '₺1500+', emoji: '👑', tag: 'Reklam' },
    { name: 'Master Colorist', speciality: 'Balayage', rating: 4.8, price: '₺600+', emoji: '🎨', tag: 'Önerilen' },
    { name: 'Glamour Point', speciality: 'Kaynak Uzmanı', rating: 4.6, price: '₺1000+', emoji: '✨', tag: 'Reklam' },
  ];
  for (const s of sponsored) await addDoc(collection(db, 'sponsoredSalons'), s);
}

// ─── ANA ÇALIŞTIRICI ───────────────────────────────────────────
async function main() {
  console.log('🚀 Seed başlıyor...\n');
  try {
    await clearAllData();
    const allUids = await seedUsers();
    
    const hairdresserUids: Record<string, string> = {};
    const customerUids: Record<string, string> = {};
    for (const h of HAIRDRESSERS) if (allUids[h.email]) hairdresserUids[h.email] = allUids[h.email];
    for (const c of CUSTOMERS) if (allUids[c.email]) customerUids[c.email] = allUids[c.email];

    const validHairdresserUids = Object.values(hairdresserUids).filter(Boolean) as string[];

    if (validHairdresserUids.length > 0) {
      await seedAvailability(validHairdresserUids);
    }

    const jobIds = await seedJobs(customerUids);
    await seedBidsAndChats(hairdresserUids, jobIds, customerUids);
    await seedAppointmentsAndPortfolio(hairdresserUids, customerUids);
    await seedUIAndReviews(hairdresserUids, customerUids);

    console.log('\n✅ Seed başarıyla tamamlandı!');
    console.log('Test hesapları (Şifre: test123456):');
    console.log(' - ayse@test.com (Müşteri)');
    console.log(' - aylin@salonelegance.com (Kuaför)');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed hatası:', error);
    process.exit(1);
  }
}

main();