import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { ContentTypeBadge } from './ContentTypeBadge';
import { TypeSpecificView } from './TypeSpecificView';
import { ActionButtons } from './ActionButtons';
import { MentorMillionaireView } from './MentorMillionaireView';
import { AdAdaptationView } from './AdAdaptationView';
import { ExpandableSection, CopyButton } from './ExpandableSection';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

function FadeIn({ children, delay = 0, style }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity: fade, transform: [{ translateY: slide }] }]}>{children}</Animated.View>;
}

function ScoreBadge({ score, label, color }) {
  if (score == null) return null;
  const c = color || (score >= 8 ? colors.success : score >= 5 ? colors.warning : colors.error);
  return (
    <View style={[s.scoreBadge, { borderColor: c + '40' }]}>
      <Text style={[s.scoreNum, { color: c }]}>{score}</Text>
      <Text style={s.scoreSlash}>/10</Text>
      {label && <Text style={s.scoreLabel}>{label}</Text>}
    </View>
  );
}

export function IntelligenceView({ data, source, result }) {
  const [adaptResult, setAdaptResult] = useState(null);
  if (!data) return null;
  if (adaptResult) return <AdAdaptationView adaptation={adaptResult} onClose={() => setAdaptResult(null)} />;

  const intel = data.raw ? null : data;
  const ct = intel?.contentType || 'unknown';

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Source + Badge */}
      {source && (
        <FadeIn>
          <GlassCard style={s.card}>
            <View style={s.badgeRow}>
              <ContentTypeBadge contentType={ct} />
              {intel?._qualityScore && <ScoreBadge score={intel._qualityScore} label="QUALITY" />}
            </View>
            <View style={s.sourceRow}>
              <Ionicons name="videocam" size={16} color={colors.goldPrimary} />
              <Text style={s.sourceTitle} numberOfLines={2}>{source.title || 'Unknown'}</Text>
            </View>
            <View style={s.metaRow}>
              {source.author && <Text style={s.metaText}>{source.author}</Text>}
              {source.duration && <Text style={s.metaText}>{source.duration}</Text>}
              {source.views && <Text style={s.metaText}>{source.views} views</Text>}
              {result?.fromCache && <Text style={[s.metaText, { color: colors.goldDim }]}>CACHED</Text>}
            </View>
          </GlassCard>
        </FadeIn>
      )}

      {/* Actions */}
      {intel && result && (
        <FadeIn delay={30}>
          <ActionButtons result={result} contentType={ct} onAdaptResult={setAdaptResult} />
        </FadeIn>
      )}

      {/* Scores Strip */}
      {intel && (intel.viralPotential || intel.speakerAnalysis) && (
        <FadeIn delay={50}>
          <GlassCard style={s.card}>
            <View style={s.scoresStrip}>
              {intel.viralPotential?.score && <ScoreBadge score={intel.viralPotential.score} label="VIRAL" color="#EA80FC" />}
              {intel.speakerAnalysis?.credibilityScore && <ScoreBadge score={intel.speakerAnalysis.credibilityScore} label="CREDIBILITY" color="#6DD5FA" />}
            </View>
            {intel.viralPotential?.explanation && <Text style={s.scoreExpl}>{intel.viralPotential.explanation}</Text>}
          </GlassCard>
        </FadeIn>
      )}

      {/* Summary */}
      {intel?.summary && (
        <FadeIn delay={80}>
          <GlassCard style={s.card} glowIntensity={0.12}>
            <ExpandableSection title="SUMMARY" icon="flash" copyText={intel.summary}>
              <Text style={s.summaryText}>{intel.summary}</Text>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Speaker & Format Analysis */}
      {(intel?.speakerAnalysis || intel?.contentFormatBreakdown) && (
        <FadeIn delay={100}>
          <GlassCard style={s.card}>
            {intel.speakerAnalysis && (
              <ExpandableSection title="SPEAKER ANALYSIS" icon="person" iconColor="#6DD5FA" defaultExpanded={false}
                copyText={`Tone: ${intel.speakerAnalysis.tone}\nDelivery: ${intel.speakerAnalysis.deliveryStyle}\nCredibility: ${intel.speakerAnalysis.credibilityScore}/10 — ${intel.speakerAnalysis.credibilityReason || ''}`}>
                <View style={s.kvRow}><Text style={s.kvLabel}>TONE</Text><Text style={s.kvValue}>{intel.speakerAnalysis.tone}</Text></View>
                <View style={s.kvRow}><Text style={s.kvLabel}>DELIVERY</Text><Text style={s.kvValue}>{intel.speakerAnalysis.deliveryStyle}</Text></View>
                {intel.speakerAnalysis.credibilityReason && (
                  <View style={s.kvRow}><Text style={s.kvLabel}>CREDIBILITY</Text><Text style={s.kvValue}>{intel.speakerAnalysis.credibilityReason}</Text></View>
                )}
              </ExpandableSection>
            )}
            {intel.contentFormatBreakdown && (
              <ExpandableSection title="CONTENT FORMAT" icon="film" iconColor="#B388FF" defaultExpanded={false}
                copyText={`Hook: ${intel.contentFormatBreakdown.hookLength} — ${intel.contentFormatBreakdown.hookType}\nBody: ${intel.contentFormatBreakdown.bodyStructure}\nEnding: ${intel.contentFormatBreakdown.endingType}\nPacing: ${intel.contentFormatBreakdown.totalPacing}`}>
                <View style={s.kvRow}><Text style={s.kvLabel}>HOOK</Text><Text style={s.kvValue}>{intel.contentFormatBreakdown.hookLength} — {intel.contentFormatBreakdown.hookType}</Text></View>
                <View style={s.kvRow}><Text style={s.kvLabel}>BODY</Text><Text style={s.kvValue}>{intel.contentFormatBreakdown.bodyStructure}</Text></View>
                <View style={s.kvRow}><Text style={s.kvLabel}>ENDING</Text><Text style={s.kvValue}>{intel.contentFormatBreakdown.endingType}</Text></View>
                <View style={s.kvRow}><Text style={s.kvLabel}>PACING</Text><Text style={s.kvValue}>{intel.contentFormatBreakdown.totalPacing}</Text></View>
              </ExpandableSection>
            )}
          </GlassCard>
        </FadeIn>
      )}

      {/* Emotional Triggers */}
      {intel?.emotionalTriggers?.length > 0 && (
        <FadeIn delay={120}>
          <GlassCard style={s.card}>
            <ExpandableSection title="EMOTIONAL TRIGGERS" icon="heart" iconColor="#FF4081" defaultExpanded={false} copyText={intel.emotionalTriggers.join(', ')}>
              <View style={s.tagsWrap}>
                {intel.emotionalTriggers.map((t, i) => (
                  <View key={i} style={[s.tag, { backgroundColor: '#FF408115', borderColor: '#FF408130' }]}>
                    <Text style={[s.tagText, { color: '#FF4081' }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Type-Specific */}
      {intel?.typeSpecific && (
        <FadeIn delay={140}>
          <TypeSpecificView contentType={ct} data={intel.typeSpecific} />
        </FadeIn>
      )}

      {/* Key Topics */}
      {intel?.keyTopics?.length > 0 && (
        <FadeIn delay={160}>
          <GlassCard style={s.card}>
            <ExpandableSection title="KEY TOPICS" icon="pricetags" copyText={intel.keyTopics.join(', ')}>
              <View style={s.tagsWrap}>
                {intel.keyTopics.map((t, i) => (
                  <View key={i} style={s.tag}><Text style={s.tagText}>{t}</Text></View>
                ))}
              </View>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Key Insights */}
      {intel?.keyInsights?.length > 0 && (
        <FadeIn delay={180}>
          <GlassCard style={s.card}>
            <ExpandableSection title="KEY INSIGHTS" icon="bulb" copyText={intel.keyInsights.join('\n')}>
              {intel.keyInsights.map((ins, i) => (
                <View key={i} style={s.insightRow}>
                  <View style={s.insightDot} />
                  <Text style={s.insightText}>{ins}</Text>
                </View>
              ))}
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Quotes */}
      {intel?.quotes?.length > 0 && (
        <FadeIn delay={200}>
          <GlassCard style={s.card}>
            <ExpandableSection title="QUOTES" icon="chatbubble-ellipses" copyText={intel.quotes.map(q => `"${q}"`).join('\n')}>
              {intel.quotes.map((q, i) => (
                <View key={i} style={s.quoteBlock}>
                  <View style={s.quoteLine} />
                  <Text style={s.quoteText}>"{q}"</Text>
                  <CopyButton text={q} />
                </View>
              ))}
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Metadata */}
      {intel && (
        <FadeIn delay={220}>
          <GlassCard style={s.card}>
            <View style={s.metaGrid}>
              {intel.sentiment && <View style={s.metaItem}><Text style={s.mLabel}>SENTIMENT</Text><Text style={s.mValue}>{intel.sentiment}</Text></View>}
              {intel.targetAudience && <View style={s.metaItem}><Text style={s.mLabel}>AUDIENCE</Text><Text style={s.mValue}>{intel.targetAudience}</Text></View>}
            </View>
          </GlassCard>
        </FadeIn>
      )}

      {/* Hook */}
      {intel?.scriptHook && (
        <FadeIn delay={240}>
          <GlassCard style={s.card} glowIntensity={0.15}>
            <ExpandableSection title="CONTENT HOOK" icon="megaphone" copyText={intel.scriptHook}>
              <Text style={s.hookText}>{intel.scriptHook}</Text>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* MM Script */}
      {result?.mentorMillionaire && (
        <FadeIn delay={260}>
          <MentorMillionaireView data={result.mentorMillionaire} />
        </FadeIn>
      )}

      {/* Action Items */}
      {intel?.actionItems?.length > 0 && (
        <FadeIn delay={280}>
          <GlassCard style={s.card}>
            <ExpandableSection title="ACTION ITEMS" icon="rocket" copyText={intel.actionItems.join('\n')}>
              {intel.actionItems.map((item, i) => (
                <View key={i} style={s.actionRow}>
                  <Text style={s.actionNum}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={s.actionText}>{item}</Text>
                </View>
              ))}
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Transcript */}
      {intel?.transcript && intel.transcript.length > 20 && !intel.transcript.startsWith('[') && (
        <FadeIn delay={300}>
          <GlassCard style={s.card}>
            <ExpandableSection title="FULL TRANSCRIPT" icon="document-text" iconColor={colors.textSecondary} defaultExpanded={false} copyText={intel.transcript}>
              <Text style={s.transcriptText}>{intel.transcript}</Text>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Monetization */}
      {intel?.monetizationAngles?.length > 0 && (
        <FadeIn delay={320}>
          <GlassCard style={s.card}>
            <ExpandableSection title="MONETIZATION ANGLES" icon="cash" iconColor={colors.success} defaultExpanded={false} copyText={intel.monetizationAngles.join('\n')}>
              {intel.monetizationAngles.map((a, i) => (
                <View key={i} style={s.insightRow}>
                  <View style={[s.insightDot, { backgroundColor: colors.success }]} />
                  <Text style={s.insightText}>{a}</Text>
                </View>
              ))}
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Ad Adaptations — side by side: Original | Adapted */}
      {result?.adAdaptations && (
        <FadeIn delay={340}>
          <GlassCard style={s.card} glowIntensity={0.1}>
            <ExpandableSection title="AUTO-ADAPTED ADS" icon="color-wand" iconColor="#FF4081" defaultExpanded={false}>
              {/* Original ad summary */}
              {intel?.typeSpecific && (
                <View style={s.comparisonBlock}>
                  <View style={s.comparisonHeader}>
                    <View style={[s.comparisonDot, { backgroundColor: '#FF4081' }]} />
                    <Text style={s.comparisonLabel}>ORIGINAL AD</Text>
                  </View>
                  {intel.typeSpecific.first3Seconds?.wordByWord && (
                    <Text style={s.comparisonHook}>"{intel.typeSpecific.first3Seconds.wordByWord}"</Text>
                  )}
                  {intel.typeSpecific.productSold && <Text style={s.comparisonMeta}>Product: {intel.typeSpecific.productSold}</Text>}
                  {intel.typeSpecific.ctaExactWording && <Text style={s.comparisonMeta}>CTA: "{intel.typeSpecific.ctaExactWording}"</Text>}
                  {intel.typeSpecific.overallEffectiveness && <Text style={s.comparisonMeta}>Effectiveness: {intel.typeSpecific.overallEffectiveness}/10</Text>}
                </View>
              )}
              {/* Adapted versions */}
              {Object.entries(result.adAdaptations).map(([product, adapt]) => (
                <View key={product} style={s.comparisonBlock}>
                  <View style={s.comparisonHeader}>
                    <View style={[s.comparisonDot, { backgroundColor: colors.goldPrimary }]} />
                    <Text style={[s.comparisonLabel, { color: colors.goldPrimary }]}>ADAPTED: {product.toUpperCase()}</Text>
                  </View>
                  <Text style={s.adaptHook}>"{adapt?.hook || ''}"</Text>
                  {adapt?.painPoint && <Text style={s.comparisonMeta}>Pain: {adapt.painPoint}</Text>}
                  {adapt?.cta && <Text style={s.comparisonMeta}>CTA: "{adapt.cta}"</Text>}
                  {adapt?.whyItWillWork && <Text style={s.comparisonReason}>{adapt.whyItWillWork}</Text>}
                  {adapt?.fullScript && <CopyButton text={adapt.fullScript} label="COPY FULL SCRIPT" />}
                </View>
              ))}
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      {/* Raw fallback */}
      {data.raw && (
        <FadeIn>
          <GlassCard style={s.card}>
            <ExpandableSection title="ANALYSIS" icon="document-text">
              <Text style={s.rawText}>{data.raw}</Text>
            </ExpandableSection>
          </GlassCard>
        </FadeIn>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  card: { marginBottom: 12 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sourceTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 17, flex: 1 },
  metaRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  metaText: { ...typography.caption, color: colors.textTertiary },
  scoresStrip: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  scoreBadge: { alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, minWidth: 70 },
  scoreNum: { fontSize: 20, fontWeight: '700' },
  scoreSlash: { ...typography.caption, color: colors.textTertiary, fontSize: 9 },
  scoreLabel: { ...typography.label, color: colors.textTertiary, fontSize: 8, marginTop: 2 },
  scoreExpl: { ...typography.body, color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 },
  summaryText: { ...typography.body, color: colors.textPrimary, lineHeight: 24 },
  kvRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  kvLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9, width: 80, marginTop: 2 },
  kvValue: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 13, lineHeight: 18 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.goldSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.15)' },
  tagText: { ...typography.caption, color: colors.goldLight, fontSize: 11 },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  insightDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.goldPrimary, marginTop: 7 },
  insightText: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 14, lineHeight: 20 },
  quoteBlock: { flexDirection: 'row', marginBottom: 10, gap: 10, alignItems: 'flex-start' },
  quoteLine: { width: 2, backgroundColor: colors.goldDim, borderRadius: 1, alignSelf: 'stretch' },
  quoteText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 20 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center', gap: 4, flex: 1 },
  mLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9 },
  mValue: { ...typography.body, color: colors.goldLight, fontSize: 12, textAlign: 'center', textTransform: 'capitalize' },
  hookText: { ...typography.body, color: colors.goldBright, fontSize: 16, fontWeight: '500', lineHeight: 24, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  actionNum: { ...typography.mono, color: colors.goldDim, fontSize: 11, marginTop: 2 },
  actionText: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 14, lineHeight: 20 },
  transcriptText: { ...typography.body, color: colors.textSecondary, fontSize: 13, lineHeight: 22 },
  rawText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  comparisonBlock: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(255, 64, 129, 0.2)' },
  comparisonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  comparisonDot: { width: 8, height: 8, borderRadius: 4 },
  comparisonLabel: { ...typography.label, color: '#FF4081', fontSize: 10 },
  comparisonHook: { ...typography.body, color: '#FF4081', fontStyle: 'italic', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  comparisonMeta: { ...typography.caption, color: colors.textSecondary, fontSize: 11, marginBottom: 3, lineHeight: 16 },
  comparisonReason: { ...typography.body, color: colors.textTertiary, fontSize: 11, fontStyle: 'italic', marginTop: 4, marginBottom: 4, lineHeight: 16 },
  adaptBlock: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  adaptProduct: { ...typography.subheading, color: '#FF4081', fontSize: 13, marginBottom: 4 },
  adaptHook: { ...typography.body, color: colors.textPrimary, fontStyle: 'italic', fontSize: 13, lineHeight: 18, marginBottom: 4 },
});
