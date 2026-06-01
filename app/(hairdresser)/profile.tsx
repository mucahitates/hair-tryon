// ─────────────────────────────────────────────────────────────
// KUAFÖR PROFİL EKRANI (app/(hairdresser)/profile.tsx)
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
  Modal,
  TextInput,
  Alert,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

// ─── DUMMY VERİ ────────────────────────────────────────────
const DUMMY_PROFILE = {
  salonName: 'Salon Elegance',
  city: 'İstanbul',
  district: 'Kadıköy',
  address: 'Moda Caddesi No:42, Kadıköy',
  phone: '05321234567',
  instagram: '@salonelegance',
  bio: 'Profesyonel saç boyama ve kesim uzmanı. 8 yıllık deneyimle hizmet veriyoruz.',
  totalJobs: 124,
  averageRating: 4.8,
  followersCount: 892,
  completionRate: 96,
  experience: 8,
  memberSince: 'Ocak 2023',
};

const DUMMY_SERVICES = [
  { id: '1', category: 'Kesim', name: 'Klasik Kesim', price: 200, duration: 45 },
  { id: '2', category: 'Kesim', name: 'Özel Tasarım Kesim', price: 350, duration: 60 },
  { id: '3', category: 'Renk', name: 'Tek Renk Boyama', price: 400, duration: 90 },
  { id: '4', category: 'Renk', name: 'Balayage', price: 800, duration: 180 },
  { id: '5', category: 'Bakım', name: 'Keratin Bakım', price: 600, duration: 120 },
];

const DUMMY_WORKING_HOURS: Record<string, { isOpen: boolean; open: string; close: string }> = {
  'Pazartesi': { isOpen: true, open: '09:00', close: '19:00' },
  'Salı': { isOpen: true, open: '09:00', close: '19:00' },
  'Çarşamba': { isOpen: true, open: '09:00', close: '19:00' },
  'Perşembe': { isOpen: true, open: '09:00', close: '19:00' },
  'Cuma': { isOpen: true, open: '09:00', close: '20:00' },
  'Cumartesi': { isOpen: true, open: '10:00', close: '18:00' },
  'Pazar': { isOpen: false, open: '09:00', close: '18:00' },
};

const SPECIALIZATIONS = ['Renk', 'Kesim', 'Balayage', 'Ombre', 'Keratin', 'Fön', 'Uzatma', 'Perma'];

// Saat seçenekleri — 07:00'dan 22:00'ye 30 dakika aralıkla
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

// ─── YARDIMCI BİLEŞENLER ──────────────────────────────────

function SectionTitle({ title, icon, action, onAction }: {
  title: string; icon: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.left}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sectionStyles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  action: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
});

