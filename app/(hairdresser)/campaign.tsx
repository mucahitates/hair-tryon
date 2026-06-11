// app/(hairdresser)/campaign.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';

// TAKVİM KÜTÜPHANESİ
import DateTimePicker from '@react-native-community/datetimepicker';

// FIREBASE IMPORTS
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../src/services/firebase';

const { width, height } = Dimensions.get('window');

// ─── TİPLER ────────────────────────────────────────────────
type CampaignType = 'discount' | 'fixed' | 'package' | 'firsttime' | 'loyalty';
type CampaignStatus = 'active' | 'draft' | 'expired';
type TargetAudience = 'all' | 'new' | 'loyal' | 'passive';

interface Campaign {
  id: string;
  hairdresserId: string;
  title: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  discount: number;
  services: string[];
  targetAudience: TargetAudience;
  startDate: string;
  endDate: string;
  maxUsage: number;
  usageCount: number;
  viewCount: number;
  earning: number;
  potentialEarning: number;
  emoji: string;
  dailyUsage: number[];
  createdAt: any;
}

// ─── SABİT LİSTELER ─────────────────────────────────────────
const DUMMY_SERVICES = [
  'Balayage', 'Ombre', 'Saç Boyama', 'Keratin Bakım',
  'Protein Bakım', 'Wolf Cut', 'Klasik Kesim', 'Fön', 'Perma',
];

const DUMMY_SUGGESTION = {
  text: 'Bu hafta 4 boş saatiniz var. İndirim kampanyası açarak doluluk oranınızı artırabilirsiniz.',
  action: 'Hızlı Kampanya Oluştur',
};

// ─── YARDIMCI ──────────────────────────────────────────────
const campaignTypeConfig: Record<CampaignType, { label: string; icon: string; color: string }> = {
  discount: { label: 'İndirim %', icon: 'pricetag-outline', color: '#A78BFA' },
  fixed: { label: 'Sabit Fiyat', icon: 'cash-outline', color: '#34D399' },
  package: { label: 'Paket', icon: 'cube-outline', color: '#60A5FA' },
  firsttime: { label: 'İlk Ziyaret', icon: 'person-add-outline', color: '#F472B6' },
  loyalty: { label: 'Sadakat', icon: 'heart-outline', color: '#FFB844' },
};

const audienceConfig: Record<TargetAudience, { label: string; icon: string }> = {
  all: { label: 'Tüm Müşteriler', icon: 'people-outline' },
  new: { label: 'Yeni Müşteriler', icon: 'person-add-outline' },
  loyal: { label: 'Sadık Müşteriler', icon: 'heart-outline' },
  passive: { label: 'Pasif Müşteriler', icon: 'time-outline' },
};

// YYYY-MM-DD to "12 Haz 2026" format
const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const formatDisplayDate = (dateObj: Date) => {
  const d = dateObj.getDate();
  const m = TR_MONTHS_SHORT[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  return `${d} ${m} ${y}`;
};

// ─── MİNİ ÇUBUK GRAFİK ─────────────────────────────────────
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 2 }}>
      {data.slice(-10).map((val, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: Math.max((val / max) * 32, 2),
            backgroundColor: color,
            borderRadius: 2,
            opacity: 0.7 + (i / data.length) * 0.3,
          }}
        />
      ))}
    </View>
  );
}

