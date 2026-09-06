import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getPurchaseInvoices, getSettings } from '@/database/db';
import { SearchBar, Chip } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Purchases'>;

export function PurchasesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: invoices, loading, refresh } = useRefresh(() => getPurchaseInvoices({ limit: 100 }), []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const filtered = (invoices ?? []).filter((inv) => {
    if (search && !inv.supplier_name.includes(search) && !inv.invoice_number.includes(search)) return false;
    if (period === 'today' && inv.date !== today) return false;
    if (period === 'week' && inv.date < weekAgo) return false;
    if (period === 'month' && inv.date < monthAgo) return false;
    return true;
  });

  const periods = [
    { label: 'الكل', value: 'all' as const },
    { label: 'اليوم', value: 'today' as const },
    { label: 'الأسبوع', value: 'week' as const },
    { label: 'الشهر', value: 'month' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>المشتريات</Text>
        <TouchableOpacity style={[styles.newButton, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('NewPurchase')}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث برقم الفاتورة أو المورد..." />
        <View style={styles.chipsRow}>
          {periods.map((p) => (
            <Chip key={p.value} label={p.label} selected={period === p.value} onPress={() => setPeriod(p.value)} />
          ))}
        </View>
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('PurchaseDetail', { invoiceId: item.id })}>
              <View style={styles.cardHeader}>
                <Text style={[styles.invoiceNum, { color: theme.textSecondary }]}>{item.invoice_number}</Text>
                <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(item.total, currency)}</Text>
              </View>
              <Text style={[styles.supplierName, { color: theme.text }]}>{item.supplier_name}</Text>
              <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDateShort(item.date)}</Text>
              {item.remaining > 0 ? (
                <View style={[styles.remainingBar, { backgroundColor: theme.warningBg }]}>
                  <Text style={[styles.remainingText, { color: theme.warning }]}>متبقي: {formatCurrency(item.remaining, currency)}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="bag-outline" title="لا توجد مشتريات" message="ابدأ بإنشاء فاتورة شراء" actionText="فاتورة شراء" onAction={() => navigation.navigate('NewPurchase')} />}
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
  newButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  invoiceNum: { fontSize: 12, fontFamily: 'Cairo' },
  amount: { fontSize: 17, fontWeight: '700', fontFamily: 'Cairo' },
  supplierName: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
  date: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
  remainingBar: { marginTop: 8, padding: 6, borderRadius: 8, alignItems: 'center' },
  remainingText: { fontSize: 12, fontFamily: 'Cairo', fontWeight: '600' },
});