function SettingRow({ icon, label, value, onPress, isSwitch, switchValue, onSwitch, color, showArrow = true }: {
  icon: string; label: string; value?: string; onPress?: () => void;
  isSwitch?: boolean; switchValue?: boolean; onSwitch?: (val: boolean) => void;
  color?: string; showArrow?: boolean;
}) {
  return (
    <TouchableOpacity style={settingStyles.row} onPress={onPress} disabled={isSwitch} activeOpacity={0.7}>
      <View style={[settingStyles.iconWrapper, { backgroundColor: (color || COLORS.primary) + '22' }]}>
        <Ionicons name={icon as any} size={18} color={color || COLORS.primary} />
      </View>
      <Text style={[settingStyles.label, color ? { color } : {}]}>{label}</Text>
      <View style={settingStyles.right}>
        {value && <Text style={settingStyles.value}>{value}</Text>}
        {isSwitch && onSwitch && (
          <Switch
            value={switchValue}
            onValueChange={onSwitch}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
            thumbColor={switchValue ? COLORS.primary : COLORS.textMuted}
          />
        )}
        {showArrow && !isSwitch && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: SPACING.md, gap: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: FONTS.regular, color: COLORS.textPrimary, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { fontSize: FONTS.small, color: COLORS.textMuted },
});

// ─── BOTTOM MODAL WRAPPER ──────────────────────────────────
// showBack ve onBack propları eklendi
// ─── BOTTOM MODAL WRAPPER ──────────────────────────────────
function BottomModal({ visible, onClose, title, children, showSave, onSave, saveLabel, showBack, onBack }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
  showSave?: boolean; onSave?: () => void; saveLabel?: string;
  showBack?: boolean; onBack?: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    else slideAnim.setValue(400);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* View yerine KeyboardAvoidingView kullanıyoruz */}
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[modalStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={modalStyles.header}>
            {showBack && onBack && (
              <TouchableOpacity onPress={onBack} style={modalStyles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )}
            <Text style={[modalStyles.title, showBack && { flex: 1, marginLeft: SPACING.sm }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Klavye açıkken de butonlara basılabilmesini sağlar
          >
            {children}
            <View style={{ height: SPACING.xl }} />
          </ScrollView>

          {showSave && onSave && (
            <View style={modalStyles.footer}>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={onSave}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.saveBtnGradient}>
                  <Text style={modalStyles.saveBtnText}>{saveLabel || 'Kaydet'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});

// ─── SALON DÜZENLEME MODALI ────────────────────────────────
function EditSalonModal({ visible, onClose, avatarUri, onAvatarChange }: {
  visible: boolean; onClose: () => void;
  avatarUri: string | null; onAvatarChange: (uri: string) => void;
}) {
  const [salonName, setSalonName] = useState(DUMMY_PROFILE.salonName);
  const [phone, setPhone] = useState(DUMMY_PROFILE.phone);
  const [address, setAddress] = useState(DUMMY_PROFILE.address);
  const [instagram, setInstagram] = useState(DUMMY_PROFILE.instagram);
  const [bio, setBio] = useState(DUMMY_PROFILE.bio);
  const [phoneError, setPhoneError] = useState('');

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        onAvatarChange(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    }
  };

  const handleSave = () => {
    if (phone && phone.replace(/\D/g, '').length !== 11) {
      setPhoneError('Telefon 11 haneli olmalı');
      return;
    }
    setPhoneError('');
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Salon Bilgilerini Düzenle"
      showSave onSave={handleSave} saveLabel="Kaydet"
    >
      <View style={editStyles.content}>
        <TouchableOpacity style={editStyles.avatarSection} onPress={handlePickPhoto}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={editStyles.avatarImage} />
          ) : (
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={editStyles.avatar}>
              <Text style={editStyles.avatarEmoji}>✂️</Text>
            </LinearGradient>
          )}
          <View style={editStyles.avatarBadge}>
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </View>
          <Text style={editStyles.avatarHint}>Fotoğrafı değiştir</Text>
        </TouchableOpacity>

        <Text style={editStyles.label}>Salon Adı</Text>
        <View style={editStyles.inputWrapper}>
          <TextInput style={editStyles.input} value={salonName} onChangeText={setSalonName} placeholderTextColor={COLORS.textMuted} />
        </View>

        <Text style={editStyles.label}>Telefon</Text>
        <View style={[editStyles.inputWrapper, phoneError ? { borderColor: COLORS.error } : null]}>
          <TextInput
            style={editStyles.input}
            value={phone}
            onChangeText={(t) => {
              const n = t.replace(/\D/g, '');
              if (n.length <= 11) { setPhone(n); setPhoneError(''); }
            }}
            placeholder="05xxxxxxxxx"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            maxLength={11}
          />
        </View>
        {phoneError ? <Text style={editStyles.errorText}>{phoneError}</Text> : null}

        <Text style={editStyles.label}>Adres</Text>
        <View style={editStyles.inputWrapper}>
          <TextInput style={editStyles.input} value={address} onChangeText={setAddress} placeholderTextColor={COLORS.textMuted} />
        </View>

        <Text style={editStyles.label}>Instagram</Text>
        <View style={editStyles.inputWrapper}>
          <TextInput style={editStyles.input} value={instagram} onChangeText={setInstagram} placeholder="@salonadi" placeholderTextColor={COLORS.textMuted} />
        </View>

        <Text style={editStyles.label}>Hakkında</Text>
        <View style={[editStyles.inputWrapper, { alignItems: 'flex-start' }]}>
          <TextInput
            style={[editStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Salon hakkında kısa açıklama..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>
      </View>
    </BottomModal>
  );
}

const editStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.md, position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarEmoji: { fontSize: 40 },
  avatarBadge: { position: 'absolute', bottom: 22, right: width / 2 - 55, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A0533' },
  avatarHint: { fontSize: FONTS.small, color: COLORS.primary, marginTop: 30 },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs },
  inputWrapper: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular, width: '100%' },
  errorText: { fontSize: FONTS.small, color: COLORS.error, marginTop: 2 },
});

// ─── HİZMET EKLE MODALI ────────────────────────────────────
function AddServiceModal({ visible, onClose, onAdd }: {
  visible: boolean; onClose: () => void; onAdd: (service: any) => void;
}) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const categories = ['Kesim', 'Renk', 'Bakım', 'Şekillendirme', 'Uzatma', 'Kimyasal'];

  const handleAdd = () => {
    if (!category || !name || !price || !duration) { Alert.alert('Hata', 'Tüm alanları doldurun'); return; }
    onAdd({ id: Date.now().toString(), category, name, price: parseInt(price), duration: parseInt(duration) });
    setCategory(''); setName(''); setPrice(''); setDuration('');
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Hizmet Ekle" showSave onSave={handleAdd} saveLabel="Ekle">
      <View style={addStyles.content}>
        <Text style={addStyles.label}>Kategori *</Text>
        <View style={addStyles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[addStyles.chip, category === cat && addStyles.chipActive]} onPress={() => setCategory(cat)}>
              <Text style={[addStyles.chipText, category === cat && addStyles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={addStyles.label}>Hizmet Adı *</Text>
        <View style={addStyles.inputWrapper}>
          <TextInput style={addStyles.input} value={name} onChangeText={setName} placeholder="Örn: Balayage, Wolf Cut..." placeholderTextColor={COLORS.textMuted} />
        </View>

        <View style={addStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={addStyles.label}>Fiyat (₺) *</Text>
            <View style={addStyles.inputWrapper}>
              <TextInput style={addStyles.input} value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, ''))} placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={addStyles.label}>Süre (dk) *</Text>
            <View style={addStyles.inputWrapper}>
              <TextInput style={addStyles.input} value={duration} onChangeText={(t) => setDuration(t.replace(/\D/g, ''))} placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
            </View>
          </View>
        </View>
      </View>
    </BottomModal>
  );
}

const addStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  inputWrapper: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular, width: '100%' },
  row: { flexDirection: 'row', gap: SPACING.md },
});

// ─── ÇALIŞMA SAATLERİ MODALI ────────────────────────────────
// İçi içe Modal mantığı kullanmadan koşullu render (conditional rendering) yapısı ile
function WorkingHoursModal({ visible, onClose, hours, onSave }: {
  visible: boolean; onClose: () => void;
  hours: typeof DUMMY_WORKING_HOURS;
  onSave: (hours: typeof DUMMY_WORKING_HOURS) => void;
}) {
  const [local, setLocal] = useState({ ...hours });

  // İç modal geçişi için stateler
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDay, setPickerDay] = useState('');
  const [pickerType, setPickerType] = useState<'open' | 'close'>('open');

  useEffect(() => {
    setLocal({ ...hours });
    setShowTimePicker(false); // Modal açıldığında daima ana listeye dön
  }, [visible, hours]);

  const toggleDay = (day: string) => {
    setLocal(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen }
    }));
  };

  const handleTimeSelect = (time: string) => {
    setLocal(prev => ({
      ...prev,
      [pickerDay]: { ...prev[pickerDay], [pickerType]: time }
    }));
    setShowTimePicker(false);
  };

  const modalTitle = showTimePicker
    ? (pickerType === 'open' ? 'Açılış Saati' : 'Kapanış Saati')
    : 'Çalışma Saatleri';

  return (
    <BottomModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      showBack={showTimePicker}
      onBack={() => setShowTimePicker(false)}
      showSave={!showTimePicker}
      onSave={() => { onSave(local); onClose(); }}
      saveLabel="Kaydet"
    >
      {showTimePicker ? (
        // ── GÖRÜNÜM 2: SAAT SEÇİCİ ──
        <View style={timeStyles.list}>
          {TIME_OPTIONS.map((time) => {
            const isActive = local[pickerDay]?.[pickerType] === time;
            return (
              <TouchableOpacity
                key={time}
                style={[timeStyles.timeItem, isActive && timeStyles.timeItemActive]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text style={[timeStyles.timeText, isActive && timeStyles.timeTextActive]}>
                  {time}
                </Text>
                {isActive && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        // ── GÖRÜNÜM 1: GÜNLER VE SAATLER LİSTESİ ──
        <View style={{ paddingHorizontal: SPACING.lg }}>
          {Object.entries(local).map(([day, info]) => (
            <View key={day} style={hoursStyles.dayRow}>
              <Switch
                value={info.isOpen}
                onValueChange={() => toggleDay(day)}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                thumbColor={info.isOpen ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[hoursStyles.dayName, !info.isOpen && { color: COLORS.textMuted }]}>{day}</Text>

              {info.isOpen ? (
                <View style={hoursStyles.timeRow}>
                  <TouchableOpacity
                    style={hoursStyles.timeBtn}
                    onPress={() => {
                      setPickerDay(day);
                      setPickerType('open');
                      setShowTimePicker(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                    <Text style={hoursStyles.timeBtnText}>{info.open}</Text>
                  </TouchableOpacity>

                  <Text style={hoursStyles.timeDash}>—</Text>

                  <TouchableOpacity
                    style={hoursStyles.timeBtn}
                    onPress={() => {
                      setPickerDay(day);
                      setPickerType('close');
                      setShowTimePicker(true);
                    }}
                  >
                    <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                    <Text style={hoursStyles.timeBtnText}>{info.close}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={hoursStyles.closedBadge}>
                  <Text style={hoursStyles.closedText}>Kapalı</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </BottomModal>
  );
}

const hoursStyles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dayName: { flex: 1, fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '18', paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44' },
  timeBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  timeDash: { color: COLORS.textMuted, fontWeight: 'bold' },
  closedBadge: { backgroundColor: COLORS.error + '18', paddingVertical: 5, paddingHorizontal: 12, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.error + '44' },
  closedText: { color: COLORS.error, fontSize: FONTS.small, fontWeight: '700' },
});

const timeStyles = StyleSheet.create({
  list: { paddingVertical: SPACING.sm },
  timeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  timeItemActive: { backgroundColor: COLORS.primary + '18' },
  timeText: { fontSize: FONTS.large, color: COLORS.textPrimary, fontWeight: '500' },
  timeTextActive: { color: COLORS.primary, fontWeight: '700' },
});

// ─── ŞİFRE DEĞİŞTİR MODALI ────────────────────────────────
function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) newErrors.old = 'Eski şifre gerekli';
    if (newPassword.length < 6) newErrors.new = 'Yeni şifre en az 6 karakter olmalı';
    if (newPassword !== confirmPassword) newErrors.confirm = 'Şifreler uyuşmuyor';
    if (newPassword === oldPassword) newErrors.new = 'Yeni şifre eski şifreyle aynı olamaz';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    Alert.alert('Başarılı', 'Şifreniz güncellendi.');
    setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setErrors({});
    onClose();
  };

  const InputField = ({ label, value, onChange, show, onToggle, error, placeholder }: any) => (
    <View style={pwStyles.fieldWrapper}>
      <Text style={pwStyles.label}>{label}</Text>
      <View style={[pwStyles.inputWrapper, error && pwStyles.inputError]}>
        <TextInput
          style={pwStyles.input}
          value={value}
          onChangeText={(t) => { onChange(t); setErrors(e => ({ ...e })); }}
          secureTextEntry={!show}
          textContentType="oneTimeCode"
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity onPress={onToggle} style={pwStyles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      {error && <Text style={pwStyles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <BottomModal visible={visible} onClose={onClose} title="Şifre Değiştir" showSave onSave={handleSave} saveLabel="Güncelle">
      <View style={pwStyles.content}>
        <InputField label="Eski Şifre" value={oldPassword} onChange={setOldPassword} show={showOld} onToggle={() => setShowOld(!showOld)} error={errors.old} placeholder="Mevcut şifreniz" />
        <InputField label="Yeni Şifre" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} error={errors.new} placeholder="En az 6 karakter" />
        <InputField label="Yeni Şifre Tekrar" value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} error={errors.confirm} placeholder="Yeni şifreyi tekrar girin" />

        {newPassword.length > 0 && (
          <View style={pwStyles.strengthWrapper}>
            <Text style={pwStyles.strengthLabel}>Şifre Güçlülüğü:</Text>
            <View style={pwStyles.strengthBars}>
              {[1, 2, 3, 4].map((level) => {
                const strength = newPassword.length < 6 ? 1 : newPassword.length < 8 ? 2 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
                const colors = ['#F87171', '#FFB844', '#34D399', '#A78BFA'];
                return (
                  <View key={level} style={[pwStyles.strengthBar, { backgroundColor: level <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)' }]} />
                );
              })}
            </View>
          </View>
        )}
      </View>
    </BottomModal>
  );
}

const pwStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  fieldWrapper: { gap: SPACING.xs },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular },
  eyeBtn: { padding: SPACING.sm },
  errorText: { fontSize: FONTS.small, color: COLORS.error, marginTop: 2 },
  strengthWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  strengthLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 6, borderRadius: RADIUS.full },
});

// ─── GİZLİLİK AYARLARI MODALI ─────────────────────────────
function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  return (
    <BottomModal visible={visible} onClose={onClose} title="Gizlilik Ayarları" showSave onSave={onClose} saveLabel="Kaydet">
      <View style={privStyles.content}>
        <Text style={privStyles.desc}>Profilinizin ve bilgilerinizin görünürlüğünü kontrol edin.</Text>
        <View style={privStyles.card}>
          {[
            { label: 'Profilimi Herkese Göster', desc: 'Müşteriler profilinizi görebilir', value: profileVisible, onChange: setProfileVisible },
            { label: 'Puanlarımı Göster', desc: 'Ortalama puanınız profilinde görünür', value: showRating, onChange: setShowRating },
            { label: 'Mesaj Almaya İzin Ver', desc: 'Müşteriler size mesaj atabilir', value: allowMessages, onChange: setAllowMessages },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={privStyles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={privStyles.rowTitle}>{item.label}</Text>
                  <Text style={privStyles.rowDesc}>{item.desc}</Text>
                </View>
                <Switch value={item.value} onValueChange={item.onChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                  thumbColor={item.value ? COLORS.primary : COLORS.textMuted} />
              </View>
              {i < arr.length - 1 && <View style={privStyles.divider} />}
            </View>
          ))}
        </View>
      </View>
    </BottomModal>
  );
}

const privStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  desc: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, gap: SPACING.md },
  rowTitle: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
  rowDesc: { fontSize: FONTS.small, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
});

// ─── YARDIM MERKEZİ MODALI ─────────────────────────────────
function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const faqs = [
    { q: 'Nasıl teklif verebilirim?', a: 'İş Havuzu sekmesinden açık ilanları inceleyin ve "Teklif Ver" butonuna basın.' },
    { q: 'Portfolyo nasıl eklerim?', a: 'Portfolyo sekmesinden + butonuna basarak fotoğraf ekleyebilirsiniz.' },
    { q: 'Randevuyu nasıl onaylayabilirim?', a: 'Takvim sekmesinden bekleyen randevuları onaylayabilirsiniz.' },
    { q: 'Hizmet fiyatlarımı nasıl güncellerim?', a: 'Profil > Hizmetlerim bölümünden hizmetleri düzenleyebilirsiniz.' },
  ];

  return (
    <BottomModal visible={visible} onClose={onClose} title="Yardım Merkezi">
      <View style={helpStyles.content}>
        <Text style={helpStyles.sectionTitle}>Sık Sorulan Sorular</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={helpStyles.faqCard}>
            <View style={helpStyles.faqQ}>
              <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
              <Text style={helpStyles.qText}>{faq.q}</Text>
            </View>
            <Text style={helpStyles.aText}>{faq.a}</Text>
          </View>
        ))}
      </View>
    </BottomModal>
  );
}

// ─── HAKKINDA MODALI ───────────────────────────────────────
function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomModal visible={visible} onClose={onClose} title="Hakkında">
      <View style={helpStyles.content}>
        <View style={helpStyles.logoSection}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={helpStyles.logo}>
            <Text style={{ fontSize: 36 }}>✂️</Text>
          </LinearGradient>
          <Text style={helpStyles.appName}>Hair Tryon</Text>
          <Text style={helpStyles.version}>Versiyon 1.0.0</Text>
        </View>
        <View style={helpStyles.infoCard}>
          {[
            { label: 'Versiyon', value: '1.0.0' },
            { label: 'Geliştirici', value: 'Hair Tryon Team' },
            { label: 'İletişim', value: 'info@hairtryon.com' },
          ].map((item, i) => (
            <View key={i} style={helpStyles.infoRow}>
              <Text style={helpStyles.infoLabel}>{item.label}</Text>
              <Text style={helpStyles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        <Text style={helpStyles.legal}>© 2025 Hair Tryon. Tüm hakları saklıdır.</Text>
      </View>
    </BottomModal>
  );
}

const helpStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary },
  faqCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  faqQ: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  qText: { flex: 1, fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.textPrimary },
  aText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20, paddingLeft: 24 },
  logoSection: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg },
  logo: { width: 80, height: 80, borderRadius: RADIUS.xl, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: FONTS.xxlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  version: { fontSize: FONTS.small, color: COLORS.textMuted },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: FONTS.regular, color: COLORS.textMuted },
  infoValue: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
  legal: { fontSize: FONTS.small, color: COLORS.textMuted, textAlign: 'center' },
});

// ─── ANA EKRAN ─────────────────────────────────────────────
export default function HairdresserProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const [showEditSalon, setShowEditSalon] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showWorkingHours, setShowWorkingHours] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [notifNewJob, setNotifNewJob] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifAppointment, setNotifAppointment] = useState(true);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [services, setServices] = useState(DUMMY_SERVICES);
  const [workingHours, setWorkingHours] = useState(DUMMY_WORKING_HOURS);
  const [specs, setSpecs] = useState(['Renk', 'Kesim', 'Balayage', 'Ombre', 'Keratin']);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(contentAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleDeleteService = (id: string) => {
    Alert.alert('Hizmeti Sil', 'Bu hizmeti silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => setServices(prev => prev.filter(s => s.id !== id)) },
    ]);
  };

  const toggleSpec = (spec: string) => {
    setSpecs(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  };

  const serviceCategories = Array.from(new Set(services.map(s => s.category)));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0533', '#0F0A1E', '#0D1B3E']}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── SALON KARTI ── */}
        <Animated.View style={[styles.salonCard, { opacity: headerAnim }]}>
          <LinearGradient colors={[COLORS.primaryDark + '44', COLORS.primary + '22']} style={styles.salonCardGradient}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowEditSalon(true)}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>✂️</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.salonName}>{DUMMY_PROFILE.salonName}</Text>
            <Text style={styles.salonBio}>{DUMMY_PROFILE.bio}</Text>

            <View style={styles.salonMeta}>
              {[
                { icon: 'location-outline', text: `${DUMMY_PROFILE.district}, ${DUMMY_PROFILE.city}` },
                { icon: 'call-outline', text: DUMMY_PROFILE.phone },
                { icon: 'logo-instagram', text: DUMMY_PROFILE.instagram },
              ].map((item) => (
                <View key={item.text} style={styles.metaItem}>
                  <Ionicons name={item.icon as any} size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditSalon(true)}>
              <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Salon Bilgilerini Düzenle</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentAnim }] }}>

          {/* ── İSTATİSTİKLER ── */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Toplam İş', value: DUMMY_PROFILE.totalJobs, icon: 'briefcase-outline', color: COLORS.primary },
              { label: 'Puan', value: DUMMY_PROFILE.averageRating, icon: 'star-outline', color: '#FFB844' },
              { label: 'Takipçi', value: DUMMY_PROFILE.followersCount, icon: 'people-outline', color: '#34D399' },
              { label: 'Tamamlama', value: `%${DUMMY_PROFILE.completionRate}`, icon: 'checkmark-circle-outline', color: '#A78BFA' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <LinearGradient colors={[stat.color + '22', stat.color + '11']} style={styles.statCardGradient}>
                  <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* ── HİZMETLER ── */}
          <View style={styles.section}>
            <SectionTitle title="Hizmetlerim" icon="cut-outline" action="+ Ekle" onAction={() => setShowAddService(true)} />

            {services.length === 0 ? (
              <TouchableOpacity style={styles.emptyServices} onPress={() => setShowAddService(true)}>
                <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
                <Text style={styles.emptyServicesText}>Henüz hizmet eklenmedi</Text>
                <Text style={styles.emptyServicesHint}>+ Ekle butonuna basarak hizmet ekleyebilirsiniz</Text>
              </TouchableOpacity>
            ) : (
              serviceCategories.map((cat) => (
                <View key={cat} style={styles.serviceCategoryGroup}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryDot} />
                    <Text style={styles.serviceCategoryTitle}>{cat}</Text>
                    <View style={styles.categoryLine} />
                  </View>

                  {services.filter(s => s.category === cat).map((service) => (
                    <View key={service.id} style={styles.serviceCard}>
                      <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={styles.serviceCardGradient}
                      >
                        <View style={styles.serviceLeft}>
                          <View style={styles.serviceIconWrapper}>
                            <Ionicons name="cut-outline" size={18} color={COLORS.primary} />
                          </View>
                          <View style={styles.serviceInfo}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <View style={styles.serviceMetaRow}>
                              <View style={styles.serviceMetaItem}>
                                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                                <Text style={styles.serviceMetaText}>{service.duration} dk</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={styles.serviceRight}>
                          <Text style={styles.servicePrice}>₺{service.price}</Text>
                          <TouchableOpacity style={styles.serviceDeleteBtn} onPress={() => handleDeleteService(service.id)}>
                            <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>

          {/* ── UZMANLIK ALANLARI ── */}
          <View style={styles.section}>
            <SectionTitle title="Uzmanlık Alanlarım" icon="sparkles-outline" />
            <View style={styles.specGrid}>
              {SPECIALIZATIONS.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[styles.specChip, specs.includes(spec) && styles.specChipActive]}
                  onPress={() => toggleSpec(spec)}
                >
                  {specs.includes(spec) && <Ionicons name="checkmark" size={12} color={COLORS.primary} />}
                  <Text style={[styles.specText, specs.includes(spec) && styles.specTextActive]}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── ÇALIŞMA SAATLERİ ── */}
          <View style={styles.section}>
            <SectionTitle title="Çalışma Saatleri" icon="time-outline" action="Düzenle" onAction={() => setShowWorkingHours(true)} />
            <View style={styles.hoursCard}>
              {Object.entries(workingHours).map(([day, info]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>{day}</Text>
                  <Text style={[styles.hoursTime, !info.isOpen && { color: COLORS.error }]}>
                    {info.isOpen ? `${info.open} - ${info.close}` : 'Kapalı'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── BİLDİRİM AYARLARI ── */}
          <View style={styles.section}>
            <SectionTitle title="Bildirimler" icon="notifications-outline" />
            <View style={styles.settingsCard}>
              <SettingRow icon="briefcase-outline" label="Yeni İş İlanı" isSwitch switchValue={notifNewJob} onSwitch={setNotifNewJob} showArrow={false} />
              <SettingRow icon="chatbubble-outline" label="Yeni Mesaj" isSwitch switchValue={notifMessage} onSwitch={setNotifMessage} showArrow={false} />
              <SettingRow icon="calendar-outline" label="Randevu Hatırlatma" isSwitch switchValue={notifAppointment} onSwitch={setNotifAppointment} showArrow={false} />
            </View>
          </View>

          {/* ── HESAP ── */}
          <View style={styles.section}>
            <SectionTitle title="Hesap" icon="person-outline" />
            <View style={styles.settingsCard}>
              <SettingRow icon="lock-closed-outline" label="Şifre Değiştir" onPress={() => setShowChangePassword(true)} />
              <SettingRow icon="shield-checkmark-outline" label="Gizlilik Ayarları" onPress={() => setShowPrivacy(true)} />
              <SettingRow icon="help-outline" label="Yardım Merkezi" onPress={() => setShowHelp(true)} />
              <SettingRow icon="information-circle-outline" label="Hakkında" value="v1.0.0" onPress={() => setShowAbout(true)} />
            </View>
          </View>

          {/* ── ÇIKIŞ YAP ── */}
          <View style={[styles.section, { marginBottom: 120 }]}>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.signOutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── MODALLAR ── */}
      <EditSalonModal
        visible={showEditSalon}
        onClose={() => setShowEditSalon(false)}
        avatarUri={avatarUri}
        onAvatarChange={setAvatarUri}
      />
      <AddServiceModal
        visible={showAddService}
        onClose={() => setShowAddService(false)}
        onAdd={(service) => setServices(prev => [...prev, service])}
      />
      <WorkingHoursModal
        visible={showWorkingHours}
        onClose={() => setShowWorkingHours(false)}
        hours={workingHours}
        onSave={setWorkingHours}
      />
      <ChangePasswordModal visible={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.15, top: -100, right: -80 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#A78BFA', opacity: 0.08, bottom: 300, left: -60 },
  scrollContent: { paddingTop: 56, paddingBottom: 140 },
  salonCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  salonCardGradient: { padding: SPACING.xl, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary },
  avatarEmoji: { fontSize: 40 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A0533' },
  salonName: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  salonBio: { fontSize: FONTS.small, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  salonMeta: { gap: 6, alignItems: 'center', marginBottom: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '22', paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  editBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.xl },
  statCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  statCardGradient: { padding: SPACING.sm, alignItems: 'center', gap: 4, minHeight: 80, justifyContent: 'center' },
  statValue: { fontSize: FONTS.medium, fontWeight: 'bold' },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  emptyServices: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  emptyServicesText: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyServicesHint: { fontSize: FONTS.small, color: COLORS.textMuted, textAlign: 'center' },
  serviceCategoryGroup: { marginBottom: SPACING.md },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  categoryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  serviceCategoryTitle: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  categoryLine: { flex: 1, height: 1, backgroundColor: COLORS.primary + '33' },
  serviceCard: { borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  serviceCardGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  serviceIconWrapper: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: FONTS.medium, fontWeight: '600', color: COLORS.textPrimary },
  serviceMetaRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 3 },
  serviceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  serviceMetaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  serviceRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  servicePrice: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.primary },
  serviceDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.error + '18', justifyContent: 'center', alignItems: 'center' },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  specChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  specChipActive: { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
  specText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  specTextActive: { color: COLORS.primary, fontWeight: '700' },
  hoursCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  hoursDay: { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  hoursTime: { fontSize: FONTS.small, color: COLORS.textPrimary, fontWeight: '600' },
  settingsCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.xl, backgroundColor: COLORS.error + '18', borderWidth: 1, borderColor: COLORS.error + '44' },
  signOutText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.error },
});