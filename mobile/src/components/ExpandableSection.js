import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function ExpandableSection({ title, icon, iconColor, children, defaultExpanded = true, copyText }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyText) return;
    await Clipboard.setStringAsync(typeof copyText === 'string' ? copyText : JSON.stringify(copyText, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!copyText) return;
    const text = typeof copyText === 'string' ? copyText : JSON.stringify(copyText, null, 2);
    try { await Share.share({ message: `${title}\n\n${text}` }); } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name={icon || 'chevron-forward'} size={14} color={iconColor || colors.goldPrimary} />
          <Text style={[styles.title, iconColor && { color: iconColor }]}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {copyText && (
            <TouchableOpacity onPress={handleShare} style={styles.copyBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-outline" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {copyText && (
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? colors.success : colors.textTertiary} />
            </TouchableOpacity>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

export function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TouchableOpacity onPress={handleCopy} style={styles.copyBtnInline} activeOpacity={0.7}>
      <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={12} color={copied ? colors.success : colors.goldDim} />
      {label && <Text style={[styles.copyLabel, copied && { color: colors.success }]}>{copied ? 'COPIED' : label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { ...typography.label, color: colors.goldPrimary },
  copyBtn: { padding: 4 },
  content: { marginTop: 4 },
  copyBtnInline: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  copyLabel: { ...typography.label, color: colors.goldDim, fontSize: 8 },
});
