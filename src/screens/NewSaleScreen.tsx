import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import {
  getCustomers, getProducts, getSettings, createSalesInvoice, addCustomer, createInstallments,
} from '@/database/db';
import { TextField, Button, SearchBar, BottomSheet, Chip } from '@/components/ui/Inputs';
import { formatCurrency, todayISO, currentTime, getPaymentMethodLabel } from '@/utils/format';
import { PAYMENT_METHODS, GOVERNORATES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Product, Customer } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NewSale'>;

interface CartItem {
  product: Product;
  quantity: number;
  sale_price: number;
  discount: number;
}

export function NewSaleScreen({ navigation }: Props) {
  const theme = useTheme();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState('0');
  const [paid, setPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickGov, setQuickGov] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: settings } = useRefresh(() => getSettings(), []);
  const { data: customers, refresh: refreshCustomers } = useRefresh(() => getCustomers(), []);
  const { data: products, refresh: refreshProducts } = useRefresh(() => getProducts({ limit: 200 }), []);

  useFocusEffect(useCallback(() => {
    refreshCustomers();
    refreshProducts();
  }, [refreshCustomers, refreshProducts]));

  const currency = settings?.currency ?? 'ج.م';

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.sale_price - i.discount, 0);
  const total = subtotal - (parseFloat(invoiceDiscount) || 0);
  const paidAmount = parseFloat(paid) || 0;
  const remaining = total - paidAmount;

  const filteredProducts = (products ?? []).filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.code?.toLowerCase().includes(s) || p.barcode?.toLowerCase().includes(s);
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, sale_price: product.sale_price, discount: 0 }];
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

  const handleQuickAddCustomer = async () => {
    if (!quickName.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return;
    }
    const id = await addCustomer({ name: quickName.trim(), phone: quickPhone.trim() || null, governorate: quickGov || null, address: null, notes: null });
    setCustomerId(id);
    setCustomerName(quickName.trim());
    setShowQuickCustomer(false);
    setShowCustomerSheet(false);
    setQuickName('');
    setQuickPhone('');
    setQuickGov('');
    refreshCustomers();
  };

  const handleSave = async () => {
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
      let custId = customerId;
      if (!custId) {
        const cashCustomers = (customers ?? []).filter((c) => c.name === 'عميل نقدي');
        if (cashCustomers.length > 0) {
          custId = cashCustomers[0].id;
        } else {
          custId = await addCustomer({ name: 'عميل نقدي', phone: null, governorate: null, address: null, notes: null });
          refreshCustomers();
        }
      }

      const invoiceId = await createSalesInvoice({
        customer_id: custId,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          sale_price: i.sale_price,
          discount: i.discount,
        })),
        discount: parseFloat(invoiceDiscount) || 0,
        paid: paidAmount,
        payment_method: paymentMethod as any,
        notes: notes.trim() || undefined,
      });

      if (remaining > 0 && paymentMethod === 'credit') {
        Alert.alert(
          'تقسيط',
          'هل تريد عمل تقسيط للمبلغ المتبقي؟',
          [
            { text: 'لا', onPress: () => navigation.replace('SaleDetail', { invoiceId }) },
            { text: 'نعم، تقسيط', onPress: () => navigation.navigate('InstallmentForm', { invoiceId, customerId: custId!, total, paid: paidAmount }) },
          ],
        );
      } else {
        navigation.replace('SaleDetail', { invoiceId });
      }
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
        <Text style={[styles.title, { color: theme.text }]}>فاتورة بيع جديدة</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>العميل</Text>
            <TouchableOpacity
              style={[styles.customerSelector, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              onPress={() => setShowCustomerSheet(true)}
            >
              <Ionicons name="person" size={20} color={theme.accent} />
              <Text style={[styles.customerSelectorText, { color: theme.text }]}>{customerName}</Text>
              <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>المنتجات ({cart.length})</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.accent + '15' }]}
                onPress={() => setShowProductSheet(true)}
              >
                <Ionicons name="add" size={18} color={theme.accent} />
                <Text style={[styles.addButtonText, { color: theme.accent }]}>إضافة منتج</Text>
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={[styles.emptyCart, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="cart-outline" size={40} color={theme.textTertiary} />
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
                      <Text style={[styles.qtyLabel, { color: theme.textSecondary }]}>السعر</Text>
                      <TextInput
                        value={String(item.sale_price)}
                        onChangeText={(v) => updateCartItem(item.product.id, { sale_price: parseFloat(v) || 0 })}
                        style={[styles.priceInput, { color: theme.text, borderColor: theme.border }]}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <Text style={[styles.cartItemTotal, { color: theme.text }]}>
                    الإجمالي: {formatCurrency(item.quantity * item.sale_price - item.discount, currency)}
                  </Text>
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
                  <TextInput
                    value={invoiceDiscount}
                    onChangeText={setInvoiceDiscount}
                    style={[styles.discountInput, { color: theme.text, borderColor: theme.border }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }]}>
                  <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>الإجمالي النهائي</Text>
                  <Text style={[styles.summaryTotalValue, { color: theme.accent }]}>{formatCurrency(total, currency)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المدفوع</Text>
                  <TextInput
                    value={paid}
                    onChangeText={setPaid}
                    style={[styles.discountInput, { color: theme.text, borderColor: theme.border }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>المتبقي</Text>
                  <Text style={[styles.summaryValue, { color: remaining > 0 ? theme.error : theme.success }]}>
                    {formatCurrency(Math.max(0, remaining), currency)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>طريقة الدفع</Text>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.map((m) => (
                  <Chip
                    key={m.value}
                    label={m.label}
                    selected={paymentMethod === m.value}
                    onPress={() => setPaymentMethod(m.value)}
                  />
                ))}
              </View>

              <TextField
                label="ملاحظات"
                value={notes}
                onChangeText={setNotes}
                placeholder="ملاحظات اختيارية"
                multiline
                containerStyle={{ marginTop: 16 }}
              />
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        {cart.length > 0 ? (
          <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Button
              title={saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
              onPress={handleSave}
              disabled={saving}
              size="large"
              icon="checkmark-circle"
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <BottomSheet visible={showCustomerSheet} onClose={() => setShowCustomerSheet(false)} title="اختيار العميل">
        <View style={{ maxHeight: 400 }}>
          <View style={styles.sheetActions}>
            <TouchableOpacity
              onPress={() => { setShowCustomerSheet(false); setShowQuickCustomer(true); }}
              style={[styles.quickAddButton, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}
            >
              <Ionicons name="person-add" size={18} color={theme.accent} />
              <Text style={[styles.quickAddText, { color: theme.accent }]}>إضافة عميل سريع</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.customerOption, { borderColor: theme.border }]}
            onPress={() => { setCustomerId(null); setCustomerName('عميل نقدي'); setShowCustomerSheet(false); }}
          >
            <Ionicons name="cash" size={20} color={theme.success} />
            <Text style={[styles.customerOptionText, { color: theme.text }]}>عميل نقدي</Text>
          </TouchableOpacity>
          {(customers ?? []).map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.customerOption, { borderColor: theme.border }]}
              onPress={() => { setCustomerId(c.id); setCustomerName(c.name); setShowCustomerSheet(false); }}
            >
              <View style={[styles.customerAvatar, { backgroundColor: theme.accent + '15' }]}>
                <Text style={[styles.customerAvatarText, { color: theme.accent }]}>{c.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.customerOptionText, { color: theme.text }]}>{c.name}</Text>
                <Text style={[styles.customerOptionSub, { color: theme.textSecondary }]}>{c.phone ?? ''}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={showProductSheet} onClose={() => setShowProductSheet(false)} title="إضافة منتج">
        <View style={{ maxHeight: 500 }}>
          <SearchBar value={productSearch} onChangeText={setProductSearch} placeholder="بحث عن منتج..." />
          <TouchableOpacity
            onPress={() => { setShowProductSheet(false); navigation.navigate('BarcodeScanner', { mode: 'sale' }); }}
            style={[styles.scanButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <Ionicons name="scan" size={20} color={theme.accent} />
            <Text style={[styles.scanButtonText, { color: theme.accent }]}>مسح الباركود</Text>
          </TouchableOpacity>
          <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
            {filteredProducts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.productOption, { borderColor: theme.border }]}
                onPress={() => addToCart(p)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productOptionName, { color: theme.text }]}>{p.name}</Text>
                  <Text style={[styles.productOptionSub, { color: theme.textSecondary }]}>
                    المخزون: {p.quantity} {p.unit} - {formatCurrency(p.sale_price, currency)}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>

      <BottomSheet visible={showQuickCustomer} onClose={() => setShowQuickCustomer(false)} title="إضافة عميل سريع">
        <TextField label="الاسم" value={quickName} onChangeText={setQuickName} placeholder="اسم العميل" icon="person" />
        <TextField label="رقم الهاتف" value={quickPhone} onChangeText={setQuickPhone} placeholder="رقم الهاتف" icon="call" keyboardType="phone-pad" />
        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>المحافظة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={styles.govChips}>
              {GOVERNORATES.map((g) => (
                <Chip key={g} label={g} selected={quickGov === g} onPress={() => setQuickGov(g)} />
              ))}
            </View>
          </ScrollView>
        </View>
        <Button title="إضافة" onPress={handleQuickAddCustomer} icon="checkmark" />
      </BottomSheet>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  section: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: { fontSize: 13, fontWeight: '600', fontFamily: 'Cairo' },
  customerSelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  customerSelectorText: { flex: 1, fontSize: 15, fontFamily: 'Cairo' },
  emptyCart: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 14,
    gap: 12,
  },
  emptyCartText: { fontSize: 14, fontFamily: 'Cairo' },
  cartItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cartItemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartItemName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo', flex: 1, marginRight: 8 },
  cartItemRow: { flexDirection: 'row-reverse', gap: 16, marginBottom: 8 },
  qtyControl: { flex: 1 },
  qtyLabel: { fontSize: 12, fontFamily: 'Cairo', marginBottom: 4 },
  qtyButtons: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  qtyValue: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', minWidth: 30, textAlign: 'center' },
  priceControl: { flex: 1 },
  priceInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Cairo',
    textAlign: 'right',
  },
  cartItemTotal: { fontSize: 14, fontWeight: '700', fontFamily: 'Cairo', textAlign: 'left' },
  summaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, fontFamily: 'Cairo' },
  summaryValue: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Cairo' },
  discountInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Cairo',
    textAlign: 'right',
    minWidth: 100,
  },
  paymentMethods: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
  },
  sheetActions: { marginBottom: 12 },
  quickAddButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  quickAddText: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  customerOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  customerOptionText: { fontSize: 15, fontFamily: 'Cairo' },
  customerOptionSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo' },
  scanButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  scanButtonText: { fontSize: 14, fontWeight: '600', fontFamily: 'Cairo' },
  productOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  productOptionName: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  productOptionSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  label: { fontSize: 13, fontFamily: 'Cairo' },
  govChips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
});
