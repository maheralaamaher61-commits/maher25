import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import {
  getSalesReport, getPurchaseReport, getExpensesReport, getTopProducts, getBottomProducts,
  getProducts, getSettings, getReceivablesSummary,
} from '@/database/db';
import { Chip, Button } from '@/components/ui/Inputs';
import { StatCard, SectionHeader, LoadingState } from '@/components/ui/Cards';
import { formatCurrency, todayISO, getWeekStart, getMonthStart, formatDateShort } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export function ReportsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [dateFrom, setDateFrom] = useState(getMonthStart());
  const [dateTo, setDateTo] = useState(todayISO());

  const updatePeriod = (p: typeof period) => {
    setPeriod(p);
    if (p === 'today') { setDateFrom(todayISO()); setDateTo(todayISO()); }
    else if (p === 'week') { setDateFrom(getWeekStart()); setDateTo(todayISO()); }
    else if (p === 'month') { setDateFrom(getMonthStart()); setDateTo(todayISO()); }
  };

  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: salesReport, refresh: refreshSales } = useRefresh(() => getSalesReport(dateFrom, dateTo), [dateFrom, dateTo]);
  const { data: purchaseReport, refresh: refreshPurchases } = useRefresh(() => getPurchaseReport(dateFrom, dateTo), [dateFrom, dateTo]);
  const { data: expensesReport, refresh: refreshExpenses } = useRefresh(() => getExpensesReport(dateFrom, dateTo), [dateFrom, dateTo]);
  const { data: topProducts, refresh: refreshTop } = useRefresh(() => getTopProducts(dateFrom, dateTo, 10), [dateFrom, dateTo]);
  const { data: bottomProducts, refresh: refreshBottom } = useRefresh(() => getBottomProducts(dateFrom, dateTo, 10), [dateFrom, dateTo]);
  const { data: lowStockProducts, refresh: refreshLow } = useRefresh(() => getProducts({ lowStock: true, limit: 20 }), []);
  const { data: expiredProducts, refresh: refreshExpired } = useRefresh(() => getProducts({ expiryFilter: 'expired', limit: 20 }), []);
  const { data: receivables, refresh: refreshRec } = useRefresh(() => getReceivablesSummary(), []);

  useFocusEffect(useCallback(() => {
    refreshSales(); refreshPurchases(); refreshExpenses(); refreshTop(); refreshBottom(); refreshLow(); refreshExpired(); refreshRec();
  }, [dateFrom, dateTo]));

  const currency = settings?.currency ?? 'ج.م';

  const netProfit = (salesReport?.profit ?? 0) - (expensesReport?.total ?? 0);

  const handleShare = async () => {
    let text = `تقرير المبيعات (${formatDateShort(dateFrom)} - ${formatDateShort(dateTo)})\n\n`;
    text += `المبيعات: ${formatCurrency(salesReport?.total ?? 0, currency)}\n`;
    text += `المشتريات: ${formatCurrency(purchaseReport?.total ?? 0, currency)}\n`;
    text += `المصروفات: ${formatCurrency(expensesReport?.total ?? 0, currency)}\n`;
    text += `صافي الربح: ${formatCurrency(netProfit, currency)}\n\n`;
    text += `المنتجات الأكثر مبيعًا:\n`;
    (topProducts ?? []).forEach((p, i) => { text += `${i + 1}. ${p.product_name} - ${p.qty} قطعة\n`; });
    await Share.share({ message: text });
  };

  const periods = [
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
        <Text style={[styles.title, { color: theme.text }]}>التقارير</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={styles.chipsRow}>
          {periods.map((p) => (
            <Chip key={p.value} label={p.label} selected={period === p.value} onPress={() => updatePeriod(p.value)} />
          ))}
        </View>
        <Text style={[styles.dateRange, { color: theme.textSecondary }]}>{formatDateShort(dateFrom)} - {formatDateShort(dateTo)}</Text>

        <SectionHeader title="المبيعات والمشتريات" />
        <View style={styles.statsGrid}>
          <View style={styles.statCol}><StatCard title="المبيعات" value={formatCurrency(salesReport?.total ?? 0, currency)} icon="trending-up" color={theme.success} subtitle={`${salesReport?.count ?? 0} فاتورة`} /></View>
          <View style={styles.statCol}><StatCard title="المشتريات" value={formatCurrency(purchaseReport?.total ?? 0, currency)} icon="trending-down" color={theme.info} subtitle={`${purchaseReport?.count ?? 0} فاتورة`} /></View>
          <View style={styles.statCol}><StatCard title="المصروفات" value={formatCurrency(expensesReport?.total ?? 0, currency)} icon="wallet" color={theme.warning} /></View>
          <View style={styles.statCol}><StatCard title="صافي الربح" value={formatCurrency(netProfit, currency)} icon="bar-chart" color={netProfit >= 0 ? theme.accent : theme.error} /></View>
        </View>

        <SectionHeader title="المستحقات" />
        <View style={styles.statsGrid}>
          <View style={styles.statCol}><StatCard title="إجمالي المستحق" value={formatCurrency(receivables?.total ?? 0, currency)} icon="cash" color={theme.warning} /></View>
          <View style={styles.statCol}><StatCard title="متأخر" value={formatCurrency(receivables?.overdue ?? 0, currency)} icon="alert" color={theme.error} /></View>
        </View>

        <SectionHeader title="المنتجات الأكثر مبيعًا" />
        {(topProducts ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.textTertiary }]}>لا توجد بيانات</Text>
        ) : (
          (topProducts ?? []).map((p, i) => (
            <View key={i} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.rank, { color: theme.textTertiary }]}>{i + 1}</Text>
              <Text style={[styles.productName, { color: theme.text }]}>{p.product_name}</Text>
              <Text style={[styles.productQty, { color: theme.textSecondary }]}>{p.qty} قطعة</Text>
              <Text style={[styles.productTotal, { color: theme.text }]}>{formatCurrency(p.total, currency)}</Text>
            </View>
          ))
        )}

        <SectionHeader title="المنتجات الأقل مبيعًا" />
        {(bottomProducts ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.textTertiary }]}>لا توجد بيانات</Text>
        ) : (
          (bottomProducts ?? []).slice(0, 5).map((p, i) => (
            <View key={i} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.rank, { color: theme.textTertiary }]}>{i + 1}</Text>
              <Text style={[styles.productName, { color: theme.text }]}>{p.product_name}</Text>
              <Text style={[styles.productQty, { color: theme.textSecondary }]}>{p.qty} قطعة</Text>
              <Text style={[styles.productTotal, { color: theme.text }]}>{formatCurrency(p.total, currency)}</Text>
            </View>
          ))
        )}

        <SectionHeader title="منتجات مخزون منخفض" />
        {(lowStockProducts ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.success }]}>لا توجد منتجات بمخزون منخفض</Text>
        ) : (
          (lowStockProducts ?? []).map((p) => (
            <View key={p.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.productName, { color: theme.text, flex: 1 }]}>{p.name}</Text>
              <Text style={[styles.productQty, { color: theme.error }]}>{p.quantity} {p.unit}</Text>
              <Text style={[styles.productTotal, { color: theme.textTertiary }]}>حد أدنى: {p.min_stock}</Text>
            </View>
          ))
        )}

        <SectionHeader title="منتجات منتهية الصلاحية" />
        {(expiredProducts ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.success }]}>لا توجد منتجات منتهية الصلاحية</Text>
        ) : (
          (expiredProducts ?? []).map((p) => (
            <View key={p.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.productName, { color: theme.text, flex: 1 }]}>{p.name}</Text>
              <Text style={[styles.productQty, { color: theme.error }]}>{p.expiry_date ?? ''}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  shareButton: { padding: 8 },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  dateRange: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 16 },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCol: { flexBasis: '47%', flexGrow: 1 },
  listItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  rank: { fontSize: 14, fontWeight: '700', fontFamily: 'Cairo', width: 24 },
  productName: { flex: 1, fontSize: 14, fontFamily: 'Cairo' },
  productQty: { fontSize: 13, fontFamily: 'Cairo' },
  productTotal: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  empty: { fontSize: 13, fontFamily: 'Cairo', textAlign: 'center', paddingVertical: 16 },
});
