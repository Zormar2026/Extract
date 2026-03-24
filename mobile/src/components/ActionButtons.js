import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { GoldButton } from './GoldButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AD_PRODUCTS } from '../theme/contentTypes';
import { saveToLibrary, adaptAd, automateUrl } from '../api/client';

function ActionButton({ icon, label, color, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color + '30' }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={18} color={color} />
      )}
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ActionButtons({ result, contentType, onAdaptResult }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [automating, setAutomating] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adaptingProduct, setAdaptingProduct] = useState(null);

  const isAd = contentType === 'advertisement/marketing';
  const isMM = ['business/entrepreneurship', 'trading/investing'].includes(contentType);

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    haptic();
    setSaving(true);
    try {
      await saveToLibrary(result);
      setSaved(true);
      Alert.alert('Saved', 'Extraction saved to library.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutomate = async () => {
    haptic();
    setAutomating(true);
    try {
      const res = await automateUrl(result.source?.url);
      Alert.alert('Pipeline Started', 'Content sent to Mentor Millionaire pipeline.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAutomating(false);
    }
  };

  const handleAdapt = async (productName) => {
    haptic();
    setAdaptingProduct(productName);
    try {
      const res = await adaptAd(result, productName);
      setShowAdModal(false);
      setAdaptingProduct(null);
      if (onAdaptResult) onAdaptResult(res.adaptation);
    } catch (e) {
      Alert.alert('Error', e.message);
      setAdaptingProduct(null);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <ActionButton
          icon={saved ? 'checkmark-circle' : 'bookmark'}
          label={saved ? 'SAVED' : 'SAVE'}
          color={saved ? colors.success : colors.goldPrimary}
          onPress={handleSave}
          loading={saving}
        />

        {isMM && (
          <ActionButton
            icon="videocam"
            label="CREATE"
            color="#FFD740"
            onPress={handleAutomate}
            loading={automating}
          />
        )}

        {isAd && (
          <ActionButton
            icon="color-wand"
            label="ADAPT AD"
            color="#FF4081"
            onPress={() => { haptic(); setShowAdModal(true); }}
          />
        )}

        <ActionButton
          icon="copy"
          label="IMPLEMENT"
          color="#6DD5FA"
          onPress={() => { haptic(); handleSave(); }}
          loading={false}
        />
      </View>

      {/* Ad Adaptation Modal */}
      <Modal visible={showAdModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} glowIntensity={0.2}>
            <Text style={styles.modalTitle}>ADAPT AD FOR</Text>
            <Text style={styles.modalSubtitle}>Choose a product to create an adapted script</Text>

            {AD_PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product}
                style={styles.productRow}
                onPress={() => handleAdapt(product)}
                disabled={!!adaptingProduct}
                activeOpacity={0.7}
              >
                {adaptingProduct === product ? (
                  <ActivityIndicator size="small" color="#FF4081" />
                ) : (
                  <Ionicons name="arrow-forward-circle" size={20} color="#FF4081" />
                )}
                <Text style={styles.productName}>{product}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.productRow}
              onPress={() => {
                Alert.prompt?.('Custom Product', 'Enter product name:', (name) => {
                  if (name) handleAdapt(name);
                }) || Alert.alert('Coming Soon', 'Custom product support coming in next update.');
              }}
              disabled={!!adaptingProduct}
            >
              <Ionicons name="add-circle" size={20} color={colors.goldPrimary} />
              <Text style={[styles.productName, { color: colors.goldPrimary }]}>Custom Product</Text>
            </TouchableOpacity>

            <GoldButton
              title="CANCEL"
              variant="ghost"
              onPress={() => setShowAdModal(false)}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
  },
  actionLabel: {
    ...typography.label,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.label,
    color: '#FF4081',
    fontSize: 13,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productName: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
});
