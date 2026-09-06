import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getReceivablesSummary, getReceivablesByCustomer, getSettings, updateOverdueInstallments } from '@/database/db';
import { Chip } from '@/components/ui/Inputs';
import { EmptyState, LoadingState, StatCard } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort, todayISO } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Receivables'>;

export function ReceivablesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month' | 'overdue'>('all');
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: summary, loading: summaryLoading } = useRefresh(async () => {
    await updateOverdueInstallments();
    return getReceivablesSummary();
  }, []);
  const { data: byCustomer, loading: custLoading } = useRefresh(() => getReceivablesByCustomer(), []);

  useFocusEffect(useCallback(() => {}, []));

  const currency = settings?.currency ?? 'ج.م';

  const filters = [
    { label: 'الكل', value: 'all' as const },
    { label: 'اليوم', value: 'today' as const },
    { label: 'الأسبوع', value: 'week' as const },
    { label: 'الشهر', value: 'month' as const },
    { label: 'متأخر', value: 'overdue' as const },
  ];

  const today = todayISO();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>المستحقات</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}><StatCard title="إجمالي المستحقات" value={formatCurrency(summary?.total ?? 0, currency)} icon="cash" color={theme.accent} /></View>
          <View style={{ flex: 1 }}><StatCard title="مستحق اليوم" value={formatCurrency(summary?.today ?? 0, currency)} icon="alarm" color={theme.warning} /></View>
        </View>
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}><StatCard title="متأخر" value={formatCurrency(summary?.overdue ?? 0, currency)} icon="alert" color={theme.error} /></View>
          <View style={{ flex: 1 }}><StatCard title="خلال أسبوع" value={formatCurrency(summary?.week ?? 0, currency)} icon="calendar" color={theme.info} /></View>
        </View>
        <View style={styles.chipsRow}>
          {filters.map((f) => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </View>
      </View>

      {custLoading ? <LoadingState /> : (
        <FlatList
          data={byCustomer ?? []}
          keyExtractor={(item, i) => String(i)}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => {
              // Find customer by name - navigate to installments
              navigation.navigate('Installments');
            }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.customerName, { color: theme.text }]}>{item.customer_name}</Text>
                  <Text style={[styles.phone, { color: theme.textSecondary }]}>{item.phone ?? ''}</Text>
                </View>
                <Text style={[styles.totalRemaining, { color: theme.error }]}>{formatCurrency(item.total_remaining, currency)}</Text>
              </View>
              <View style={styles.cardFooter}>
                {item.overdue > 0 ? <Text style={[styles.badgeText, { color: theme.error }]}>متأخر: {formatCurrency(item.overdue, currency)}</Text> : null}
                {item.today_due > 0 ? <Text style={[styles.badgeText, { color: theme.warning }]}>اليوم: {formatCurrency(item.today_due, currency)}</Text> : null}
                {item.next_due ? <Text style={[styles.badgeText, { color: theme.textSecondary }]}>أقرب دفع: {formatDateShort(item.next_due)}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="checkmark-circle-outline" title="لا توجد مستحقات" message="جميع الأقساط مدفوعة" />}
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
  statsRow: { flexDirection: 'row-reverse', gap: 12 },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  customerName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  phone: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  totalRemaining: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  cardFooter: { flexDirection: 'row-reverse', gap: 12, flexWrap: 'wrap' },
  badgeText: { fontSize: 12, fontFamily: 'Cairo' },
});
