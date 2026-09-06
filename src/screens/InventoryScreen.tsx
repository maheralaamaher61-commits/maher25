import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getProducts, getCategories, getSettings } from '@/database/db';
import { SearchBar, Chip } from '@/components/ui/Inputs';
import { EmptyState, LoadingState } from '@/components/ui/Cards';
import { formatCurrency, getExpiryStatus } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = { navigation: any };

export function InventoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'expired' | 'near_expiry'>('all');
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: categories } = useRefresh(() => getCategories(), []);
  const { data: products, loading, refresh } = useRefresh(
    () => getProducts({ limit: 200 }),
    [],
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';
  const warningDays = settings?.expiry_warning_days ?? 30;

  const filtered = (products ?? []).filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      if (!p.name.toLowerCase().includes(s) && !p.code?.toLowerCase().includes(s) && !p.barcode?.toLowerCase().includes(s)) return false;
    }
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (filter === 'low' && p.quantity > p.min_stock) return false;
    if (filter === 'expired' && getExpiryStatus(p.expiry_date, warningDays) !== 'expired') return false;
    if (filter === 'near_expiry' && getExpiryStatus(p.expiry_date, warningDays) !== 'near_expiry') return false;
    return true;
  });

  const filters = [
    { label: 'الكل', value: 'all' as const },
    { label: 'مخزون منخفض', value: 'low' as const },
    { label: 'قرب الانتهاء', value: 'near_expiry' as const },
    { label: 'منتهي الصلاحية', value: 'expired' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>المخزون</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('ProductForm', {})}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newButtonText}>منتج جديد</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="بحث بالاسم أو الكود أو الباركود..." />
        <View style={styles.chipsRow}>
          {filters.map((f) => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </View>
        {categories && categories.length > 0 ? (
          <View style={styles.chipsRow}>
            <Chip label="كل التصنيفات" selected={selectedCategory === null} onPress={() => setSelectedCategory(null)} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} selected={selectedCategory === c.id} onPress={() => setSelectedCategory(c.id)} />
            ))}
          </View>
        ) : null}
      </View>

      {loading ? <LoadingState /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const expiryStatus = getExpiryStatus(item.expiry_date, warningDays);
            const isLowStock = item.quantity <= item.min_stock;
            return (
              <TouchableOpacity
                style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              >
                <View style={styles.productHeader}>
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.productQty, { color: isLowStock ? theme.error : theme.text }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <View style={styles.productFooter}>
                  <Text style={[styles.productPrice, { color: theme.textSecondary }]}>
                    بيع: {formatCurrency(item.sale_price, currency)}
                  </Text>
                  {expiryStatus === 'expired' ? (
                    <View style={[styles.expiryBadge, { backgroundColor: theme.errorBg }]}>
                      <Text style={[styles.expiryText, { color: theme.error }]}>منتهي الصلاحية</Text>
                    </View>
                  ) : expiryStatus === 'near_expiry' ? (
                    <View style={[styles.expiryBadge, { backgroundColor: theme.warningBg }]}>
                      <Text style={[styles.expiryText, { color: theme.warning }]}>قرب الانتهاء</Text>
                    </View>
                  ) : null}
                  {isLowStock ? (
                    <View style={[styles.expiryBadge, { backgroundColor: theme.warningBg }]}>
                      <Text style={[styles.expiryText, { color: theme.warning }]}>مخزون منخفض</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="لا توجد منتجات"
              message="أضف منتجك الأول لبدء إدارة المخزون"
              actionText="إضافة منتج"
              onAction={() => navigation.navigate('ProductForm', {})}
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
  filterSection: { padding: 16, gap: 10 },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  productCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: { fontSize: 16, fontWeight: '600', fontFamily: 'Cairo', flex: 1, marginRight: 8 },
  productQty: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  productFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  productPrice: { fontSize: 13, fontFamily: 'Cairo' },
  expiryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  expiryText: { fontSize: 11, fontFamily: 'Cairo', fontWeight: '600' },
});
