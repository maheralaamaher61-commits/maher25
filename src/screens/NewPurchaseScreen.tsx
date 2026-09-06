import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSuppliers, getProducts, getSettings, createPurchaseInvoice, addSupplier } from '@/database/db';
import { TextField, Button, SearchBar, BottomSheet, Chip } from '@/components/ui/Inputs';
import { formatCurrency, getPaymentMethodLabel } from '@/utils/format';
import { PAYMENT_METHODS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Product, Supplier } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPurchase'>;

interface CartItem {
  product: Product;
  quantity: number;
  purchase_price: number;
}

export function NewPurchaseScreen({ navigation }: Props) {
  const theme = useTheme();
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paid, setPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierSheet, setShowSupplierSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: suppliers, refresh: refreshSuppliers } = useRefresh(() => getSuppliers(), []);
  const { data: products } = useRefresh(() => getProducts({ limit: 200 }), []);

  useFocusEffect(useCallback(() => { refreshSuppliers(); }, [refreshSuppliers]));

  const currency = settings?.currency ?? 'ج.م';
  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const total = subtotal - (parseFloat(discount) || 0);
  const paidAmount = parseFloat(paid) || 0;
  const remaining = total - paidAmount;

  const filteredProducts = (products ?? []).filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.barcode?.toLowerCase().includes(s);
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, purchase_price: product.purchase_price }];
    });
    setShowProductSheet(false);
    setProductSearch('');
  };

  const updateCartItem = (productId: number, updates: Partial<CartItem>) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, ...updates } : i));
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleQuickAddSupplier = async () => {
    if (!quickName.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return;
    }
    const id = await addSupplier({ name: quickName.trim(), company: null, phone: quickPhone.trim() || null, address: null, tax_number: null, notes: null });
    setSupplierId(id);
    setSupplierName(quickName.trim());
    setShowQuickSupplier(false);
    setShowSupplierSheet(false);
    setQuickName('');
    setQuickPhone('');
    refreshSuppliers();
  };

  const handleSave = async () => {
    if (!supplierId) {
      Alert.alert('خطأ', 'يجب اختيار مورد');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('خطأ', 'لا يمكن حفظ فاتورة بدون منتجات');
      return;
    }
    if (paidAmount > total) {
      Alert.alert('خطأ', 'المبلغ المدفوع لا يمكن أن يكون أكبر من الإجمالي');
      return;
    }
    setSaving(true);
    try {
      const invoiceId = await createPurchaseInvoice({
        supplier_id: supplierId,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
        })),
        discount: parseFloat(discount) || 0,
        paid: paidAmount,
        payment_method: paymentMethod as any,
        notes: notes.trim() || undefined,
      });
      navigation.replace('PurchaseDetail', { invoiceId });
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
        <Text style={[styles.title, { color: theme.text }]}>فاتورة شراء جديدة</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>المورد</Text>
            <TouchableOpacity style={[styles.selector, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => setShowSupplierSheet(true)}>
              <Ionicons name="storefront" size={20} color={theme.accent} />
              <Text style={[styles.selectorText, { color: theme.text }]}>{supplierName || 'اختر المورد'}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>المنتجات ({cart.length})</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.accent + '15' }]} onPress={() => setShowProductSheet(true)}>
                <Ionicons name="add" size={18} color={theme.accent} />
                <Text style={[styles.addButtonText, { color: theme.accent }]}>إضافة منتج</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={[styles.emptyCart, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="bag-outline" size={40} color={theme.textTertiary} />
                <Text style={[styles.emptyCartText, { color: theme.textTertiary }]}>أضف منتجات للفاتورة</Text>
              </View>
            ) : (
              cart.map((item) => (
                <View key={item.product.id} style={[styles.cartItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.cartItemHeader}>
                    <Text style={[styles.cartItemName, { color: theme.text }]} numberOfLines={1}>{item.product.name}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                      <Ionicons name="trash-outline" size={18} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemRow}>
                    <View style={styles.qtyControl}>
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>الكمية</Text>
                      <View style={styles.qtyButtons}>
                        <TouchableOpacity onPress={() => updateCartItem(item.product.id, { quantity: Math.max(1, item.quantity - 1) })}>
                          <Ionicons name="remove-circle" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyValue, { color: theme.text }]}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateCartItem(item.product.id, { quantity: item.quantity + 1 })}>
                          <Ionicons name="add-circle" size={24} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.priceControl}>
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>سعر الشراء</Text>
                      <TextInput
                        value={String(item.purchase_price)}
                        onChangeText={(v) => updateCartItem(item.product.id, { purchase_price: parseFloat(v) || 0 })}
                        style={[styles.priceInput, { color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <Text style={[styles.cartItemTotal, { color: theme.text }]}>الإجمالي: {formatCurrency(item.quantity * item.purchase_price, currency)}</Text>
                </View>
              ))
            )}
          </View>

          {cart.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>الإجمالي والدفع</Text>
              <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>الإجمالي الفرعي</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(subtotal, currency)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>الخصم</Text>
                  <TextInput value={discount} onChangeText={setDiscount} style={[styles.discountInput, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textTertiary} />
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
                  <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>الإجمالي</Text>
                  <Text style={[styles.summaryTotalValue, { color: theme.accent }]}>{formatCurrency(total, currency)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المدفوع</Text>
                  <TextInput value={paid} onChangeText={setPaid} style={[styles.discountInput, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.textTertiary} />
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المتبقي</Text>
                  <Text style={[styles.summaryValue, { color: remaining > 0 ? theme.error : theme.success }]}>{formatCurrency(Math.max(0, remaining), currency)}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>طريقة الدفع</Text>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.filter((m) => m.value !== 'credit').map((m) => (
                  <Chip key={m.value} label={m.label} selected={paymentMethod === m.value} onPress={() => setPaymentMethod(m.value)} />
                ))}
              </View>

              <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات اختيارية" multiline containerStyle={{ marginTop: 16 }} />
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        {cart.length > 0 ? (
          <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button title={saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'} onPress={handleSave} disabled={saving || !supplierId} size="large" icon="checkmark-circle" style={{ flex: 1 }} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <BottomSheet visible={showSupplierSheet} onClose={() => setShowSupplierSheet(false)} title="اختيار المورد">
        <View style={{ maxHeight: 400 }}>
          <TouchableOpacity onPress={() => { setShowSupplierSheet(false); setShowQuickSupplier(true); }} style={[styles.quickAddButton, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
            <Ionicons name="person-add" size={18} color={theme.accent} />
            <Text style={[styles.quickAddText, { color: theme.accent }]}>إضافة مورد سريع</Text>
          </TouchableOpacity>
          {(suppliers ?? []).map((s) => (
            <TouchableOpacity key={s.id} style={[styles.optionItem, { borderColor: theme.border }]} onPress={() => { setSupplierId(s.id); setSupplierName(s.name); setShowSupplierSheet(false); }}>
              <Ionicons name="storefront" size={20} color={theme.accent} />
              <View>
                <Text style={[styles.optionText, { color: theme.text }]}>{s.name}</Text>
                <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{s.phone ?? ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={showProductSheet} onClose={() => setShowProductSheet(false)} title="إضافة منتج">
        <View style={{ maxHeight: 500 }}>
          <SearchBar value={productSearch} onChangeText={setProductSearch} placeholder="بحث عن منتج..." />
          <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
            {filteredProducts.map((p) => (
              <TouchableOpacity key={p.id} style={[styles.optionItem, { borderColor: theme.border }]} onPress={() => addToCart(p)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.optionSub, { color: theme.textSecondary }]}>المخزون: {p.quantity} {p.unit}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>

      <BottomSheet visible={showQuickSupplier} onClose={() => setShowQuickSupplier(false)} title="إضافة مورد سريع">
        <TextField label="الاسم *" value={quickName} onChangeText={setQuickName} placeholder="اسم المورد" icon="storefront" />
        <TextField label="رقم الهاتف" value={quickPhone} onChangeText={setQuickPhone} placeholder="رقم الهاتف" icon="call" keyboardType="phone-pad" />
        <Button title="إضافة" onPress={handleQuickAddSupplier} icon="checkmark" />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  section: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  addButton: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addButtonText: { fontSize: 13, fontWeight: '600', fontFamily: 'Cairo' },
  selector: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  selectorText: { flex: 1, fontSize: 15, fontFamily: 'Cairo' },
  emptyCart: { alignItems: 'center', padding: 40, borderRadius: 14, gap: 12 },
  emptyCartText: { fontSize: 14, fontFamily: 'Cairo' },
  cartItem: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  cartItemHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cartItemName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo', flex: 1, marginRight: 8 },
  cartItemRow: { flexDirection: 'row-reverse', gap: 16, marginBottom: 8 },
  qtyControl: { flex: 1 },
  qtyLabel: { fontSize: 12, fontFamily: 'Cairo', marginBottom: 4 },
  qtyButtons: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  qtyValue: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', minWidth: 30, textAlign: 'center' },
  priceControl: { flex: 1 },
  priceInput: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, fontSize: 15, fontFamily: 'Cairo', textAlign: 'right' },
  cartItemTotal: { fontSize: 14, fontWeight: '700', fontFamily: 'Cairo', textAlign: 'left' },
  summaryCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: 'Cairo' },
  summaryValue: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Cairo' },
  discountInput: { borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, fontSize: 15, fontFamily: 'Cairo', textAlign: 'right', minWidth: 100 },
  paymentMethods: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  quickAddButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 8 },
  quickAddText: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  optionItem: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  optionText: { fontSize: 15, fontFamily: 'Cairo' },
  optionSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
});
