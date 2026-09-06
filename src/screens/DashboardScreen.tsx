import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getDashboardStats, getRecentSalesInvoices, getRecentPurchaseInvoices, getRecentStockMovements, getRecentCustomerPayments, getSettings } from '@/database/db';
import { StatCard, AlertCard, SectionHeader, EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort, getInvoiceStatusLabel, getStockReasonLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = { navigation: any };

export function DashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: stats, loading: statsLoading } = useRefresh(() => getDashboardStats(), []);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: recentSales } = useRefresh(() => getRecentSalesInvoices(5), []);
  const { data: recentPurchases } = useRefresh(() => getRecentPurchaseInvoices(5), []);
  const { data: recentMovements } = useRefresh(() => getRecentStockMovements(5), []);
  const { data: recentPayments } = useRefresh(() => getRecentCustomerPayments(5), []);

  const currency = settings?.currency ?? 'ج.م';

  if (statsLoading || !stats) {
    return <LoadingState message="جاري تحميل البيانات..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={[1]}
        renderItem={() => (
          <View style={styles.content}>
            <Text style={[styles.greeting, { color: theme.text }]}>لوحة التحكم</Text>
            <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDateShort(new Date())}</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <StatCard
                  title="مبيعات اليوم"
                  value={formatCurrency(stats.today_sales, currency)}
                  icon="trending-up"
                  color={theme.success}
                  onPress={() => navigation.navigate('Sales')}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="مشتريات اليوم"
                  value={formatCurrency(stats.today_purchases, currency)}
                  icon="trending-down"
                  color={theme.info}
                  onPress={() => navigation.navigate('Purchases')}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="مصروفات اليوم"
                  value={formatCurrency(stats.today_expenses, currency)}
                  icon="wallet-outline"
                  color={theme.warning}
                  onPress={() => navigation.navigate('Expenses')}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="صافي ربح اليوم"
                  value={formatCurrency(stats.today_profit, currency)}
                  icon="bar-chart"
                  color={theme.accent}
                  onPress={() => navigation.navigate('Reports')}
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <StatCard
                  title="فواتير البيع"
                  value={String(stats.sales_invoice_count)}
                  icon="receipt"
                  onPress={() => navigation.navigate('Sales')}
                  subtitle="فاتورة اليوم"
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="فواتير الشراء"
                  value={String(stats.purchase_invoice_count)}
                  icon="document-text"
                  onPress={() => navigation.navigate('Purchases')}
                  subtitle="فاتورة اليوم"
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="قيمة المخزون"
                  value={formatCurrency(stats.inventory_value, currency)}
                  icon="cube"
                  onPress={() => navigation.navigate('Inventory')}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="مبالغ مستحقة"
                  value={formatCurrency(stats.total_receivables, currency)}
                  icon="cash"
                  color={theme.warning}
                  onPress={() => navigation.navigate('Receivables')}
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <StatCard
                  title="مستحق اليوم"
                  value={formatCurrency(stats.today_due, currency)}
                  icon="alarm"
                  color={theme.error}
                  onPress={() => navigation.navigate('Receivables')}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  title="أقساط متأخرة"
                  value={String(stats.overdue_installments)}
                  icon="warning"
                  color={theme.error}
                  onPress={() => navigation.navigate('Installments')}
                />
              </View>
            </View>

            <View style={styles.alertsSection}>
              <SectionHeader title="تنبيهات" />
              <AlertCard
                title="منتجات قليلة المخزون"
                count={stats.low_stock_count}
                icon="cube-outline"
                color={theme.warning}
                onPress={() => navigation.navigate('Products')}
              />
              <View style={{ height: 8 }} />
              <AlertCard
                title="منتجات قرب انتهاء الصلاحية"
                count={stats.near_expiry_count}
                icon="time-outline"
                color={theme.warning}
                onPress={() => navigation.navigate('Products')}
              />
              <View style={{ height: 8 }} />
              <AlertCard
                title="منتجات منتهية الصلاحية"
                count={stats.expired_count}
                icon="trash-outline"
                color={theme.error}
                onPress={() => navigation.navigate('Products')}
              />
            </View>

            <SectionHeader title="آخر فواتير البيع" actionText="الكل" onAction={() => navigation.navigate('Sales')} />
            {recentSales && recentSales.length > 0 ? (
              recentSales.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => navigation.navigate('SaleDetail', { invoiceId: inv.id })}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{inv.customer_name}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{inv.invoice_number} - {formatDateShort(inv.date)}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(inv.total, currency)}</Text>
                    <Text style={[styles.listItemStatus, { color: inv.status === 'paid' ? theme.success : inv.status === 'partial' ? theme.warning : theme.error }]}>
                      {getInvoiceStatusLabel(inv.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : <Text style={[styles.emptyMini, { color: theme.textTertiary }]}>لا توجد فواتير بعد</Text>}

            <SectionHeader title="آخر فواتير الشراء" actionText="الكل" onAction={() => navigation.navigate('Purchases')} />
            {recentPurchases && recentPurchases.length > 0 ? (
              recentPurchases.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => navigation.navigate('PurchaseDetail', { invoiceId: inv.id })}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{inv.supplier_name}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{inv.invoice_number} - {formatDateShort(inv.date)}</Text>
                  </View>
                  <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(inv.total, currency)}</Text>
                </TouchableOpacity>
              ))
            ) : <Text style={[styles.emptyMini, { color: theme.textTertiary }]}>لا توجد مشتريات بعد</Text>}

            <SectionHeader title="آخر حركات المخزون" actionText="الكل" onAction={() => navigation.navigate('StockMovements', {})} />
            {recentMovements && recentMovements.length > 0 ? (
              recentMovements.map((m) => (
                <View key={m.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{m.product_name}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{getStockReasonLabel(m.reason)} - {formatDateShort(m.date)}</Text>
                  </View>
                  <Text style={[styles.listItemAmount, { color: m.type === '+' ? theme.success : theme.error }]}>
                    {m.type}{m.quantity} → {m.balance_after}
                  </Text>
                </View>
              ))
            ) : <Text style={[styles.emptyMini, { color: theme.textTertiary }]}>لا توجد حركات بعد</Text>}

            <SectionHeader title="آخر دفعات العملاء" actionText="الكل" onAction={() => navigation.navigate('Receivables')} />
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((p) => (
                <View key={p.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{p.customer_name}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{formatDateShort(p.date)}</Text>
                  </View>
                  <Text style={[styles.listItemAmount, { color: theme.success }]}>{formatCurrency(p.amount, currency)}</Text>
                </View>
              ))
            ) : <Text style={[styles.emptyMini, { color: theme.textTertiary }]}>لا توجد دفعات بعد</Text>}

            <View style={{ height: 20 }} />
          </View>
        )}
        keyExtractor={() => 'dashboard'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('NewSale')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  greeting: { fontSize: 28, fontWeight: '800', fontFamily: 'Cairo' },
  date: { fontSize: 14, fontFamily: 'Cairo', marginTop: 4, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  statCol: { flexBasis: '47%', flexGrow: 1 },
  alertsSection: { marginTop: 8, marginBottom: 8 },
  listItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  listItemSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  listItemRight: { alignItems: 'flex-end' },
  listItemAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'Cairo' },
  listItemStatus: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  emptyMini: { fontSize: 13, fontFamily: 'Cairo', paddingVertical: 12, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
