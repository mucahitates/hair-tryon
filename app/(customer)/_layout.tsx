// Müşteri tab navigation layout — çift kavisli tasarım
// Üst koyu kavis: 6 ikon barı
// Alt mor kavis: tıklanabilir AI Saç butonu (Tabs dışında absolute katman)

import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THEME = {
  tabBackground: '#16213E',        // Koyu lacivert — arka plan ile uyumlu
  activeGlow: '#4EFFFF',           // Mor glow — primary renk
  textWhite: '#FFFFFF',
  textMuted: '#8E8E93',
  curveBorder: 'rgba(167, 139, 250, 0.3)', // Mor kenarlık
  aiButton: '#7C3AED',             // Koyu mor — primaryDark
};

function TabIcon({ iconName, label, focused, curveOffset }: { iconName: any; label: string; focused: boolean; curveOffset: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const bottomElementsTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: focused ? -10 : 0,
        tension: 70,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        tension: 70,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bottomElementsTranslateY, {
        toValue: focused ? 0 : 8,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={[tabStyles.wrapper, { top: curveOffset }]}>
      <Animated.View
        style={[tabStyles.glowBackground, { opacity: labelOpacity }]}
      />
      <Animated.View style={[
        tabStyles.iconContainer,
        { transform: [{ translateY }, { scale }] }
      ]}>
        <Ionicons
          name={focused ? iconName : `${iconName}-outline`}
          size={26}
          color={focused ? '#000000' : THEME.textMuted}
          
        />
      </Animated.View>
      <Animated.View style={[
        tabStyles.activeElements,
        {
          opacity: labelOpacity,
          transform: [{ translateY: bottomElementsTranslateY }],
        }
      ]}>
        <View style={tabStyles.indicatorLine} />
        <Text style={tabStyles.label} numberOfLines={1}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    width: 44,
    height: 44,
    backgroundColor: THEME.activeGlow,
    borderRadius: 30,
    shadowColor: THEME.activeGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    opacity: 0.08,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    zIndex: 2,
  },
  activeElements: {
    position: 'absolute',
    bottom: -8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  indicatorLine: {
    width: 40,
    height: 2,
    backgroundColor: THEME.activeGlow,
    borderRadius: 2,
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.activeGlow,
    letterSpacing: 0.4,
  },
});

// Alttaki mor kavisli AI butonu — tıklanabilir, Tabs dışında
function AICurveButton() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <View style={aiStyles.layer} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.replace('/(customer)/ai-hair')}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: false }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: false }).start()}
        style={aiStyles.touchArea}
      >
        <Animated.View style={[aiStyles.curve, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="sparkles" size={18} color={THEME.textWhite} />
          <Text style={aiStyles.label}>AI Saç</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const aiStyles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: -200,
    left: 0,
    right: 0,
    height: 250,
    alignItems: 'center',
    zIndex: 5,
  },
  touchArea: {
    width: width * 0.5,
    alignItems: 'center',
  },
  curve: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    width: width * 1,
    height: 200,
    backgroundColor: THEME.aiButton,
    borderTopLeftRadius: width * 0.85, // Büyük kavis
    borderTopRightRadius: width * 0.85, // Büyük kavis
    paddingTop: 10, // İkonun üstünde boşluk
  },
  label: {
    color: THEME.textWhite,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
  },
});

export default function CustomerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 110,
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: width * 1.5,
                  height: 300,
                  backgroundColor: THEME.tabBackground,
                  borderTopLeftRadius: width * 0.80,
                  borderTopRightRadius: width * 0.80,
                  borderTopWidth: 1.5,
                  borderTopColor: THEME.curveBorder,
                  position: 'absolute',
                  top: 0,
                  shadowColor: THEME.activeGlow,
                  shadowOffset: { width: 0, height: -5 },
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              />
            </View>
          ),
        }}
      >
        <Tabs.Screen name="my-jobs" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="briefcase" label="İşlerim" focused={focused} curveOffset={24} /> ) }} />
        <Tabs.Screen name="explore" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="search" label="Keşfet" focused={focused} curveOffset={-10} /> ) }} />
        <Tabs.Screen name="chats" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="chatbubble" label="Sohbet" focused={focused} curveOffset={-24} /> ) }} />
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="home" label="Ana Sayfa"  focused={focused} curveOffset={-24} /> ) }} />
        <Tabs.Screen name="appointments" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="calendar" label="Randevu" focused={focused} curveOffset={-10} /> ) }} />
        <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => ( <TabIcon iconName="person" label="Profil" focused={focused} curveOffset={24} /> ) }} />
        <Tabs.Screen name="ai-hair" options={{ href: null }} />
      </Tabs>

      {/* Alttaki mor kavisli AI butonu */}
      <AICurveButton />
    </View>
  );
}