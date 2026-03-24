import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { ContentTypeBadge } from '../components/ContentTypeBadge';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { getLibrary, deleteLibraryItem, updateLibraryItem } from '../api/client';

const STATUS_COLORS = {
  saved: colors.goldPrimary,
  implementing: '#6DD5FA',
  done: colors.success,
};

function LibraryItem({ item, onDelete, onStatusChange, onPress }) {
  const statusColor = STATUS_COLORS[item.status] || colors.textTertiary;

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8}>
      <GlassCard style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <ContentTypeBadge contentType={item.contentType} size="small" />
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || item.url}
        </Text>

        <Text style={styles.itemSummary} numberOfLines={2}>
          {item.intelligence?.summary || ''}
        </Text>

        <View style={styles.itemFooter}>
          <Text style={styles.itemDate}>
            {new Date(item.savedAt).toLocaleDateString()}
          </Text>

          <View style={styles.itemActions}>
            <TouchableOpacity
              onPress={() => {
                const next = item.status === 'saved' ? 'implementing' : item.status === 'implementing' ? 'done' : 'saved';
                onStatusChange(item.id, next);
              }}
              style={[styles.miniBtn, { borderColor: statusColor + '40' }]}
            >
              <Text style={[styles.miniBtnText, { color: statusColor }]}>
                {item.status === 'saved' ? 'START' : item.status === 'implementing' ? 'DONE' : 'RESET'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={[styles.miniBtn, { borderColor: colors.error + '30' }]}
            >
              <Ionicons name="trash" size={12} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function LibraryScreen({ onSelectItem }) {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getLibrary(filter ? { status: filter } : {});
      setItems(res.items || []);
    } catch (e) {
      console.warn('Library load error:', e.message);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    await deleteLibraryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await updateLibraryItem(id, { status });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0D0D14', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Ionicons name="library" size={18} color={colors.goldPrimary} />
        <Text style={styles.title}>LIBRARY</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>

      {/* Filter Strip */}
      <View style={styles.filterRow}>
        {[null, 'saved', 'implementing', 'done'].map((f) => (
          <TouchableOpacity
            key={f || 'all'}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f ? f.toUpperCase() : 'ALL'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onPress={onSelectItem}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldPrimary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No saved extractions yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 48 : 16, paddingBottom: 12,
  },
  title: { ...typography.label, color: colors.goldPrimary, fontSize: 13, flex: 1 },
  count: { ...typography.mono, color: colors.textTertiary, fontSize: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { borderColor: colors.goldPrimary, backgroundColor: colors.goldSubtle },
  filterText: { ...typography.label, color: colors.textTertiary, fontSize: 9 },
  filterTextActive: { color: colors.goldPrimary },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  itemCard: { marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  itemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '500', marginBottom: 4 },
  itemSummary: { ...typography.body, color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
  itemActions: { flexDirection: 'row', gap: 8 },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  miniBtnText: { ...typography.label, fontSize: 9 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { ...typography.body, color: colors.textTertiary },
});
