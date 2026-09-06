import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, Share } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getCustomer, getCustomerStats, getSalesInvoices, getCustomerPayments, getInstallments, getSettings, updateOverdueInstallments } from '@/database/db';
import { StatCard, SectionHeader, EmptyState, LoadingState } from '@/components/ui/Cards';
import { Button, Badge } from '@/components/ui/Inputs';
import { formatCurrency, formatDate, formatDateShort, getInvoiceStatusLabel, getInstallmentStatusLabel, getPaymentMethodLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerProfile'>;
type Tab = 'invoices' | 'payments' | 'installments' | 'ledger';

export function CustomerProfileScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { customerId } = route.params;
  const [tab, setTab] = useState<Tab>('invoices');

  const { data: customer, loading } = useRefresh(() => getCustomer(customerId), [customerId]);
  const { data: stats, refresh: refreshStats } = useRefresh(() => getCustomerStats(customerId), [customerId]);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: invoices, refresh: refreshInvoices } = useRefresh(() => getSalesInvoices({ customerId, limit: 50 }), [customerId]);
  const { data: payments, refresh: refreshPayments } = useRefresh(() => getCustomerPayments(customerId), [customerId]);
  const { data: installments, refresh: refreshInstallments } = useRefresh(async () => {
    await updateOverdueInstallments();
    return getInstallments({ customerId, limit: 50 });
  }, [customerId]);

  useFocusEffect(useCallback(() => {
    refreshStats();
    refreshInvoices();
    refreshPayments();
    refreshInstallments();
  }, [refreshStats, refreshInvoices, refreshPayments, refreshInstallments]));

  const currency = settings?.currency ?? 'ج.م';

  if (loading || !customer) return <LoadingState />;
  if (!stats) return <LoadingState />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'invoices', label: 'الفواتير' },
    { key: 'payments', label: 'المدفوعات' },
    { key: 'installments', label: 'الأقساط' },
    { key: 'ledger', label: 'كشف الحساب' },
  ];

  const handleShareReminder = async () => {
    const overdueInst = (installments ?? []).filter((i) => i.remaining > 0);
    if (overdueInst.length === 0) {
      Alert.alert('تنبيه', 'لا توجد أقساط مستحقة لهذا العميل');
      return;
    }
    const first = overdueInst[0];
    const msg = `تذكير: السيد/ة ${customer.name}\nلديك قسط مستحق بقيمة ${formatCurrency(first.remaining, currency)} بتاريخ ${formatDate(first.due_date)}\nشكرًا لتعاملكم معنا.`;
    await Share.share({ message: msg });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{customer.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerForm', { customerId })} style={styles.editButton}>
          <Ionicons name="create" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{customer.phone ?? 'لا يوجد هاتف'}</Text>
            </View>
            {customer.governorate ? (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={theme.textTertiary} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>{customer.governorate}</Text>
              </View>
            ) : null}
            {customer.address ? (
              <View style={styles.infoRow}>
                <Ionicons name="navigate" size={16} color={theme.textTertiary} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>{customer.address}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCol}><StatCard title="إجمالي المشتريات" value={formatCurrency(stats.total, currency)} icon="cart" color={theme.accent} /></View>
          <View style={styles.statCol}><StatCard title="إجمالي المدفوع" value={formatCurrency(stats.paid, currency)} icon="cash" color={theme.success} /></View>
          <View style={styles.statCol}><StatCard title="المتبقي" value={formatCurrency(stats.remaining, currency)} icon="wallet" color={theme.error} /></View>
          <View style={styles.statCol}><StatCard title="عدد الفواتير" value={String(stats.count)} icon="receipt" color={theme.info} subtitle={`${stats.incomplete} غير مكتملة`} /></View>
          <View style={styles.statCol}><StatCard title="إجمالي الأقساط" value={formatCurrency(stats.total, currency)} icon="calendar" color={theme.warning} /></View>
          <View style={styles.statCol}><StatCard title="أقساط متأخرة" value={formatCurrency(stats.overdue, currency)} icon="alert" color={theme.error} /></View>
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, { borderBottomColor: tab === t.key ? theme.accent : 'transparent' }]}
            >
              <Text style={[styles.tabText, { color: tab === t.key ? theme.accent : theme.textSecondary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'invoices' ? (
          <View style={styles.tabContent}>
            {(invoices ?? []).length === 0 ? (
              <EmptyState icon="receipt-outline" title="لا توجد فواتير" />
            ) : (
              (invoices ?? []).map((inv) => (
                <TouchableOpacity key={inv.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('SaleDetail', { invoiceId: inv.id })}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{inv.invoice_number}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{formatDateShort(inv.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(inv.total, currency)}</Text>
                    <Badge text={getInvoiceStatusLabel(inv.status)} color={inv.status === 'paid' ? theme.success : inv.status === 'partial' ? theme.warning : theme.error} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}

        {tab === 'payments' ? (
          <View style={styles.tabContent}>
            {(payments ?? []).length === 0 ? (
              <EmptyState icon="cash-outline" title="لا توجد مدفوعات" />
            ) : (
              (payments ?? []).map((p) => (
                <View key={p.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: theme.success }]}>{formatCurrency(p.amount, currency)}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{formatDateShort(p.date)} - {getPaymentMethodLabel(p.payment_method)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'installments' ? (
          <View style={styles.tabContent}>
            {(installments ?? []).length === 0 ? (
              <EmptyState icon="calendar-outline" title="لا توجد أقساط" />
            ) : (
              (installments ?? []).map((inst) => (
                <View key={inst.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>قسط {inst.installment_number}</Text>
                    <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>استحقاق: {formatDateShort(inst.due_date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(inst.remaining, currency)}</Text>
                    <Badge text={getInstallmentStatusLabel(inst.status)} color={inst.status === 'paid' ? theme.success : inst.status === 'overdue' ? theme.error : inst.status === 'partial' ? theme.warning : theme.textSecondary} />
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'ledger' ? (
          <View style={styles.tabContent}>
            <Button title="عرض كشف الحساب الكامل" onPress={() => navigation.navigate('CustomerLedger', { customerId })} icon="document-text" />
          </View>
        ) : null}
      </ScrollView>

      {(stats.overdue > 0 || (installments ?? []).some((i) => i.remaining > 0)) ? (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title="إرسال تذكير" onPress={handleShareReminder} icon="send" style={{ flex: 1 }} />
          <View style={{ width: 12 }} />
          <Button title="تسجيل دفعة" onPress={() => navigation.navigate('Payment', { customerId })} variant="outline" icon="cash" style={{ flex: 1 }} />
        </View>
      ) : (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title="تسجيل دفعة" onPress={() => navigation.navigate('Payment', { customerId })} icon="cash" style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo', flex: 1, textAlign: 'center' },
  editButton: { padding: 8 },
  infoSection: { padding: 16 },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, fontFamily: 'Cairo' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  statCol: { flexBasis: '47%', flexGrow: 1 },
  tabsRow: { flexDirection: 'row-reverse', paddingHorizontal: 16, borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  tabContent: { padding: 16 },
  listItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  listItemTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  listItemSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  listItemAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'Cairo' },
  bottomBar: { flexDirection: 'row-reverse', padding: 16, borderTopWidth: 1 },
});
