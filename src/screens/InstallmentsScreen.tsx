import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getInstallments, getSettings, updateOverdueInstallments, addCustomerPayment } from '@/database/db';
import { Chip, Button, Badge } from '@/components/ui/Inputs';
import { EmptyState, LoadingState, StatCard } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort, formatDate, getInstallmentStatusLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Installments'>;

export function InstallmentsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: installments, loading, refresh } = useRefresh(async () => {
    await updateOverdueInstallments();
    return getInstallments({ limit: 200 });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';

  const filtered = (installments ?? []).filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  const totalRemaining = filtered.reduce((sum, i) => sum + i.remaining, 0);
  const totalOverdue = (installments ?? []).filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.remaining, 0);

  const handleReminder = async (inst: any) => {
    const msg = `تذكير: السيد/ة ${inst.customer_name}\nلديك قسط مستحق بقيمة ${formatCurrency(inst.remaining, currency)} بتاريخ ${formatDate(inst.due_date)}\nفاتورة رقم: ${inst.invoice_number}`;
    await Share.share({ message: msg });
  };

  const statuses = [
    { label: 'الكل', value: null },
    { label: 'متأخر', value: 'overdue' },
    { label: 'قيد الانتظار', value: 'pending' },
    { label: 'جزئي', value: 'partial' },
    { label: 'مدفوع', value: 'paid' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>الأقساط</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}><StatCard title="إجمالي المتبقي" value={formatCurrency(totalRemaining, currency)} icon="cash" color={theme.warning} /></View>
          <View style={{ flex: 1 }}><StatCard title="متأخر" value={formatCurrency(totalOverdue, currency)} icon="alert" color={theme.error} /></View>
        </View>
        <View style={styles.chipsRow}>
          {statuses.map((s) => (
            <Chip key={s.label} label={s.label} selected={statusFilter === s.value} onPress={() => setStatusFilter(s.value)} />
          ))}
        </View>
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.customerName, { color: theme.text }]}>{item.customer_name}</Text>
                  <Text style={[styles.invoiceRef, { color: theme.textSecondary }]}>{item.invoice_number} - قسط {item.installment_number}</Text>
                </View>
                <Badge text={getInstallmentStatusLabel(item.status)} color={item.status === 'paid' ? theme.success : item.status === 'overdue' ? theme.error : item.status === 'partial' ? theme.warning : theme.textSecondary} />
              </View>
              <View style={styles.cardBody}>
                <View>
                  <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(item.remaining, currency)}</Text>
                  <Text style={[styles.dueDate, { color: item.status === 'overdue' ? theme.error : theme.textSecondary }]}>استحقاق: {formatDateShort(item.due_date)}</Text>
                </View>
              </View>
              {item.remaining > 0 ? (
                <View style={styles.actionsRow}>
                  <Button title="تسجيل دفعة" onPress={() => navigation.navigate('Payment', { customerId: item.customer_id, installmentId: item.id, invoiceId: item.invoice_id })} size="small" icon="cash" style={{ flex: 1 }} />
                  <Button title="تذكير" onPress={() => handleReminder(item)} variant="outline" size="small" icon="send" style={{ flex: 1 }} />
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="لا توجد أقساط" />}
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
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  customerName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  invoiceRef: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  cardBody: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  amount: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  dueDate: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
  actionsRow: { flexDirection: 'row-reverse', gap: 8 },
});
