import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  Animated, KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../components/GlassCard';
import { GoldButton } from '../components/GoldButton';
import { PulsingOrb } from '../components/PulsingOrb';
import { IntelligenceView } from '../components/IntelligenceView';
import { extractUrl } from '../api/client';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const DEPTH_OPTIONS = [
  { key: 'quick', label: 'QUICK', time: '~15s', icon: 'flash-outline' },
  { key: 'standard', label: 'STANDARD', time: '~30s', icon: 'flash' },
  { key: 'deep', label: 'DEEP (Opus)', time: '~90s', icon: 'nuclear' },
];

const PROGRESS_STEPS = {
  quick: [
    'Connecting to source...',
    'Downloading metadata...',
    'Quick extraction...',
    'Finalizing...',
  ],
  standard: [
    'Connecting to source...',
    'Downloading video metadata...',
    'Extracting transcript...',
    'Detecting content type...',
    'Extracting intelligence...',
    'Generating type-specific data...',
    'Scoring quality...',
    'Finalizing report...',
  ],
  deep: [
    'Connecting to source...',
    'Downloading video metadata...',
    'Extracting full transcript...',
    'Detecting content type...',
    'Opus: Deep speaker & delivery analysis...',
    'Opus: Extracting exhaustive intelligence...',
    'Opus: Mining every quote, tool, & resource...',
    'Opus: Deep type-specific extraction...',
    'Opus: Analyzing meta-strategy & hidden insights...',
    'Scoring extraction quality...',
    'Quality check — retrying if incomplete...',
    'Generating adaptations & scripts...',
    'Finalizing deep intelligence report...',
  ],
};

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [depth, setDepth] = useState('deep');
  const [progressIdx, setProgressIdx] = useState(0);

  const titleFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(titleFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const steps = PROGRESS_STEPS[depth] || PROGRESS_STEPS.deep;

  useEffect(() => {
    if (!loading) return;
    setProgressIdx(0);
    const interval = setInterval(() => {
      setProgressIdx(prev => {
        if (prev < steps.length - 1) {
          setStatus(steps[prev + 1]);
          return prev + 1;
        }
        return prev;
      });
    }, depth === 'quick' ? 1500 : depth === 'standard' ? 2500 : 6000);
    return () => clearInterval(interval);
  }, [loading, depth]);

  const handleExtract = async () => {
    if (!url.trim()) {
      Alert.alert('URL Required', 'Paste a video URL to extract intelligence.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(steps[0]);

    try {
      const data = await extractUrl(url.trim(), 'auto', depth);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(data);
      setStatus('');
    } catch (err) {
      setError(err.message);
      setStatus('');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { setUrl(''); setResult(null); setError(null); setStatus(''); };

  const handleShare = async () => {
    if (!result) return;
    const intel = result.intelligence;
    const text = `EXTRACT Intelligence Report\n\nType: ${intel.contentType}\n\n${intel.summary}\n\nKey Insights:\n${(intel.keyInsights || []).map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\nHook: ${intel.scriptHook || ''}`;
    try { await Share.share({ message: text }); } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0A0A0F', '#0D0D14', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.ambientGlow} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: titleFade }]}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Ionicons name="diamond" size={18} color={colors.goldPrimary} />
              </View>
              <View>
                <Text style={styles.title}>EXTRACT</Text>
                <Text style={styles.subtitle}>Deep Intelligence Engine</Text>
              </View>
            </View>
            <View style={styles.divider} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View style={[styles.content, { opacity: contentFade }]}>
            {!result ? (
              <>
                {/* Input */}
                <GlassCard style={styles.inputCard} glowIntensity={loading ? 0.3 : 0}>
                  <Text style={styles.inputLabel}>VIDEO URL</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="link" size={18} color={colors.goldDim} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={url}
                      onChangeText={setUrl}
                      placeholder="Paste YouTube, TikTok, or Instagram URL"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none" autoCorrect={false} keyboardType="url"
                      editable={!loading} selectionColor={colors.goldPrimary}
                    />
                  </View>
                </GlassCard>

                {/* Depth Selector */}
                {!loading && (
                  <View style={styles.depthRow}>
                    <Text style={styles.depthLabel}>EXTRACTION DEPTH</Text>
                    <View style={styles.depthOptions}>
                      {DEPTH_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.key}
                          style={[styles.depthBtn, depth === opt.key && styles.depthBtnActive]}
                          onPress={() => setDepth(opt.key)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={opt.icon} size={14} color={depth === opt.key ? colors.goldPrimary : colors.textTertiary} />
                          <Text style={[styles.depthBtnText, depth === opt.key && styles.depthBtnTextActive]}>{opt.label}</Text>
                          <Text style={styles.depthTime}>{opt.time}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Processing */}
                {loading && (
                  <View style={styles.processingContainer}>
                    <PulsingOrb size={100} active={true} />
                    <Text style={styles.statusText}>{status}</Text>

                    {/* Progress bar */}
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${((progressIdx + 1) / steps.length) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      Step {progressIdx + 1} of {steps.length}
                    </Text>
                  </View>
                )}

                {/* Error */}
                {error && (
                  <GlassCard style={styles.errorCard}>
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={18} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  </GlassCard>
                )}

                {/* Extract Button */}
                {!loading && (
                  <View style={styles.buttonArea}>
                    <GoldButton
                      title={`EXTRACT — ${depth.toUpperCase()}`}
                      onPress={handleExtract}
                      loading={loading}
                      disabled={!url.trim()}
                      icon={<Ionicons name="flash" size={18} color={colors.bg} />}
                    />
                  </View>
                )}

                {/* Supported */}
                {!loading && (
                  <View style={styles.platforms}>
                    <Text style={styles.platformsLabel}>SUPPORTED</Text>
                    <View style={styles.platformIcons}>
                      <Ionicons name="logo-youtube" size={20} color={colors.textTertiary} />
                      <Ionicons name="logo-tiktok" size={18} color={colors.textTertiary} />
                      <Ionicons name="logo-instagram" size={20} color={colors.textTertiary} />
                      <Ionicons name="logo-twitter" size={20} color={colors.textTertiary} />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Results */}
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsLeft}>
                    <Text style={styles.resultsTitle}>INTELLIGENCE REPORT</Text>
                    {result.intelligence?._qualityScore && (
                      <View style={styles.qualityBadge}>
                        <Text style={styles.qualityText}>Q{result.intelligence._qualityScore}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.resultsActions}>
                    <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                      <Ionicons name="share-outline" size={18} color={colors.goldDim} />
                    </TouchableOpacity>
                    <GoldButton title="NEW" variant="ghost" onPress={handleClear}
                      icon={<Ionicons name="add" size={16} color={colors.goldPrimary} />} />
                  </View>
                </View>
                <IntelligenceView data={result.intelligence} source={result.source} result={result} />
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  safe: { flex: 1 },
  ambientGlow: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(200, 168, 78, 0.04)' },
  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 48 : 16, paddingBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoMark: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.goldSubtle, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.hero, color: colors.textPrimary, fontSize: 24, letterSpacing: 6 },
  subtitle: { ...typography.caption, color: colors.textTertiary, fontSize: 10, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 16 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  inputCard: { marginBottom: 16 },
  inputLabel: { ...typography.label, color: colors.goldDim, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, ...typography.body, color: colors.textPrimary, fontSize: 15, padding: 0 },
  depthRow: { marginBottom: 20 },
  depthLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9, marginBottom: 8 },
  depthOptions: { flexDirection: 'row', gap: 8 },
  depthBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 4 },
  depthBtnActive: { borderColor: colors.goldPrimary, backgroundColor: colors.goldSubtle },
  depthBtnText: { ...typography.label, color: colors.textTertiary, fontSize: 10 },
  depthBtnTextActive: { color: colors.goldPrimary },
  depthTime: { ...typography.caption, color: colors.textTertiary, fontSize: 8 },
  processingContainer: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  statusText: { ...typography.subheading, color: colors.goldPrimary, fontSize: 12, marginTop: 8, textAlign: 'center' },
  progressBar: { width: '80%', height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: colors.goldPrimary, borderRadius: 2 },
  progressText: { ...typography.caption, color: colors.textTertiary, fontSize: 9 },
  errorCard: { marginBottom: 16, borderColor: 'rgba(248, 113, 113, 0.2)' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { ...typography.body, color: colors.error, flex: 1, fontSize: 13 },
  buttonArea: { marginBottom: 24 },
  platforms: { alignItems: 'center', gap: 10 },
  platformsLabel: { ...typography.label, color: colors.textTertiary, fontSize: 9 },
  platformIcons: { flexDirection: 'row', gap: 20 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultsLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsTitle: { ...typography.label, color: colors.goldPrimary, fontSize: 13 },
  qualityBadge: { backgroundColor: colors.goldSubtle, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(200, 168, 78, 0.2)' },
  qualityText: { ...typography.mono, color: colors.goldPrimary, fontSize: 11 },
  resultsActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareBtn: { padding: 8 },
});
