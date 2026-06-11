// app/(hairdresser)/cari.tsx
import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

// DOSYA İŞLEMLERİ İÇİN EXPO IMPORTS
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

// FIREBASE IMPORTS
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { useAuthStore } from '../../src/stores/authStore';

const { width, height } = Dimensions.get('window');

// ─── TİPLER ────────────────────────────────────────────────
interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    note: string;
    createdAt?: any;
}

interface AppointmentIncome {
    id: string;
    customerName: string;
    customerEmoji: string;
    service: string;
    price: number;
    date: string;
    status: string;
}

const EXPENSE_CATEGORIES = [
    { key: 'Kira', icon: 'home-outline', color: '#F87171' },
    { key: 'Personel', icon: 'people-outline', color: '#FB923C' },
    { key: 'Malzeme', icon: 'flask-outline', color: '#FBBF24' },
    { key: 'Fatura', icon: 'flash-outline', color: '#60A5FA' },
    { key: 'Diğer', icon: 'ellipsis-horizontal-outline', color: '#A78BFA' },
];

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// YYYY-MM-DD formatını "12 Haz 2026" formatına çeviren yardımcı
const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = TR_MONTHS_SHORT[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
};

// ─── BÖLÜM BAŞLIĞI ─────────────────────────────────────────
function SectionTitle({ title, icon }: { title: string; icon: string }) {
    return (
        <View style={sectionStyles.row}>
            <Ionicons name={icon as any} size={18} color={COLORS.primary} />
            <Text style={sectionStyles.title}>{title}</Text>
        </View>
    );
}

const sectionStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
    title: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
});

