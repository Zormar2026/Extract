import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';

const TABS = [
  { key: 'home', label: 'EXTRACT', icon: 'flash' },
  { key: 'library', label: 'LIBRARY', icon: 'library' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <View style={styles.container}>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'library' && (
        <LibraryScreen onSelectItem={(item) => {
          // Could navigate to detail view; for now just switch to home
          setActiveTab('home');
        }} />
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={active ? colors.goldPrimary : colors.textTertiary}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E0E15',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    ...typography.label,
    color: colors.textTertiary,
    fontSize: 9,
  },
  tabLabelActive: {
    color: colors.goldPrimary,
  },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.goldPrimary,
    marginTop: 2,
  },
});
