import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSupplier, getSupplierStats, getSettings } from '@/database/db';
import { StatCard, SectionHeader, EmptyState, LoadingState } from '@/components/ui/Cards';
import { Button } from '@/components/ui/Inputs';
import { formatCurrency, formatDateShort } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplierProfile'>;

export function SupplierProfileScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { supplierId } = route.params;

  const { data: supplier, loading } = useRefresh(() => getSupplier(supplierId), [supplierId]);
  const { data: stats, refresh: refreshStats } = useRefresh(() => getSupplierStats(supplierId), [supplierId]);
  const { data: settings } = useRefresh(() => getSettings(), []);

  useFocusEffect(useCallback(() => { refreshStats(); }, [refreshStats]));

  const currency = settings?.currency ?? 'ج.م';

  if (loading || !supplier) return <LoadingState />;
  if (!stats) return <LoadingState />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{supplier.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SupplierForm', { supplierId })} style={styles.editButton}>
          <Ionicons name="create" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {supplier.company ? <Text style={[styles.infoText, { color: theme.text }]}>{supplier.company}</Text> : null}
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={theme.textTertiary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{supplier.phone ?? 'لا يوجد هاتف'}</Text>
          </View>
          {supplier.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{supplier.address}</Text>
            </View>
          ) : null}
          {supplier.tax_number ? (
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>رقم ضريبي: {supplier.tax_number}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCol}><StatCard title="إجمالي المشتريات" value={formatCurrency(stats.total, currency)} icon="bag" color={theme.accent} /></View>
          <View style={styles.statCol}><StatCard title="عدد الفواتير" value={String(stats.count)} icon="receipt" color={theme.info} /></View>
          <View style={styles.statCol}><StatCard title="آخر شراء" value={stats.last_date ? formatDateShort(stats.last_date) : '-'} icon="calendar" color={theme.success} /></View>
        </View>

        <SectionHeader title="سجل المشتريات" actionText="فاتورة جديدة" onAction={() => navigation.navigate('NewPurchase')} />
        {(stats.invoices ?? []).length === 0 ? (
          <EmptyState icon="bag-outline" title="لا توجد مشتريات" />
        ) : (
          (stats.invoices ?? []).map((inv) => (
            <TouchableOpacity key={inv.id} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('PurchaseDetail', { invoiceId: inv.id })}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>{inv.invoice_number}</Text>
                <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>{formatDateShort(inv.date)}</Text>
              </View>
              <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(inv.total, currency)}</Text>
            </TouchableOpacity>
          ))
        )}

        <SectionHeader title="المنتجات المشتراة" />
        {(stats.products ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.textTertiary }]}>لا توجد منتجات</Text>
        ) : (
          (stats.products ?? []).map((p, i) => (
            <View key={i} style={[styles.listItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>{p.product_name}</Text>
                <Text style={[styles.listItemSub, { color: theme.textSecondary }]}>الكمية: {p.qty}</Text>
              </View>
              <Text style={[styles.listItemAmount, { color: theme.text }]}>{formatCurrency(p.total, currency)}</Text>
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
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo', flex: 1, textAlign: 'center' },
  editButton: { padding: 8 },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, fontFamily: 'Cairo' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCol: { flexBasis: '47%', flexGrow: 1 },
  listItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  listItemTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  listItemSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  listItemAmount: { fontSize: 15, fontWeight: '700', fontFamily: 'Cairo' },
  empty: { fontSize: 13, fontFamily: 'Cairo', textAlign: 'center', paddingVertical: 16 },
});
