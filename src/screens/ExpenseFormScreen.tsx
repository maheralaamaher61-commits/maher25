import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/constants/theme';
import { addExpense, getExpense } from '@/database/db';
import { TextField, Button, Chip } from '@/components/ui/Inputs';
import { EXPENSE_CATEGORIES } from '@/constants';
import { todayISO, currentTime } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseForm'>;

export function ExpenseFormScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { expenseId } = route.params;
  const isEdit = !!expenseId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('أخرى');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(currentTime());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (expenseId) {
        (async () => {
          const e = await getExpense(expenseId);
          if (e) {
            setName(e.name);
            setCategory(e.category);
            setAmount(String(e.amount));
            setDate(e.date);
            setTime(e.time);
            setNotes(e.notes ?? '');
          }
        })();
      }
    }, [expenseId]),
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'اسم المصروف مطلوب');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('خطأ', 'القيمة يجب أن تكون أكبر من صفر');
      return;
    }
    setSaving(true);
    try {
      const finalCategory = category === 'تصنيف مخصص' ? customCategory.trim() || 'أخرى' : category;
      await addExpense({
        name: name.trim(),
        category: finalCategory,
        amount: amt,
        date,
        time,
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'تعديل مصروف' : 'مصروف جديد'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <TextField label="اسم المصروف *" value={name} onChangeText={setName} placeholder="مثال: إيجار المحل" icon="wallet" />
          <TextField label="القيمة *" value={amount} onChangeText={setAmount} placeholder="0" icon="cash" keyboardType="numeric" />
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>التصنيف</Text>
            <View style={styles.chipsRow}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </View>
          {category === 'تصنيف مخصص' ? (
            <TextField label="التصنيف المخصص" value={customCategory} onChangeText={setCustomCategory} placeholder="اسم التصنيف" />
          ) : null}
          <View style={styles.row}>
            <TextField label="التاريخ" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1, marginRight: 8 }} />
            <TextField label="الوقت" value={time} onChangeText={setTime} placeholder="HH:MM" containerStyle={{ flex: 1 }} />
          </View>
          <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات اختيارية" multiline />
        </ScrollView>
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={saving ? 'جاري الحفظ...' : 'حفظ'} onPress={handleSave} disabled={saving} size="large" icon="checkmark-circle" style={{ flex: 1 }} />
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
  section: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 6 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row-reverse' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
