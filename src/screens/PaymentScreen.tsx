import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getCustomer, getSettings, addCustomerPayment, getInstallments, getSalesInvoice } from '@/database/db';
import { TextField, Button, Chip } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, todayISO, currentTime, getPaymentMethodLabel } from '@/utils/format';
import { PAYMENT_METHODS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export function PaymentScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { customerId, invoiceId, installmentId } = route.params;
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: customer, loading } = useRefresh(() => getCustomer(customerId), [customerId]);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: installments } = useRefresh(() => getInstallments({ customerId, limit: 50 }), [customerId]);
  const { data: invoice } = useRefresh(async () => invoiceId ? getSalesInvoice(invoiceId) : null, [invoiceId]);

  useFocusEffect(useCallback(() => {}, []));

  const currency = settings?.currency ?? 'ج.م';
  const maxAmount = invoice ? invoice.remaining : (installments ?? []).find((i) => i.id === installmentId)?.remaining ?? 0;

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('خطأ', 'المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    if (maxAmount > 0 && amt > maxAmount) {
      Alert.alert('خطأ', `المبلغ لا يمكن أن يكون أكبر من المتبقي (${formatCurrency(maxAmount, currency)})`);
      return;
    }
    setSaving(true);
    try {
      await addCustomerPayment({
        customer_id: customerId,
        invoice_id: invoiceId ?? null,
        installment_id: installmentId ?? null,
        amount: amt,
        payment_method: paymentMethod as any,
        notes: notes.trim() || undefined,
      });
      Alert.alert('تم', 'تم تسجيل الدفعة بنجاح');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !customer) return <LoadingState />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>تسجيل دفعة</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <View style={[styles.customerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.accent + '15' }]}>
              <Text style={[styles.avatarText, { color: theme.accent }]}>{customer.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={[styles.customerName, { color: theme.text }]}>{customer.name}</Text>
              <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>{customer.phone ?? ''}</Text>
            </View>
          </View>

          {invoice ? (
            <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>الفاتورة</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{invoice.invoice_number}</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoSub, { color: theme.textSecondary }]}>الإجمالي: {formatCurrency(invoice.total, currency)}</Text>
                <Text style={[styles.infoSub, { color: theme.error }]}>متبقي: {formatCurrency(invoice.remaining, currency)}</Text>
              </View>
            </View>
          ) : null}

          {installmentId ? (
            (() => {
              const inst = (installments ?? []).find((i) => i.id === installmentId);
              return inst ? (
                <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>القسط {inst.installment_number}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{formatCurrency(inst.remaining, currency)} متبقي</Text>
                </View>
              ) : null;
            })()
          ) : null}

          <TextField label="المبلغ *" value={amount} onChangeText={setAmount} placeholder="0" icon="cash" keyboardType="numeric" />
          {maxAmount > 0 ? (
            <TouchableOpacity onPress={() => setAmount(String(maxAmount))}>
              <Text style={[styles.maxHint, { color: theme.accent }]}>المتبقي: {formatCurrency(maxAmount, currency)} - اضغط لتعبئة تلقائية</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>طريقة الدفع</Text>
          <View style={styles.chipsRow}>
            {PAYMENT_METHODS.filter((m) => m.value !== 'credit').map((m) => (
              <Chip key={m.value} label={m.label} selected={paymentMethod === m.value} onPress={() => setPaymentMethod(m.value)} />
            ))}
          </View>

          <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات اختيارية" multiline containerStyle={{ marginTop: 16 }} />
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={saving ? 'جاري الحفظ...' : 'تسجيل الدفعة'} onPress={handleSave} disabled={saving} size="large" icon="checkmark-circle" style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  customerCard: { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', fontFamily: 'Cairo' },
  customerName: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
  customerPhone: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
  infoBox: { padding: 14, borderRadius: 12, marginBottom: 16 },
  infoLabel: { fontSize: 13, fontFamily: 'Cairo' },
  infoValue: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo', marginTop: 4 },
  infoRow: { flexDirection: 'row-reverse', gap: 16, marginTop: 8 },
  infoSub: { fontSize: 13, fontFamily: 'Cairo' },
  maxHint: { fontSize: 13, fontFamily: 'Cairo', marginTop: 4 },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 8 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
