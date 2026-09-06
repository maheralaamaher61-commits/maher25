import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getExpenses, getSettings, deleteExpense } from '@/database/db';
import { Chip, ConfirmDialog } from '@/components/ui/Inputs';
import { EmptyState, LoadingState, StatCard } from '@/components/ui/Cards';
import { formatCurrency, formatDateShort, todayISO, getWeekStart, getMonthStart } from '@/utils/format';
import { EXPENSE_CATEGORIES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Expenses'>;

export function ExpensesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: expenses, loading, refresh } = useRefresh(() => getExpenses({ limit: 100 }), []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';
  const today = todayISO();

  const filtered = (expenses ?? []).filter((e) => {
    if (period === 'today' && e.date !== today) return false;
    if (period === 'week' && e.date < getWeekStart()) return false;
    if (period === 'month' && e.date < getMonthStart()) return false;
    if (category && e.category !== category) return false;
    return true;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId);
      refresh();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
    setDeleteId(null);
  };

  const periods = [
    { label: 'الكل', value: 'all' as const },
    { label: 'اليوم', value: 'today' as const },
    { label: 'الأسبوع', value: 'week' as const },
    { label: 'الشهر', value: 'month' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>المصروفات</Text>
        <TouchableOpacity style={[styles.newButton, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('ExpenseForm', {})}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <StatCard title="إجمالي المصروفات" value={formatCurrency(totalAmount, currency)} icon="wallet" color={theme.warning} />
        <View style={styles.chipsRow}>
          {periods.map((p) => (
            <Chip key={p.value} label={p.label} selected={period === p.value} onPress={() => setPeriod(p.value)} />
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipsRow}>
            <Chip label="كل التصنيفات" selected={category === null} onPress={() => setCategory(null)} />
            {EXPENSE_CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} onLongPress={() => setDeleteId(item.id)}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.expenseName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.expenseCategory, { color: theme.textSecondary }]}>{item.category} - {formatDateShort(item.date)}</Text>
                </View>
                <Text style={[styles.expenseAmount, { color: theme.warning }]}>{formatCurrency(item.amount, currency)}</Text>
              </View>
              {item.notes ? <Text style={[styles.expenseNotes, { color: theme.textTertiary }]}>{item.notes}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="wallet-outline" title="لا توجد مصروفات" message="أضف مصروفك الأول" actionText="إضافة مصروف" onAction={() => navigation.navigate('ExpenseForm', {})} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <ConfirmDialog visible={deleteId !== null} title="حذف المصروف" message="هل أنت متأكد؟" confirmText="حذف" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} danger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  newButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center' },
  expenseName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  expenseCategory: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  expenseNotes: { fontSize: 12, fontFamily: 'Cairo', marginTop: 6 },
});
