import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getCustomer, getCustomerLedger, getSettings } from '@/database/db';
import { Button } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDate } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerLedger'>;

export function CustomerLedgerScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { customerId } = route.params;

  const { data: customer } = useRefresh(() => getCustomer(customerId), [customerId]);
  const { data: ledger, loading } = useRefresh(() => getCustomerLedger(customerId), [customerId]);
  const { data: settings } = useRefresh(() => getSettings(), []);

  const currency = settings?.currency ?? 'ج.م';

  const handleShare = async () => {
    if (!ledger || ledger.length === 0) {
      Alert.alert('تنبيه', 'لا توجد حركات لعرضها');
      return;
    }
    let text = `كشف حساب: ${customer?.name ?? ''}\n\n`;
    for (const e of ledger) {
      text += `${formatDate(e.date)} - ${e.description}\n`;
      if (e.debit > 0) text += `  مدين: ${formatCurrency(e.debit, currency)}\n`;
      if (e.credit > 0) text += `  دائن: ${formatCurrency(e.credit, currency)}\n`;
      text += `  الرصيد: ${formatCurrency(e.balance, currency)}\n\n`;
    }
    const finalBalance = ledger[ledger.length - 1].balance;
    text += `الرصيد النهائي: ${formatCurrency(finalBalance, currency)}`;
    await Share.share({ message: text });
  };

  const finalBalance = ledger && ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>كشف الحساب</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? <LoadingState /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <View style={[styles.customerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.customerName, { color: theme.text }]}>{customer?.name ?? ''}</Text>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>الرصيد النهائي</Text>
              <Text style={[styles.balanceValue, { color: finalBalance > 0 ? theme.error : theme.success }]}>
                {formatCurrency(Math.abs(finalBalance), currency)}
                {finalBalance > 0 ? ' (مدين)' : finalBalance < 0 ? ' (دائن)' : ''}
              </Text>
            </View>
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.colHeader, { color: theme.textSecondary, flex: 1.5 }]}>التاريخ</Text>
            <Text style={[styles.colHeader, { color: theme.textSecondary, flex: 2 }]}>الوصف</Text>
            <Text style={[styles.colHeader, { color: theme.textSecondary, flex: 1 }]}>مدين</Text>
            <Text style={[styles.colHeader, { color: theme.textSecondary, flex: 1 }]}>دائن</Text>
            <Text style={[styles.colHeader, { color: theme.textSecondary, flex: 1 }]}>الرصيد</Text>
          </View>

          {(ledger ?? []).length === 0 ? (
            <Text style={[styles.empty, { color: theme.textTertiary }]}>لا توجد حركات</Text>
          ) : (
            (ledger ?? []).map((entry, i) => (
              <View key={i} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.cell, { color: theme.textSecondary, flex: 1.5 }]}>{formatDate(entry.date)}</Text>
                <Text style={[styles.cell, { color: theme.text, flex: 2 }]}>{entry.description}</Text>
                <Text style={[styles.cell, { color: theme.error, flex: 1 }]}>{entry.debit > 0 ? formatCurrency(entry.debit, currency) : '-'}</Text>
                <Text style={[styles.cell, { color: theme.success, flex: 1 }]}>{entry.credit > 0 ? formatCurrency(entry.credit, currency) : '-'}</Text>
                <Text style={[styles.cell, { color: theme.text, flex: 1, fontWeight: '700' }]}>{formatCurrency(entry.balance, currency)}</Text>
              </View>
            ))
          )}

          <View style={{ marginTop: 20 }}>
            <Button title="مشاركة كشف الحساب" onPress={handleShare} icon="share" />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  customerCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  customerName: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo', marginBottom: 10 },
  balanceRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 14, fontFamily: 'Cairo' },
  balanceValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  tableHeader: { flexDirection: 'row-reverse', paddingVertical: 10, borderBottomWidth: 1 },
  colHeader: { fontSize: 12, fontWeight: '600', fontFamily: 'Cairo', textAlign: 'center' },
  tableRow: { flexDirection: 'row-reverse', paddingVertical: 10, borderBottomWidth: 1 },
  cell: { fontSize: 12, fontFamily: 'Cairo', textAlign: 'center' },
  empty: { fontSize: 14, fontFamily: 'Cairo', textAlign: 'center', paddingVertical: 30 },
});
