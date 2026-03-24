import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { GoldButton } from './GoldButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function AdAdaptationView({ adaptation, onClose }) {
  if (!adaptation) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="color-wand" size={16} color="#FF4081" />
          <Text style={styles.headerTitle}>AD ADAPTATION</Text>
        </View>
        <GoldButton title="BACK" variant="ghost" onPress={onClose} />
      </View>

      {adaptation.productName && (
        <GlassCard style={styles.card} glowIntensity={0.15}>
          <Text style={styles.productLabel}>ADAPTED FOR</Text>
          <Text style={styles.productName}>{adaptation.productName}</Text>
        </GlassCard>
      )}

      {adaptation.hook && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={13} color="#FF4081" />
            <Text style={styles.sectionTitle}>HOOK</Text>
          </View>
          <Text style={styles.hookText}>"{adaptation.hook}"</Text>
        </GlassCard>
      )}

      {adaptation.painPoint && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={13} color="#FF8A65" />
            <Text style={[styles.sectionTitle, { color: '#FF8A65' }]}>PAIN POINT</Text>
          </View>
          <Text style={styles.bodyText}>{adaptation.painPoint}</Text>
        </GlassCard>
      )}

      {adaptation.fullScript && (
        <GlassCard style={styles.card} glowIntensity={0.1}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={13} color={colors.goldPrimary} />
            <Text style={styles.sectionTitle}>FULL SCRIPT</Text>
          </View>
          <Text style={styles.scriptText}>{adaptation.fullScript}</Text>
        </GlassCard>
      )}

      {adaptation.offer && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={13} color="#A5D6A7" />
            <Text style={[styles.sectionTitle, { color: '#A5D6A7' }]}>OFFER</Text>
          </View>
          <Text style={styles.bodyText}>{adaptation.offer}</Text>
        </GlassCard>
      )}

      {adaptation.whyItWillWork && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={13} color="#FFD740" />
            <Text style={[styles.sectionTitle, { color: '#FFD740' }]}>WHY IT WILL WORK</Text>
          </View>
          <Text style={styles.bodyText}>{adaptation.whyItWillWork}</Text>
        </GlassCard>
      )}

      {adaptation.visualDirection?.length > 0 && (
        <GlassCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={13} color="#6DD5FA" />
            <Text style={[styles.sectionTitle, { color: '#6DD5FA' }]}>VISUAL DIRECTION</Text>
          </View>
          {adaptation.visualDirection.map((shot, i) => (
            <View key={i} style={styles.shotRow}>
              <Text style={styles.shotNum}>SHOT {i + 1}</Text>
              <Text style={styles.shotDesc}>{shot}</Text>
            </View>
          ))}
        </GlassCard>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...typography.label, color: '#FF4081', fontSize: 13 },
  card: { marginBottom: 14 },
  productLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9 },
  productName: { ...typography.heading, color: '#FF4081', fontSize: 20, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { ...typography.label, color: colors.goldPrimary },
  hookText: { ...typography.body, color: '#FF4081', fontSize: 16, fontStyle: 'italic', fontWeight: '500', lineHeight: 24 },
  bodyText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  scriptText: { ...typography.body, color: colors.textPrimary, lineHeight: 24, fontSize: 14 },
  shotRow: { marginBottom: 10 },
  shotNum: { ...typography.label, color: '#6DD5FA', fontSize: 9, marginBottom: 2 },
  shotDesc: { ...typography.body, color: colors.textSecondary, fontSize: 13 },
});
