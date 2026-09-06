import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import {
  getProduct, addProduct, updateProduct, getCategories, getSuppliers, getSettings, addCategory,
} from '@/database/db';
import { TextField, Button, Chip, BottomSheet, SearchBar } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

export function ProductFormScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { productId, barcode } = route.params;
  const isEdit = !!productId;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcodeVal, setBarcodeVal] = useState(barcode ?? '');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [wholesalePrice, setWholesalePrice] = useState('0');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('قطعة');
  const [minStock, setMinStock] = useState('5');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: categories, refresh: refreshCategories } = useRefresh(() => getCategories(), []);
  const { data: suppliers } = useRefresh(() => getSuppliers(), []);
  const { data: settings } = useRefresh(() => getSettings(), []);

  useFocusEffect(
    useCallback(() => {
      if (productId) {
        (async () => {
          const p = await getProduct(productId);
          if (p) {
            setName(p.name);
            setCode(p.code ?? '');
            setBarcodeVal(p.barcode ?? '');
            setBrand(p.brand ?? '');
            setPurchasePrice(String(p.purchase_price));
            setSalePrice(String(p.sale_price));
            setWholesalePrice(String(p.wholesale_price));
            setQuantity(String(p.quantity));
            setUnit(p.unit);
            setMinStock(String(p.min_stock));
            setHasExpiry(p.has_expiry === 1);
            setProductionDate(p.production_date ?? '');
            setExpiryDate(p.expiry_date ?? '');
            setNotes(p.notes ?? '');
            setCategoryId(p.category_id);
            setSupplierId(p.supplier_id);
          }
        })();
      }
    }, [productId]),
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowQuickCategory(false);
      refreshCategories();
    } catch {
      Alert.alert('خطأ', 'التصنيف موجود بالفعل');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'اسم المنتج مطلوب');
      return;
    }
    if (parseFloat(salePrice) < 0 || parseFloat(purchasePrice) < 0) {
      Alert.alert('خطأ', 'الأسعار لا يمكن أن تكون سالبة');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        code: code.trim() || null,
        barcode: barcodeVal.trim() || null,
        image: null,
        category_id: categoryId,
        brand: brand.trim() || null,
        supplier_id: supplierId,
        purchase_price: parseFloat(purchasePrice) || 0,
        sale_price: parseFloat(salePrice) || 0,
        wholesale_price: parseFloat(wholesalePrice) || 0,
        quantity: parseFloat(quantity) || 0,
        unit: unit.trim() || 'قطعة',
        min_stock: parseFloat(minStock) || 0,
        has_expiry: hasExpiry ? 1 : 0,
        production_date: hasExpiry ? productionDate || null : null,
        expiry_date: hasExpiry ? expiryDate || null : null,
        notes: notes.trim() || null,
      };
      if (isEdit && productId) {
        await updateProduct(productId, data);
      } else {
        await addProduct(data as any);
      }
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
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'تعديل منتج' : 'منتج جديد'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <TextField label="اسم المنتج *" value={name} onChangeText={setName} placeholder="اسم المنتج" icon="cube" />
          <View style={styles.row}>
            <TextField label="كود المنتج" value={code} onChangeText={setCode} placeholder="كود" containerStyle={{ flex: 1, marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>الباركود</Text>
              <View style={[styles.barcodeRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <TextInput
                  value={barcodeVal}
                  onChangeText={setBarcodeVal}
                  style={[styles.input, { color: theme.text }]}
                  placeholder="باركود"
                  placeholderTextColor={theme.textTertiary}
                  textAlign="right"
                />
                <TouchableOpacity onPress={() => navigation.navigate('BarcodeScanner', { mode: 'product' })}>
                  <Ionicons name="scan" size={22} color={theme.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>التصنيف</Text>
              <TouchableOpacity onPress={() => setShowQuickCategory(true)} style={[styles.quickAdd, { backgroundColor: theme.accent + '15' }]}>
                <Ionicons name="add" size={16} color={theme.accent} />
                <Text style={[styles.quickAddText, { color: theme.accent }]}>تصنيف جديد</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                <Chip label="بدون" selected={categoryId === null} onPress={() => setCategoryId(null)} />
                {(categories ?? []).map((c) => (
                  <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
                ))}
              </View>
            </ScrollView>
          </View>

          <TextField label="العلامة التجارية" value={brand} onChangeText={setBrand} placeholder="العلامة التجارية" icon="pricetag" />

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>المورد</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                <Chip label="بدون" selected={supplierId === null} onPress={() => setSupplierId(null)} />
                {(suppliers ?? []).map((s) => (
                  <Chip key={s.id} label={s.name} selected={supplierId === s.id} onPress={() => setSupplierId(s.id)} />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.row}>
            <TextField label="سعر الشراء" value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0" keyboardType="numeric" containerStyle={{ flex: 1, marginRight: 8 }} />
            <TextField label="سعر البيع" value={salePrice} onChangeText={setSalePrice} placeholder="0" keyboardType="numeric" containerStyle={{ flex: 1 }} />
          </View>
          <View style={styles.row}>
            <TextField label="سعر الجملة" value={wholesalePrice} onChangeText={setWholesalePrice} placeholder="0" keyboardType="numeric" containerStyle={{ flex: 1, marginRight: 8 }} />
            <TextField label="الكممية" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" containerStyle={{ flex: 1 }} />
          </View>
          <View style={styles.row}>
            <TextField label="الوحدة" value={unit} onChangeText={setUnit} placeholder="قطعة" containerStyle={{ flex: 1, marginRight: 8 }} />
            <TextField label="الحد الأدنى للمخزون" value={minStock} onChangeText={setMinStock} placeholder="5" keyboardType="numeric" containerStyle={{ flex: 1 }} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>هل المنتج له تاريخ انتهاء؟</Text>
            <View style={styles.chipsRow}>
              <Chip label="لا" selected={!hasExpiry} onPress={() => setHasExpiry(false)} />
              <Chip label="نعم" selected={hasExpiry} onPress={() => setHasExpiry(true)} />
            </View>
          </View>

          {hasExpiry ? (
            <View style={styles.row}>
              <TextField label="تاريخ الإنتاج" value={productionDate} onChangeText={setProductionDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1, marginRight: 8 }} />
              <TextField label="تاريخ الانتهاء" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
            </View>
          ) : null}

          <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات اختيارية" multiline />

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={saving ? 'جاري الحفظ...' : 'حفظ'} onPress={handleSave} disabled={saving} size="large" icon="checkmark-circle" style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={showQuickCategory} onClose={() => setShowQuickCategory(false)} title="تصنيف جديد">
        <TextField label="اسم التصنيف" value={newCategoryName} onChangeText={setNewCategoryName} placeholder="اسم التصنيف" />
        <Button title="إضافة" onPress={handleAddCategory} icon="checkmark" />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  row: { flexDirection: 'row-reverse' },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 6 },
  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  quickAdd: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  quickAddText: { fontSize: 12, fontWeight: '600', fontFamily: 'Cairo' },
  chipsRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  barcodeRow: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: 'Cairo' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
