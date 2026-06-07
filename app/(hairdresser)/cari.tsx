// ─────────────────────────────────────────────────────────────
// CARİ DÖKÜM SAYFASI (app/(hairdresser)/cari.tsx)
// ─────────────────────────────────────────────────────────────

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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── TİPLER ────────────────────────────────────────────────
interface Expense {
    id: string;
    category: string;
    amount: number;
    date: string;
    note: string;
}

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_INCOME_TRANSACTIONS = [
    { id: 't1', date: '12 Haz 2025', customer: 'Ayşe Kaya', service: 'Balayage', amount: 750, category: 'Hizmet' },
    { id: 't2', date: '11 Haz 2025', customer: 'Fatma Şahin', service: 'Keratin Bakım', amount: 580, category: 'Hizmet' },
    { id: 't3', date: '10 Haz 2025', customer: 'Zeynep Mart', service: 'Wolf Cut', amount: 350, category: 'Hizmet' },
    { id: 't4', date: '9 Haz 2025', customer: 'Merve Yıldız', service: 'Ombre', amount: 700, category: 'Hizmet' },
    { id: 't5', date: '8 Haz 2025', customer: 'Selin Arslan', service: 'Saç Boyama', amount: 400, category: 'Hizmet' },
    { id: 't6', date: '7 Haz 2025', customer: 'Elif Demir', service: 'Balayage', amount: 750, category: 'Hizmet' },
    { id: 't7', date: '6 Haz 2025', customer: 'Hande Koç', service: 'Keratin', amount: 600, category: 'Hizmet' },
    { id: 't8', date: '5 Haz 2025', customer: 'Büşra Aktaş', service: 'Kesim', amount: 200, category: 'Hizmet' },
    { id: 't9', date: '4 Haz 2025', customer: 'Nilay Yurt', service: 'Perma', amount: 450, category: 'Hizmet' },
    { id: 't10', date: '3 Haz 2025', customer: 'Ceyda Öz', service: 'Ombre', amount: 700, category: 'Hizmet' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', category: 'Kira', amount: 3500, date: '1 Haz 2025', note: 'Salon kirası' },
    { id: 'e2', category: 'Personel', amount: 4500, date: '1 Haz 2025', note: 'Asistan maaşı' },
    { id: 'e3', category: 'Malzeme', amount: 730, date: '11 Haz 2025', note: 'Boya & kimyasal' },
    { id: 'e4', category: 'Fatura', amount: 320, date: '10 Haz 2025', note: 'Elektrik & su' },
];

const DUMMY_MONTHLY = [
    { month: 'Oca', income: 5200, expense: 1800 },
    { month: 'Şub', income: 6100, expense: 2100 },
    { month: 'Mar', income: 7800, expense: 2300 },
    { month: 'Nis', income: 8200, expense: 2000 },
    { month: 'May', income: 12825, expense: 2800 },
    { month: 'Haz', income: 8625, expense: 1300 },
];

const DUMMY_TOP_SERVICES = [
    { service: 'Balayage', count: 28, earning: 21000, color: '#A78BFA' },
    { service: 'Keratin', count: 22, earning: 13200, color: '#34D399' },
    { service: 'Ombre', count: 18, earning: 12600, color: '#60A5FA' },
    { service: 'Saç Boyama', count: 31, earning: 12400, color: '#F472B6' },
    { service: 'Kesim', count: 25, earning: 5000, color: '#FFB844' },
];

const DUMMY_TOP_CUSTOMERS = [
    { name: 'Ayşe Kaya', emoji: '👩', visits: 8, totalSpent: 4800 },
    { name: 'Fatma Şahin', emoji: '👩‍🦱', visits: 6, totalSpent: 3480 },
    { name: 'Zeynep Mart', emoji: '👩‍🦰', visits: 5, totalSpent: 2750 },
    { name: 'Merve Yıldız', emoji: '👱‍♀️', visits: 4, totalSpent: 2800 },
];

const EXPENSE_CATEGORIES = [
    { key: 'Kira', icon: 'home-outline', color: '#F87171' },
    { key: 'Personel', icon: 'people-outline', color: '#FB923C' },
    { key: 'Malzeme', icon: 'flask-outline', color: '#FBBF24' },
    { key: 'Fatura', icon: 'flash-outline', color: '#60A5FA' },
    { key: 'Diğer', icon: 'ellipsis-horizontal-outline', color: '#A78BFA' },
];

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
    onAdd: (expense: Expense) => void;
}) {
    const [category, setCategory] = useState('Kira');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState('');
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
            setCategory('Kira'); setAmount(''); setNote(''); setDate('');
        }
    }, [visible]);

    const handleAdd = () => {
        if (!amount || parseInt(amount) <= 0) {
            Alert.alert('Hata', 'Geçerli bir tutar girin');
            return;
        }
        onAdd({
            id: Date.now().toString(),
            category,
            amount: parseInt(amount),
            date: date || new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            note,
        });
        onClose();
    };

    const selectedCat = EXPENSE_CATEGORIES.find(c => c.key === category)!;

    return (
        <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
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
                        {/* Kategori seç */}
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

                        {/* Tutar */}
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
                                    autoFocus
                                />
                            </View>
                        </View>

                        {/* Tarih */}
                        <View style={expenseModalStyles.field}>
                            <Text style={expenseModalStyles.label}>Tarih (opsiyonel)</Text>
                            <TextInput
                                style={expenseModalStyles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="Örn: 1 Haz 2025"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>

                        {/* Not */}
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
        </Modal>
    );
}

const expenseModalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '88%', overflow: 'hidden' },
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
    const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
    const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [activePeriod, setActivePeriod] = useState<'month' | 'year'>('month');
    const [showAddExpense, setShowAddExpense] = useState(false);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(contentAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    // Hesaplamalar
    const totalIncome = DUMMY_INCOME_TRANSACTIONS.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const thisMonthIncome = 8625;
    const lastMonthIncome = 7200;
    const growthRate = (((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1);
    const isGrowthPositive = thisMonthIncome > lastMonthIncome;

    const avgPerJob = Math.round(totalIncome / DUMMY_INCOME_TRANSACTIONS.length);
    const kdvAmount = Math.round(totalIncome * 0.18);
    const taxEstimate = Math.round(netProfit * 0.15);

    // Gider kategorileri — dinamik
    const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
        category: cat.key,
        amount: expenses.filter(e => e.category === cat.key).reduce((acc, e) => acc + e.amount, 0),
        color: cat.color,
        icon: cat.icon,
    })).filter(c => c.amount > 0);

    const totalExpenseByCat = expenseByCategory.reduce((acc, e) => acc + e.amount, 0);

    // Tüm işlemler birleşik
    const allTransactions = [
        ...DUMMY_INCOME_TRANSACTIONS.map(t => ({ ...t, type: 'income' as const })),
        ...expenses.map(e => ({ id: e.id, date: e.date, customer: e.category, service: e.note || e.category, amount: -e.amount, type: 'expense' as const, category: e.category })),
    ].sort((a, b) => b.id.localeCompare(a.id));

    const filteredTransactions = allTransactions.filter(t => {
        if (activeFilter === 'income') return t.type === 'income';
        if (activeFilter === 'expense') return t.type === 'expense';
        return true;
    });

    const maxMonthly = Math.max(...DUMMY_MONTHLY.map(m => Math.max(m.income, m.expense)));
    const maxService = Math.max(...DUMMY_TOP_SERVICES.map(s => s.earning));

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
                <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => Alert.alert('Dışa Aktar', 'Format seçin:', [
                        { text: 'PDF', onPress: () => Alert.alert('PDF', 'PDF oluşturuluyor...') },
                        { text: 'Excel', onPress: () => Alert.alert('Excel', 'Excel oluşturuluyor...') },
                        { text: 'İptal', style: 'cancel' },
                    ])}
                >
                    <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
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
                            <Text style={styles.netCardLabel}>Net Kazanç</Text>
                            <Text style={styles.netCardValue}>
                                ₺{activePeriod === 'month'
                                    ? (thisMonthIncome - totalExpense).toLocaleString()
                                    : netProfit.toLocaleString()}
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
                                        %{Math.abs(parseFloat(growthRate))} geçen aya göre
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
                                        ₺{activePeriod === 'month' ? thisMonthIncome.toLocaleString() : totalIncome.toLocaleString()}
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
                                { label: 'Toplam İş', value: DUMMY_INCOME_TRANSACTIONS.length.toString(), icon: 'briefcase-outline', color: COLORS.primary },
                                { label: 'Ort. Tutar', value: `₺${avgPerJob}`, icon: 'calculator-outline', color: '#60A5FA' },
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
                                {DUMMY_MONTHLY.map((month) => (
                                    <View key={month.month} style={styles.barGroup}>
                                        <View style={styles.barPair}>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, {
                                                    height: Math.max((month.income / maxMonthly) * 100, 4),
                                                    backgroundColor: '#34D399',
                                                }]} />
                                            </View>
                                            <View style={styles.barWrapper}>
                                                <View style={[styles.bar, {
                                                    height: Math.max((month.expense / maxMonthly) * 100, 4),
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
                                    ₺{DUMMY_MONTHLY[DUMMY_MONTHLY.length - 1].income.toLocaleString()}
                                </Text>
                                <Text style={styles.chartAmountLabel}>Bu Ay Gelir</Text>
                                <View style={styles.chartAmountDivider} />
                                <Text style={[styles.chartAmount, { color: '#F87171' }]}>
                                    ₺{totalExpense.toLocaleString()}
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
                                <Text style={styles.emptyExpenseText}>Henüz gider eklenmedi</Text>
                                <TouchableOpacity style={styles.emptyExpenseBtn} onPress={() => setShowAddExpense(true)}>
                                    <Text style={styles.emptyExpenseBtnText}>Gider Ekle</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* ── EN ÇOK KAZANDIRAN HİZMETLER ── */}
                    <View style={styles.section}>
                        <SectionTitle title="En Çok Kazandıran Hizmetler" icon="trophy-outline" />
                        <View style={styles.servicesCard}>
                            {DUMMY_TOP_SERVICES.map((service, index) => (
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
                                    {index < DUMMY_TOP_SERVICES.length - 1 && <View style={styles.expenseDivider} />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── EN SADIK MÜŞTERİLER ── */}
                    <View style={styles.section}>
                        <SectionTitle title="En Sadık Müşteriler" icon="heart-outline" />
                        <View style={styles.customersCard}>
                            {DUMMY_TOP_CUSTOMERS.map((customer, index) => (
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
                                    {index < DUMMY_TOP_CUSTOMERS.length - 1 && <View style={styles.expenseDivider} />}
                                </View>
                            ))}
                        </View>
                    </View>

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

                        <View style={styles.transactionsList}>
                            {filteredTransactions.map((transaction, index) => (
                                <View key={transaction.id}>
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
                                            <Text style={styles.transactionDate}>{transaction.date}</Text>
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
                                    {index < filteredTransactions.length - 1 && <View style={styles.expenseDivider} />}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ── DIŞA AKTAR ── */}
                    <View style={styles.exportSection}>
                        <Text style={styles.exportTitle}>Dışa Aktar</Text>
                        <View style={styles.exportButtons}>
                            <TouchableOpacity
                                style={styles.exportButton}
                                onPress={() => Alert.alert('PDF', 'Cari döküm PDF olarak hazırlanıyor...')}
                            >
                                <LinearGradient colors={['#F87171' + '33', '#F87171' + '22']} style={styles.exportButtonGradient}>
                                    <Ionicons name="document-text-outline" size={22} color="#F87171" />
                                    <Text style={[styles.exportButtonText, { color: '#F87171' }]}>PDF İndir</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.exportButton}
                                onPress={() => Alert.alert('Excel', 'Cari döküm Excel olarak hazırlanıyor...')}
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
                onAdd={(expense) => {
                    setExpenses(prev => [expense, ...prev]);
                }}
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