// ─── KAMPANYA KARTI ────────────────────────────────────────
function CampaignCard({ campaign, onPress, onToggle }: {
  campaign: Campaign;
  onPress: () => void;
  onToggle: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const typeConf = campaignTypeConfig[campaign.type];
  const usageRate = campaign.maxUsage > 0 ? (campaign.usageCount / campaign.maxUsage) * 100 : 0;

  const statusColor = {
    active: '#34D399',
    draft: '#FFB844',
    expired: '#F87171',
  }[campaign.status];

  const statusLabel = {
    active: 'Aktif',
    draft: 'Taslak',
    expired: 'Sona Erdi',
  }[campaign.status];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[cardStyles.card, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
          style={cardStyles.gradient}
        >
          {/* Üst satır */}
          <View style={cardStyles.topRow}>
            <View style={cardStyles.emojiWrapper}>
              <Text style={cardStyles.emoji}>{campaign.emoji}</Text>
            </View>
            <View style={cardStyles.titleSection}>
              <Text style={cardStyles.title} numberOfLines={1}>{campaign.title}</Text>
              <View style={cardStyles.metaRow}>
                <View style={[cardStyles.typeBadge, { backgroundColor: typeConf.color + '22', borderColor: typeConf.color + '44' }]}>
                  <Ionicons name={typeConf.icon as any} size={10} color={typeConf.color} />
                  <Text style={[cardStyles.typeBadgeText, { color: typeConf.color }]}>{typeConf.label}</Text>
                </View>
                <View style={[cardStyles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
                  <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[cardStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            </View>
            {/* Toggle */}
            {campaign.status !== 'expired' && (
              <TouchableOpacity
                style={[cardStyles.toggleBtn, { backgroundColor: campaign.status === 'active' ? '#34D399' + '33' : 'rgba(255,255,255,0.08)' }]}
                onPress={onToggle}
              >
                <Ionicons
                  name={campaign.status === 'active' ? 'pause' : 'play'}
                  size={14}
                  color={campaign.status === 'active' ? '#34D399' : COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* İndirim */}
          <View style={cardStyles.discountRow}>
            <Text style={cardStyles.discountValue}>%{campaign.discount}</Text>
            <Text style={cardStyles.discountLabel}>indirim</Text>
            <View style={cardStyles.discountDivider} />
            <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
            <Text style={cardStyles.dateText}>{formatDisplayDate(new Date(campaign.startDate))} — {formatDisplayDate(new Date(campaign.endDate))}</Text>
          </View>

          {/* İstatistikler */}
          <View style={cardStyles.statsRow}>
            <View style={cardStyles.statItem}>
              <Ionicons name="eye-outline" size={13} color={COLORS.textMuted} />
              <Text style={cardStyles.statValue}>{campaign.viewCount || 0}</Text>
              <Text style={cardStyles.statLabel}>görüntü</Text>
            </View>
            <View style={cardStyles.statDivider} />
            <View style={cardStyles.statItem}>
              <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
              <Text style={cardStyles.statValue}>{campaign.usageCount || 0}</Text>
              <Text style={cardStyles.statLabel}>kullanım</Text>
            </View>
            <View style={cardStyles.statDivider} />
            <View style={cardStyles.statItem}>
              <Ionicons name="cash-outline" size={13} color="#34D399" />
              <Text style={[cardStyles.statValue, { color: '#34D399' }]}>₺{(campaign.earning || 0).toLocaleString()}</Text>
              <Text style={cardStyles.statLabel}>kazanç</Text>
            </View>
          </View>

          {/* Kullanım oranı */}
          <View style={cardStyles.usageRow}>
            <View style={cardStyles.usageBar}>
              <Animated.View style={[cardStyles.usageFill, {
                width: `${usageRate}%` as any,
                backgroundColor: usageRate > 80 ? '#F87171' : usageRate > 50 ? '#FFB844' : '#34D399',
              }]} />
            </View>
            <Text style={cardStyles.usageText}>{campaign.usageCount || 0}/{campaign.maxUsage}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  gradient: { padding: SPACING.md, gap: SPACING.sm },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  emojiWrapper: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 22 },
  titleSection: { flex: 1, gap: 5 },
  title: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', gap: SPACING.xs },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  toggleBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  discountValue: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  discountLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  discountDivider: { width: 1, height: 16, backgroundColor: COLORS.border, marginHorizontal: 4 },
  dateText: { fontSize: FONTS.small, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, padding: SPACING.sm },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
  statValue: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  usageBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  usageFill: { height: '100%', borderRadius: RADIUS.full },
  usageText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartLabel: { fontSize: 10, color: COLORS.textMuted },
});

// ─── KAMPANYA DETAY MODALI ─────────────────────────────────
function CampaignDetailModal({ visible, campaign, onClose, onDelete, onDuplicate }: {
  visible: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!campaign) return null;

  const typeConf = campaignTypeConfig[campaign.type];
  const audienceConf = audienceConfig[campaign.targetAudience];
  const usageRate = campaign.maxUsage > 0 ? ((campaign.usageCount || 0) / campaign.maxUsage) * 100 : 0;
  const conversionRate = (campaign.viewCount || 0) > 0 ? (((campaign.usageCount || 0) / campaign.viewCount) * 100).toFixed(1) : '0';

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[detailStyles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={['#140824', '#090514']} style={StyleSheet.absoluteFill} />

        {/* Kapat */}
        <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
          <Ionicons name="chevron-down" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Hero */}
          <LinearGradient
            colors={[typeConf.color + '44', typeConf.color + '22']}
            style={detailStyles.hero}
          >
            <Text style={detailStyles.heroEmoji}>{campaign.emoji}</Text>
            <Text style={detailStyles.heroTitle}>{campaign.title}</Text>
            <Text style={detailStyles.heroDesc}>{campaign.description}</Text>
            <View style={detailStyles.heroBadges}>
              <View style={[detailStyles.heroBadge, { backgroundColor: typeConf.color + '33' }]}>
                <Ionicons name={typeConf.icon as any} size={13} color={typeConf.color} />
                <Text style={[detailStyles.heroBadgeText, { color: typeConf.color }]}>{typeConf.label}</Text>
              </View>
              <View style={[detailStyles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name={audienceConf.icon as any} size={13} color={COLORS.textSecondary} />
                <Text style={detailStyles.heroBadgeText}>{audienceConf.label}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={detailStyles.content}>
            {/* Ana istatistikler */}
            <View style={detailStyles.mainStats}>
              {[
                { label: 'Görüntülenme', value: (campaign.viewCount || 0).toLocaleString(), icon: 'eye-outline', color: COLORS.primary },
                { label: 'Kullanım', value: (campaign.usageCount || 0).toString(), icon: 'people-outline', color: '#60A5FA' },
                { label: 'Dönüşüm', value: `%${conversionRate}`, icon: 'trending-up-outline', color: '#FFB844' },
              ].map((stat) => (
                <View key={stat.label} style={detailStyles.mainStatItem}>
                  <LinearGradient colors={[stat.color + '22', stat.color + '11']} style={detailStyles.mainStatGradient}>
                    <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                    <Text style={[detailStyles.mainStatValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={detailStyles.mainStatLabel}>{stat.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* Kazanç analizi */}
            <View style={detailStyles.earningCard}>
              <Text style={detailStyles.sectionTitle}>💰 Kazanç Analizi</Text>
              <View style={detailStyles.earningRow}>
                <View style={detailStyles.earningItem}>
                  <Text style={detailStyles.earningLabel}>Kampanyadan Kazanç</Text>
                  <Text style={[detailStyles.earningValue, { color: '#34D399' }]}>₺{(campaign.earning || 0).toLocaleString()}</Text>
                </View>
                <View style={detailStyles.earningDivider} />
                <View style={detailStyles.earningItem}>
                  <Text style={detailStyles.earningLabel}>Potansiyel Kazanç</Text>
                  <Text style={[detailStyles.earningValue, { color: COLORS.primary }]}>₺{(campaign.potentialEarning || 0).toLocaleString()}</Text>
                </View>
              </View>
              <View style={detailStyles.earningCompare}>
                <View style={detailStyles.earningBar}>
                  <View style={[detailStyles.earningBarFill, {
                    width: `${campaign.potentialEarning > 0 ? ((campaign.earning || 0) / campaign.potentialEarning) * 100 : 0}%` as any,
                    backgroundColor: '#34D399',
                  }]} />
                </View>
                <Text style={detailStyles.earningRatio}>
                  %{campaign.potentialEarning > 0 ? (((campaign.earning || 0) / campaign.potentialEarning) * 100).toFixed(0) : 0} gerçekleşti
                </Text>
              </View>
            </View>

            {/* Kullanım oranı */}
            <View style={detailStyles.usageCard}>
              <Text style={detailStyles.sectionTitle}>📊 Kullanım Durumu</Text>
              <View style={detailStyles.usageInfo}>
                <Text style={detailStyles.usageNumbers}>{campaign.usageCount || 0} / {campaign.maxUsage} kullanım</Text>
                <Text style={detailStyles.usagePercent}>%{usageRate.toFixed(0)}</Text>
              </View>
              <View style={detailStyles.usageBar}>
                <View style={[detailStyles.usageBarFill, {
                  width: `${usageRate}%` as any,
                  backgroundColor: usageRate > 80 ? '#F87171' : usageRate > 50 ? '#FFB844' : '#34D399',
                }]} />
              </View>
            </View>

            {/* Kampanya detayları */}
            <View style={detailStyles.infoCard}>
              <Text style={detailStyles.sectionTitle}>📋 Kampanya Bilgileri</Text>
              {[
                { icon: 'pricetag-outline', label: 'İndirim', value: `%${campaign.discount}`, color: COLORS.primary },
                { icon: 'calendar-outline', label: 'Başlangıç', value: formatDisplayDate(new Date(campaign.startDate)), color: COLORS.textMuted },
                { icon: 'calendar-outline', label: 'Bitiş', value: formatDisplayDate(new Date(campaign.endDate)), color: COLORS.textMuted },
                { icon: audienceConf.icon, label: 'Hedef Kitle', value: audienceConf.label, color: COLORS.textMuted },
              ].map((item, index, arr) => (
                <View key={item.label}>
                  <View style={detailStyles.infoRow}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                    <Text style={detailStyles.infoLabel}>{item.label}</Text>
                    <Text style={[detailStyles.infoValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                  {index < arr.length - 1 && <View style={detailStyles.infoDivider} />}
                </View>
              ))}

              {/* Hizmetler */}
              <View style={detailStyles.infoDivider} />
              <View style={detailStyles.infoRow}>
                <Ionicons name="cut-outline" size={16} color={COLORS.textMuted} />
                <Text style={detailStyles.infoLabel}>Hizmetler</Text>
              </View>
              <View style={detailStyles.servicesRow}>
                {(campaign.services || []).map((s) => (
                  <View key={s} style={detailStyles.serviceChip}>
                    <Text style={detailStyles.serviceChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Aksiyonlar */}
            <View style={detailStyles.actionButtons}>
              <TouchableOpacity style={detailStyles.duplicateBtn} onPress={onDuplicate}>
                <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                <Text style={detailStyles.duplicateBtnText}>Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity style={detailStyles.deleteBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color="#F87171" />
                <Text style={detailStyles.deleteBtnText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeBtn: { position: 'absolute', top: 56, left: SPACING.lg, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  hero: { paddingTop: 80, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, textAlign: 'center' },
  heroDesc: { fontSize: FONTS.regular, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },
  heroBadges: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full },
  heroBadgeText: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  sectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  mainStats: { flexDirection: 'row', gap: SPACING.sm },
  mainStatItem: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  mainStatGradient: { padding: SPACING.md, alignItems: 'center', gap: 4 },
  mainStatValue: { fontSize: FONTS.large, fontWeight: 'bold' },
  mainStatLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  earningCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md },
  earningRow: { flexDirection: 'row', alignItems: 'center' },
  earningItem: { flex: 1, alignItems: 'center', gap: 4 },
  earningLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  earningValue: { fontSize: FONTS.xlarge, fontWeight: 'bold' },
  earningDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  earningCompare: { gap: SPACING.xs },
  earningBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  earningBarFill: { height: '100%', borderRadius: RADIUS.full },
  earningRatio: { fontSize: FONTS.small, color: COLORS.textMuted, textAlign: 'right' },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100, marginTop: SPACING.sm },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 8, color: COLORS.textMuted },
  usageCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  usageInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  usageNumbers: { fontSize: FONTS.regular, color: COLORS.textSecondary },
  usagePercent: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.primary },
  usageBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: RADIUS.full },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  infoLabel: { flex: 1, fontSize: FONTS.small, color: COLORS.textMuted },
  infoValue: { fontSize: FONTS.small, fontWeight: '600' },
  infoDivider: { height: 1, backgroundColor: COLORS.border },
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, paddingTop: SPACING.xs, paddingBottom: SPACING.sm },
  serviceChip: { backgroundColor: COLORS.primary + '22', paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  serviceChipText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm },
  duplicateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary + '18', borderWidth: 1, borderColor: COLORS.primary + '44' },
  duplicateBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.lg, backgroundColor: '#60A5FA' + '18', borderWidth: 1, borderColor: '#60A5FA' + '44' },
  shareBtnText: { fontSize: FONTS.small, color: '#60A5FA', fontWeight: '700' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.lg, backgroundColor: '#F87171' + '18', borderWidth: 1, borderColor: '#F87171' + '44' },
  deleteBtnText: { fontSize: FONTS.small, color: '#F87171', fontWeight: '700' },
});

// ─── KAMPANYA OLUŞTUR MODALI ───────────────────────────────
function CreateCampaignModal({ visible, onClose, onCreate, initialData }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'hairdresserId'>) => void;
  initialData?: any; // Hızlı Kampanya için önceden doldurulacak veri
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('discount');
  const [discount, setDiscount] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');

  // Tarih Objeleri (Picker için)
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 Hafta sonrası

  // Picker Gösterim Kontrolü
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

  const [maxUsage, setMaxUsage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const slideAnim = useRef(new Animated.Value(height)).current;

  const EMOJIS = ['🎯', '🔥', '⭐', '💎', '🎁', '🌟', '💫', '✨', '🚀', '❄️', '🌸', '☀️', '👑', '🎪'];

  useEffect(() => {
    if (visible) {
      setStep(1);
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();

      // Hızlı Kampanya'dan geliyorsa verileri doldur
      if (initialData) {
        setTitle(initialData.title || '');
        setDiscount(initialData.discount || '');
        setType(initialData.type || 'discount');
        setSelectedEmoji(initialData.emoji || '🔥');
      } else {
        // Normal Kampanya ise sıfırla
        setTitle(''); setDescription(''); setType('discount'); setDiscount('');
        setSelectedServices([]); setTargetAudience('all');
        setStartDate(new Date()); setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setMaxUsage(''); setSelectedEmoji('🎯');
      }
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, initialData]);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      if (pickerMode === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const handleCreate = () => {
    if (!title || !discount || selectedServices.length === 0) {
      Alert.alert('Eksik Bilgi', 'Başlık, indirim oranı ve en az 1 hizmet seçin.');
      return;
    }

    onCreate({
      title,
      description,
      type,
      status: 'active', // Yeni kampanya varsayılan aktif
      discount: parseInt(discount),
      services: selectedServices,
      targetAudience,
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0],
      maxUsage: parseInt(maxUsage) || 50,
      usageCount: 0,
      viewCount: 0,
      earning: 0,
      potentialEarning: parseInt(maxUsage || '50') * parseInt(discount) * 10 || 0,
      emoji: selectedEmoji,
      dailyUsage: [],
    });
    onClose();
  };

  const canNext = () => {
    if (step === 1) return title.length > 0 && discount.length > 0;
    if (step === 2) return selectedServices.length > 0;
    return true;
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={createStyles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
          <Animated.View style={[createStyles.container, { transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={['#1E1030', '#120A1F']} style={StyleSheet.absoluteFill} />

            <View style={createStyles.handle} />

            {/* Header */}
            <View style={createStyles.header}>
              <TouchableOpacity
                style={createStyles.backBtn}
                onPress={() => step > 1 ? setStep(prev => (prev - 1) as 1 | 2 | 3) : onClose()}
              >
                <Ionicons name={step === 1 ? 'close' : 'arrow-back'} size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={createStyles.headerTitle}>
                  {initialData ? 'Hızlı Kampanya' : 'Kampanya Oluştur'}
                </Text>
                <Text style={createStyles.headerStep}>Adım {step}/3</Text>
              </View>
              <View style={createStyles.stepDots}>
                {[1, 2, 3].map(s => (
                  <View key={s} style={[createStyles.stepDot, step >= s && createStyles.stepDotActive]} />
                ))}
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={createStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── ADIM 1: TEMEL BİLGİLER ── */}
              {step === 1 && (
                <View style={createStyles.stepContent}>
                  <Text style={createStyles.stepTitle}>Temel Bilgiler</Text>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Kampanya İkonu</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                        {EMOJIS.map((e) => (
                          <TouchableOpacity
                            key={e}
                            style={[createStyles.emojiBtn, selectedEmoji === e && createStyles.emojiBtnActive]}
                            onPress={() => setSelectedEmoji(e)}
                          >
                            <Text style={{ fontSize: 24 }}>{e}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Kampanya Başlığı *</Text>
                    <TextInput
                      style={createStyles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Örn: Yaz İndirimi, İlk Ziyaret..."
                      placeholderTextColor={COLORS.textMuted}
                      maxLength={50}
                    />
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Açıklama</Text>
                    <TextInput
                      style={[createStyles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Kampanya hakkında kısa açıklama..."
                      placeholderTextColor={COLORS.textMuted}
                      multiline
                      maxLength={150}
                    />
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Kampanya Türü *</Text>
                    <View style={createStyles.typeGrid}>
                      {(Object.entries(campaignTypeConfig) as [CampaignType, any][]).map(([key, conf]) => (
                        <TouchableOpacity
                          key={key}
                          style={[createStyles.typeCard, type === key && createStyles.typeCardActive, type === key && { borderColor: conf.color }]}
                          onPress={() => setType(key)}
                        >
                          <Ionicons name={conf.icon as any} size={20} color={type === key ? conf.color : COLORS.textMuted} />
                          <Text style={[createStyles.typeLabel, type === key && { color: conf.color }]}>{conf.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>İndirim Oranı (%) *</Text>
                    <View style={createStyles.discountInput}>
                      <TextInput
                        style={createStyles.discountInputField}
                        value={discount}
                        onChangeText={(t) => setDiscount(t.replace(/\D/g, ''))}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={createStyles.discountSymbol}>%</Text>
                    </View>
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Maksimum Kullanım</Text>
                    <TextInput
                      style={createStyles.input}
                      value={maxUsage}
                      onChangeText={(t) => setMaxUsage(t.replace(/\D/g, ''))}
                      placeholder="50"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {/* ── ADIM 2: HİZMET & KİTLE ── */}
              {step === 2 && (
                <View style={createStyles.stepContent}>
                  <Text style={createStyles.stepTitle}>Hizmet & Hedef Kitle</Text>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Hizmetler * (birden fazla seçebilirsiniz)</Text>
                    <View style={createStyles.serviceGrid}>
                      {DUMMY_SERVICES.map((service) => (
                        <TouchableOpacity
                          key={service}
                          style={[createStyles.serviceChip, selectedServices.includes(service) && createStyles.serviceChipActive]}
                          onPress={() => toggleService(service)}
                        >
                          {selectedServices.includes(service) && (
                            <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                          )}
                          <Text style={[createStyles.serviceChipText, selectedServices.includes(service) && createStyles.serviceChipTextActive]}>
                            {service}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={createStyles.field}>
                    <Text style={createStyles.fieldLabel}>Hedef Kitle</Text>
                    {(Object.entries(audienceConfig) as [TargetAudience, any][]).map(([key, conf]) => (
                      <TouchableOpacity
                        key={key}
                        style={[createStyles.audienceCard, targetAudience === key && createStyles.audienceCardActive]}
                        onPress={() => setTargetAudience(key)}
                      >
                        <View style={[createStyles.audienceIcon, targetAudience === key && { backgroundColor: COLORS.primary + '33' }]}>
                          <Ionicons name={conf.icon as any} size={18} color={targetAudience === key ? COLORS.primary : COLORS.textMuted} />
                        </View>
                        <Text style={[createStyles.audienceLabel, targetAudience === key && createStyles.audienceLabelActive]}>
                          {conf.label}
                        </Text>
                        {targetAudience === key && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ── ADIM 3: TARİH & ÖZET ── */}
              {step === 3 && (
                <View style={createStyles.stepContent}>
                  <Text style={createStyles.stepTitle}>Tarih & Özet</Text>

                  {/* Tarihler (Picker kullanarak) */}
                  <View style={createStyles.dateRow}>
                    <View style={[createStyles.field, { flex: 1 }]}>
                      <Text style={createStyles.fieldLabel}>Başlangıç Tarihi</Text>
                      <TouchableOpacity
                        style={createStyles.datePickerBtn}
                        onPress={() => { setPickerMode('start'); setShowPicker(true); }}
                      >
                        <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                        <Text style={createStyles.datePickerText}>{formatDisplayDate(startDate)}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[createStyles.field, { flex: 1 }]}>
                      <Text style={createStyles.fieldLabel}>Bitiş Tarihi</Text>
                      <TouchableOpacity
                        style={createStyles.datePickerBtn}
                        onPress={() => { setPickerMode('end'); setShowPicker(true); }}
                      >
                        <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                        <Text style={createStyles.datePickerText}>{formatDisplayDate(endDate)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Platform spesifik Picker (iOS'da butonlarla kapatılır) */}
                  {showPicker && (
                    <View style={Platform.OS === 'ios' && createStyles.iosPickerContainer}>
                      {Platform.OS === 'ios' && (
                        <View style={createStyles.iosPickerHeader}>
                          <TouchableOpacity onPress={() => setShowPicker(false)}>
                            <Text style={createStyles.iosPickerDoneText}>Bitti</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      <DateTimePicker
                        value={pickerMode === 'start' ? startDate : endDate}
                        mode="date"
                        display="spinner"
                        themeVariant="dark"
                        onChange={handleDateChange}
                        minimumDate={pickerMode === 'end' ? startDate : new Date()}
                      />
                    </View>
                  )}

                  <View style={createStyles.summaryCard}>
                    <Text style={createStyles.summaryTitle}>Kampanya Özeti</Text>
                    <View style={createStyles.summaryHeader}>
                      <Text style={{ fontSize: 36 }}>{selectedEmoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={createStyles.summaryName}>{title || 'Kampanya Adı'}</Text>
                        <Text style={createStyles.summaryDesc}>{description || 'Açıklama yok'}</Text>
                      </View>
                    </View>
                    {[
                      { label: 'Tür', value: campaignTypeConfig[type].label },
                      { label: 'İndirim', value: `%${discount || 0}` },
                      { label: 'Maks. Kullanım', value: maxUsage || '50' },
                      { label: 'Hedef', value: audienceConfig[targetAudience].label },
                      { label: 'Hizmetler', value: selectedServices.join(', ') || 'Seçilmedi' },
                    ].map((item) => (
                      <View key={item.label} style={createStyles.summaryRow}>
                        <Text style={createStyles.summaryLabel}>{item.label}</Text>
                        <Text style={createStyles.summaryValue} numberOfLines={1}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={createStyles.footer}>
              <TouchableOpacity
                style={[createStyles.nextBtn, !canNext() && createStyles.nextBtnDisabled]}
                onPress={() => {
                  if (step < 3) setStep(prev => (prev + 1) as 1 | 2 | 3);
                  else handleCreate();
                }}
                disabled={!canNext()}
              >
                <LinearGradient
                  colors={canNext() ? [COLORS.primary, COLORS.primaryDark] : ['#333', '#222']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={createStyles.nextBtnGradient}
                >
                  <Text style={createStyles.nextBtnText}>
                    {step < 3 ? 'Devam Et' : 'Oluştur ve Yayınla'}
                  </Text>
                  <Ionicons name={step < 3 ? 'arrow-forward' : 'checkmark-circle'} size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#120A1F', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: height * 0.90, overflow: 'hidden' },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  headerStep: { fontSize: FONTS.small, color: COLORS.textMuted },
  stepDots: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary },
  scrollContent: { padding: SPACING.lg, paddingBottom: 20 },
  stepContent: { gap: SPACING.lg },
  stepTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  field: { gap: SPACING.sm },
  fieldLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginLeft: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md, color: COLORS.white, fontSize: FONTS.regular },
  emojiBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emojiBtnActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 4) / 3, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 5 },
  typeCardActive: { backgroundColor: COLORS.primary + '22' },
  typeLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
  discountInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md },
  discountInputField: { flex: 1, fontSize: 32, fontWeight: 'bold', color: COLORS.primary, paddingVertical: SPACING.md },
  discountSymbol: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  serviceChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  serviceChipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  serviceChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  audienceCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: SPACING.sm },
  audienceCardActive: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '44' },
  audienceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  audienceLabel: { flex: 1, fontSize: FONTS.regular, color: COLORS.textMuted, fontWeight: '500' },
  audienceLabelActive: { color: COLORS.primary, fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: SPACING.md },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.lg, padding: SPACING.md },
  datePickerText: { fontSize: FONTS.regular, color: COLORS.white },
  iosPickerContainer: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.lg, marginTop: SPACING.sm, overflow: 'hidden' },
  iosPickerHeader: { alignItems: 'flex-end', padding: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  iosPickerDoneText: { color: COLORS.primary, fontWeight: 'bold', fontSize: FONTS.regular },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  summaryTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  summaryName: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  summaryDesc: { fontSize: FONTS.small, color: COLORS.textMuted },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  summaryLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  summaryValue: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: '600', maxWidth: '60%' },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  nextBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  nextBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function CampaignScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<CampaignStatus | 'all'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState<any>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ─── FIRESTORE CANLI DİNLEME ───
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'campaigns'),
      where('hairdresserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
      setCampaigns(data);
      setLoading(false);
    });

    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    return () => unsub();
  }, [user?.uid]);

  // ─── KAMPANYA OLUŞTURMA & BİLDİRİM ───
  const handleCreateCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'hairdresserId'>) => {
    if (!user?.uid) return;
    try {
      // 1. Kampanyayı oluştur
      const campaignRef = await addDoc(collection(db, 'campaigns'), {
        ...campaignData,
        hairdresserId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Takipçilere Bildirim Gitmesi İçin 'notifications' Koleksiyonuna Tetikleyici Yaz
      await addDoc(collection(db, 'notifications'), {
        type: 'campaign_created',
        hairdresserId: user.uid,
        campaignId: campaignRef.id,
        title: 'Yeni Kampanya! 🎉',
        message: `${campaignData.title} fırsatını kaçırmayın!`,
        targetAudience: campaignData.targetAudience,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Kampanya oluşturuldu ve müşterilerinize bildirim gönderildi!');
    } catch (e) {
      Alert.alert('Hata', 'Kampanya oluşturulamadı.');
    }
  };

  // ─── DURUM DEĞİŞTİRME ───
  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'draft' : 'active';
      await updateDoc(doc(db, 'campaigns', id), { status: newStatus });
    } catch (e) {
      Alert.alert('Hata', 'Kampanya durumu güncellenemedi.');
    }
  };

  // ─── SİLME ───
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      setShowDetail(false);
    } catch (e) {
      Alert.alert('Hata', 'Kampanya silinemedi.');
    }
  };

  // ─── KOPYALAMA ───
  const handleDuplicate = async (campaign: Campaign) => {
    if (!user?.uid) return;
    try {
      const { id, createdAt, ...rest } = campaign;
      await addDoc(collection(db, 'campaigns'), {
        ...rest,
        title: `${campaign.title} (Kopya)`,
        status: 'draft',
        usageCount: 0,
        viewCount: 0,
        earning: 0,
        dailyUsage: [],
        createdAt: serverTimestamp()
      });
      setShowDetail(false);
      Alert.alert('Başarılı', 'Kampanya taslak olarak kopyalandı.');
    } catch (e) {
      Alert.alert('Hata', 'Kopyalama başarısız.');
    }
  };

  const handleOpenQuickCreate = () => {
    // Hızlı Kampanya için yapay zeka önerisi gibi önceden doldurulmuş data gönderiyoruz
    setQuickCreateData({
      title: 'Hafta Sonu Fırsatı',
      discount: '20',
      type: 'discount',
      emoji: '🔥'
    });
    setShowCreate(true);
  };

  const handleOpenNormalCreate = () => {
    setQuickCreateData(null); // Normal oluşturma tertemiz ekranla başlar
    setShowCreate(true);
  };

  // ─── HESAPLAMALAR ───
  const filteredCampaigns = campaigns.filter(c => activeTab === 'all' || c.status === activeTab);
  const totalEarning = campaigns.filter(c => c.status !== 'draft').reduce((acc, c) => acc + (c.earning || 0), 0);
  const totalUsage = campaigns.filter(c => c.status !== 'draft').reduce((acc, c) => acc + (c.usageCount || 0), 0);
  const totalViews = campaigns.filter(c => c.status !== 'draft').reduce((acc, c) => acc + (c.viewCount || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const tabCounts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    expired: campaigns.filter(c => c.status === 'expired').length,
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
        <View>
          <Text style={styles.title}>Kampanyalarım</Text>
          <Text style={styles.subtitle}>{activeCampaigns} aktif kampanya</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── GENEL İSTATİSTİKLER ── */}
          <View style={styles.overallStats}>
            {[
              { label: 'Toplam Kazanç', value: `₺${totalEarning.toLocaleString()}`, icon: 'cash-outline', color: '#34D399' },
              { label: 'Toplam Kullanım', value: totalUsage.toString(), icon: 'people-outline', color: COLORS.primary },
              { label: 'Görüntülenme', value: totalViews.toLocaleString(), icon: 'eye-outline', color: '#60A5FA' },
              { label: 'Aktif', value: activeCampaigns.toString(), icon: 'flash-outline', color: '#FFB844' },
            ].map((stat) => (
              <View key={stat.label} style={styles.overallStatCard}>
                <LinearGradient colors={[stat.color + '22', stat.color + '11']} style={styles.overallStatGradient}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                  <Text style={[styles.overallStatValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.overallStatLabel}>{stat.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* ── OTOMATİK ÖNERİ (HIZLI KAMPANYA) ── */}
          <View style={styles.suggestionCard}>
            <LinearGradient
              colors={[COLORS.primary + '33', COLORS.primaryDark + '22']}
              style={styles.suggestionGradient}
            >
              <View style={styles.suggestionIcon}>
                <Ionicons name="bulb-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionText}>{DUMMY_SUGGESTION.text}</Text>
                <TouchableOpacity style={styles.suggestionBtn} onPress={handleOpenQuickCreate}>
                  <Text style={styles.suggestionBtnText}>{DUMMY_SUGGESTION.action}</Text>
                  <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* ── YENİ KAMPANYA OLUŞTUR BUTONU ── */}
          <TouchableOpacity style={styles.createBtn} onPress={handleOpenNormalCreate}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              <Ionicons name="add-circle-outline" size={22} color={COLORS.white} />
              <Text style={styles.createBtnText}>Yeni Kampanya Oluştur</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── SEKMELER ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
            {([
              { key: 'all', label: 'Tümü' },
              { key: 'active', label: 'Aktif' },
              { key: 'draft', label: 'Taslak' },
              { key: 'expired', label: 'Sona Erdi' },
            ] as { key: CampaignStatus | 'all'; label: string }[]).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                <View style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── KAMPANYA LİSTESİ ── */}
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onPress={() => { setSelectedCampaign(campaign); setShowDetail(true); }}
                onToggle={() => handleToggle(campaign.id, campaign.status)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Kampanya yok</Text>
              <Text style={styles.emptyDesc}>Yeni bir kampanya oluşturarak müşteri çekmeye başlayın</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Detay modalı */}
      <CampaignDetailModal
        visible={showDetail}
        campaign={selectedCampaign}
        onClose={() => setShowDetail(false)}
        onDelete={() => {
          Alert.alert('Kampanyayı Sil', 'Bu kampanyayı silmek istediğinize emin misiniz?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => handleDelete(selectedCampaign!.id) },
          ]);
        }}
        onDuplicate={() => handleDuplicate(selectedCampaign!)}
      />

      {/* Oluştur modalı */}
      <CreateCampaignModal
        visible={showCreate}
        initialData={quickCreateData}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateCampaign}
      />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#7C3AED', opacity: 0.12, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  overallStats: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  overallStatCard: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  overallStatGradient: { padding: SPACING.sm, alignItems: 'center', gap: 3, minHeight: 80, justifyContent: 'center' },
  overallStatValue: { fontSize: FONTS.small, fontWeight: 'bold' },
  overallStatLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
  suggestionCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primary + '44', marginBottom: SPACING.lg },
  suggestionGradient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  suggestionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  suggestionText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.sm },
  suggestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestionBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  createBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.lg },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16 },
  createBtnText: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.white },
  tabScroll: { marginBottom: SPACING.lg },
  tabContent: { gap: SPACING.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  tabText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabCount: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabCountActive: { backgroundColor: COLORS.primary + '44' },
  tabCountText: { fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold' },
  tabCountTextActive: { color: COLORS.primary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center' },
});