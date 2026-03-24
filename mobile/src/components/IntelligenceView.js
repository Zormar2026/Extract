import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { ContentTypeBadge } from './ContentTypeBadge';
import { TypeSpecificView } from './TypeSpecificView';
import { ActionButtons } from './ActionButtons';
import { MentorMillionaireView } from './MentorMillionaireView';
import { AdAdaptationView } from './AdAdaptationView';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

function FadeInSection({ children, delay = 0, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

function SectionHeader({ icon, title, delay }) {
  return (
    <FadeInSection delay={delay}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={14} color={colors.goldPrimary} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
    </FadeInSection>
  );
}

function TagPill({ text, delay }) {
  return (
    <FadeInSection delay={delay}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{text}</Text>
      </View>
    </FadeInSection>
  );
}

export function IntelligenceView({ data, source, result }) {
  const [adaptResult, setAdaptResult] = useState(null);

  if (!data) return null;

  // Show ad adaptation view if we have one
  if (adaptResult) {
    return <AdAdaptationView adaptation={adaptResult} onClose={() => setAdaptResult(null)} />;
  }

  const intel = data.raw ? null : data;
  const contentType = intel?.contentType || 'unknown';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Content Type Badge + Source Info */}
      {source && (
        <FadeInSection delay={0}>
          <GlassCard style={styles.card}>
            <View style={styles.badgeRow}>
              <ContentTypeBadge contentType={contentType} />
            </View>
            <View style={styles.sourceRow}>
              <Ionicons name="videocam" size={16} color={colors.goldPrimary} />
              <Text style={styles.sourceTitle} numberOfLines={2}>
                {source.title || 'Unknown'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              {source.author && <Text style={styles.metaText}>{source.author}</Text>}
              {source.duration && <Text style={styles.metaText}>{source.duration}</Text>}
              {source.views && <Text style={styles.metaText}>{source.views} views</Text>}
            </View>
          </GlassCard>
        </FadeInSection>
      )}

      {/* Action Buttons */}
      {intel && result && (
        <FadeInSection delay={50}>
          <ActionButtons
            result={result}
            contentType={contentType}
            onAdaptResult={setAdaptResult}
          />
        </FadeInSection>
      )}

      {/* Summary */}
      {intel?.summary && (
        <FadeInSection delay={100}>
          <GlassCard style={styles.card} glowIntensity={0.15}>
            <SectionHeader icon="flash" title="Summary" delay={150} />
            <Text style={styles.summaryText}>{intel.summary}</Text>
          </GlassCard>
        </FadeInSection>
      )}

      {/* Type-Specific Intelligence */}
      {intel?.typeSpecific && (
        <FadeInSection delay={180}>
          <TypeSpecificView contentType={contentType} data={intel.typeSpecific} />
        </FadeInSection>
      )}

      {/* Key Topics */}
      {intel?.keyTopics?.length > 0 && (
        <FadeInSection delay={200}>
          <GlassCard style={styles.card}>
            <SectionHeader icon="pricetags" title="Key Topics" delay={250} />
            <View style={styles.tagsWrap}>
              {intel.keyTopics.map((topic, i) => (
                <TagPill key={i} text={topic} delay={280 + i * 50} />
              ))}
            </View>
          </GlassCard>
        </FadeInSection>
      )}

      {/* Key Insights */}
      {intel?.keyInsights?.length > 0 && (
        <FadeInSection delay={300}>
          <GlassCard style={styles.card}>
            <SectionHeader icon="bulb" title="Key Insights" delay={350} />
            {intel.keyInsights.map((insight, i) => (
              <FadeInSection key={i} delay={380 + i * 60}>
                <View style={styles.insightRow}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              </FadeInSection>
            ))}
          </GlassCard>
        </FadeInSection>
      )}

      {/* Quotes */}
      {intel?.quotes?.length > 0 && (
        <FadeInSection delay={400}>
          <GlassCard style={styles.card}>
            <SectionHeader icon="chatbubble-ellipses" title="Notable Quotes" delay={450} />
            {intel.quotes.map((quote, i) => (
              <FadeInSection key={i} delay={480 + i * 60}>
                <View style={styles.quoteBlock}>
                  <View style={styles.quoteLine} />
                  <Text style={styles.quoteText}>"{quote}"</Text>
                </View>
              </FadeInSection>
            ))}
          </GlassCard>
        </FadeInSection>
      )}

      {/* Metadata Strip */}
      {intel && (
        <FadeInSection delay={500}>
          <GlassCard style={styles.card}>
            <View style={styles.metaGrid}>
              {intel.sentiment && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>SENTIMENT</Text>
                  <Text style={styles.metaValue}>{intel.sentiment}</Text>
                </View>
              )}
              {intel.contentType && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>TYPE</Text>
                  <Text style={styles.metaValue}>{intel.contentType}</Text>
                </View>
              )}
              {intel.targetAudience && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>AUDIENCE</Text>
                  <Text style={styles.metaValue}>{intel.targetAudience}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </FadeInSection>
      )}

      {/* Script Hook */}
      {intel?.scriptHook && (
        <FadeInSection delay={600}>
          <GlassCard style={styles.card} glowIntensity={0.2}>
            <SectionHeader icon="megaphone" title="Content Hook" delay={650} />
            <Text style={styles.hookText}>{intel.scriptHook}</Text>
          </GlassCard>
        </FadeInSection>
      )}

      {/* Mentor Millionaire Script (auto-generated for business/trading) */}
      {result?.mentorMillionaire && (
        <FadeInSection delay={700}>
          <MentorMillionaireView data={result.mentorMillionaire} />
        </FadeInSection>
      )}

      {/* Action Items */}
      {intel?.actionItems?.length > 0 && (
        <FadeInSection delay={750}>
          <GlassCard style={styles.card}>
            <SectionHeader icon="rocket" title="Action Items" delay={780} />
            {intel.actionItems.map((item, i) => (
              <FadeInSection key={i} delay={800 + i * 50}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionNumber}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.actionText}>{item}</Text>
                </View>
              </FadeInSection>
            ))}
          </GlassCard>
        </FadeInSection>
      )}

      {/* Raw fallback */}
      {data.raw && (
        <FadeInSection delay={100}>
          <GlassCard style={styles.card}>
            <SectionHeader icon="document-text" title="Analysis" delay={150} />
            <Text style={styles.rawText}>{data.raw}</Text>
          </GlassCard>
        </FadeInSection>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginBottom: 14 },
  badgeRow: { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionTitle: { ...typography.label, color: colors.goldPrimary },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sourceTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 17, flex: 1 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaText: { ...typography.caption, color: colors.textTertiary },
  summaryText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.goldSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.15)' },
  tagText: { ...typography.caption, color: colors.goldLight, fontSize: 11 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  insightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldPrimary, marginTop: 8 },
  insightText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  quoteBlock: { flexDirection: 'row', marginBottom: 12, gap: 12 },
  quoteLine: { width: 2, backgroundColor: colors.goldDim, borderRadius: 1 },
  quoteText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 22 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 6 },
  metaLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9 },
  metaValue: { ...typography.body, color: colors.goldLight, fontSize: 13, textTransform: 'capitalize' },
  hookText: { ...typography.body, color: colors.goldBright, fontSize: 16, fontWeight: '500', lineHeight: 24, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  actionNumber: { ...typography.mono, color: colors.goldDim, fontSize: 12, marginTop: 2 },
  actionText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  rawText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