// ─── GİDER EKLE MODALI ─────────────────────────────────────
function AddExpenseModal({ visible, onClose, onAdd }: {
    visible: boolean;
    onClose: () => void;
    onAdd: (expense: Omit<Expense, 'id'>) => void;
}) {
    const [category, setCategory] = useState('Kira');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
            setCategory('Kira'); setAmount(''); setNote('');
        }
    }, [visible]);

    const handleAdd = () => {
        if (!amount || parseInt(amount) <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        onAdd({
            category,
            amount: parseInt(amount),
            date: todayStr,
            note,
        });
        onClose();
    };

    const selectedCat = EXPENSE_CATEGORIES.find(c => c.key === category)!;

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={expenseModalStyles.overlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                    <Animated.View style={[expenseModalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
                        <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

                        <View style={expenseModalStyles.handle} />

                        <View style={expenseModalStyles.header}>
                            <Text style={expenseModalStyles.title}>Gider Ekle</Text>
                            <TouchableOpacity onPress={onClose} style={expenseModalStyles.closeBtn}>
                                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={expenseModalStyles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={expenseModalStyles.field}>
                                <Text style={expenseModalStyles.label}>Kategori *</Text>
                                <View style={expenseModalStyles.categoryGrid}>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.key}
                                            style={[
                                                expenseModalStyles.categoryCard,
                                                category === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '18' },
                                            ]}
                                            onPress={() => setCategory(cat.key)}
                                        >
                                            <View style={[expenseModalStyles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
                                                <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                                            </View>
                                            <Text style={[
                                                expenseModalStyles.categoryLabel,
                                                category === cat.key && { color: cat.color, fontWeight: '700' },
                                            ]}>
                                                {cat.key}
                                            </Text>
                                            {category === cat.key && (
                                                <Ionicons name="checkmark-circle" size={16} color={cat.color} style={{ position: 'absolute', top: 6, right: 6 }} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={expenseModalStyles.field}>
                                <Text style={expenseModalStyles.label}>Tutar (₺) *</Text>
                                <View style={expenseModalStyles.amountWrapper}>
                                    <Text style={[expenseModalStyles.amountSymbol, { color: selectedCat.color }]}>₺</Text>
                                    <TextInput
                                        style={[expenseModalStyles.amountInput, { color: selectedCat.color }]}
                                        value={amount}
                                        onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
                                        placeholder="0"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={expenseModalStyles.field}>
                                <Text style={expenseModalStyles.label}>Not (opsiyonel)</Text>
                                <TextInput
                                    style={[expenseModalStyles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Gider hakkında not..."
                                    placeholderTextColor={COLORS.textMuted}
                                    multiline
                                    maxLength={100}
                                />
                            </View>
                        </ScrollView>

                        <View style={expenseModalStyles.footer}>
                            <TouchableOpacity onPress={handleAdd}>
                                <LinearGradient
                                    colors={['#F87171', '#EF4444']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={expenseModalStyles.addBtn}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
                                    <Text style={expenseModalStyles.addBtnText}>Gider Ekle</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const expenseModalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.88, overflow: 'hidden' },
    handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: 20 },
    field: { gap: SPACING.sm },
    label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginLeft: 2 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    categoryCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 4) / 3, paddingVertical: SPACING.md, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: SPACING.xs, position: 'relative' },
    categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    categoryLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
    amountWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: '#F87171', borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md },
    amountSymbol: { fontSize: 32, fontWeight: 'bold', marginRight: SPACING.sm },
    amountInput: { flex: 1, fontSize: 32, fontWeight: 'bold', paddingVertical: SPACING.md },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.regular },
    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
    addBtn: { borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
    addBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function CariScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [appointments, setAppointments] = useState<AppointmentIncome[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [activePeriod, setActivePeriod] = useState<'month' | 'year'>('month');
    const [showAddExpense, setShowAddExpense] = useState(false);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(20)).current;

    // ─── FIRESTORE VERİ DİNLEME ───
    useEffect(() => {
        if (!user?.uid) return;

        const unsubs: (() => void)[] = [];

        // 1. Gelirler (Onaylanmış veya Tamamlanmış Randevular)
        const aptQ = query(collection(db, 'appointments'), where('hairdresserId', '==', user.uid));
        unsubs.push(onSnapshot(aptQ, (snap) => {
            const data = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(a => a.status === 'confirmed' || a.status === 'completed') // Sadece geçerli işler gelire yansır
                .map(a => ({
                    id: a.id,
                    customerName: a.customerName || 'Müşteri',
                    customerEmoji: a.customerEmoji || '👤',
                    service: a.service || 'Hizmet',
                    price: Number(a.price) || 0,
                    date: a.date, // "YYYY-MM-DD"
                    status: a.status
                }));
            setAppointments(data);
        }));

        // 2. Giderler
        const expQ = query(collection(db, 'expenses'), where('hairdresserId', '==', user.uid));
        unsubs.push(onSnapshot(expQ, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(data);
            setLoading(false);
        }));

        Animated.parallel([
            Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(contentAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        ]).start();

        return () => unsubs.forEach(u => u());
    }, [user?.uid]);

    // ─── YENİ GİDER EKLEME ───
    const handleAddExpenseToDb = async (expenseData: Omit<Expense, 'id'>) => {
        if (!user?.uid) return;
        try {
            await addDoc(collection(db, 'expenses'), {
                ...expenseData,
                hairdresserId: user.uid,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            Alert.alert('Hata', 'Gider eklenemedi.');
        }
    };

    // ─── DİNAMİK HESAPLAMALAR ───
    const today = new Date();
    const currentMonthNum = today.getMonth() + 1;
    const currentYearStr = today.getFullYear().toString();
    const currentMonthStr = currentMonthNum < 10 ? `0${currentMonthNum}` : `${currentMonthNum}`;
    const currentMonthPrefix = `${currentYearStr}-${currentMonthStr}`; // "2026-06"

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(today.getMonth() - 1);
    const lastMonthNum = lastMonthDate.getMonth() + 1;
    const lastYearStr = lastMonthDate.getFullYear().toString();
    const lastMonthStr = lastMonthNum < 10 ? `0${lastMonthNum}` : `${lastMonthNum}`;
    const lastMonthPrefix = `${lastYearStr}-${lastMonthStr}`;

    const filteredApts = appointments.filter(a => {
        if (!a.date) return false;
        if (activePeriod === 'month') return a.date.startsWith(currentMonthPrefix);
        return a.date.startsWith(currentYearStr);
    });

    const filteredExps = expenses.filter(e => {
        if (!e.date) return false;
        if (activePeriod === 'month') return e.date.startsWith(currentMonthPrefix);
        return e.date.startsWith(currentYearStr);
    });

    const totalIncome = filteredApts.reduce((acc, t) => acc + t.price, 0);
    const totalExpense = filteredExps.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const thisMonthIncome = appointments.filter(a => a.date?.startsWith(currentMonthPrefix)).reduce((acc, a) => acc + a.price, 0);
    const lastMonthIncome = appointments.filter(a => a.date?.startsWith(lastMonthPrefix)).reduce((acc, a) => acc + a.price, 0);

    let growthRate = 0;
    if (lastMonthIncome > 0) {
        growthRate = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    } else if (thisMonthIncome > 0) {
        growthRate = 100;
    }
    const isGrowthPositive = growthRate >= 0;

    const avgPerJob = filteredApts.length > 0 ? Math.round(totalIncome / filteredApts.length) : 0;
    const kdvAmount = Math.round(totalIncome * 0.18);
    const taxEstimate = Math.round(netProfit > 0 ? netProfit * 0.15 : 0);

    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
        category: cat.key,
        amount: filteredExps.filter(e => e.category === cat.key).reduce((acc, e) => acc + e.amount, 0),
        color: cat.color,
        icon: cat.icon,
    })).filter(c => c.amount > 0);

    const totalExpenseByCat = expenseByCategory.reduce((acc, e) => acc + e.amount, 0);

    const serviceMap: Record<string, { count: number, earning: number }> = {};
    filteredApts.forEach(a => {
        if (!serviceMap[a.service]) serviceMap[a.service] = { count: 0, earning: 0 };
        serviceMap[a.service].count += 1;
        serviceMap[a.service].earning += a.price;
    });

    const topServices = Object.keys(serviceMap).map((key, i) => {
        const colors = ['#A78BFA', '#34D399', '#60A5FA', '#F472B6', '#FFB844'];
        return {
            service: key,
            count: serviceMap[key].count,
            earning: serviceMap[key].earning,
            color: colors[i % colors.length]
        };
    }).sort((a, b) => b.earning - a.earning).slice(0, 5);
    const maxService = topServices.length > 0 ? Math.max(...topServices.map(s => s.earning)) : 1;

    const customerMap: Record<string, { emoji: string, visits: number, spent: number }> = {};
    filteredApts.forEach(a => {
        if (!customerMap[a.customerName]) customerMap[a.customerName] = { emoji: a.customerEmoji, visits: 0, spent: 0 };
        customerMap[a.customerName].visits += 1;
        customerMap[a.customerName].spent += a.price;
    });

    const topCustomers = Object.keys(customerMap).map(key => ({
        name: key,
        emoji: customerMap[key].emoji,
        visits: customerMap[key].visits,
        totalSpent: customerMap[key].spent
    })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStr = TR_MONTHS_SHORT[d.getMonth()];
        const yNum = d.getFullYear().toString();
        const mNum = d.getMonth() + 1;
        const pfx = `${yNum}-${mNum < 10 ? '0' + mNum : mNum}`;

        const inc = appointments.filter(a => a.date?.startsWith(pfx)).reduce((acc, a) => acc + a.price, 0);
        const exp = expenses.filter(e => e.date?.startsWith(pfx)).reduce((acc, e) => acc + e.amount, 0);
        monthlyData.push({ month: mStr, income: inc, expense: exp });
    }
    const maxMonthly = Math.max(1, ...monthlyData.map(m => Math.max(m.income, m.expense)));

    const allTransactions = [
        ...filteredApts.map(t => ({ id: t.id, date: t.date, customer: t.customerName, service: t.service, amount: t.price, type: 'income' as const, category: 'Hizmet' })),
        ...filteredExps.map(e => ({ id: e.id, date: e.date, customer: e.category, service: e.note || e.category, amount: -e.amount, type: 'expense' as const, category: e.category })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayTransactions = allTransactions.filter(t => {
        if (activeFilter === 'income') return t.type === 'income';
        if (activeFilter === 'expense') return t.type === 'expense';
        return true;
    });

    // ─── EXPORT FONKSİYONLARI ───
    const exportToExcel = async () => {
        try {
            const headerString = 'Tarih,Islem/Musteri,Kategori,Tip,Tutar (TL)\n';
            const rowString = displayTransactions.map(t =>
                `${t.date},${t.customer} - ${t.service},${t.category},${t.type === 'income' ? 'Gelir' : 'Gider'},${Math.abs(t.amount)}`
            ).join('\n');
            const csvString = headerString + rowString;

            const fileUri = FileSystem.documentDirectory + 'Cari_Dokum.csv';

            await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: 'utf8' });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Bilgi', 'Cihazınızda paylaşım özelliği desteklenmiyor.');
            }
        } catch (error) {
            Alert.alert('Hata', 'Excel dosyası oluşturulurken hata oluştu.');
            console.error(error);
        }
    };
    const exportToPDF = async () => {
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <style>
                        body { 
                            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                            padding: 40px; 
                            color: #333; 
                            background-color: #f4f4f9; 
                        }
                        .container { 
                            background: #fff; 
                            padding: 40px; 
                            border-radius: 16px; 
                            box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
                        }
                        .header { 
                            text-align: center; 
                            border-bottom: 2px solid #7C3AED; 
                            padding-bottom: 20px; 
                            margin-bottom: 30px; 
                        }
                        .header h1 { 
                            color: #7C3AED; 
                            margin: 0; 
                            font-size: 32px; 
                            text-transform: uppercase; 
                            letter-spacing: 1px; 
                        }
                        .header p { 
                            color: #666; 
                            margin-top: 8px; 
                            font-size: 15px; 
                        }
                        .summary-grid { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 40px; 
                            gap: 20px; 
                        }
                        .summary-card { 
                            flex: 1; 
                            background: #fafafa; 
                            padding: 20px; 
                            border-radius: 12px; 
                            text-align: center; 
                            border: 1px solid #eaeaea; 
                        }
                        .summary-card h3 { 
                            margin: 0 0 10px 0; 
                            font-size: 13px; 
                            color: #888; 
                            font-weight: 600; 
                            text-transform: uppercase; 
                            letter-spacing: 0.5px;
                        }
                        .val { font-size: 28px; font-weight: 800; }
                        .val.income { color: #059669; }
                        .val.expense { color: #DC2626; }
                        .val.net { color: #7C3AED; }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 10px; 
                            font-size: 14px; 
                        }
                        th { 
                            background-color: #7C3AED; 
                            color: white; 
                            padding: 14px 12px; 
                            text-align: left; 
                            font-weight: 600; 
                            font-size: 13px;
                            text-transform: uppercase;
                        }
                        th:first-child { border-top-left-radius: 8px; }
                        th:last-child { border-top-right-radius: 8px; text-align: right; }
                        td { 
                            padding: 16px 12px; 
                            border-bottom: 1px solid #f0f0f0; 
                            color: #444; 
                            vertical-align: middle;
                        }
                        tr:last-child td { border-bottom: none; }
                        .item-title { font-weight: 700; color: #222; font-size: 15px; }
                        .item-sub { font-size: 12px; color: #888; margin-top: 4px; }
                        .badge { 
                            padding: 6px 10px; 
                            border-radius: 6px; 
                            font-size: 11px; 
                            font-weight: bold; 
                            letter-spacing: 0.5px;
                        }
                        .badge.income { background-color: #d1fae5; color: #059669; }
                        .badge.expense { background-color: #fee2e2; color: #DC2626; }
                        .footer { 
                            margin-top: 50px; 
                            text-align: center; 
                            font-size: 12px; 
                            color: #aaa; 
                            border-top: 1px solid #eaeaea; 
                            padding-top: 20px; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Cari Döküm Raporu</h1>
                            <p>Dönem: <strong>${activePeriod === 'month' ? 'Bu Ay' : 'Bu Yıl'}</strong> &nbsp;|&nbsp; Çıktı Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
                        </div>
                        
                        <div class="summary-grid">
                            <div class="summary-card">
                                <h3>Toplam Gelir</h3>
                                <div class="val income">₺${totalIncome.toLocaleString()}</div>
                            </div>
                            <div class="summary-card">
                                <h3>Toplam Gider</h3>
                                <div class="val expense">₺${totalExpense.toLocaleString()}</div>
                            </div>
                            <div class="summary-card">
                                <h3>Net Kazanç</h3>
                                <div class="val net">₺${netProfit.toLocaleString()}</div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>İşlem / Açıklama</th>
                                    <th>Kategori</th>
                                    <th>Durum</th>
                                    <th>Tutar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${displayTransactions.map(t => `
                                    <tr>
                                        <td style="white-space: nowrap; color: #666;">${formatDisplayDate(t.date)}</td>
                                        <td>
                                            <div class="item-title">${t.customer}</div>
                                            <div class="item-sub">${t.service}</div>
                                        </td>
                                        <td><span style="color: #666; font-weight: 500;">${t.category}</span></td>
                                        <td>
                                            <span class="badge ${t.type === 'income' ? 'income' : 'expense'}">
                                                ${t.type === 'income' ? 'GELİR' : 'GİDER'}
                                            </span>
                                        </td>
                                        <td style="text-align: right; font-weight: 800; font-size: 15px;" class="${t.type === 'income' ? 'val income' : 'val expense'}">
                                            ${t.type === 'income' ? '+' : '-'}₺${Math.abs(t.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="footer">
                            Bu rapor, kuaför yönetim sistemi tarafından otomatik olarak oluşturulmuştur.<br>
                            © ${new Date().getFullYear()} - Tüm Hakları Saklıdır.
                        </div>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Bilgi', 'Cihazınızda paylaşım özelliği desteklenmiyor.');
            }
        } catch (error) {
            Alert.alert('Hata', 'PDF oluşturulurken hata oluştu.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient colors={['#1A0533', '#0F0A1E', '#0D1B3E']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
                start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* ── HEADER ── */}
            <Animated.View style={[styles.header, { opacity: headerAnim }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(hairdresser)' as any);
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Cari Döküm</Text>
                    <Text style={styles.subtitle}>Gelir & Gider Analizi</Text>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={{ opacity: contentOpacity }}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View style={{ transform: [{ translateY: contentAnim }] }}>

                    {/* ── DÖNEM SEÇİCİ ── */}
                    <View style={styles.periodSelector}>
                        {[
                            { key: 'month', label: 'Bu Ay' },
                            { key: 'year', label: 'Bu Yıl' },
                        ].map((p) => (
                            <TouchableOpacity
                                key={p.key}
                                style={[styles.periodBtn, activePeriod === p.key && styles.periodBtnActive]}
                                onPress={() => setActivePeriod(p.key as any)}
                            >
                                <Text style={[styles.periodBtnText, activePeriod === p.key && styles.periodBtnTextActive]}>
                                    {p.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── ANA ÖZET KARTLARI ── */}
                    <View style={styles.mainCards}>
                        {/* Net Kazanç */}
                        <LinearGradient
                            colors={[COLORS.primaryDark + '88', COLORS.primary + '55']}
                            style={styles.netCard}
                        >
                            <Text style={styles.netCardLabel}>Net Kazanç ({activePeriod === 'month' ? 'Bu Ay' : 'Bu Yıl'})</Text>
                            <Text style={styles.netCardValue}>
                                ₺{netProfit.toLocaleString()}
                            </Text>
                            {/* Büyüme sadece Bu Ay'da göster */}
                            {activePeriod === 'month' && (
                                <View style={styles.netCardGrowth}>
                                    <Ionicons
                                        name={isGrowthPositive ? 'trending-up' : 'trending-down'}
                                        size={14}
                                        color={isGrowthPositive ? '#34D399' : '#F87171'}
                                    />
                                    <Text style={[styles.netCardGrowthText, { color: isGrowthPositive ? '#34D399' : '#F87171' }]}>
                                        %{Math.abs(growthRate).toFixed(1)} geçen aya göre
                                    </Text>
                                </View>
                            )}
                        </LinearGradient>

                        {/* Gelir / Gider */}
                        <View style={styles.incomeExpenseRow}>
                            <View style={styles.incomeCard}>
                                <LinearGradient colors={['#34D399' + '22', '#34D399' + '11']} style={styles.incomeCardGradient}>
                                    <View style={styles.incomeCardIcon}>
                                        <Ionicons name="arrow-down-outline" size={16} color="#34D399" />
                                    </View>
                                    <Text style={styles.incomeCardLabel}>Toplam Gelir</Text>
                                    <Text style={[styles.incomeCardValue, { color: '#34D399' }]}>
                                        ₺{totalIncome.toLocaleString()}
                                    </Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.incomeCard}>
                                <LinearGradient colors={['#F87171' + '22', '#F87171' + '11']} style={styles.incomeCardGradient}>
                                    <View style={[styles.incomeCardIcon, { backgroundColor: '#F87171' + '22' }]}>
                                        <Ionicons name="arrow-up-outline" size={16} color="#F87171" />
                                    </View>
                                    <Text style={styles.incomeCardLabel}>Toplam Gider</Text>
                                    <Text style={[styles.incomeCardValue, { color: '#F87171' }]}>
                                        ₺{totalExpense.toLocaleString()}
                                    </Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Alt istatistikler */}
                        <View style={styles.subStats}>
                            {[
                                { label: 'Toplam İş', value: filteredApts.length.toString(), icon: 'briefcase-outline', color: COLORS.primary },
                                { label: 'Ort. Tutar', value: `₺${avgPerJob.toLocaleString()}`, icon: 'calculator-outline', color: '#60A5FA' },
                                { label: 'KDV (%18)', value: `₺${kdvAmount.toLocaleString()}`, icon: 'receipt-outline', color: '#FFB844' },
                                { label: 'Vergi Tahmini', value: `₺${taxEstimate.toLocaleString()}`, icon: 'shield-outline', color: '#F472B6' },
                            ].map((stat) => (
                                <View key={stat.label} style={styles.subStatCard}>
                                    <LinearGradient colors={[stat.color + '22', stat.color + '11']} style={styles.subStatGradient}>
                                        <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                                        <Text style={[styles.subStatValue, { color: stat.color }]}>{stat.value}</Text>
                                        <Text style={styles.subStatLabel}>{stat.label}</Text>
                                    </LinearGradient>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── AYLIK GELİR/GİDER GRAFİĞİ ── */}
                    <View style={styles.section}>
                        <SectionTitle title="Aylık Gelir & Gider" icon="bar-chart-outline" />
                        <View style={styles.chartCard}>
                            <View style={styles.chartLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
                                    <Text style={styles.legendText}>Gelir</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                                    <Text style={styles.legendText}>Gider</Text>
                                </View>
                            </View>

                            <View style={styles.barChart}>
                                {monthlyData.map((month) => (
                                    <View key={month.month} style={styles.barGroup}>
                                        <View style={styles.barPair}>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, {
                                                    height: `${Math.max((month.income / maxMonthly) * 100, 4)}%` as any,
                                                    backgroundColor: '#34D399',
                                                }]} />
                                            </View>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, {
                                                    height: `${Math.max((month.expense / maxMonthly) * 100, 4)}%` as any,
                                                    backgroundColor: '#F87171',
                                                    opacity: 0.8,
                                                }]} />
                                            </View>
                                        </View>
                                        <Text style={styles.barLabel}>{month.month}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.chartAmounts}>
                                <Text style={[styles.chartAmount, { color: '#34D399' }]}>
                                    ₺{monthlyData[monthlyData.length - 1].income.toLocaleString()}
                                </Text>
                                <Text style={styles.chartAmountLabel}>Bu Ay Gelir</Text>
                                <View style={styles.chartAmountDivider} />
                                <Text style={[styles.chartAmount, { color: '#F87171' }]}>
                                    ₺{monthlyData[monthlyData.length - 1].expense.toLocaleString()}
                                </Text>
                                <Text style={styles.chartAmountLabel}>Bu Ay Gider</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── GİDER KATEGORİLERİ ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <SectionTitle title="Gider Kategorileri" icon="pie-chart-outline" />
                            <TouchableOpacity style={styles.addExpenseBtn} onPress={() => setShowAddExpense(true)}>
                                <LinearGradient
                                    colors={['#F87171', '#EF4444']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.addExpenseBtnGradient}
                                >
                                    <Ionicons name="add" size={16} color={COLORS.white} />
                                    <Text style={styles.addExpenseBtnText}>Gider Ekle</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {expenseByCategory.length > 0 ? (
                            <View style={styles.expenseCard}>
                                {expenseByCategory.map((exp, index) => (
                                    <View key={exp.category}>
                                        <View style={styles.expenseRow}>
                                            <View style={[styles.expenseIcon, { backgroundColor: exp.color + '22' }]}>
                                                <Ionicons name={exp.icon as any} size={16} color={exp.color} />
                                            </View>
                                            <View style={styles.expenseInfo}>
                                                <View style={styles.expenseTopRow}>
                                                    <Text style={styles.expenseCategory}>{exp.category}</Text>
                                                    <Text style={[styles.expenseAmount, { color: exp.color }]}>
                                                        ₺{exp.amount.toLocaleString()}
                                                    </Text>
                                                </View>
                                                <View style={styles.expenseBarWrapper}>
                                                    <View style={[styles.expenseBarFill, {
                                                        width: `${totalExpenseByCat > 0 ? (exp.amount / totalExpenseByCat) * 100 : 0}%` as any,
                                                        backgroundColor: exp.color,
                                                    }]} />
                                                </View>
                                                <Text style={styles.expensePercent}>
                                                    %{totalExpenseByCat > 0 ? ((exp.amount / totalExpenseByCat) * 100).toFixed(1) : '0'}
                                                </Text>
                                            </View>
                                        </View>
                                        {index < expenseByCategory.length - 1 && <View style={styles.expenseDivider} />}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyExpense}>
                                <Ionicons name="wallet-outline" size={36} color={COLORS.textMuted} />
                                <Text style={styles.emptyExpenseText}>Bu periyotta gider yok</Text>
                            </View>
                        )}
                    </View>

                    {/* ── EN ÇOK KAZANDIRAN HİZMETLER ── */}
                    {topServices.length > 0 && (
                        <View style={styles.section}>
                            <SectionTitle title="En Çok Kazandıran Hizmetler" icon="trophy-outline" />
                            <View style={styles.servicesCard}>
                                {topServices.map((service, index) => (
                                    <View key={service.service}>
                                        <View style={styles.serviceRow}>
                                            <View style={[styles.serviceRank, { backgroundColor: service.color + '22' }]}>
                                                <Text style={[styles.serviceRankText, { color: service.color }]}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.serviceInfo}>
                                                <View style={styles.serviceTopRow}>
                                                    <Text style={styles.serviceName}>{service.service}</Text>
                                                    <Text style={[styles.serviceEarning, { color: service.color }]}>
                                                        ₺{service.earning.toLocaleString()}
                                                    </Text>
                                                </View>
                                                <View style={styles.serviceBarWrapper}>
                                                    <View style={[styles.serviceBarFill, {
                                                        width: `${(service.earning / maxService) * 100}%` as any,
                                                        backgroundColor: service.color,
                                                        opacity: 0.7,
                                                    }]} />
                                                </View>
                                                <Text style={styles.serviceCount}>{service.count} işlem</Text>
                                            </View>
                                        </View>
                                        {index < topServices.length - 1 && <View style={styles.expenseDivider} />}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── EN SADIK MÜŞTERİLER ── */}
                    {topCustomers.length > 0 && (
                        <View style={styles.section}>
                            <SectionTitle title="En Sadık Müşteriler" icon="heart-outline" />
                            <View style={styles.customersCard}>
                                {topCustomers.map((customer, index) => (
                                    <View key={customer.name}>
                                        <View style={styles.customerRow}>
                                            <LinearGradient
                                                colors={[COLORS.primary + '44', COLORS.primaryDark + '33']}
                                                style={styles.customerAvatar}
                                            >
                                                <Text style={{ fontSize: 20 }}>{customer.emoji}</Text>
                                            </LinearGradient>
                                            <View style={styles.customerInfo}>
                                                <Text style={styles.customerName}>{customer.name}</Text>
                                                <Text style={styles.customerVisits}>{customer.visits} ziyaret</Text>
                                            </View>
                                            <View style={styles.customerEarningWrapper}>
                                                <Text style={styles.customerEarning}>₺{customer.totalSpent.toLocaleString()}</Text>
                                                <Text style={styles.customerEarningLabel}>toplam harcama</Text>
                                            </View>
                                        </View>
                                        {index < topCustomers.length - 1 && <View style={styles.expenseDivider} />}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── KDV & VERGİ ── */}
                    <View style={styles.section}>
                        <SectionTitle title="KDV & Vergi Özeti" icon="shield-checkmark-outline" />
                        <View style={styles.taxCard}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                                style={styles.taxGradient}
                            >
                                <View style={styles.taxRow}>
                                    <View style={styles.taxItem}>
                                        <Text style={styles.taxLabel}>KDV Oranı</Text>
                                        <Text style={[styles.taxValue, { color: '#FFB844' }]}>%18</Text>
                                    </View>
                                    <View style={styles.taxDivider} />
                                    <View style={styles.taxItem}>
                                        <Text style={styles.taxLabel}>KDV Tutarı</Text>
                                        <Text style={[styles.taxValue, { color: '#FFB844' }]}>₺{kdvAmount.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.taxDivider} />
                                    <View style={styles.taxItem}>
                                        <Text style={styles.taxLabel}>Vergi Tahmini</Text>
                                        <Text style={[styles.taxValue, { color: '#F472B6' }]}>₺{taxEstimate.toLocaleString()}</Text>
                                    </View>
                                </View>
                                <View style={styles.taxWarning}>
                                    <Ionicons name="information-circle-outline" size={14} color="#FFB844" />
                                    <Text style={styles.taxWarningText}>
                                        Vergi tahmini bilgilendirme amaçlıdır. Mali müşavirinize danışınız.
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* ── İŞLEM GEÇMİŞİ ── */}
                    <View style={styles.section}>
                        <SectionTitle title="İşlem Geçmişi" icon="list-outline" />

                        <View style={styles.filterRow}>
                            {[
                                { key: 'all', label: 'Tümü' },
                                { key: 'income', label: 'Gelir' },
                                { key: 'expense', label: 'Gider' },
                            ].map((f) => (
                                <TouchableOpacity
                                    key={f.key}
                                    style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                                    onPress={() => setActiveFilter(f.key as any)}
                                >
                                    <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {displayTransactions.length > 0 ? (
                            <View style={styles.transactionsList}>
                                {displayTransactions.map((transaction, index) => (
                                    <View key={transaction.id + index}>
                                        <View style={styles.transactionRow}>
                                            <View style={[styles.transactionIcon, {
                                                backgroundColor: transaction.type === 'income' ? '#34D399' + '22' : '#F87171' + '22',
                                            }]}>
                                                <Ionicons
                                                    name={transaction.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'}
                                                    size={16}
                                                    color={transaction.type === 'income' ? '#34D399' : '#F87171'}
                                                />
                                            </View>
                                            <View style={styles.transactionInfo}>
                                                <Text style={styles.transactionName}>{transaction.customer}</Text>
                                                <Text style={styles.transactionService}>{transaction.service}</Text>
                                                <Text style={styles.transactionDate}>{formatDisplayDate(transaction.date)}</Text>
                                            </View>
                                            <View style={styles.transactionAmountWrapper}>
                                                <Text style={[styles.transactionAmount, {
                                                    color: transaction.type === 'income' ? '#34D399' : '#F87171',
                                                }]}>
                                                    {transaction.type === 'income' ? '+' : '-'}₺{Math.abs(transaction.amount).toLocaleString()}
                                                </Text>
                                                <View style={[styles.transactionCategoryBadge, {
                                                    backgroundColor: transaction.type === 'income' ? '#34D399' + '18' : '#F87171' + '18',
                                                }]}>
                                                    <Text style={[styles.transactionCategoryText, {
                                                        color: transaction.type === 'income' ? '#34D399' : '#F87171',
                                                    }]}>
                                                        {transaction.category}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        {index < displayTransactions.length - 1 && <View style={styles.expenseDivider} />}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyExpense}>
                                <Ionicons name="document-text-outline" size={36} color={COLORS.textMuted} />
                                <Text style={styles.emptyExpenseText}>Bu filtreye uygun işlem bulunamadı.</Text>
                            </View>
                        )}
                    </View>

                    {/* ── DIŞA AKTAR ── */}
                    <View style={styles.exportSection}>
                        <Text style={styles.exportTitle}>Dışa Aktar</Text>
                        <View style={styles.exportButtons}>
                            <TouchableOpacity
                                style={styles.exportButton}
                                onPress={exportToPDF}
                            >
                                <LinearGradient colors={['#F87171' + '33', '#F87171' + '22']} style={styles.exportButtonGradient}>
                                    <Ionicons name="document-text-outline" size={22} color="#F87171" />
                                    <Text style={[styles.exportButtonText, { color: '#F87171' }]}>PDF İndir</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.exportButton}
                                onPress={exportToExcel}
                            >
                                <LinearGradient colors={['#34D399' + '33', '#34D399' + '22']} style={styles.exportButtonGradient}>
                                    <Ionicons name="grid-outline" size={22} color="#34D399" />
                                    <Text style={[styles.exportButtonText, { color: '#34D399' }]}>Excel İndir</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 60 }} />
                </Animated.View>
            </Animated.ScrollView>

            {/* Gider ekle modalı */}
            <AddExpenseModal
                visible={showAddExpense}
                onClose={() => setShowAddExpense(false)}
                onAdd={handleAddExpenseToDb}
            />
        </View>
    );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.12, top: -80, right: -80 },
    orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#34D399', opacity: 0.06, bottom: 200, left: -60 },
    header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
    subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
    exportBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '44' },
    scrollContent: { paddingHorizontal: SPACING.lg },
    periodSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, padding: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg },
    periodBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.lg, alignItems: 'center' },
    periodBtnActive: { backgroundColor: COLORS.primary + '33', borderWidth: 1, borderColor: COLORS.primary + '66' },
    periodBtnText: { fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '600' },
    periodBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
    mainCards: { gap: SPACING.md, marginBottom: SPACING.xl },
    netCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs },
    netCardLabel: { fontSize: FONTS.small, color: 'rgba(255,255,255,0.7)' },
    netCardValue: { fontSize: 36, fontWeight: '900', color: COLORS.white },
    netCardGrowth: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    netCardGrowthText: { fontSize: FONTS.small, fontWeight: '600' },
    incomeExpenseRow: { flexDirection: 'row', gap: SPACING.md },
    incomeCard: { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    incomeCardGradient: { padding: SPACING.md, gap: SPACING.xs },
    incomeCardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#34D399' + '22', justifyContent: 'center', alignItems: 'center' },
    incomeCardLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
    incomeCardValue: { fontSize: FONTS.xlarge, fontWeight: 'bold' },
    subStats: { flexDirection: 'row', gap: SPACING.sm },
    subStatCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    subStatGradient: { padding: SPACING.sm, alignItems: 'center', gap: 3, minHeight: 75, justifyContent: 'center' },
    subStatValue: { fontSize: FONTS.small, fontWeight: 'bold' },
    subStatLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
    section: { marginBottom: SPACING.xl },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    addExpenseBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
    addExpenseBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14 },
    addExpenseBtnText: { fontSize: FONTS.small, fontWeight: '700', color: COLORS.white },
    chartCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
    chartLegend: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: FONTS.small, color: COLORS.textMuted },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
    barGroup: { flex: 1, alignItems: 'center', gap: SPACING.xs },
    barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100 },
    barWrapper: { flex: 1, justifyContent: 'flex-end', height: 100 },
    bar: { width: '100%', borderRadius: 3 },
    barLabel: { fontSize: 10, color: COLORS.textMuted },
    chartAmounts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
    chartAmount: { fontSize: FONTS.large, fontWeight: 'bold' },
    chartAmountLabel: { fontSize: 10, color: COLORS.textMuted },
    chartAmountDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
    expenseCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    expenseRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
    expenseIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    expenseInfo: { flex: 1, gap: 4 },
    expenseTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expenseCategory: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
    expenseAmount: { fontSize: FONTS.medium, fontWeight: 'bold' },
    expenseBarWrapper: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
    expenseBarFill: { height: '100%', borderRadius: RADIUS.full },
    expensePercent: { fontSize: 10, color: COLORS.textMuted },
    expenseDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.sm },
    emptyExpense: { alignItems: 'center', padding: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
    emptyExpenseText: { fontSize: FONTS.regular, color: COLORS.textMuted },
    emptyExpenseBtn: { paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#F87171' + '22', borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#F87171' + '44' },
    emptyExpenseBtnText: { fontSize: FONTS.small, color: '#F87171', fontWeight: '700' },
    servicesCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    serviceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
    serviceRank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    serviceRankText: { fontSize: FONTS.medium, fontWeight: 'bold' },
    serviceInfo: { flex: 1, gap: 4 },
    serviceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceName: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
    serviceEarning: { fontSize: FONTS.medium, fontWeight: 'bold' },
    serviceBarWrapper: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
    serviceBarFill: { height: '100%', borderRadius: RADIUS.full },
    serviceCount: { fontSize: 10, color: COLORS.textMuted },
    customersCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    customerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
    customerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    customerInfo: { flex: 1 },
    customerName: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
    customerVisits: { fontSize: FONTS.small, color: COLORS.textMuted },
    customerEarningWrapper: { alignItems: 'flex-end' },
    customerEarning: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.primary },
    customerEarningLabel: { fontSize: 10, color: COLORS.textMuted },
    taxCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    taxGradient: { padding: SPACING.lg, gap: SPACING.md },
    taxRow: { flexDirection: 'row', alignItems: 'center' },
    taxItem: { flex: 1, alignItems: 'center', gap: 4 },
    taxLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
    taxValue: { fontSize: FONTS.large, fontWeight: 'bold' },
    taxDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
    taxWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: '#FFB844' + '11', borderRadius: RADIUS.md, padding: SPACING.sm },
    taxWarningText: { flex: 1, fontSize: FONTS.small, color: '#FFB844', lineHeight: 18 },
    filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    filterChip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
    filterChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
    filterChipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
    filterChipTextActive: { color: COLORS.primary, fontWeight: '700' },
    transactionsList: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    transactionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
    transactionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    transactionInfo: { flex: 1 },
    transactionName: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
    transactionService: { fontSize: FONTS.small, color: COLORS.textMuted },
    transactionDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
    transactionAmountWrapper: { alignItems: 'flex-end', gap: 4 },
    transactionAmount: { fontSize: FONTS.medium, fontWeight: 'bold' },
    transactionCategoryBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full },
    transactionCategoryText: { fontSize: 10, fontWeight: '600' },
    exportSection: { gap: SPACING.md },
    exportTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
    exportButtons: { flexDirection: 'row', gap: SPACING.md },
    exportButton: { flex: 1, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    exportButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
    exportButtonText: { fontSize: FONTS.regular, fontWeight: 'bold' },
});