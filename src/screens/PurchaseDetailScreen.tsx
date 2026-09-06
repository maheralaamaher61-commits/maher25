import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getPurchaseInvoice, getPurchaseInvoiceItems, getSettings, getSupplier, cancelPurchaseInvoice } from '@/database/db';
import { Button, Badge, ConfirmDialog } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseDetail'>;

export function PurchaseDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { invoiceId } = route.params;
  const [showCancel, setShowCancel] = React.useState(false);

  const { data: invoice, loading, refresh } = useRefresh(() => getPurchaseInvoice(invoiceId), [invoiceId]);
  const { data: items } = useRefresh(() => getPurchaseInvoiceItems(invoiceId), [invoiceId]);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: supplier } = useRefresh(async () => {
    const inv = await getPurchaseInvoice(invoiceId);
    if (!inv) return null;
    return getSupplier(inv.supplier_id);
  }, [invoiceId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';

  if (loading || !invoice) return <LoadingState />;

  const handleCancel = async () => {
    setShowCancel(false);
    try {
      await cancelPurchaseInvoice(invoiceId);
      Alert.alert('تم', 'تم إلغاء فاتورة الشراء وخصم الكميات من المخزون');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>تفاصيل الشراء</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.invoiceNumber, { color: theme.textSecondary }]}>{invoice.invoice_number}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="storefront" size={16} color={theme.textTertiary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{supplier?.name ?? ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={theme.textTertiary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{formatDate(invoice.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card" size={16} color={theme.textTertiary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>{getPaymentMethodLabel(invoice.payment_method)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>المنتجات</Text>
        {(items ?? []).map((item) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.product_name}</Text>
            <View style={styles.itemRow}>
              <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>{item.quantity} × {formatCurrency(item.purchase_price, currency)}</Text>
              <Text style={[styles.itemTotal, { color: theme.text }]}>{formatCurrency(item.total, currency)}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>الإجمالي الفرعي</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(invoice.subtotal, currency)}</Text>
          </View>
          {invoice.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>الخصم</Text>
              <Text style={[styles.summaryValue, { color: theme.warning }]}>{formatCurrency(invoice.discount, currency)}</Text>
            </View>
          ) : null}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
            <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>الإجمالي</Text>
            <Text style={[styles.summaryTotalValue, { color: theme.accent }]}>{formatCurrency(invoice.total, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المدفوع</Text>
            <Text style={[styles.summaryValue, { color: theme.success }]}>{formatCurrency(invoice.paid, currency)}</Text>
          </View>
          {invoice.remaining > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المتبقي</Text>
              <Text style={[styles.summaryValue, { color: theme.error }]}>{formatCurrency(invoice.remaining, currency)}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: 20 }}>
          <Button title="إلغاء فاتورة الشراء" onPress={() => setShowCancel(true)} variant="danger" icon="close-circle" />
        </View>
      </ScrollView>

      <ConfirmDialog visible={showCancel} title="إلغاء فاتورة الشراء" message="سيتم خصم الكميات من المخزون. هل أنت متأكد؟" confirmText="إلغاء الفاتورة" onConfirm={handleCancel} onCancel={() => setShowCancel(false)} danger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  invoiceNumber: { fontSize: 14, fontFamily: 'Cairo' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, fontFamily: 'Cairo' },
  sectionLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo', marginBottom: 10 },
  itemCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  itemName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo', marginBottom: 6 },
  itemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  itemDetail: { fontSize: 13, fontFamily: 'Cairo' },
  itemTotal: { fontSize: 15, fontWeight: '700', fontFamily: 'Cairo' },
  summaryCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10, marginTop: 16 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Cairo' },
  summaryValue: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Cairo' },
});
