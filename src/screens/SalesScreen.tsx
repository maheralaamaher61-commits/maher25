import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSalesInvoices, getSettings } from '@/database/db';
import { SearchBar, Badge } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort, getInvoiceStatusLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = { navigation: any };

export function SalesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: invoices, loading, refresh } = useRefresh(
    () => getSalesInvoices({ limit: 100 }),
    [],
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';
  const filtered = (invoices ?? []).filter((inv) => {
    if (search && !inv.customer_name.includes(search) && !inv.invoice_number.includes(search)) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  const statusFilters = [
    { label: 'الكل', value: null },
    { label: 'مدفوعة', value: 'paid' },
    { label: 'جزئيًا', value: 'partial' },
    { label: 'غير مدفوعة', value: 'unpaid' },
    { label: 'ملغاة', value: 'cancelled' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>المبيعات</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('NewSale')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newButtonText}>فاتورة جديدة</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث برقم الفاتورة أو اسم العميل..." />
        <View style={styles.chipsRow}>
          {statusFilters.map((f) => (
            <TouchableOpacity
              key={f.label}
              onPress={() => setStatusFilter(f.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: statusFilter === f.value ? theme.accent : theme.surfaceAlt,
                  borderColor: statusFilter === f.value ? theme.accent : theme.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: statusFilter === f.value ? '#fff' : theme.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => navigation.navigate('SaleDetail', { invoiceId: item.id })}
            >
              <View style={styles.invoiceHeader}>
                <Text style={[styles.invoiceNumber, { color: theme.textSecondary }]}>{item.invoice_number}</Text>
                <Badge
                  text={getInvoiceStatusLabel(item.status)}
                  color={item.status === 'paid' ? theme.success : item.status === 'partial' ? theme.warning : item.status === 'cancelled' ? theme.textTertiary : theme.error}
                />
              </View>
              <Text style={[styles.customerName, { color: theme.text }]}>{item.customer_name}</Text>
              <View style={styles.invoiceFooter}>
                <Text style={[styles.invoiceDate, { color: theme.textSecondary }]}>{formatDateShort(item.date)}</Text>
                <Text style={[styles.invoiceTotal, { color: theme.text }]}>{formatCurrency(item.total, currency)}</Text>
              </View>
              {item.remaining > 0 && item.status !== 'cancelled' ? (
                <View style={[styles.remainingBar, { backgroundColor: theme.warningBg }]}>
                  <Text style={[styles.remainingText, { color: theme.warning }]}>
                    متبقي: {formatCurrency(item.remaining, currency)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="لا توجد فواتير"
              message="ابدأ بإنشاء فاتورة بيع جديدة"
              actionText="فاتورة جديدة"
              onAction={() => navigation.navigate('NewSale')}
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: 'Cairo' },
  headerActions: { flexDirection: 'row-reverse' },
  newButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  filterSection: { padding: 16, gap: 12 },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'Cairo' },
  invoiceCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  invoiceHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: { fontSize: 12, fontFamily: 'Cairo' },
  customerName: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', marginBottom: 8 },
  invoiceFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDate: { fontSize: 13, fontFamily: 'Cairo' },
  invoiceTotal: { fontSize: 17, fontWeight: '700', fontFamily: 'Cairo' },
  remainingBar: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  remainingText: { fontSize: 13, fontFamily: 'Cairo', fontWeight: '600' },
});
