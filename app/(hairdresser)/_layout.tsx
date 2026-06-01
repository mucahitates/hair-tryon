// ─────────────────────────────────────────────────────────────
// KUAFÖR LAYOUT (app/(hairdresser)/_layout.tsx)
// ─────────────────────────────────────────────────────────────
// Merkezi fan menü — 1 buton basınca 6 buton açılır
// Stack navigation kullanır, custom bottom bar
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Pressable } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── MENÜ İTEMLERİ ─────────────────────────────────────────
const MENU_ITEMS = [
  { name: 'index', label: 'Menü', icon: 'grid-outline', color: '#A78BFA' },
  { name: 'jobs', label: 'İşler', icon: 'briefcase-outline', color: '#34D399' },
  { name: 'appointments', label: 'Takvim', icon: 'calendar-outline', color: '#60A5FA' },
  { name: 'chats', label: 'Sohbet', icon: 'chatbubble-outline', color: '#F472B6' },
  { name: 'portfolio', label: 'Vitrin', icon: 'storefront-outline', color: '#FBBF24' },
  { name: 'profile', label: 'Profil', icon: 'person-outline', color: '#FB923C' },
];

// ─── FAN MENÜ BİLEŞENİ ─────────────────────────────────────
function FanMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Her buton için animasyon değerleri
  const animations = useRef(MENU_ITEMS.map(() => ({
    scale: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  // Merkez buton rotasyon animasyonu
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Fan açılış pozisyonları — yarım daire yukarı doğru
  const getPosition = (index: number) => {
    const total = MENU_ITEMS.length;
    // 200 → 340 derece arası (yukarı yarım daire)
    const startAngle = 200;
    const endAngle = 340;
    const angle = startAngle + (endAngle - startAngle) * (index / (total - 1));
    const radians = (angle * Math.PI) / 180;
    const radius = 170;
    return {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
    };
  };

  const openMenu = () => {
    setIsOpen(true);

    // Overlay fade in
    Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();

    // Merkez buton dönsün
    Animated.spring(rotateAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false }).start();

    // Her butonu sırayla aç
    const anims = MENU_ITEMS.map((_, index) => {
      const pos = getPosition(index);
      return Animated.parallel([
        Animated.spring(animations[index].scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.spring(animations[index].translateX, { toValue: pos.x, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.spring(animations[index].translateY, { toValue: pos.y, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.timing(animations[index].opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]);
    });

    Animated.stagger(50, anims).start();
  };

  const closeMenu = () => {
    // Overlay fade out
    Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: false }).start();

    // Merkez buton geri dönsün
    Animated.spring(rotateAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: false }).start();

    // Her butonu kapat
    const anims = MENU_ITEMS.map((_, index) =>
      Animated.parallel([
        Animated.spring(animations[index].scale, { toValue: 0, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.spring(animations[index].translateX, { toValue: 0, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.spring(animations[index].translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: false }),
        Animated.timing(animations[index].opacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ])
    );

    Animated.stagger(30, [...anims].reverse()).start(() => setIsOpen(false));
  };

  const handleToggle = () => {
    if (isOpen) closeMenu();
    else openMenu();
  };

  const handleNavigate = (name: string) => {
    closeMenu();
    setTimeout(() => {
      const route = name === 'index' ? '/(hairdresser)' : `/(hairdresser)/${name}`;
      router.replace(route as any);
    }, 200);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  // Aktif ekranı bul
  const getActiveName = () => {
    if (pathname === '/(hairdresser)' || pathname === '/(hairdresser)/index') return 'index';
    return pathname.split('/').pop() || 'index';
  };
  const activeName = getActiveName();

  return (
    <>
      {/* Overlay — menü açıkken arka planı karart */}
      {isOpen && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        </Animated.View>
      )}

      {/* Fan menü container */}
      <View style={styles.fanContainer} pointerEvents="box-none">

        {/* Fan butonları */}
        {MENU_ITEMS.map((item, index) => {
          const isActive = activeName === item.name;
          return (
            <Animated.View
              key={item.name}
              style={[
                styles.fanItemWrapper,
                {
                  opacity: animations[index].opacity,
                  transform: [
                    { translateX: animations[index].translateX },
                    { translateY: animations[index].translateY },
                    { scale: animations[index].scale },
                  ],
                },
              ]}
              pointerEvents={isOpen ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={styles.fanItemBtn}
                onPress={() => handleNavigate(item.name)}
                activeOpacity={0.85}
              >
                {/* Aktif ise gradient, değilse düz */}
                {isActive ? (
                  <LinearGradient
                    colors={[item.color, item.color + 'AA']}
                    style={styles.fanItemGradient}
                  >
                    <Ionicons name={item.icon.replace('-outline', '') as any} size={30} color="#fff" />
                  </LinearGradient>
                ) : (
                  <View style={[styles.fanItemGradient, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <Ionicons name={item.icon as any} size={30} color={item.color} />
                  </View>
                )}
                {/* Etiket */}
                <View style={[styles.fanItemLabel, { backgroundColor: item.color + 'EE' }]}>
                  <Text style={styles.fanItemLabelText}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Merkez ana buton */}
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.9} style={styles.centerBtnWrapper}>
          <LinearGradient
            colors={isOpen ? ['#F87171', '#EF4444'] : [COLORS.primary, COLORS.primaryDark]}
            style={styles.centerBtn}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="add" size={32} color="#fff" />
            </Animated.View>
          </LinearGradient>
          {/* Glow efekti */}
          <View style={[styles.centerBtnGlow, { backgroundColor: isOpen ? '#F87171' : COLORS.primary }]} />
        </TouchableOpacity>

      </View>
    </>
  );
}

// ─── ANA LAYOUT ────────────────────────────────────────────
export default function HairdresserLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="appointments" />
        <Stack.Screen name="chats" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="profile" />
      </Stack>

      {/* Fan menü — tüm ekranlarda görünür */}
      <FanMenu />
    </View>
  );
}

// ─── STİLLER ───────────────────────────────────────────────
const styles = StyleSheet.create({
  // Karartma overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 90,
  },
  // Fan menü container — sağ alt köşe
  fanContainer: {
    position: 'absolute',
    bottom: 40,
    left:width / 2 - 32, // Merkezlemek için
    width: 64,
    height: 64,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fan item wrapper
  fanItemWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanItemBtn: {
    alignItems: 'center',
    gap: 1,
  },
  fanItemGradient: {
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    
  },
  // Etiket
  fanItemLabel: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  fanItemLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  // Merkez buton
  centerBtnWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  centerBtnGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
});