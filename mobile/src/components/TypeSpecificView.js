import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { getContentTypeConfig } from '../theme/contentTypes';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Value({ text, highlight }) {
  return <Text style={[styles.value, highlight && styles.valueHighlight]}>{text}</Text>;
}

function Row({ label, value, highlight }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Label text={label} />
      <Value text={String(value)} highlight={highlight} />
    </View>
  );
}

function NumberedList({ items }) {
  if (!items?.length) return null;
  return items.map((item, i) => (
    <View key={i} style={styles.numberedRow}>
      <Text style={styles.number}>{String(i + 1).padStart(2, '0')}</Text>
      <Text style={styles.itemText}>
        {typeof item === 'string' ? item : item.instruction || item.item || JSON.stringify(item)}
      </Text>
    </View>
  ));
}

function TutorialView({ data }) {
  return (
    <>
      <Row label="ESTIMATED TIME" value={data.estimatedTime} />
      <Row label="DIFFICULTY" value={data.difficulty} highlight />
      {data.toolsNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="TOOLS NEEDED" />
          <View style={styles.tagsRow}>
            {data.toolsNeeded.map((t, i) => (
              <View key={i} style={styles.toolTag}>
                <Text style={styles.toolText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {data.steps?.length > 0 && (
        <View style={styles.section}>
          <Label text="STEPS" />
          {data.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumText}>{step.number || i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.itemText}>{step.instruction}</Text>
                {step.command && (
                  <View style={styles.commandBox}>
                    <Text style={styles.commandText}>{step.command}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function TradingView({ data }) {
  return (
    <>
      <Row label="ASSET" value={data.asset} highlight />
      <Row label="TIMEFRAME" value={data.timeframe} />
      <Row label="ENTRY SIGNAL" value={data.entrySignal} />
      <Row label="EXIT TARGET" value={data.exitTarget} />
      <Row label="STOP LOSS" value={data.stopLoss} />
      <Row label="POSITION SIZING" value={data.positionSizing} />
      <Row label="RISK/REWARD" value={data.riskRewardRatio} />
      <Row label="CONVICTION" value={data.conviction} highlight />
    </>
  );
}

function RecipeView({ data }) {
  return (
    <>
      <View style={styles.metaStrip}>
        {data.prepTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>PREP</Text><Text style={styles.metaChipValue}>{data.prepTime}</Text></View>}
        {data.cookTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>COOK</Text><Text style={styles.metaChipValue}>{data.cookTime}</Text></View>}
        {data.servings && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>SERVES</Text><Text style={styles.metaChipValue}>{data.servings}</Text></View>}
      </View>
      {data.ingredients?.length > 0 && (
        <View style={styles.section}>
          <Label text="INGREDIENTS" />
          {data.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientQty}>{ing.quantity}</Text>
              <Text style={styles.itemText}>{ing.item}</Text>
            </View>
          ))}
        </View>
      )}
      {data.method?.length > 0 && (
        <View style={styles.section}>
          <Label text="METHOD" />
          <NumberedList items={data.method} />
        </View>
      )}
    </>
  );
}

function AdView({ data }) {
  const config = getContentTypeConfig('advertisement/marketing');
  return (
    <>
      {data.hookAnalysis && (
        <View style={styles.section}>
          <Label text="HOOK ANALYSIS" />
          <View style={styles.hookBox}>
            <Text style={styles.hookQuote}>"{data.hookAnalysis.text}"</Text>
            <Row label="TECHNIQUE" value={data.hookAnalysis.technique} highlight />
            <Row label="EFFECTIVENESS" value={`${data.hookAnalysis.effectiveness}/10`} />
          </View>
        </View>
      )}
      <Row label="PAIN POINT" value={data.painPoint} />
      {data.offerStructure && (
        <View style={styles.section}>
          <Label text="OFFER STRUCTURE" />
          <Row label="MAIN OFFER" value={data.offerStructure.mainOffer} />
          {data.offerStructure.bonuses?.map((b, i) => (
            <Row key={i} label={`BONUS ${i + 1}`} value={b} />
          ))}
          <Row label="GUARANTEE" value={data.offerStructure.guarantee} />
        </View>
      )}
      {data.ctaBreakdown && (
        <View style={styles.section}>
          <Label text="CTA BREAKDOWN" />
          <Text style={styles.ctaText}>"{data.ctaBreakdown.text}"</Text>
          <View style={styles.ctaTags}>
            {data.ctaBreakdown.urgency && <View style={[styles.ctaTag, { backgroundColor: '#FF408120' }]}><Text style={[styles.ctaTagText, { color: '#FF4081' }]}>URGENCY</Text></View>}
            {data.ctaBreakdown.scarcity && <View style={[styles.ctaTag, { backgroundColor: '#FFD74020' }]}><Text style={[styles.ctaTagText, { color: '#FFD740' }]}>SCARCITY</Text></View>}
          </View>
        </View>
      )}
      {data.whyItWorks && (
        <View style={[styles.section, styles.scoreSection]}>
          <View style={[styles.scoreBadge, { borderColor: config.color + '60' }]}>
            <Text style={[styles.scoreNumber, { color: config.color }]}>{data.whyItWorks.score}</Text>
            <Text style={styles.scoreOf}>/10</Text>
          </View>
          <Text style={styles.scoreExplanation}>{data.whyItWorks.explanation}</Text>
        </View>
      )}
    </>
  );
}

function WorkoutView({ data }) {
  return (
    <>
      <Row label="DURATION" value={data.totalDuration} />
      <Row label="TYPE" value={data.workoutType} highlight />
      {data.equipmentNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="EQUIPMENT" />
          <View style={styles.tagsRow}>
            {data.equipmentNeeded.map((e, i) => (
              <View key={i} style={styles.toolTag}><Text style={styles.toolText}>{e}</Text></View>
            ))}
          </View>
        </View>
      )}
      {data.exercises?.length > 0 && (
        <View style={styles.section}>
          <Label text="EXERCISES" />
          {data.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseDetail}>{ex.sets} x {ex.reps}</Text>
                <Text style={styles.exerciseDetail}>Rest: {ex.restTime}</Text>
                <Text style={styles.exerciseDetail}>{ex.muscleGroup}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function PodcastView({ data }) {
  return (
    <>
      {data.guestCredentials && <Row label="GUEST" value={data.guestCredentials} highlight />}
      {data.top5Insights?.length > 0 && (
        <View style={styles.section}>
          <Label text="TOP INSIGHTS" />
          <NumberedList items={data.top5Insights} />
        </View>
      )}
      {data.bestQuotes?.length > 0 && (
        <View style={styles.section}>
          <Label text="BEST QUOTES" />
          {data.bestQuotes.map((q, i) => (
            <View key={i} style={styles.quoteRow}>
              <View style={styles.quoteMark} />
              <Text style={styles.quoteText}>"{q}"</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function ProductDemoView({ data }) {
  return (
    <>
      <Row label="PRICING" value={data.pricingMentioned} />
      <Row label="VS COMPETITORS" value={data.competitorComparison} />
      {data.featuresShown?.length > 0 && (
        <View style={styles.section}>
          <Label text="FEATURES SHOWN" />
          <NumberedList items={data.featuresShown} />
        </View>
      )}
      {data.problemsSolved?.length > 0 && (
        <View style={styles.section}>
          <Label text="PROBLEMS SOLVED" />
          <NumberedList items={data.problemsSolved} />
        </View>
      )}
    </>
  );
}

function NewsView({ data }) {
  return (
    <>
      {data.keyFacts?.length > 0 && (
        <View style={styles.section}><Label text="KEY FACTS" /><NumberedList items={data.keyFacts} /></View>
      )}
      {data.peopleMentioned?.length > 0 && (
        <View style={styles.section}>
          <Label text="PEOPLE MENTIONED" />
          {data.peopleMentioned.map((p, i) => (
            <Row key={i} label={p.name || `Person ${i + 1}`} value={p.role || ''} />
          ))}
        </View>
      )}
      {data.whatItMeans && <Row label="WHAT IT MEANS" value={data.whatItMeans} />}
    </>
  );
}

function BusinessView({ data }) {
  return (
    <>
      {data.coreFramework && <Row label="CORE FRAMEWORK" value={data.coreFramework} highlight />}
      {data.keyPrinciples?.length > 0 && (
        <View style={styles.section}><Label text="KEY PRINCIPLES" /><NumberedList items={data.keyPrinciples} /></View>
      )}
      {data.metricsmentioned?.length > 0 && (
        <View style={styles.section}>
          <Label text="METRICS" />
          <View style={styles.tagsRow}>
            {data.metricsmentioned.map((m, i) => (
              <View key={i} style={styles.metricTag}><Text style={styles.metricText}>{m}</Text></View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

export function TypeSpecificView({ contentType, data }) {
  if (!data) return null;

  const config = getContentTypeConfig(contentType);

  const ViewComponent = {
    'tutorial/how-to': TutorialView,
    'trading/investing': TradingView,
    'recipe/cooking': RecipeView,
    'advertisement/marketing': AdView,
    'workout/fitness': WorkoutView,
    'news/opinion': NewsView,
    'podcast/interview': PodcastView,
    'product-demo': ProductDemoView,
    'business/entrepreneurship': BusinessView,
  }[contentType];

  if (!ViewComponent) return null;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.headerTitle, { color: config.color }]}>{config.label} DETAILS</Text>
        <View style={[styles.headerLine, { backgroundColor: config.color + '20' }]} />
      </View>
      <ViewComponent data={data} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  headerTitle: { ...typography.label },
  headerLine: { flex: 1, height: 1, marginLeft: 8 },
  label: { ...typography.label, color: colors.textTertiary, fontSize: 9, marginBottom: 4 },
  value: { ...typography.body, color: colors.textPrimary, fontSize: 14, marginBottom: 12 },
  valueHighlight: { color: colors.goldBright, fontWeight: '600' },
  row: { marginBottom: 4 },
  section: { marginTop: 8, marginBottom: 8 },
  numberedRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  number: { ...typography.mono, color: colors.goldDim, fontSize: 11, marginTop: 2 },
  itemText: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 14, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  toolTag: { backgroundColor: 'rgba(109, 213, 250, 0.1)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(109, 213, 250, 0.2)' },
  toolText: { ...typography.caption, color: '#6DD5FA', fontSize: 10 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.goldSubtle, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { ...typography.mono, color: colors.goldPrimary, fontSize: 12 },
  stepContent: { flex: 1 },
  commandBox: { backgroundColor: '#0E0E15', borderRadius: 6, padding: 8, marginTop: 6, borderWidth: 1, borderColor: colors.borderSubtle },
  commandText: { ...typography.mono, color: '#6DD5FA', fontSize: 12 },
  metaStrip: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metaChip: { alignItems: 'center', gap: 2 },
  metaChipLabel: { ...typography.label, color: colors.textTertiary, fontSize: 8 },
  metaChipValue: { ...typography.body, color: colors.goldLight, fontSize: 14, fontWeight: '600' },
  ingredientRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  ingredientQty: { ...typography.mono, color: colors.goldPrimary, fontSize: 12, width: 80, textAlign: 'right' },
  hookBox: { backgroundColor: 'rgba(255, 64, 129, 0.06)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 64, 129, 0.15)' },
  hookQuote: { ...typography.body, color: '#FF4081', fontSize: 15, fontStyle: 'italic', fontWeight: '500', marginBottom: 10, lineHeight: 22 },
  ctaText: { ...typography.body, color: colors.goldBright, fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  ctaTags: { flexDirection: 'row', gap: 8 },
  ctaTag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  ctaTagText: { ...typography.label, fontSize: 9 },
  scoreSection: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255, 64, 129, 0.04)', borderRadius: 8, padding: 12 },
  scoreBadge: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 22, fontWeight: '700' },
  scoreOf: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
  scoreExplanation: { ...typography.body, color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  exerciseCard: { backgroundColor: 'rgba(179, 136, 255, 0.06)', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(179, 136, 255, 0.12)' },
  exerciseName: { ...typography.body, color: '#B388FF', fontWeight: '600', marginBottom: 4 },
  exerciseMeta: { flexDirection: 'row', gap: 12 },
  exerciseDetail: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  quoteRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quoteMark: { width: 2, backgroundColor: '#EA80FC', borderRadius: 1 },
  quoteText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 20 },
  metricTag: { backgroundColor: 'rgba(255, 215, 64, 0.1)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  metricText: { ...typography.caption, color: '#FFD740', fontSize: 10 },
});
