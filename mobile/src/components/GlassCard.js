import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export function GlassCard({ children, style, glowIntensity = 0 }) {
  return (
    <View style={[styles.outer, style]}>
      {glowIntensity > 0 && (
        <View style={[styles.glow, { opacity: glowIntensity }]} />
      )}
      <LinearGradient
        colors={['rgba(22, 22, 31, 0.85)', 'rgba(10, 10, 15, 0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.innerBorder}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: colors.goldGlow,
    borderRadius: 36,
    zIndex: -1,
  },
  gradient: {
    borderRadius: 15,
  },
  innerBorder: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: 'rgba(200, 168, 78, 0.06)',
  },
});
