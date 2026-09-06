import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getProduct, getSettings, deleteProduct, adjustStock, getStockMovements, getCategories } from '@/database/db';
import { Button, Badge, ConfirmDialog, TextField, BottomSheet, Chip } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { formatCurrency, formatDate, getExpiryStatus, getStockReasonLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { productId } = route.params;
  const [showDelete, setShowDelete] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('manual_adjust');

  const { data: product, loading, refresh } = useRefresh(() => getProduct(productId), [productId]);
  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: categories } = useRefresh(() => getCategories(), []);
  const { data: movements } = useRefresh(() => getStockMovements({ productId, limit: 20 }), [productId]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const currency = settings?.currency ?? 'ج.م';
  const warningDays = settings?.expiry_warning_days ?? 30;

  if (loading || !product) return <LoadingState />;

  const expiryStatus = getExpiryStatus(product.expiry_date, warningDays);
  const categoryName = (categories ?? []).find((c) => c.id === product.category_id)?.name ?? 'بدون تصنيف';
  const profit = product.sale_price - product.purchase_price;

  const handleDelete = async () => {
    setShowDelete(false);
    try {
      await deleteProduct(productId);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  };

  const handleAdjust = async () => {
    const qty = parseFloat(adjustQty);
    if (!qty || qty === 0) {
      Alert.alert('خطأ', 'أدخل كمية صحيحة');
      return;
    }
    try {
      await adjustStock(productId, qty, adjustReason as any, null);
      setAdjustQty('');
      setShowAdjust(false);
      refresh();
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
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>تفاصيل المنتج</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
          <View style={styles.tagsRow}>
            <Badge text={categoryName} />
            {product.brand ? <Badge text={product.brand} /> : null}
            {expiryStatus === 'expired' ? (
              <Badge text="منتهي الصلاحية" color={theme.error} bgColor={theme.errorBg} />
            ) : expiryStatus === 'near_expiry' ? (
              <Badge text="قرب الانتهاء" color={theme.warning} bgColor={theme.warningBg} />
            ) : null}
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>الكمية</Text>
            <Text style={[styles.infoValue, { color: product.quantity <= product.min_stock ? theme.error : theme.text }]}>
              {product.quantity} {product.unit}
            </Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>سعر الشراء</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{formatCurrency(product.purchase_price, currency)}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>سعر البيع</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{formatCurrency(product.sale_price, currency)}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>الربح للوحدة</Text>
            <Text style={[styles.infoValue, { color: theme.success }]}>{formatCurrency(profit, currency)}</Text>
          </View>
        </View>

        {product.barcode ? (
          <View style={[styles.detailRow, { borderColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الباركود</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{product.barcode}</Text>
          </View>
        ) : null}
        {product.code ? (
          <View style={[styles.detailRow, { borderColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الكود</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{product.code}</Text>
          </View>
        ) : null}
        <View style={[styles.detailRow, { borderColor: theme.border }]}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>سعر الجملة</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>{formatCurrency(product.wholesale_price, currency)}</Text>
        </View>
        <View style={[styles.detailRow, { borderColor: theme.border }]}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>الحد الأدنى</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>{product.min_stock} {product.unit}</Text>
        </View>
        {product.has_expiry ? (
          <>
            {product.production_date ? (
              <View style={[styles.detailRow, { borderColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>تاريخ الإنتاج</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{formatDate(product.production_date)}</Text>
              </View>
            ) : null}
            {product.expiry_date ? (
              <View style={[styles.detailRow, { borderColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>تاريخ الانتهاء</Text>
                <Text style={[styles.detailValue, { color: expiryStatus === 'expired' ? theme.error : theme.text }]}>{formatDate(product.expiry_date)}</Text>
              </View>
            ) : null}
          </>
        ) : null}
        {product.notes ? (
          <View style={[styles.detailRow, { borderColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ملاحظات</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{product.notes}</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>آخر حركات المخزون</Text>
        {(movements ?? []).length === 0 ? (
          <Text style={[styles.empty, { color: theme.textTertiary }]}>لا توجد حركات</Text>
        ) : (
          (movements ?? []).map((m) => (
            <View key={m.id} style={[styles.movementItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.movementReason, { color: theme.text }]}>{getStockReasonLabel(m.reason)}</Text>
                <Text style={[styles.movementDate, { color: theme.textSecondary }]}>{formatDate(m.date)} {m.time}</Text>
              </View>
              <Text style={[styles.movementQty, { color: m.type === '+' ? theme.success : theme.error }]}>
                {m.type}{m.quantity} → {m.balance_after}
              </Text>
            </View>
          ))
        )}

        <View style={styles.actionsRow}>
          <Button title="تعديل" onPress={() => navigation.navigate('ProductForm', { productId })} icon="create" style={{ flex: 1 }} />
          <Button title="تسوية مخزون" onPress={() => setShowAdjust(true)} variant="outline" icon="swap-horizontal" style={{ flex: 1 }} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Button title="حذف المنتج" onPress={() => setShowDelete(true)} variant="danger" icon="trash" />
        </View>
      </ScrollView>

      <ConfirmDialog visible={showDelete} title="حذف المنتج" message="هل أنت متأكد؟ لا يمكن التراجع." confirmText="حذف" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} danger />

      <BottomSheet visible={showAdjust} onClose={() => setShowAdjust(false)} title="تسوية المخزون">
        <TextField label="الكمية (+ للزيادة، - للنقص)" value={adjustQty} onChangeText={setAdjustQty} placeholder="مثال: 5 أو -3" keyboardType="numeric" />
        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>السبب</Text>
          <View style={styles.reasonChips}>
            {[{ v: 'manual_adjust', l: 'تعديل يدوي' }, { v: 'damage', l: 'تلف' }, { v: 'expiry', l: 'انتهاء صلاحية' }, { v: 'settlement', l: 'تسوية' }].map((r) => (
              <Chip key={r.v} label={r.l} selected={adjustReason === r.v} onPress={() => setAdjustReason(r.v)} />
            ))}
          </View>
        </View>
        <Button title="تأكيد" onPress={handleAdjust} icon="checkmark" />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  productName: { fontSize: 20, fontWeight: '700', fontFamily: 'Cairo', marginBottom: 10 },
  tagsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  infoGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  infoCard: { flexBasis: '47%', flexGrow: 1, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoLabel: { fontSize: 13, fontFamily: 'Cairo' },
  infoValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo', marginTop: 4 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 14, fontFamily: 'Cairo' },
  detailValue: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  sectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', marginTop: 16, marginBottom: 10 },
  empty: { fontSize: 13, fontFamily: 'Cairo', textAlign: 'center', paddingVertical: 16 },
  movementItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  movementReason: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  movementDate: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  movementQty: { fontSize: 14, fontWeight: '700', fontFamily: 'Cairo' },
  actionsRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 20 },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 6 },
  reasonChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 6 },
});
