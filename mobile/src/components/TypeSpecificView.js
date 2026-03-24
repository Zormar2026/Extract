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
  if (!value && value !== 0) return null;
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
        {typeof item === 'string' ? item : item.instruction || item.action || item.item || item.feature || JSON.stringify(item)}
      </Text>
    </View>
  ));
}

function TagsRow({ items, color = '#6DD5FA' }) {
  if (!items?.length) return null;
  return (
    <View style={styles.tagsRow}>
      {items.map((t, i) => (
        <View key={i} style={[styles.toolTag, { borderColor: color + '30', backgroundColor: color + '10' }]}>
          <Text style={[styles.toolText, { color }]}>{typeof t === 'string' ? t : t.name || t.item || JSON.stringify(t)}</Text>
        </View>
      ))}
    </View>
  );
}

function ScoreBadge({ score, max = 10, color = colors.goldPrimary, label }) {
  if (!score && score !== 0) return null;
  return (
    <View style={styles.scoreBadgeRow}>
      <View style={[styles.scoreBadge, { borderColor: color + '60' }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreOf}>/{max}</Text>
      </View>
      {label && <Text style={styles.scoreBadgeLabel}>{label}</Text>}
    </View>
  );
}

function TutorialView({ data }) {
  return (
    <>
      <View style={styles.metaStrip}>
        {data.estimatedTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>TIME</Text><Text style={styles.metaChipValue}>{data.estimatedTime}</Text></View>}
        {data.difficultyLevel && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>DIFFICULTY</Text><Text style={styles.metaChipValue}>{data.difficultyLevel}/10</Text></View>}
        {data.estimatedCost && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>COST</Text><Text style={styles.metaChipValue}>{data.estimatedCost}</Text></View>}
      </View>
      {data.expectedOutcome && <Row label="EXPECTED OUTCOME" value={data.expectedOutcome} highlight />}
      {data.prerequisites?.length > 0 && (
        <View style={styles.section}>
          <Label text="PREREQUISITES" />
          <TagsRow items={data.prerequisites} color="#FFD740" />
        </View>
      )}
      {data.toolsNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="TOOLS NEEDED" />
          {data.toolsNeeded.map((t, i) => (
            <View key={i} style={styles.toolDetailRow}>
              <Text style={styles.toolDetailName}>{typeof t === 'string' ? t : t.name}</Text>
              {t.free !== undefined && <Text style={[styles.toolDetailTag, t.free ? styles.freeTag : styles.paidTag]}>{t.free ? 'FREE' : 'PAID'}</Text>}
            </View>
          ))}
        </View>
      )}
      {data.softwareNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="SOFTWARE" />
          <TagsRow items={data.softwareNeeded} color="#B388FF" />
        </View>
      )}
      {data.whatToBuyOrDownload?.length > 0 && (
        <View style={styles.section}>
          <Label text="WHAT TO GET" />
          <TagsRow items={data.whatToBuyOrDownload} color="#80CBC4" />
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
                {step.timestamp && <Text style={styles.timestampText}>{step.timestamp}</Text>}
                {step.command && (
                  <View style={styles.commandBox}>
                    <Text style={styles.commandText}>{step.command}</Text>
                  </View>
                )}
                {step.tip && (
                  <View style={styles.tipBox}>
                    <Ionicons name="bulb-outline" size={12} color="#FFD740" />
                    <Text style={styles.tipText}>{step.tip}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      {data.commonMistakes?.length > 0 && (
        <View style={styles.section}>
          <Label text="COMMON MISTAKES" />
          {data.commonMistakes.map((m, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Ionicons name="warning-outline" size={12} color="#FF8A80" />
              <Text style={styles.mistakeText}>{m}</Text>
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
      <View style={styles.metaStrip}>
        {data.asset && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>ASSET</Text><Text style={[styles.metaChipValue, { color: '#4CAF50' }]}>{data.asset}</Text></View>}
        {data.assetClass && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>CLASS</Text><Text style={styles.metaChipValue}>{data.assetClass}</Text></View>}
        {data.timeframe && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>TIMEFRAME</Text><Text style={styles.metaChipValue}>{data.timeframe}</Text></View>}
      </View>
      <Row label="ENTRY SIGNAL" value={data.entrySignal} highlight />
      <Row label="ENTRY PRICE" value={data.entryPrice} />
      <Row label="EXIT TARGET" value={data.exitTarget} />
      <Row label="STOP LOSS" value={data.stopLoss} />
      <Row label="POSITION SIZING" value={data.positionSizing} />
      <Row label="RISK/REWARD" value={data.riskRewardRatio} highlight />
      <Row label="CONVICTION" value={data.conviction} highlight />
      <Row label="MARKET CONDITIONS" value={data.marketConditionsRequired} />
      <Row label="BACKTEST" value={data.backtestPerformance} />
      {data.confluenceFactors?.length > 0 && (
        <View style={styles.section}>
          <Label text="CONFLUENCE FACTORS" />
          {data.confluenceFactors.map((f, i) => (
            <View key={i} style={styles.confluenceRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.confluenceText}>{f}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function RecipeView({ data }) {
  return (
    <>
      <View style={styles.metaStrip}>
        {data.prepTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>PREP</Text><Text style={styles.metaChipValue}>{data.prepTime}</Text></View>}
        {data.cookTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>COOK</Text><Text style={styles.metaChipValue}>{data.cookTime}</Text></View>}
        {data.totalTime && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>TOTAL</Text><Text style={styles.metaChipValue}>{data.totalTime}</Text></View>}
        {data.servings && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>SERVES</Text><Text style={styles.metaChipValue}>{data.servings}</Text></View>}
      </View>
      <Row label="CUISINE" value={data.cuisine} highlight />
      <Row label="DIFFICULTY" value={data.difficulty} />
      <Row label="CALORIES" value={data.caloriesPerServing} />
      {data.dietaryInfo?.length > 0 && (
        <View style={styles.section}>
          <Label text="DIETARY INFO" />
          <TagsRow items={data.dietaryInfo} color="#66BB6A" />
        </View>
      )}
      {data.ingredients?.length > 0 && (
        <View style={styles.section}>
          <Label text="INGREDIENTS" />
          {data.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientQty}>{ing.quantity}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>{ing.item}</Text>
                {ing.substitution && <Text style={styles.substitutionText}>Sub: {ing.substitution}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      {data.equipmentNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="EQUIPMENT" />
          {data.equipmentNeeded.map((eq, i) => (
            <View key={i} style={styles.toolDetailRow}>
              <Text style={styles.toolDetailName}>{typeof eq === 'string' ? eq : eq.item}</Text>
              {eq.alternative && <Text style={styles.altText}>Alt: {eq.alternative}</Text>}
            </View>
          ))}
        </View>
      )}
      {data.method?.length > 0 && (
        <View style={styles.section}>
          <Label text="METHOD" />
          {data.method.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumText}>{step.step || i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.itemText}>{typeof step === 'string' ? step : step.instruction}</Text>
                {(step.time || step.temperature) && (
                  <View style={styles.methodMeta}>
                    {step.time && <Text style={styles.methodMetaText}>{step.time}</Text>}
                    {step.temperature && <Text style={styles.methodMetaText}>{step.temperature}</Text>}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      {data.chefTips?.length > 0 && (
        <View style={styles.section}>
          <Label text="CHEF TIPS" />
          {data.chefTips.map((tip, i) => (
            <View key={i} style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={12} color="#FFD740" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
      <Row label="STORAGE" value={data.storageInstructions} />
      <Row label="WINE PAIRING" value={data.winePairing} />
    </>
  );
}

function AdView({ data }) {
  const config = getContentTypeConfig('advertisement/marketing');
  return (
    <>
      {data.first3Seconds && (
        <View style={styles.section}>
          <Label text="FIRST 3 SECONDS" />
          <View style={styles.hookBox}>
            <Text style={styles.hookQuote}>"{data.first3Seconds.wordByWord}"</Text>
            <Row label="HOOK TYPE" value={data.first3Seconds.hookType} highlight />
            {data.first3Seconds.visualDescription && <Row label="VISUAL" value={data.first3Seconds.visualDescription} />}
          </View>
        </View>
      )}
      {/* Legacy hookAnalysis support */}
      {!data.first3Seconds && data.hookAnalysis && (
        <View style={styles.section}>
          <Label text="HOOK ANALYSIS" />
          <View style={styles.hookBox}>
            <Text style={styles.hookQuote}>"{data.hookAnalysis.text}"</Text>
            <Row label="TECHNIQUE" value={data.hookAnalysis.technique} highlight />
            <Row label="EFFECTIVENESS" value={`${data.hookAnalysis.effectiveness}/10`} />
          </View>
        </View>
      )}
      <Row label="PRODUCT" value={data.productSold} highlight />
      <Row label="PRICE" value={data.priceMentioned} />
      <Row label="DESIRE TRIGGERED" value={data.desireTriggered} />
      {data.painPointScore && (
        <View style={styles.section}>
          <ScoreBadge score={data.painPointScore} color="#FF4081" label="PAIN POINT" />
          {data.painPointAnalysis && <Text style={styles.analysisText}>{data.painPointAnalysis}</Text>}
        </View>
      )}
      <Row label="PAIN POINT" value={!data.painPointScore ? data.painPoint : null} />
      {data.offerStructure && (
        <View style={styles.section}>
          <Label text="OFFER STRUCTURE" />
          <Row label="MAIN OFFER" value={data.offerStructure.mainOffer} />
          {data.offerStructure.bonuses?.map((b, i) => (
            <Row key={i} label={`BONUS ${i + 1}`} value={b} />
          ))}
          <Row label="GUARANTEE" value={data.offerStructure.guarantee} />
          <Row label="RISK REVERSAL" value={data.offerStructure.riskReversal} />
        </View>
      )}
      {data.socialProof && (
        <View style={styles.section}>
          <Label text="SOCIAL PROOF" />
          <Row label="TYPE" value={data.socialProof.type} />
          <Row label="STRENGTH" value={data.socialProof.strength ? `${data.socialProof.strength}/10` : null} />
          {data.socialProof.examples?.map((e, i) => (
            <View key={i} style={styles.proofRow}>
              <Ionicons name="people-outline" size={12} color="#B388FF" />
              <Text style={styles.proofText}>{e}</Text>
            </View>
          ))}
        </View>
      )}
      {data.urgencyTactics?.length > 0 && (
        <View style={styles.section}>
          <Label text="URGENCY TACTICS" />
          <TagsRow items={data.urgencyTactics} color="#FF4081" />
        </View>
      )}
      {data.scarcityTactics?.length > 0 && (
        <View style={styles.section}>
          <Label text="SCARCITY TACTICS" />
          <TagsRow items={data.scarcityTactics} color="#FFD740" />
        </View>
      )}
      <Row label="CTA WORDING" value={data.ctaExactWording} highlight />
      {/* Legacy ctaBreakdown */}
      {data.ctaBreakdown && !data.ctaExactWording && (
        <View style={styles.section}>
          <Label text="CTA BREAKDOWN" />
          <Text style={styles.ctaText}>"{data.ctaBreakdown.text}"</Text>
        </View>
      )}
      <Row label="PLATFORM" value={data.platformOptimization} />
      {data.whyItWorks3Reasons?.length > 0 && (
        <View style={styles.section}>
          <Label text="WHY IT WORKS" />
          <NumberedList items={data.whyItWorks3Reasons} />
        </View>
      )}
      {data.whatCouldBeImproved?.length > 0 && (
        <View style={styles.section}>
          <Label text="COULD BE IMPROVED" />
          {data.whatCouldBeImproved.map((imp, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Ionicons name="arrow-up-circle-outline" size={12} color="#FFD740" />
              <Text style={styles.mistakeText}>{imp}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.scoresRow}>
        {data.productionQuality && <ScoreBadge score={data.productionQuality} color="#6DD5FA" label="PRODUCTION" />}
        {data.overallEffectiveness && <ScoreBadge score={data.overallEffectiveness} color={config.color} label="EFFECTIVENESS" />}
      </View>
      {/* Legacy whyItWorks */}
      {data.whyItWorks && !data.whyItWorks3Reasons && (
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
      <View style={styles.metaStrip}>
        {data.totalDuration && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>DURATION</Text><Text style={styles.metaChipValue}>{data.totalDuration}</Text></View>}
        {data.workoutType && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>TYPE</Text><Text style={[styles.metaChipValue, { color: '#B388FF' }]}>{data.workoutType}</Text></View>}
        {data.caloriesBurned && <View style={styles.metaChip}><Text style={styles.metaChipLabel}>CALORIES</Text><Text style={styles.metaChipValue}>{data.caloriesBurned}</Text></View>}
      </View>
      {data.musclesWorked?.length > 0 && (
        <View style={styles.section}>
          <Label text="MUSCLES WORKED" />
          <TagsRow items={data.musclesWorked} color="#B388FF" />
        </View>
      )}
      {data.equipmentNeeded?.length > 0 && (
        <View style={styles.section}>
          <Label text="EQUIPMENT" />
          <TagsRow items={data.equipmentNeeded} color="#6DD5FA" />
        </View>
      )}
      {data.warmUp && data.warmUp !== 'not included' && <Row label="WARM UP" value={data.warmUp} />}
      {data.exercises?.length > 0 && (
        <View style={styles.section}>
          <Label text="EXERCISES" />
          {data.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseOrder}>{ex.order || i + 1}</Text>
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>
              <View style={styles.exerciseMeta}>
                <Text style={styles.exerciseDetail}>{ex.sets} x {ex.reps}</Text>
                {ex.restTime && <Text style={styles.exerciseDetail}>Rest: {ex.restTime}</Text>}
                {ex.muscleGroup && <Text style={styles.exerciseDetail}>{ex.muscleGroup}</Text>}
              </View>
              {ex.formCues?.length > 0 && (
                <View style={styles.formCuesRow}>
                  {ex.formCues.map((cue, ci) => (
                    <View key={ci} style={styles.formCue}>
                      <Ionicons name="checkmark" size={10} color="#4CAF50" />
                      <Text style={styles.formCueText}>{cue}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(ex.weightBeginner || ex.weightIntermediate || ex.weightAdvanced) && (
                <View style={styles.weightRow}>
                  {ex.weightBeginner && <View style={styles.weightChip}><Text style={styles.weightLevel}>BEG</Text><Text style={styles.weightValue}>{ex.weightBeginner}</Text></View>}
                  {ex.weightIntermediate && <View style={styles.weightChip}><Text style={styles.weightLevel}>INT</Text><Text style={styles.weightValue}>{ex.weightIntermediate}</Text></View>}
                  {ex.weightAdvanced && <View style={styles.weightChip}><Text style={styles.weightLevel}>ADV</Text><Text style={styles.weightValue}>{ex.weightAdvanced}</Text></View>}
                </View>
              )}
              {ex.modification && <Text style={styles.modificationText}>Mod: {ex.modification}</Text>}
            </View>
          ))}
        </View>
      )}
      {data.coolDown && data.coolDown !== 'not included' && <Row label="COOL DOWN" value={data.coolDown} />}
    </>
  );
}

function PodcastView({ data }) {
  return (
    <>
      {data.guestFullName && <Row label="GUEST" value={data.guestFullName} highlight />}
      {data.guestCredentials && <Row label="CREDENTIALS" value={data.guestCredentials} />}
      {data.episodeSummary3Sentences && <Row label="SUMMARY" value={data.episodeSummary3Sentences} />}
      {data.whoNeedsToHearThis && <Row label="WHO NEEDS THIS" value={data.whoNeedsToHearThis} highlight />}
      {(data.top10Insights || data.top5Insights)?.length > 0 && (
        <View style={styles.section}>
          <Label text="TOP INSIGHTS" />
          <NumberedList items={data.top10Insights || data.top5Insights} />
        </View>
      )}
      {data.mostControversialStatement && (
        <View style={styles.section}>
          <Label text="MOST CONTROVERSIAL" />
          <View style={styles.controversialBox}>
            <Ionicons name="flame-outline" size={14} color="#FF4081" />
            <Text style={styles.controversialText}>{data.mostControversialStatement}</Text>
          </View>
        </View>
      )}
      {data.bestStoryTold && <Row label="BEST STORY" value={data.bestStoryTold} />}
      {data.actionableAdvice?.length > 0 && (
        <View style={styles.section}>
          <Label text="ACTIONABLE ADVICE" />
          <NumberedList items={data.actionableAdvice} />
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
      {data.bestQuoteForSocial && (
        <View style={styles.section}>
          <Label text="BEST FOR SOCIAL" />
          <View style={styles.socialQuoteBox}>
            <Ionicons name="share-social-outline" size={14} color={colors.goldPrimary} />
            <Text style={styles.socialQuoteText}>"{data.bestQuoteForSocial}"</Text>
          </View>
        </View>
      )}
      {data.resourcesRecommended?.length > 0 && (
        <View style={styles.section}>
          <Label text="RESOURCES" />
          <TagsRow items={data.resourcesRecommended} color="#80CBC4" />
        </View>
      )}
      {data.booksmentioned?.length > 0 && (
        <View style={styles.section}>
          <Label text="BOOKS MENTIONED" />
          <TagsRow items={data.booksmentioned} color="#EA80FC" />
        </View>
      )}
    </>
  );
}

function ProductDemoView({ data }) {
  return (
    <>
      <Row label="PRODUCT" value={data.productName} highlight />
      <Row label="TARGET USER" value={data.targetUser} />
      <Row label="USP" value={data.uniqueSellingPoint} highlight />
      <Row label="PRICING" value={data.pricingMentioned} />
      <Row label="VS COMPETITORS" value={data.competitorComparison} />
      {data.featuresShown?.length > 0 && (
        <View style={styles.section}>
          <Label text="FEATURES SHOWN" />
          {data.featuresShown.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <View style={{ flex: 1 }}>
                <Text style={styles.featureName}>{typeof f === 'string' ? f : f.feature}</Text>
                {f.benefit && <Text style={styles.featureBenefit}>{f.benefit}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      {data.problemsSolved?.length > 0 && (
        <View style={styles.section}>
          <Label text="PROBLEMS SOLVED" />
          <NumberedList items={data.problemsSolved} />
        </View>
      )}
      {data.limitations?.length > 0 && (
        <View style={styles.section}>
          <Label text="LIMITATIONS" />
          {data.limitations.map((l, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Ionicons name="alert-circle-outline" size={12} color="#FF8A80" />
              <Text style={styles.mistakeText}>{typeof l === 'string' ? l : l.limitation || JSON.stringify(l)}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function NewsView({ data }) {
  return (
    <>
      {/* 5Ws */}
      <Row label="WHO" value={data.who} highlight />
      <Row label="WHAT" value={data.what} />
      <Row label="WHEN" value={data.when} />
      <Row label="WHERE" value={data.where} />
      <Row label="WHY IT MATTERS" value={data.why} highlight />
      {data.allPeople?.length > 0 && (
        <View style={styles.section}>
          <Label text="PEOPLE INVOLVED" />
          {data.allPeople.map((p, i) => (
            <View key={i} style={styles.personRow}>
              <Ionicons name="person-outline" size={12} color={colors.goldDim} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{p.name}</Text>
                {p.role && <Text style={styles.personRole}>{p.role}</Text>}
                {p.stance && <Text style={styles.personStance}>Stance: {p.stance}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      {/* Legacy peopleMentioned */}
      {!data.allPeople && data.peopleMentioned?.length > 0 && (
        <View style={styles.section}>
          <Label text="PEOPLE MENTIONED" />
          {data.peopleMentioned.map((p, i) => (
            <Row key={i} label={p.name || `Person ${i + 1}`} value={p.role || ''} />
          ))}
        </View>
      )}
      {data.allOrganizations?.length > 0 && (
        <View style={styles.section}>
          <Label text="ORGANIZATIONS" />
          <TagsRow items={data.allOrganizations} color="#6DD5FA" />
        </View>
      )}
      {/* Legacy keyFacts */}
      {data.keyFacts?.length > 0 && (
        <View style={styles.section}><Label text="KEY FACTS" /><NumberedList items={data.keyFacts} /></View>
      )}
      <Row label="ECONOMIC IMPACT" value={data.economicImpact} />
      <Row label="POLITICAL IMPLICATIONS" value={data.politicalImplications} />
      {data.biasAssessment && (
        <View style={styles.section}>
          <Label text="BIAS ASSESSMENT" />
          <Row label="DIRECTION" value={data.biasAssessment.direction} highlight />
          <Row label="STRENGTH" value={data.biasAssessment.strength ? `${data.biasAssessment.strength}/10` : null} />
        </View>
      )}
      {data.predictionsMode?.length > 0 && (
        <View style={styles.section}>
          <Label text="PREDICTIONS" />
          <NumberedList items={data.predictionsMode} />
        </View>
      )}
      {data.counterargumentsNotAddressed?.length > 0 && (
        <View style={styles.section}>
          <Label text="BLIND SPOTS" />
          {data.counterargumentsNotAddressed.map((c, i) => (
            <View key={i} style={styles.mistakeRow}>
              <Ionicons name="eye-off-outline" size={12} color="#FFD740" />
              <Text style={styles.mistakeText}>{c}</Text>
            </View>
          ))}
        </View>
      )}
      <Row label="HOW THIS AFFECTS YOU" value={data.howThisAffectsYou} highlight />
      <Row label="ACTION TO TAKE" value={data.actionYouShouldTake} highlight />
      {data.whatItMeans && <Row label="WHAT IT MEANS" value={data.whatItMeans} />}
    </>
  );
}

function BusinessView({ data }) {
  return (
    <>
      <Row label="BUSINESS MODEL" value={data.businessModel} highlight />
      {data.oneBigInsight && (
        <View style={styles.bigInsightBox}>
          <Ionicons name="diamond-outline" size={16} color={colors.goldPrimary} />
          <Text style={styles.bigInsightText}>{data.oneBigInsight}</Text>
        </View>
      )}
      {data.revenueStreams?.length > 0 && (
        <View style={styles.section}>
          <Label text="REVENUE STREAMS" />
          <NumberedList items={data.revenueStreams} />
        </View>
      )}
      <Row label="STARTUP COSTS" value={data.startupCosts} />
      <Row label="TIME TO PROFIT" value={data.timeToProfit} />
      {data.keyPrinciples?.length > 0 && (
        <View style={styles.section}><Label text="KEY PRINCIPLES" /><NumberedList items={data.keyPrinciples} /></View>
      )}
      {data.implementationPlan?.length > 0 && (
        <View style={styles.section}>
          <Label text="IMPLEMENTATION PLAN" />
          {data.implementationPlan.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumText}>{step.step || i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.itemText}>{step.action}</Text>
                {step.timeline && <Text style={styles.timestampText}>{step.timeline}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      {data.toolsAndResources?.length > 0 && (
        <View style={styles.section}>
          <Label text="TOOLS & RESOURCES" />
          {data.toolsAndResources.map((t, i) => (
            <View key={i} style={styles.toolDetailRow}>
              <Text style={styles.toolDetailName}>{typeof t === 'string' ? t : t.name}</Text>
              {t.purpose && <Text style={styles.toolPurpose}>{t.purpose}</Text>}
            </View>
          ))}
        </View>
      )}
      {data.caseStudies?.length > 0 && (
        <View style={styles.section}>
          <Label text="CASE STUDIES" />
          <NumberedList items={data.caseStudies} />
        </View>
      )}
      {data.objectionsAddressed?.length > 0 && (
        <View style={styles.section}>
          <Label text="OBJECTIONS ADDRESSED" />
          <NumberedList items={data.objectionsAddressed} />
        </View>
      )}
      {data.metricsmentioned?.length > 0 && (
        <View style={styles.section}>
          <Label text="METRICS" />
          <TagsRow items={data.metricsmentioned} color="#FFD740" />
        </View>
      )}
      {data.applyToYourBusiness && <Row label="APPLY TO YOUR BIZ" value={data.applyToYourBusiness} highlight />}
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
  toolTag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  toolText: { ...typography.caption, fontSize: 10 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.goldSubtle, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { ...typography.mono, color: colors.goldPrimary, fontSize: 12 },
  stepContent: { flex: 1 },
  commandBox: { backgroundColor: '#0E0E15', borderRadius: 6, padding: 8, marginTop: 6, borderWidth: 1, borderColor: colors.borderSubtle },
  commandText: { ...typography.mono, color: '#6DD5FA', fontSize: 12 },
  tipBox: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 6, backgroundColor: 'rgba(255, 215, 64, 0.06)', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: 'rgba(255, 215, 64, 0.12)' },
  tipText: { ...typography.caption, color: '#FFD740', flex: 1, fontSize: 11, lineHeight: 16 },
  timestampText: { ...typography.mono, color: colors.textTertiary, fontSize: 10, marginTop: 4 },
  metaStrip: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  metaChip: { alignItems: 'center', gap: 2 },
  metaChipLabel: { ...typography.label, color: colors.textTertiary, fontSize: 8 },
  metaChipValue: { ...typography.body, color: colors.goldLight, fontSize: 14, fontWeight: '600' },
  ingredientRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  ingredientQty: { ...typography.mono, color: colors.goldPrimary, fontSize: 12, width: 80, textAlign: 'right' },
  substitutionText: { ...typography.caption, color: '#80CBC4', fontSize: 10, marginTop: 2, fontStyle: 'italic' },
  altText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
  methodMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  methodMetaText: { ...typography.mono, color: colors.goldDim, fontSize: 10 },
  hookBox: { backgroundColor: 'rgba(255, 64, 129, 0.06)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 64, 129, 0.15)' },
  hookQuote: { ...typography.body, color: '#FF4081', fontSize: 15, fontStyle: 'italic', fontWeight: '500', marginBottom: 10, lineHeight: 22 },
  ctaText: { ...typography.body, color: colors.goldBright, fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  analysisText: { ...typography.body, color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  scoreBadgeRow: { alignItems: 'center', gap: 4 },
  scoreBadge: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 22, fontWeight: '700' },
  scoreOf: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
  scoreBadgeLabel: { ...typography.label, color: colors.textTertiary, fontSize: 8 },
  scoresRow: { flexDirection: 'row', gap: 24, justifyContent: 'center', marginTop: 12, marginBottom: 8 },
  scoreSection: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255, 64, 129, 0.04)', borderRadius: 8, padding: 12 },
  scoreExplanation: { ...typography.body, color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  exerciseCard: { backgroundColor: 'rgba(179, 136, 255, 0.06)', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(179, 136, 255, 0.12)' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  exerciseOrder: { ...typography.mono, color: '#B388FF', fontSize: 11, opacity: 0.6 },
  exerciseName: { ...typography.body, color: '#B388FF', fontWeight: '600', flex: 1 },
  exerciseMeta: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  exerciseDetail: { ...typography.caption, color: colors.textSecondary, fontSize: 10 },
  formCuesRow: { marginTop: 6, gap: 4 },
  formCue: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  formCueText: { ...typography.caption, color: '#4CAF50', fontSize: 10 },
  weightRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  weightChip: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: 'rgba(179, 136, 255, 0.1)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  weightLevel: { ...typography.label, color: '#B388FF', fontSize: 7 },
  weightValue: { ...typography.caption, color: colors.textSecondary, fontSize: 9 },
  modificationText: { ...typography.caption, color: '#FFD740', fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  quoteRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  quoteMark: { width: 2, backgroundColor: '#EA80FC', borderRadius: 1 },
  quoteText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', flex: 1, lineHeight: 20 },
  socialQuoteBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.goldSubtle, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.2)' },
  socialQuoteText: { ...typography.body, color: colors.goldBright, flex: 1, fontStyle: 'italic', fontSize: 13, lineHeight: 19 },
  controversialBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255, 64, 129, 0.06)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(255, 64, 129, 0.15)' },
  controversialText: { ...typography.body, color: '#FF4081', flex: 1, fontSize: 13, lineHeight: 19 },
  confluenceRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  confluenceText: { ...typography.body, color: colors.textPrimary, flex: 1, fontSize: 13 },
  proofRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  proofText: { ...typography.body, color: colors.textSecondary, flex: 1, fontSize: 13 },
  mistakeRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  mistakeText: { ...typography.body, color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  featureName: { ...typography.body, color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  featureBenefit: { ...typography.caption, color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  personRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  personName: { ...typography.body, color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  personRole: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  personStance: { ...typography.caption, color: colors.goldDim, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  bigInsightBox: { flexDirection: 'row', gap: 10, backgroundColor: colors.goldSubtle, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.25)', alignItems: 'flex-start' },
  bigInsightText: { ...typography.body, color: colors.goldBright, flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  toolDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingVertical: 4 },
  toolDetailName: { ...typography.body, color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  toolPurpose: { ...typography.caption, color: colors.textTertiary, fontSize: 10, flex: 1 },
  freeTag: { backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50' },
  paidTag: { backgroundColor: 'rgba(255, 138, 128, 0.15)', color: '#FF8A80' },
  metricTag: { backgroundColor: 'rgba(255, 215, 64, 0.1)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  metricText: { ...typography.caption, color: '#FFD740', fontSize: 10 },
});
