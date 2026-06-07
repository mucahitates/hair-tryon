// ─────────────────────────────────────────────────────────────
// MÜŞTERİ PROFİL EKRANI (app/(customer)/profile.tsx)
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
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

// 🔥 Firebase Importları
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../src/services/firebase';
import { CustomerProfile, HairDNA, User } from '../../src/types';

const { width } = Dimensions.get('window');

const HAIR_DNA_OPTIONS = {
  type: ['Düz', 'Dalgalı', 'Kıvırcık', 'Afro'],
  length: ['Kısa', 'Orta', 'Uzun', 'Çok Uzun'],
  thickness: ['İnce', 'Orta', 'Kalın'],
  condition: ['Sağlıklı', 'Normal', 'Hasarlı', 'Çok Hasarlı'],
  scalp: ['Normal', 'Yağlı', 'Kuru', 'Hassas', 'Kepekli'],
};

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

// ─── MODAL WRAPPER ─────────────────────────────────────────
function BottomModal({ visible, onClose, title, children, showSave, onSave, saveLabel, isSaving }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
  showSave?: boolean; onSave?: () => void; saveLabel?: string; isSaving?: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: false }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalWrapStyles.overlay}>
        <Animated.View style={[modalWrapStyles.container, { transform: [{ translateY: slideAnim }] }]}>
          <View style={modalWrapStyles.header}>
            <Text style={modalWrapStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalWrapStyles.closeBtn} disabled={isSaving}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
          {showSave && onSave && (
            <View style={modalWrapStyles.footer}>
              <TouchableOpacity style={modalWrapStyles.saveBtn} onPress={onSave} disabled={isSaving}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[modalWrapStyles.saveBtnGradient, isSaving && { opacity: 0.7 }]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={modalWrapStyles.saveBtnText}>{saveLabel || 'Kaydet'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalWrapStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1A0533', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', borderTopWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  saveBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
});

// ─── HAIR DNA MODALI ───────────────────────────────────────
function HairDNAModal({ visible, onClose, hairDNA, onSave }: {
  visible: boolean; onClose: () => void; hairDNA: any; onSave: (data: any) => void;
}) {
  const [local, setLocal] = useState(hairDNA);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setLocal(hairDNA); }, [hairDNA]);

  const labels: Record<string, string> = {
    type: '💧 Saç Tipi', length: '📏 Saç Uzunluğu',
    thickness: '🔍 Saç Kalınlığı', condition: '✨ Saç Durumu', scalp: '🌿 Kafa Derisi',
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(local);
    setIsSaving(false);
    onClose();
  };

  return (
    <BottomModal
      visible={visible} onClose={onClose} title="Saç Kimliğim"
      showSave onSave={handleSave} saveLabel="Kaydet" isSaving={isSaving}
    >
      {Object.entries(HAIR_DNA_OPTIONS).map(([key, options]) => (
        <View key={key} style={dnaStyles.section}>
          <Text style={dnaStyles.sectionTitle}>{labels[key]}</Text>
          <View style={dnaStyles.optionsRow}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[dnaStyles.chip, local[key] === option && dnaStyles.chipActive]}
                onPress={() => setLocal({ ...local, [key]: option })}
              >
                <Text style={[dnaStyles.chipText, local[key] === option && dnaStyles.chipTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </BottomModal>
  );
}

const dnaStyles = StyleSheet.create({
  section: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  sectionTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
});

// ─── PROFİL DÜZENLEME MODALI ───────────────────────────────
function EditProfileModal({ visible, onClose, user, onSaveProfile }: {
  visible: boolean; onClose: () => void; user: any; onSaveProfile: (data: any) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.photoURL || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDisplayName(user?.displayName || '');
      setPhone(user?.phone || '');
      setAvatarUri(user?.photoURL || null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveProfile({ displayName, phone, photoURL: avatarUri });
    setIsSaving(false);
    onClose();
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Profili Düzenle"
      showSave onSave={handleSave} saveLabel="Kaydet" isSaving={isSaving}
    >
      <View style={editStyles.content}>
        <TouchableOpacity style={editStyles.avatarSection} onPress={async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // <-- Doğru kullanım bu şekilde
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
          }
        }}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={[editStyles.avatar, { borderRadius: 45 }]} />
          ) : (
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={editStyles.avatar}>
              <Text style={editStyles.avatarText}>{user?.displayName?.[0]?.toUpperCase() || '👤'}</Text>
            </LinearGradient>
          )}
          <View style={editStyles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </View>
          <Text style={editStyles.avatarHint}>Fotoğrafı değiştir</Text>
        </TouchableOpacity>

        <Text style={editStyles.label}>Ad Soyad</Text>
        <View style={editStyles.inputWrapper}>
          <TextInput style={editStyles.input} value={displayName} onChangeText={setDisplayName} placeholderTextColor={COLORS.textMuted} />
        </View>

        <Text style={editStyles.label}>Telefon</Text>
        <View style={editStyles.inputWrapper}>
          <TextInput style={editStyles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
        </View>

        <Text style={editStyles.label}>Email (değiştirilemez)</Text>
        <View style={[editStyles.inputWrapper, { opacity: 0.5 }]}>
          <TextInput style={editStyles.input} value={user?.email || ''} editable={false} />
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} />
        </View>
      </View>
    </BottomModal>
  );
}

const editStyles = StyleSheet.create({
  content: { padding: SPACING.lg },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  avatarEditBadge: { position: 'absolute', bottom: 20, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A0533' },
  avatarHint: { fontSize: FONTS.small, color: COLORS.primary, marginTop: 30 },
  label: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular },
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
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) newErrors.old = 'Eski şifre gerekli';
    if (newPassword.length < 6) newErrors.new = 'Yeni şifre en az 6 karakter olmalı';
    if (newPassword !== confirmPassword) newErrors.confirm = 'Şifreler uyuşmuyor';
    if (newPassword === oldPassword) newErrors.new = 'Yeni şifre eski şifreyle aynı olamaz';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);

        Alert.alert('Başarılı', 'Şifreniz güvenli bir şekilde güncellendi.');
        setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setErrors({});
        onClose();
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setErrors({ old: 'Eski şifre hatalı' });
      } else {
        Alert.alert('Hata', 'Şifre güncellenirken bir sorun oluştu.');
      }
    } finally {
      setIsSaving(false);
    }
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
    <BottomModal visible={visible} onClose={onClose} title="Şifre Değiştir"
      showSave onSave={handleSave} saveLabel="Güncelle" isSaving={isSaving}
    >
      <View style={pwStyles.content}>
        <InputField
          label="Eski Şifre"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggle={() => setShowOld(!showOld)}
          error={errors.old}
          placeholder="Mevcut şifreniz"
        />
        <InputField
          label="Yeni Şifre"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
          error={errors.new}
          placeholder="En az 6 karakter"
        />
        <InputField
          label="Yeni Şifre Tekrar"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          error={errors.confirm}
          placeholder="Yeni şifreyi tekrar girin"
        />

        {newPassword.length > 0 && (
          <View style={pwStyles.strengthWrapper}>
            <Text style={pwStyles.strengthLabel}>Şifre Güçlülüğü:</Text>
            <View style={pwStyles.strengthBars}>
              {[1, 2, 3, 4].map((level) => {
                const strength = newPassword.length < 6 ? 1 : newPassword.length < 8 ? 2 : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
                const colors = ['#F87171', '#FFB844', '#34D399', '#A78BFA'];
                return (
                  <View
                    key={level}
                    style={[pwStyles.strengthBar, { backgroundColor: level <= strength ? colors[strength - 1] : 'rgba(255,255,255,0.1)' }]}
                  />
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
function PrivacyModal({ visible, onClose, user }: { visible: boolean; onClose: () => void; user: any }) {
  const [profileVisible, setProfileVisible] = useState(user?.settings?.profileVisible ?? true);
  const [showActivity, setShowActivity] = useState(user?.settings?.showActivity ?? true);
  const [allowMessages, setAllowMessages] = useState(user?.settings?.allowMessages ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.profileVisible': profileVisible,
        'settings.showActivity': showActivity,
        'settings.allowMessages': allowMessages
      });
      Alert.alert('Başarılı', 'Gizlilik ayarlarınız güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Gizlilik Ayarları"
      showSave onSave={handleSave} saveLabel="Kaydet" isSaving={isSaving}
    >
      <View style={privStyles.content}>
        <Text style={privStyles.desc}>
          Bu ayarlar profilinizin ve aktivitelerinizin başkaları tarafından görünürlüğünü kontrol eder.
        </Text>

        <View style={privStyles.card}>
          <View style={privStyles.row}>
            <View style={privStyles.rowLeft}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={privStyles.rowTitle}>Profilimi Herkese Göster</Text>
                <Text style={privStyles.rowDesc}>Kuaförler profilinizi görebilir</Text>
              </View>
            </View>
            <Switch value={profileVisible} onValueChange={setProfileVisible}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
              thumbColor={profileVisible ? COLORS.primary : COLORS.textMuted} />
          </View>

          <View style={privStyles.divider} />

          <View style={privStyles.row}>
            <View style={privStyles.rowLeft}>
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={privStyles.rowTitle}>Aktivitemi Göster</Text>
                <Text style={privStyles.rowDesc}>Son görülme zamanı gösterilir</Text>
              </View>
            </View>
            <Switch value={showActivity} onValueChange={setShowActivity}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
              thumbColor={showActivity ? COLORS.primary : COLORS.textMuted} />
          </View>

          <View style={privStyles.divider} />

          <View style={privStyles.row}>
            <View style={privStyles.rowLeft}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={privStyles.rowTitle}>Mesaj Almaya İzin Ver</Text>
                <Text style={privStyles.rowDesc}>Sadece iş ilanı olan kuaförler</Text>
              </View>
            </View>
            <Switch value={allowMessages} onValueChange={setAllowMessages}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
              thumbColor={allowMessages ? COLORS.primary : COLORS.textMuted} />
          </View>
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
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  rowTitle: { fontSize: FONTS.regular, fontWeight: '600', color: COLORS.textPrimary },
  rowDesc: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
});

// ─── ARKADAŞINI DAVET ET MODALI ────────────────────────────
function InviteModal({ visible, onClose, user }: { visible: boolean; onClose: () => void; user: any }) {
  const referralCode = user?.referralCode || 'HAIR-PROMO';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✂️ Hair Tryon uygulamasında saç stilini AI ile denemek harika! Davet kodumu kullanarak üye ol, indirimli coin kazan: ${referralCode}\nUygulamayı hemen indir!`,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Arkadaşını Davet Et">
      <View style={inviteStyles.content}>
        <LinearGradient
          colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
          style={inviteStyles.heroBanner}
        >
          <Text style={inviteStyles.heroEmoji}>🎁</Text>
          <Text style={inviteStyles.heroTitle}>Her davet = +10 Coin!</Text>
          <Text style={inviteStyles.heroDesc}>
            Arkadaşın ilk işini tamamladığında sen 10 coin, arkadaşın 5 coin kazanır.
          </Text>
        </LinearGradient>

        <Text style={inviteStyles.codeLabel}>Davet Kodun</Text>
        <TouchableOpacity
          style={inviteStyles.codeBox}
          onPress={() => Alert.alert('Kopyalandı!', `${referralCode} kodu panoya kopyalandı.`)}
        >
          <Text style={inviteStyles.codeText}>{referralCode}</Text>
          <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={inviteStyles.shareBtn} onPress={handleShare}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={inviteStyles.shareBtnGradient}
          >
            <Ionicons name="share-outline" size={20} color={COLORS.white} />
            <Text style={inviteStyles.shareBtnText}>Paylaş</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={inviteStyles.rulesCard}>
          <Text style={inviteStyles.rulesTitle}>📋 Kurallar</Text>
          {[
            'Arkadaşın uygulamaya kayıt olmalı',
            'İlk işini tamamlamalı',
            'Coin 30 gün içinde hesabına geçer',
            'Sınırsız davet yapabilirsin',
          ].map((rule, i) => (
            <View key={i} style={inviteStyles.ruleRow}>
              <View style={inviteStyles.ruleDot} />
              <Text style={inviteStyles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    </BottomModal>
  );
}

const inviteStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  heroBanner: { borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary },
  heroDesc: { fontSize: FONTS.small, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  codeLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44', padding: SPACING.md },
  codeText: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 2 },
  shareBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  shareBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 14 },
  shareBtnText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.white },
  rulesCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  rulesTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ruleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  ruleText: { fontSize: FONTS.small, color: COLORS.textSecondary },
});

// ─── ABONELİKLERİM MODALI ──────────────────────────────────
function SubscriptionsModal({ visible, onClose, list }: { visible: boolean; onClose: () => void; list: any[] }) {
  return (
    <BottomModal visible={visible} onClose={onClose} title="Aboneliklerim">
      <View style={subStyles.content}>
        {list.length === 0 ? (
          <View style={subStyles.emptyWrapper}>
            <LinearGradient
              colors={[COLORS.primary + '22', COLORS.primaryDark + '11']}
              style={subStyles.emptyIcon}
            >
              <Ionicons name="card-outline" size={40} color={COLORS.primary} />
            </LinearGradient>
            <Text style={subStyles.emptyTitle}>Aktif abonelik yok</Text>
            <Text style={subStyles.emptyDesc}>
              Favori kuaförünüzden aylık paket satın alarak düzenli bakım indirimlerinden yararlanabilirsiniz.
            </Text>
          </View>
        ) : (
          list.map((sub) => (
            <View key={sub.id} style={subStyles.infoCard}>
              <View style={subStyles.pkgRow}>
                <Text style={subStyles.pkgEmoji}>👑</Text>
                <View style={subStyles.pkgInfo}>
                  <Text style={subStyles.pkgTitle}>{sub.name || 'Premium Paket'}</Text>
                  <Text style={subStyles.pkgDesc}>{sub.description || 'Aktif Abonelik'}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.success, marginTop: 4 }}>Yenilenme Tarihi: {sub.renewDate || 'Aylık'}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={subStyles.infoCard}>
          <Text style={subStyles.infoTitle}>Abonelik Avantajları</Text>
          {[
            { emoji: '💇', title: 'Aylık Kesim Paketi', desc: 'Ayda 1 kesim + fön' },
            { emoji: '✨', title: 'Aylık Bakım Paketi', desc: 'Ayda 1 bakım + maske' },
            { emoji: '👑', title: 'Premium Paket', desc: 'Tüm hizmetlerde %20 indirim' },
          ].map((pkg, i) => (
            <View key={i} style={subStyles.pkgRow}>
              <Text style={subStyles.pkgEmoji}>{pkg.emoji}</Text>
              <View style={subStyles.pkgInfo}>
                <Text style={subStyles.pkgTitle}>{pkg.title}</Text>
                <Text style={subStyles.pkgDesc}>{pkg.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </BottomModal>
  );
}

const subStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.lg },
  emptyWrapper: { alignItems: 'center', gap: SPACING.md },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textSecondary },
  emptyDesc: { fontSize: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.md },
  infoTitle: { fontSize: FONTS.medium, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  pkgRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  pkgEmoji: { fontSize: 28 },
  pkgInfo: { flex: 1 },
  pkgTitle: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.textPrimary },
  pkgDesc: { fontSize: FONTS.small, color: COLORS.textMuted, marginTop: 2 },
});

// ─── DESTEK MODALLARI ──────────────────────────────────────
function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const faqs = [
    { q: 'Nasıl iş ilanı oluşturabilirim?', a: 'AI Saç ekranından saç modelinizi deneyin ve "İş İlanı Oluştur" butonuna basın.' },
    { q: 'Coin nasıl kazanabilirim?', a: 'İş tamamlama, yorum yazma, arkadaş daveti ve günlük giriş ile coin kazanabilirsiniz.' },
    { q: 'Randevumu nasıl iptal ederim?', a: 'Randevularım sekmesinden ilgili randevuyu bulun ve "İptal Et" butonuna basın.' },
    { q: 'Kuaföre nasıl mesaj atabilirim?', a: 'Kuaför profilindeki "Mesaj At" butonuna veya Sohbetler sekmesine gidin.' },
  ];

  return (
    <BottomModal visible={visible} onClose={onClose} title="Yardım Merkezi">
      <View style={helpStyles.content}>
        <Text style={helpStyles.sectionTitle}>Sık Sorulan Sorular</Text>
        {faqs.map((faq, i) => (
          <View key={i} style={helpStyles.faqCard}>
            <View style={helpStyles.faqQuestion}>
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

function ContactModal({ visible, onClose, user }: { visible: boolean; onClose: () => void; user: any }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen konu ve mesajınızı yazın.');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'supportMessages'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || '',
        subject,
        message,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      Alert.alert('Gönderildi', 'Mesajınız başarıyla iletildi, en kısa sürede yanıtlayacağız.');
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomModal visible={visible} onClose={onClose} title="Bize Ulaşın"
      showSave onSave={handleSend} saveLabel="Gönder" isSaving={isSaving}
    >
      <View style={helpStyles.content}>
        <View style={helpStyles.contactInfo}>
          <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
          <Text style={helpStyles.contactText}>destek@hairtryon.com</Text>
        </View>

        <Text style={helpStyles.inputLabel}>Konu</Text>
        <View style={helpStyles.inputWrapper}>
          <TextInput
            style={helpStyles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Örn: Uygulama Hatası"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <Text style={helpStyles.inputLabel}>Mesaj</Text>
        <View style={[helpStyles.inputWrapper, { alignItems: 'flex-start' }]}>
          <TextInput
            style={[helpStyles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Detaylı olarak sorununuzu veya önerinizi yazın..."
            placeholderTextColor={COLORS.textMuted}
            multiline
          />
        </View>
      </View>
    </BottomModal>
  );
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <BottomModal visible={visible} onClose={onClose} title="Hakkında">
      <View style={helpStyles.content}>
        <View style={aboutStyles.logoSection}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={aboutStyles.logo}>
            <Text style={{ fontSize: 36 }}>✂️</Text>
          </LinearGradient>
          <Text style={aboutStyles.appName}>Hair Tryon</Text>
          <Text style={aboutStyles.version}>Versiyon 1.0.0</Text>
        </View>

        <View style={aboutStyles.infoCard}>
          {[
            { label: 'Versiyon', value: '1.0.0' },
            { label: 'Geliştirici', value: 'Hair Tryon Team' },
            { label: 'İletişim', value: 'info@hairtryon.com' },
          ].map((item, i) => (
            <View key={i} style={aboutStyles.infoRow}>
              <Text style={aboutStyles.infoLabel}>{item.label}</Text>
              <Text style={aboutStyles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={aboutStyles.legal}>
          © 2026 Hair Tryon. Tüm hakları saklıdır.
        </Text>
      </View>
    </BottomModal>
  );
}

const helpStyles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  sectionTitle: { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  faqCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  faqQuestion: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  qText: { flex: 1, fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.textPrimary },
  aText: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 20, paddingLeft: 24 },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary + '18', padding: SPACING.md, borderRadius: RADIUS.md },
  contactText: { fontSize: FONTS.regular, color: COLORS.primary, fontWeight: '600' },
  inputLabel: { fontSize: FONTS.small, color: COLORS.textMuted, fontWeight: '600' },
  inputWrapper: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { paddingVertical: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.regular, width: '100%' },
});

const aboutStyles = StyleSheet.create({
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
export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, signOut } = useAuthStore();

  // Firestore Real-time State'leri
  const [realUser, setRealUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<CustomerProfile | null>(null);
  const [coinTransactions, setCoinTransactions] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [hairDNA, setHairDNA] = useState<HairDNA>({
    type: 'Dalgalı', length: 'Uzun', thickness: 'Orta', condition: 'Normal', scalp: 'Normal',
  });

  // Modal state'leri
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHairDNA, setShowHairDNA] = useState(false);
  const [showCoinHistory, setShowCoinHistory] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Bildirim ayarları
  const [notifNewBid, setNotifNewBid] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifAppointment, setNotifAppointment] = useState(true);
  const [notifCampaign, setNotifCampaign] = useState(false);

  // Animasyonlar
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(20)).current;

  // ─── GERÇEK ZAMANLI FİRESTORE DİNLEYİCİLERİ ───
  useEffect(() => {
    if (!authUser?.uid) return;

    // 1. Ana Kullanıcı Dinleyici (Referral Code Kontrolü ile)
    const unsubUser = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as User;
        setRealUser(data);

        // Eğer veritabanında referralCode yoksa otomatik oluşturup kaydet
        if (!data.referralCode) {
          const generatedCode = 'HAIR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          updateDoc(doc(db, 'users', authUser.uid), { referralCode: generatedCode });
        }

        if (data.settings?.notifications) {
          setNotifNewBid(data.settings.notifications.newBid ?? true);
          setNotifMessage(data.settings.notifications.message ?? true);
          setNotifAppointment(data.settings.notifications.appointment ?? true);
          setNotifCampaign(data.settings.notifications.campaign ?? false);
        }
      }
    });

    // 2. Müşteri Profili Dinleyici
    const unsubProfile = onSnapshot(doc(db, 'customerProfiles', authUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CustomerProfile;
        setProfileData(data);
        if (data.hairDNA) {
          setHairDNA(data.hairDNA);
        }
      }
    });

    // 3. Coin Geçmişi Dinleyici
    const qCoins = query(
      collection(db, 'users', authUser.uid, 'coinTransactions'),
      orderBy('createdAt', 'desc')
    );
    const unsubCoins = onSnapshot(qCoins, (snapshot) => {
      setCoinTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Değerlendirmelerim Dinleyici
    const qReviews = query(
      collection(db, 'reviews'),
      where('customerId', '==', authUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      setMyReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Aboneliklerim Dinleyici
    const unsubSubs = onSnapshot(collection(db, 'users', authUser.uid, 'subscriptions'), (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUser();
      unsubProfile();
      unsubCoins();
      unsubReviews();
      unsubSubs();
    };
  }, [authUser?.uid]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(contentAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  }, []);

  // ─── PROFİL & FOTOĞRAF YÜKLEME (STORAGE ENTEGRASYONU) ───
  const handleSaveProfile = async (updatedData: any) => {
    if (!authUser?.uid) return;
    try {
      let finalPhotoURL = updatedData.photoURL;

      // Eğer seçilen fotoğraf yerel bir cihaz URI'si ise Firebase Storage'a yükle
      if (finalPhotoURL && (finalPhotoURL.startsWith('file://') || finalPhotoURL.startsWith('content://'))) {
        const response = await fetch(finalPhotoURL);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${authUser.uid}`);
        await uploadBytes(storageRef, blob);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', authUser.uid), {
        displayName: updatedData.displayName,
        phone: updatedData.phone,
        photoURL: finalPhotoURL
      });
      Alert.alert('Başarılı', 'Profiliniz ve fotoğrafınız güncellendi.');
    } catch (error) {
      console.error('Profil Güncelleme Hatası:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir sorun oluştu.');
    }
  };

  const handleSaveHairDNA = async (newDNA: HairDNA) => {
    if (!authUser?.uid) return;
    try {
      await updateDoc(doc(db, 'customerProfiles', authUser.uid), { hairDNA: newDNA });
      Alert.alert('Başarılı', 'Saç kimliğiniz güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Kaydedilirken bir hata oluştu.');
    }
  };

  const handleNotificationSwitch = async (key: string, value: boolean) => {
    if (!authUser?.uid) return;
    if (key === 'newBid') setNotifNewBid(value);
    if (key === 'message') setNotifMessage(value);
    if (key === 'appointment') setNotifAppointment(value);
    if (key === 'campaign') setNotifCampaign(value);

    try {
      await updateDoc(doc(db, 'users', authUser.uid), {
        [`settings.notifications.${key}`]: value
      });
    } catch (error) {
      console.error('Bildirim ayarı kaydedilemedi', error);
    }
  };

  const handleDeleteReview = (id: string) => {
    Alert.alert('Yorumu Sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'reviews', id));
          } catch (error) {
            Alert.alert('Hata', 'Yorum silinemedi.');
          }
        }
      },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const displayUser = realUser || authUser;
  const userCoinBalance = displayUser?.coinBalance || 0;
  const nextRewardTarget = 50;
  const coinProgress = (userCoinBalance / nextRewardTarget) * 100;

  const formatDate = (timestamp?: any) => {
    if (!timestamp) return 'Yeni Üye';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const allowedDNAKeys = ['type', 'length', 'thickness', 'condition', 'scalp'];

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

        {/* ── PROFİL KARTI ── */}
        <Animated.View style={[styles.profileCard, { opacity: headerAnim }]}>
          <LinearGradient
            colors={[COLORS.primaryDark + '44', COLORS.primary + '22']}
            style={styles.profileCardGradient}
          >
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowEditProfile(true)}>
              {displayUser?.photoURL ? (
                <Image source={{ uri: displayUser.photoURL }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayUser?.displayName?.[0]?.toUpperCase() || '👤'}</Text>
                </LinearGradient>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.displayName}>{displayUser?.displayName || 'Kullanıcı'}</Text>
            <Text style={styles.email}>{displayUser?.email || 'email@adres.com'}</Text>

            <View style={styles.profileMeta}>
              {displayUser?.city && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{displayUser.city}</Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>Üye: {formatDate(displayUser?.createdAt)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditProfile(true)}>
              <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Profili Düzenle</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentAnim }] }}>

          {/* ── İSTATİSTİKLER ── */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Toplam İş', value: profileData?.totalJobs || 0, icon: 'briefcase-outline', color: COLORS.primary },
              { label: 'Harcama', value: `₺${profileData?.totalSpent || 0}`, icon: 'cash-outline', color: '#34D399' },
              { label: 'İptal Oranı', value: `%${profileData?.cancelRate || 0}`, icon: 'close-circle-outline', color: '#F87171' },
              { label: 'Takip', value: profileData?.followingCount || 0, icon: 'people-outline', color: '#A78BFA' },
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

          {/* ── COİN SİSTEMİ ── */}
          <View style={styles.section}>
            <SectionTitle title="Coin Bakiyem" icon="wallet-outline" action="Geçmiş" onAction={() => setShowCoinHistory(true)} />
            <View style={styles.coinCard}>
              <LinearGradient colors={['rgba(212,160,23,0.2)', 'rgba(212,160,23,0.08)']} style={styles.coinCardGradient}>
                <View style={styles.coinHeader}>
                  <View style={styles.coinLeft}>
                    <Text style={styles.coinEmoji}>🪙</Text>
                    <View>
                      <Text style={styles.coinBalance}>{userCoinBalance}</Text>
                      <Text style={styles.coinLabel}>Coin</Text>
                    </View>
                  </View>
                  <View style={styles.coinRight}>
                    <Text style={styles.coinRewardLabel}>Sonraki ödül</Text>
                    <Text style={styles.coinReward}>{Math.max(0, nextRewardTarget - userCoinBalance)} coin kaldı</Text>
                  </View>
                </View>
                <View style={styles.coinProgressWrapper}>
                  <View style={styles.coinProgressBg}>
                    <View style={[styles.coinProgressFill, { width: `${Math.min(coinProgress, 100)}%` }]} />
                  </View>
                  <Text style={styles.coinProgressText}>{userCoinBalance}/{nextRewardTarget} = ₺50 indirim</Text>
                </View>
                <View style={styles.coinEarnRow}>
                  {[
                    { label: 'İş tamamla', value: '+coin' },
                    { label: 'Yorum yaz', value: '+2' },
                    { label: 'Davet et', value: '+10' },
                    { label: 'Giriş yap', value: '+1' },
                  ].map((item) => (
                    <View key={item.label} style={styles.coinEarnItem}>
                      <Text style={styles.coinEarnValue}>{item.value}</Text>
                      <Text style={styles.coinEarnLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* ── SAÇ KİMLİĞİ ── */}
          <View style={styles.section}>
            <SectionTitle title="Saç Kimliğim" icon="sparkles-outline" />
            <TouchableOpacity style={styles.hairDNACard} onPress={() => setShowHairDNA(true)} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.primary + '22', COLORS.primaryDark + '11']} style={styles.hairDNAGradient}>
                <View style={styles.hairDNAGrid}>
                  {Object.entries(hairDNA).map(([key, value]) => {
                    if (!allowedDNAKeys.includes(key) || !value) return null;

                    const icons: Record<string, string> = { type: '💧', length: '📏', thickness: '🔍', condition: '✨', scalp: '🌿' };
                    const labels: Record<string, string> = { type: 'Tip', length: 'Uzunluk', thickness: 'Kalınlık', condition: 'Durum', scalp: 'Kafa Derisi' };

                    return (
                      <View key={key} style={styles.hairDNAItem}>
                        <Text style={styles.hairDNAEmoji}>{icons[key] || '🏷️'}</Text>
                        <Text style={styles.hairDNALabel}>{labels[key] || key}</Text>
                        <Text style={styles.hairDNAValue}>{String(value)}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.hairDNAEditHint}>
                  <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.hairDNAEditText}>Düzenlemek için dokun</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── DEĞERLENDİRMELERİM ── */}
          <View style={styles.section}>
            <SectionTitle title="Değerlendirmelerim" icon="star-outline" action="Tümünü Gör" onAction={() => setShowReviews(true)} />
            <View style={styles.reviewsList}>
              {myReviews.slice(0, 2).map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarEmoji}>{review.hairdresserEmoji || '✂️'}</Text>
                    </View>
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewHairdresser}>{review.hairdresserName}</Text>
                      <Text style={styles.reviewService}>{review.service}</Text>
                    </View>
                    <View style={styles.reviewRight}>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={12} color="#FFB844" />
                        ))}
                      </View>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
              {myReviews.length === 0 && (
                <Text style={{ color: COLORS.textMuted, fontSize: FONTS.small, textAlign: 'center' }}>Henüz değerlendirme bulunmuyor.</Text>
              )}
            </View>
          </View>

          {/* ── BİLDİRİM AYARLARI ── */}
          <View style={styles.section}>
            <SectionTitle title="Bildirimler" icon="notifications-outline" />
            <View style={styles.settingsCard}>
              <SettingRow icon="pricetag-outline" label="Yeni Teklif" isSwitch switchValue={notifNewBid} onSwitch={(v) => handleNotificationSwitch('newBid', v)} showArrow={false} />
              <SettingRow icon="chatbubble-outline" label="Yeni Mesaj" isSwitch switchValue={notifMessage} onSwitch={(v) => handleNotificationSwitch('message', v)} showArrow={false} />
              <SettingRow icon="calendar-outline" label="Randevu Hatırlatma" isSwitch switchValue={notifAppointment} onSwitch={(v) => handleNotificationSwitch('appointment', v)} showArrow={false} />
              <SettingRow icon="megaphone-outline" label="Kampanyalar" isSwitch switchValue={notifCampaign} onSwitch={(v) => handleNotificationSwitch('campaign', v)} showArrow={false} />
            </View>
          </View>

          {/* ── HESAP ── */}
          <View style={styles.section}>
            <SectionTitle title="Hesap" icon="person-outline" />
            <View style={styles.settingsCard}>
              <SettingRow icon="shield-checkmark-outline" label="Gizlilik Ayarları" onPress={() => setShowPrivacy(true)} />
              <SettingRow icon="lock-closed-outline" label="Şifre Değiştir" onPress={() => setShowChangePassword(true)} />
              <SettingRow icon="people-outline" label="Arkadaşını Davet Et" value="+10 coin" onPress={() => setShowInvite(true)} />
              <SettingRow icon="card-outline" label="Aboneliklerim" onPress={() => setShowSubscriptions(true)} />
            </View>
          </View>

          {/* ── DESTEK ── */}
          <View style={styles.section}>
            <SectionTitle title="Destek" icon="help-circle-outline" />
            <View style={styles.settingsCard}>
              <SettingRow icon="help-outline" label="Yardım Merkezi" onPress={() => setShowHelp(true)} />
              <SettingRow icon="chatbox-outline" label="Bize Ulaşın" onPress={() => setShowContact(true)} />
              <SettingRow icon="star-outline" label="Uygulamayı Puanla" onPress={() => Alert.alert('Teşekkürler!', 'App Store\'a yönlendiriliyorsunuz.')} />
              <SettingRow icon="information-circle-outline" label="Hakkında" value="v1.0.0" onPress={() => setShowAbout(true)} />
            </View>
          </View>

          {/* ── ÇIKIŞ YAP ── */}
          <View style={[styles.section, { marginBottom: SPACING.xxl }]}>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.signOutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── MODALLAR ── */}
      <EditProfileModal visible={showEditProfile} onClose={() => setShowEditProfile(false)} user={displayUser} onSaveProfile={handleSaveProfile} />
      <HairDNAModal visible={showHairDNA} onClose={() => setShowHairDNA(false)} hairDNA={hairDNA} onSave={handleSaveHairDNA} />
      <ChangePasswordModal visible={showChangePassword} onClose={() => setShowChangePassword(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} user={displayUser} />
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} user={displayUser} />
      <SubscriptionsModal visible={showSubscriptions} onClose={() => setShowSubscriptions(false)} list={subscriptions} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <ContactModal visible={showContact} onClose={() => setShowContact(false)} user={displayUser} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />

      {/* Coin geçmişi modalı */}
      <BottomModal visible={showCoinHistory} onClose={() => setShowCoinHistory(false)} title="Coin Geçmişi">
        {coinTransactions.length === 0 ? (
          <View style={{ alignItems: 'center', padding: SPACING.xl, gap: SPACING.md }}>
            <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.regular }}>Henüz coin hareketiniz yok.</Text>
          </View>
        ) : (
          coinTransactions.map((tx) => (
            <View key={tx.id} style={coinStyles.txRow}>
              <View style={coinStyles.txIcon}>
                <Text style={{ fontSize: 20 }}>{tx.emoji || '🪙'}</Text>
              </View>
              <View style={coinStyles.txInfo}>
                <Text style={coinStyles.txDesc}>{tx.description}</Text>
                <Text style={coinStyles.txDate}>{formatDate(tx.createdAt)}</Text>
              </View>
              <Text style={[coinStyles.txAmount, { color: tx.amount > 0 ? COLORS.success : COLORS.error }]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
              </Text>
            </View>
          ))
        )}
      </BottomModal>

      {/* Değerlendirmeler modalı */}
      <BottomModal visible={showReviews} onClose={() => setShowReviews(false)} title="Değerlendirmelerim">
        {myReviews.length === 0 ? (
          <View style={{ alignItems: 'center', padding: SPACING.xl, gap: SPACING.md }}>
            <Ionicons name="star-outline" size={40} color={COLORS.textMuted} />
            <Text style={{ color: COLORS.textSecondary, fontSize: FONTS.regular }}>Henüz değerlendirme yok</Text>
          </View>
        ) : (
          myReviews.map((review) => (
            <View key={review.id} style={[styles.reviewCard, { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarEmoji}>{review.hairdresserEmoji || '✂️'}</Text>
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewHairdresser}>{review.hairdresserName}</Text>
                  <Text style={styles.reviewService}>{review.service}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={12} color="#FFB844" />
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteReview(review.id)}
                    style={reviewDeleteStyles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                    <Text style={reviewDeleteStyles.deleteText}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))
        )}
      </BottomModal>

    </View>
  );
}

