import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getStockMovements, getSettings } from '@/database/db';
import { SearchBar, Chip } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatDate, formatDateShort, getStockReasonLabel } from '@/utils/format';
import { STOCK_REASONS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'StockMovements'>;

export function StockMovementsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { productId } = route.params || {};
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: movements, loading, refresh } = useRefresh(() => getStockMovements({ productId, limit: 200 }), [productId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = (movements ?? []).filter((m) => {
    if (reasonFilter && m.reason !== reasonFilter) return false;
    if (search && !m.product_name.includes(search)) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>حركات المخزون</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث باسم المنتج..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            <Chip label="الكل" selected={reasonFilter === null} onPress={() => setReasonFilter(null)} />
            {STOCK_REASONS.map((r) => (
              <Chip key={r.value} label={r.label} selected={reasonFilter === r.value} onPress={() => setReasonFilter(r.value)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: theme.text }]}>{item.product_name}</Text>
                  <Text style={[styles.reason, { color: theme.textSecondary }]}>{getStockReasonLabel(item.reason)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.qty, { color: item.type === '+' ? theme.success : theme.error }]}>
                    {item.type}{item.quantity}
                  </Text>
                  <Text style={[styles.balance, { color: theme.textTertiary }]}>الرصيد: {item.balance_after}</Text>
                </View>
              </View>
              <Text style={[styles.date, { color: theme.textTertiary }]}>{formatDateShort(item.date)} {item.time}</Text>
              {item.invoice_id ? <Text style={[styles.invoiceRef, { color: theme.textTertiary }]}>فاتورة: #{item.invoice_id}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="swap-horizontal" title="لا توجد حركات مخزون" />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  reason: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
  qty: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  balance: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  date: { fontSize: 12, fontFamily: 'Cairo' },
  invoiceRef: { fontSize: 11, fontFamily: 'Cairo', marginTop: 4 },
});
