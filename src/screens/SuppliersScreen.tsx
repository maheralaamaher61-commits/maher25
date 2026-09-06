import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSuppliers, deleteSupplier, getSettings } from '@/database/db';
import { SearchBar, ConfirmDialog } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Suppliers'>;

export function SuppliersScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: suppliers, loading, refresh } = useRefresh(() => getSuppliers(), []);
  const { data: settings } = useRefresh(() => getSettings(), []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = (suppliers ?? []).filter((s) => {
    if (!search) return true;
    return s.name.includes(search) || (s.phone ?? '').includes(search);
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSupplier(deleteId);
      refresh();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
    setDeleteId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>الموردون</Text>
        <TouchableOpacity style={[styles.newButton, { backgroundColor: theme.accent }]} onPress={() => navigation.navigate('SupplierForm', {})}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث بالاسم أو الهاتف..." />
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => navigation.navigate('SupplierProfile', { supplierId: item.id })}
              onLongPress={() => setDeleteId(item.id)}
            >
              <View style={[styles.avatar, { backgroundColor: theme.accent + '15' }]}>
                <Ionicons name="storefront" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.sub, { color: theme.textSecondary }]}>{item.phone ?? 'لا يوجد هاتف'}</Text>
                {item.company ? <Text style={[styles.sub, { color: theme.textTertiary }]}>{item.company}</Text> : null}
              </View>
              <Ionicons name="chevron-back" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="storefront-outline" title="لا يوجد موردون" message="أضف موردك الأول" actionText="إضافة مورد" onAction={() => navigation.navigate('SupplierForm', {})} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <ConfirmDialog visible={deleteId !== null} title="حذف المورد" message="هل أنت متأكد؟" confirmText="حذف" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} danger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  newButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row-reverse', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
  sub: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
});
