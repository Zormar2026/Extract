import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function MentorMillionaireView({ data }) {
  if (!data) return null;

  return (
    <GlassCard style={styles.card} glowIntensity={0.15}>
      <View style={styles.header}>
        <Ionicons name="videocam" size={14} color="#FFD740" />
        <Text style={styles.headerTitle}>MENTOR MILLIONAIRE SCRIPT</Text>
        <View style={styles.headerLine} />
      </View>

      {data.hook && (
        <View style={styles.section}>
          <Text style={styles.label}>HOOK</Text>
          <Text style={styles.hookText}>"{data.hook}"</Text>
        </View>
      )}

      {data.body && (
        <View style={styles.section}>
          <Text style={styles.label}>BODY</Text>
          <Text style={styles.bodyText}>{data.body}</Text>
        </View>
      )}

      {data.cta && (
        <View style={styles.section}>
          <Text style={styles.label}>CTA</Text>
          <Text style={styles.ctaText}>{data.cta}</Text>
        </View>
      )}

      {data.script && (
        <View style={styles.section}>
          <Text style={styles.label}>FULL SCRIPT</Text>
          <View style={styles.scriptBox}>
            <Text style={styles.scriptText}>{data.script}</Text>
          </View>
        </View>
      )}

      {data.visualNotes?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>VISUAL NOTES</Text>
          {data.visualNotes.map((note, i) => (
            <View key={i} style={styles.visualRow}>
              <Ionicons name="eye" size={12} color={colors.goldDim} />
              <Text style={styles.visualText}>{note}</Text>
            </View>
          ))}
        </View>
      )}

      {data.hashtags?.length > 0 && (
        <View style={styles.hashtagRow}>
          {data.hashtags.map((tag, i) => (
            <Text key={i} style={styles.hashtag}>#{tag}</Text>
          ))}
        </View>
      )}

      {data.estimatedDuration && (
        <Text style={styles.duration}>{data.estimatedDuration}</Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerTitle: { ...typography.label, color: '#FFD740' },
  headerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 215, 64, 0.15)', marginLeft: 8 },
  section: { marginBottom: 14 },
  label: { ...typography.label, color: colors.textTertiary, fontSize: 9, marginBottom: 6 },
  hookText: { ...typography.body, color: '#FFD740', fontSize: 16, fontWeight: '600', fontStyle: 'italic', lineHeight: 24 },
  bodyText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  ctaText: { ...typography.body, color: colors.goldPrimary, fontWeight: '500' },
  scriptBox: { backgroundColor: 'rgba(255, 215, 64, 0.04)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 215, 64, 0.1)' },
  scriptText: { ...typography.body, color: colors.textPrimary, lineHeight: 24, fontSize: 14 },
  visualRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  visualText: { ...typography.body, color: colors.textSecondary, fontSize: 13, flex: 1 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  hashtag: { ...typography.caption, color: colors.goldDim, fontSize: 11 },
  duration: { ...typography.caption, color: colors.textTertiary, fontSize: 10, marginTop: 8, textAlign: 'right' },
});
