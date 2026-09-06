import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getCustomers, getSettings } from '@/database/db';
import { SearchBar, Button } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatCurrency } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = { navigation: any };

export function CustomersScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: customers, loading, refresh } = useRefresh(() => getCustomers(), []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';
  const filtered = (customers ?? []).filter((c) => {
    if (!search) return true;
    return c.name.includes(search) || (c.phone ?? '').includes(search);
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>العملاء</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('CustomerForm', {})}
        >
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.newButtonText}>عميل جديد</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث بالاسم أو الهاتف..." />
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.customerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => navigation.navigate('CustomerProfile', { customerId: item.id })}
            >
              <View style={[styles.avatar, { backgroundColor: theme.accent + '15' }]}>
                <Text style={[styles.avatarText, { color: theme.accent }]}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.customerPhone, { color: theme.textSecondary }]}>
                  {item.phone ?? 'لا يوجد هاتف'}
                </Text>
                {item.governorate ? (
                  <Text style={[styles.customerGov, { color: theme.textTertiary }]}>{item.governorate}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-back" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="لا يوجد عملاء"
              message="أضف عميلك الأول لبدء تسجيل المبيعات"
              actionText="إضافة عميل"
              onAction={() => navigation.navigate('CustomerForm', {})}
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: 'Cairo' },
  newButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  searchSection: { padding: 16 },
  customerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', fontFamily: 'Cairo' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
  customerPhone: { fontSize: 13, fontFamily: 'Cairo', marginTop: 2 },
  customerGov: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
});
