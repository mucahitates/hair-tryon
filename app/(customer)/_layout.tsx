// Müşteri tab navigation layout
// 2+1+2 düzeni: Ana Sayfa, Keşfet | AI Saç (orta) | İşlerim, Profil
// Her buton arkasında radiuslu kare tab alanı mevcut
// İkonlar yukarı kaydırıldı ve geçiş animasyonları optimize edildi
// useNativeDriver çakışması giderildi

import { Tabs } from 'expo-router';
import { COLORS } from '../../src/constants/theme';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

function TabIcon({ iconName, focused }: { iconName: any; focused: boolean }) {
  // Büyüme (scale) ve yukarı kayma (translateY) animasyon değerleri
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? -12 : -4)).current; 

  // Arka plan renginin pürüzsüz değişimi için interpolasyon (Renk geçişi)
  const bgColorAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        tension: 60,
        friction: 7,
        useNativeDriver: false, // Renk animasyonuyla çakışmamak için false
      }),
      Animated.spring(translateY, {
        toValue: focused ? -12 : -4, 
        tension: 60,
        friction: 7,
        useNativeDriver: false, // Renk animasyonuyla çakışmamak için false
      }),
      Animated.timing(bgColorAnim, {
        toValue: focused ? 1 : 0,
        duration: 250,
        useNativeDriver: false, 
      }),
    ]).start();
  }, [focused]);

  // Şeffaf siyah/gri ile temanın birincil rengi arasında geçiş yapar
  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.03)', `${COLORS.primary}15`], 
  });

  return (
    <Animated.View style={[
      tabStyles.container,
      { transform: [{ scale }, { translateY }], backgroundColor }
    ]}>
      <Ionicons
        name={focused ? iconName : `${iconName}-outline`}
        size={24}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
      
    </Animated.View>
  );
}

function AIButton({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      tension: 80,
      friction: 8,
      useNativeDriver: true, // Sadece transform olduğu için donanım ivmelendirmesi aktif
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={tabStyles.aiWrapper}
    >
      <Animated.View style={[
        tabStyles.aiButton,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Ionicons name="sparkles" size={26} color={COLORS.white} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 14, // Köşeleri radiuslu kare görünümü
    position: 'relative',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 4, 
  },
  // AI Orta Butonu
  aiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24, 
  },
  aiButton: {
    width: 62,
    height: 62,
    borderRadius: 18, 
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark || '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: COLORS.primaryLight || '#fff',
  },
});

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 84, 
          paddingBottom: 14,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-hair"
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <AIButton onPress={props.onPress as () => void} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="briefcase" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" focused={focused} />
          ),
        }}
      />

      {/* Gizli sekmeler */}
      <Tabs.Screen name="chats" options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}