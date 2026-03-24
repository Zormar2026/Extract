import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getContentTypeConfig } from '../theme/contentTypes';
import { typography } from '../theme/typography';

export function ContentTypeBadge({ contentType, size = 'normal' }) {
  const config = getContentTypeConfig(contentType);
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.color + '18', borderColor: config.color + '40' },
      isSmall && styles.badgeSmall,
    ]}>
      <Ionicons name={config.icon} size={isSmall ? 10 : 13} color={config.color} />
      <Text style={[
        styles.label,
        { color: config.color },
        isSmall && styles.labelSmall,
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  label: {
    ...typography.label,
    fontSize: 11,
  },
  labelSmall: {
    fontSize: 9,
  },
});
