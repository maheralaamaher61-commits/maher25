import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import {
  getSalesInvoice, getSalesInvoiceItems, getSettings, cancelSalesInvoice, getCustomer,
} from '@/database/db';
import { Button, Badge, ConfirmDialog } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDate, formatTime, getInvoiceStatusLabel, getPaymentMethodLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SaleDetail'>;

export function SaleDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { invoiceId } = route.params;
  const [showCancel, setShowCancel] = useState(false);

  const { data: invoice, loading, refresh } = useRefresh(() => getSalesInvoice(invoiceId), [invoiceId]);
  const { data: items } = useRefresh(() => getSalesInvoiceItems(invoiceId), [invoiceId]);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: customer } = useRefresh(async () => {
    const inv = await getSalesInvoice(invoiceId);
    if (!inv) return null;
    return getCustomer(inv.customer_id);
  }, [invoiceId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';

  if (loading || !invoice) return <LoadingState />;

  const handleCancel = async () => {
    setShowCancel(false);
    try {
      await cancelSalesInvoice(invoiceId);
      Alert.alert('تم', 'تم إلغاء الفاتورة وإرجاع المخزون');
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
        <Text style={[styles.title, { color: theme.text }]}>تفاصيل الفاتورة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.section}>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.invoiceNumber, { color: theme.textSecondary }]}>{invoice.invoice_number}</Text>
              <Badge
                text={getInvoiceStatusLabel(invoice.status)}
                color={invoice.status === 'paid' ? theme.success : invoice.status === 'partial' ? theme.warning : invoice.status === 'cancelled' ? theme.textTertiary : theme.error}
              />
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{customer?.name ?? 'عميل نقدي'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{formatDate(invoice.date)} - {invoice.time}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card" size={16} color={theme.textTertiary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>{getPaymentMethodLabel(invoice.payment_method)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>المنتجات</Text>
          {(items ?? []).map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.product_name}</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.itemDetail, { color: theme.textSecondary }]}>
                  {item.quantity} × {formatCurrency(item.sale_price, currency)}
                </Text>
                {item.discount > 0 ? (
                  <Text style={[styles.itemDetail, { color: theme.warning }]}>خصم: {formatCurrency(item.discount, currency)}</Text>
                ) : null}
                <Text style={[styles.itemTotal, { color: theme.text }]}>{formatCurrency(item.total, currency)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
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
            {invoice.remaining > 0 && invoice.status !== 'cancelled' ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المتبقي</Text>
                <Text style={[styles.summaryValue, { color: theme.error }]}>{formatCurrency(invoice.remaining, currency)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ملاحظات</Text>
            <View style={[styles.notesCard, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.notesText, { color: theme.text }]}>{invoice.notes}</Text>
            </View>
          </View>
        ) : null}

        {invoice.status !== 'cancelled' && invoice.remaining > 0 ? (
          <View style={styles.section}>
            <View style={styles.actionsRow}>
              <Button
                title="تسجيل دفعة"
                onPress={() => navigation.navigate('Payment', { customerId: invoice.customer_id, invoiceId: invoice.id })}
                icon="cash"
                style={{ flex: 1 }}
              />
              <Button
                title="تقسيط"
                onPress={() => navigation.navigate('InstallmentForm', { invoiceId: invoice.id, customerId: invoice.customer_id, total: invoice.total, paid: invoice.paid })}
                icon="calendar"
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}

        {invoice.status !== 'cancelled' ? (
          <View style={styles.section}>
            <Button
              title="إلغاء الفاتورة"
              onPress={() => setShowCancel(true)}
              variant="danger"
              icon="close-circle"
            />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={showCancel}
        title="إلغاء الفاتورة"
        message="سيتم إلغاء الفاتورة وإرجاع جميع المنتجات إلى المخزون. هل أنت متأكد؟"
        confirmText="إلغاء الفاتورة"
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
        danger
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  section: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  infoHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNumber: { fontSize: 14, fontFamily: 'Cairo' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, fontFamily: 'Cairo' },
  itemCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  itemName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo', marginBottom: 6 },
  itemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  itemDetail: { fontSize: 13, fontFamily: 'Cairo' },
  itemTotal: { fontSize: 15, fontWeight: '700', fontFamily: 'Cairo' },
  summaryCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Cairo' },
  summaryValue: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Cairo' },
  notesCard: { padding: 14, borderRadius: 12 },
  notesText: { fontSize: 14, fontFamily: 'Cairo', lineHeight: 22 },
  actionsRow: { flexDirection: 'row-reverse', gap: 12 },
});
