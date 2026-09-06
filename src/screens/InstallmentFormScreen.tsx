import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSettings, createInstallments, getSalesInvoice } from '@/database/db';
import { TextField, Button, Chip } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, todayISO, formatDate } from '@/utils/format';
import { INSTALLMENT_FREQUENCIES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InstallmentForm'>;

export function InstallmentFormScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { invoiceId, customerId, total, paid } = route.params;
  const remaining = total - paid;
  const [downPayment, setDownPayment] = useState(String(paid));
  const [installmentCount, setInstallmentCount] = useState('4');
  const [firstDueDate, setFirstDueDate] = useState(todayISO());
  const [frequency, setFrequency] = useState('monthly');
  const [saving, setSaving] = useState(false);

  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: invoice } = useRefresh(() => getSalesInvoice(invoiceId), [invoiceId]);

  const currency = settings?.currency ?? 'ج.م';
  const count = parseInt(installmentCount) || 1;
  const installmentAmount = remaining / count;

  const handleSave = async () => {
    if (remaining <= 0) {
      Alert.alert('خطأ', 'لا يوجد مبلغ متبقي للتقسيط');
      return;
    }
    if (count < 1) {
      Alert.alert('خطأ', 'عدد الأقساط يجب أن يكون 1 على الأقل');
      return;
    }
    if (!firstDueDate) {
      Alert.alert('خطأ', 'تاريخ أول استحقاق مطلوب');
      return;
    }
    setSaving(true);
    try {
      await createInstallments({
        invoice_id: invoiceId,
        customer_id: customerId,
        total_amount: total,
        down_payment: paid,
        remaining,
        count,
        first_due_date: firstDueDate,
        frequency: frequency as any,
      });
      Alert.alert('تم', `تم إنشاء ${count} قسط بقيمة ${formatCurrency(installmentAmount, currency)} لكل قسط`);
      navigation.replace('SaleDetail', { invoiceId });
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return <LoadingState />;

  // Generate schedule preview
  const schedule: { num: number; amount: number; date: string }[] = [];
  const firstDate = new Date(firstDueDate);
  for (let i = 0; i < count; i++) {
    let dueDate: Date;
    if (frequency === 'daily') dueDate = new Date(firstDate.getTime() + i * 86400000);
    else if (frequency === 'weekly') dueDate = new Date(firstDate.getTime() + i * 7 * 86400000);
    else if (frequency === 'monthly') dueDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
    else dueDate = new Date(firstDate.getTime() + i * 30 * 86400000);
    schedule.push({ num: i + 1, amount: installmentAmount, date: dueDate.toISOString().split('T')[0] });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>تقسيط الفاتورة</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>قيمة الفاتورة</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(total, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المدفوع مقدمًا</Text>
              <Text style={[styles.summaryValue, { color: theme.success }]}>{formatCurrency(paid, currency)}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
              <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>المتبقي للتقسيط</Text>
              <Text style={[styles.summaryTotalValue, { color: theme.error }]}>{formatCurrency(remaining, currency)}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <TextField label="عدد الأقساط" value={installmentCount} onChangeText={setInstallmentCount} placeholder="4" keyboardType="numeric" containerStyle={{ flex: 1, marginRight: 8 }} />
            <TextField label="تاريخ أول استحقاق" value={firstDueDate} onChangeText={setFirstDueDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
          </View>

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>طريقة التكرار</Text>
          <View style={styles.chipsRow}>
            {INSTALLMENT_FREQUENCIES.map((f) => (
              <Chip key={f.value} label={f.label} selected={frequency === f.value} onPress={() => setFrequency(f.value)} />
            ))}
          </View>

          <View style={[styles.installmentPreview, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.previewTitle, { color: theme.text }]}>جدول الأقساط</Text>
            <Text style={[styles.previewAmount, { color: theme.accent }]}>
              {count} قسط × {formatCurrency(installmentAmount, currency)}
            </Text>
            {schedule.map((s) => (
              <View key={s.num} style={[styles.scheduleRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.scheduleNum, { color: theme.textSecondary }]}>القسط {s.num}</Text>
                <Text style={[styles.scheduleAmount, { color: theme.text }]}>{formatCurrency(s.amount, currency)}</Text>
                <Text style={[styles.scheduleDate, { color: theme.textSecondary }]}>{formatDate(s.date)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={saving ? 'جاري الحفظ...' : 'إنشاء جدول الأقساط'} onPress={handleSave} disabled={saving} size="large" icon="calendar" style={{ flex: 1 }} />
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
  summaryCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10, marginBottom: 16 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Cairo' },
  summaryValue: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Cairo' },
  row: { flexDirection: 'row-reverse' },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 8 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  installmentPreview: { marginTop: 20, padding: 16, borderRadius: 14 },
  previewTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', marginBottom: 4 },
  previewAmount: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo', marginBottom: 12 },
  scheduleRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  scheduleNum: { fontSize: 14, fontFamily: 'Cairo' },
  scheduleAmount: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  scheduleDate: { fontSize: 13, fontFamily: 'Cairo' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
