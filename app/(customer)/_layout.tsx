import { Tabs } from 'expo-router';
import { COLORS, FONTS } from '../../src/constants/theme';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.container}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 2,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
          height: 70,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
        
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Ana Sayfa" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Keşfet" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-hair"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✨" label="AI Saç" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💼" label="İşlerim" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}