import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const titleFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleExtract = async () => {
    if (!url.trim()) {
      Alert.alert('URL Required', 'Paste a video URL to extract intelligence.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStatus('Connecting...');

    try {
      setStatus('Extracting intelligence...');
      const data = await extractUrl(url.trim());

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setResult(data);
      setStatus('');
    } catch (err) {
      setError(err.message);
      setStatus('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setResult(null);
    setError(null);
    setStatus('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#0D0D14', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient gold glow */}
      <View style={styles.ambientGlow} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: titleFade }]}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Ionicons name="diamond" size={18} color={colors.goldPrimary} />
              </View>
              <View>
                <Text style={styles.title}>EXTRACT</Text>
                <Text style={styles.subtitle}>Video Intelligence Platform</Text>
              </View>
            </View>
            <View style={styles.divider} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View style={[styles.content, { opacity: contentFade }]}>
            {!result ? (
              <>
                {/* Input Area */}
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
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      editable={!loading}
                      selectionColor={colors.goldPrimary}
                    />
                  </View>
                </GlassCard>

                {/* Processing State */}
                {loading && (
                  <View style={styles.processingContainer}>
                    <PulsingOrb size={100} active={true} />
                    <Text style={styles.statusText}>{status}</Text>
                    <Text style={styles.statusHint}>This may take 15-30 seconds</Text>
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
                      title="EXTRACT INTELLIGENCE"
                      onPress={handleExtract}
                      loading={loading}
                      disabled={!url.trim()}
                      icon={<Ionicons name="flash" size={18} color={colors.bg} />}
                    />
                  </View>
                )}

                {/* Supported Platforms */}
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
                {/* Results View */}
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>INTELLIGENCE REPORT</Text>
                  <GoldButton
                    title="NEW"
                    variant="ghost"
                    onPress={handleClear}
                    icon={<Ionicons name="add" size={16} color={colors.goldPrimary} />}
                  />
                </View>
                <IntelligenceView
                  data={result.intelligence}
                  source={result.source}
                />
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(200, 168, 78, 0.04)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.goldSubtle,
    borderWidth: 1,
    borderColor: 'rgba(200, 168, 78, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 24,
    letterSpacing: 6,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputCard: {
    marginBottom: 24,
  },
  inputLabel: {
    ...typography.label,
    color: colors.goldDim,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    padding: 0,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  statusText: {
    ...typography.subheading,
    color: colors.goldPrimary,
    fontSize: 13,
    marginTop: 8,
  },
  statusHint: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 10,
  },
  errorCard: {
    marginBottom: 16,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    flex: 1,
    fontSize: 13,
  },
  buttonArea: {
    marginBottom: 32,
  },
  platforms: {
    alignItems: 'center',
    gap: 10,
  },
  platformsLabel: {
    ...typography.label,
    color: colors.textTertiary,
    fontSize: 9,
  },
  platformIcons: {
    flexDirection: 'row',
    gap: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    ...typography.label,
    color: colors.goldPrimary,
    fontSize: 13,
  },
});
