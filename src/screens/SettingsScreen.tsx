import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { useRefresh } from '@/hooks/useDatabase';
import { getSettings, updateSettings, clearAllData } from '@/database/db';
import { TextField, Button, Chip, ConfirmDialog, BottomSheet } from '@/components/ui/Inputs';
import { ACCENT_COLORS, INVOICE_SIZES } from '@/constants';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { refresh } = useRefresh(() => getSettings(), []);
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [currency, setCurrency] = useState('ج.م');
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [invoiceSize, setInvoiceSize] = useState('80mm');
  const [allowNegative, setAllowNegative] = useState(false);
  const [expiryDays, setExpiryDays] = useState('30');
  const [installmentNotif, setInstallmentNotif] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPinSheet, setShowPinSheet] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const s = await getSettings();
        setStoreName(s.store_name);
        setStorePhone(s.store_phone);
        setStoreAddress(s.store_address);
        setCurrency(s.currency);
        setAccentColor(s.accent_color);
        setInvoiceSize(s.invoice_size);
        setAllowNegative(s.allow_negative_stock === 1);
        setExpiryDays(String(s.expiry_warning_days));
        setInstallmentNotif(s.installment_notifications === 1);
        setPinEnabled(s.pin_enabled === 1);
      })();
    }, []),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        store_name: storeName,
        store_phone: storePhone,
        store_address: storeAddress,
        currency,
        accent_color: accentColor,
        invoice_size: invoiceSize as any,
        allow_negative_stock: allowNegative ? 1 : 0,
        expiry_warning_days: parseInt(expiryDays) || 30,
        installment_notifications: installmentNotif ? 1 : 0,
      });
      Alert.alert('تم', 'تم حفظ الإعدادات');
      refresh();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePinToggle = async () => {
    if (pinEnabled) {
      await updateSettings({ pin_enabled: 0, pin_hash: null });
      await SecureStore.deleteItemAsync('app_pin');
      setPinEnabled(false);
      Alert.alert('تم', 'تم إلغاء قفل التطبيق');
    } else {
      setShowPinSheet(true);
    }
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4) {
      Alert.alert('خطأ', 'الرقم السري يجب أن يكون 4 أرقام على الأقل');
      return;
    }
    await SecureStore.setItemAsync('app_pin', pinInput);
    await updateSettings({ pin_enabled: 1, pin_hash: 'stored' });
    setPinEnabled(true);
    setPinInput('');
    setShowPinSheet(false);
    Alert.alert('تم', 'تم تفعيل قفل التطبيق');
  };

  const handleClearData = async () => {
    setShowClearConfirm(false);
    try {
      await clearAllData();
      Alert.alert('تم', 'تم حذف جميع البيانات');
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
        <Text style={[styles.title, { color: theme.text }]}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>بيانات المتجر</Text>
        <TextField label="اسم المحل" value={storeName} onChangeText={setStoreName} placeholder="اسم المحل" icon="storefront" />
        <TextField label="رقم الهاتف" value={storePhone} onChangeText={setStorePhone} placeholder="رقم الهاتف" icon="call" keyboardType="phone-pad" />
        <TextField label="العنوان" value={storeAddress} onChangeText={setStoreAddress} placeholder="العنوان" icon="location" />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>العملة</Text>
        <TextField label="العملة" value={currency} onChangeText={setCurrency} placeholder="ج.م" icon="cash" />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>لون التطبيق</Text>
        <View style={styles.colorRow}>
          {ACCENT_COLORS.map((c) => (
            <TouchableOpacity
              key={c.value}
              onPress={() => setAccentColor(c.value)}
              style={[styles.colorDot, { backgroundColor: c.value, borderColor: accentColor === c.value ? theme.text : 'transparent', borderWidth: 3 }]}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>حجم الفاتورة</Text>
        <View style={styles.chipsRow}>
          {INVOICE_SIZES.map((s) => (
            <Chip key={s.value} label={s.label} selected={invoiceSize === s.value} onPress={() => setInvoiceSize(s.value)} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>المخزون والصلاحية</Text>
        <TouchableOpacity style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setAllowNegative(!allowNegative)}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>السماح بالمخزون السالب</Text>
            <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>السماح ببيع كمية أكبر من المخزون</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: allowNegative ? theme.accent : theme.border }]}>
            <View style={[styles.toggleKnob, { transform: [{ translateX: allowNegative ? -20 : 0 }] }]} />
          </View>
        </TouchableOpacity>
        <TextField label="أيام تنبيه انتهاء الصلاحية" value={expiryDays} onChangeText={setExpiryDays} placeholder="30" keyboardType="numeric" />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>التنبيهات والقفل</Text>
        <TouchableOpacity style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setInstallmentNotif(!installmentNotif)}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>تنبيهات الأقساط</Text>
            <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>تنبيه محلي قبل موعد الاستحقاق</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: installmentNotif ? theme.accent : theme.border }]}>
            <View style={[styles.toggleKnob, { transform: [{ translateX: installmentNotif ? -20 : 0 }] }]} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handlePinToggle}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>قفل التطبيق برقم سري</Text>
            <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>{pinEnabled ? 'مفعّل' : 'غير مفعّل'}</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: pinEnabled ? theme.accent : theme.border }]}>
            <View style={[styles.toggleKnob, { transform: [{ translateX: pinEnabled ? -20 : 0 }] }]} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>النسخ الاحتياطي</Text>
        <Button title="النسخ الاحتياطي والاستعادة" onPress={() => navigation.navigate('Backup')} icon="download" variant="outline" />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>منطقة الخطر</Text>
        <Button title="حذف كل البيانات" onPress={() => setShowClearConfirm(true)} variant="danger" icon="trash" />

        <View style={{ height: 20 }} />
        <Button title={saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'} onPress={handleSave} disabled={saving} size="large" icon="checkmark-circle" />
      </ScrollView>

      <ConfirmDialog visible={showClearConfirm} title="حذف كل البيانات" message="سيتم حذف جميع المنتجات والفواتير والعملاء نهائيًا. لا يمكن التراجع. هل أنت متأكد؟" confirmText="حذف الكل" onConfirm={handleClearData} onCancel={() => setShowClearConfirm(false)} danger />
      <BottomSheet visible={showPinSheet} onClose={() => setShowPinSheet(false)} title="تعيين رقم سري">
        <TextField label="الرقم السري (4 أرقام)" value={pinInput} onChangeText={setPinInput} placeholder="****" keyboardType="numeric" secureTextEntry />
        <Button title="تفعيل القفل" onPress={handleSetPin} icon="lock-closed" />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  sectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Cairo', marginTop: 20, marginBottom: 10 },
  colorRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  toggleLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  toggleSub: { fontSize: 12, fontFamily: 'Cairo', marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-end' },
});