const reviewDeleteStyles = StyleSheet.create({
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.error + '18',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.error + '44',
  },
  deleteText: { fontSize: 10, color: COLORS.error, fontWeight: '700' },
});

const coinStyles = StyleSheet.create({
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.md },
  txIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: FONTS.small, fontWeight: '600', color: COLORS.textPrimary },
  txDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txAmount: { fontSize: FONTS.medium, fontWeight: 'bold' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  orb1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#7C3AED', opacity: 0.15, top: -100, right: -80 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#A78BFA', opacity: 0.08, bottom: 300, left: -60 },
  scrollContent: { paddingTop: 56, paddingBottom: 140 },
  profileCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.xl, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  profileCardGradient: { padding: SPACING.xl, alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1A0533' },
  displayName: { fontSize: FONTS.xlarge, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  email: { fontSize: FONTS.small, color: COLORS.textMuted, marginBottom: SPACING.md },
  profileMeta: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONTS.small, color: COLORS.textMuted },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '22', paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '44' },
  editBtnText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.xl },
  statCard: { width: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  statCardGradient: { padding: SPACING.sm, alignItems: 'center', gap: 4, minHeight: 80, justifyContent: 'center' },
  statValue: { fontSize: FONTS.medium, fontWeight: 'bold' },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  coinCard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: '#D4A01744' },
  coinCardGradient: { padding: SPACING.md, gap: SPACING.md },
  coinHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coinLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  coinEmoji: { fontSize: 32 },
  coinBalance: { fontSize: 28, fontWeight: 'bold', color: '#D4A017' },
  coinLabel: { fontSize: FONTS.small, color: COLORS.textMuted },
  coinRight: { alignItems: 'flex-end' },
  coinRewardLabel: { fontSize: 10, color: COLORS.textMuted },
  coinReward: { fontSize: FONTS.small, color: '#D4A017', fontWeight: '600' },
  coinProgressWrapper: { gap: 4 },
  coinProgressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  coinProgressFill: { height: '100%', backgroundColor: '#D4A017', borderRadius: RADIUS.full },
  coinProgressText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },
  coinEarnRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACING.sm },
  coinEarnItem: { alignItems: 'center', gap: 2 },
  coinEarnValue: { fontSize: FONTS.small, fontWeight: 'bold', color: '#D4A017' },
  coinEarnLabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
  hairDNACard: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  hairDNAGradient: { padding: SPACING.md, gap: SPACING.md },
  hairDNAGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  hairDNAItem: { width: (width - SPACING.lg * 2 - SPACING.sm * 4 - SPACING.md * 2) / 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: COLORS.border },
  hairDNAEmoji: { fontSize: 20 },
  hairDNALabel: { fontSize: 9, color: COLORS.textMuted, textAlign: 'center' },
  hairDNAValue: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  hairDNAEditHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  hairDNAEditText: { fontSize: FONTS.small, color: COLORS.primary, fontWeight: '600' },
  reviewsList: { gap: SPACING.sm },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarEmoji: { fontSize: 18 },
  reviewInfo: { flex: 1 },
  reviewHairdresser: { fontSize: FONTS.small, fontWeight: 'bold', color: COLORS.textPrimary },
  reviewService: { fontSize: 11, color: COLORS.textMuted },
  reviewRight: { alignItems: 'flex-end', gap: 2 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewDate: { fontSize: 10, color: COLORS.textMuted },
  reviewComment: { fontSize: FONTS.small, color: COLORS.textSecondary, lineHeight: 18 },
  settingsCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, borderRadius: RADIUS.xl, backgroundColor: COLORS.error + '18', borderWidth: 1, borderColor: COLORS.error + '44' },
  signOutText: { fontSize: FONTS.regular, fontWeight: 'bold', color: COLORS.error },
});