import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeScanner'>;

export function BarcodeScannerScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    const mode = route.params?.mode ?? 'product';
    if (mode === 'sale') {
      // Return to sale screen - in a real app we'd pass the barcode back
      Alert.alert('تم المسح', `الباركود: ${data}`, [
        { text: 'موافق', onPress: () => { setScanned(false); navigation.goBack(); } },
      ]);
    } else {
      // Product mode - go to product form with barcode
      navigation.replace('ProductForm', { barcode: data });
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', fontFamily: 'Cairo' }}>طلب إذن الكاميرا...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="camera" size={48} color={theme.textTertiary} />
        <Text style={[styles.noAccess, { color: theme.textSecondary }]}>لا يوجد إذن للوصول للكاميرا</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.ean8, BarCodeScanner.Constants.BarCodeType.upc_a, BarCodeScanner.Constants.BarCodeType.upc_e, BarCodeScanner.Constants.BarCodeType.code128, BarCodeScanner.Constants.BarCodeType.code39, BarCodeScanner.Constants.BarCodeType.code93, BarCodeScanner.Constants.BarCodeType.codabar, BarCodeScanner.Constants.BarCodeType.itf, BarCodeScanner.Constants.BarCodeType.qr]}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topText}>وجّه الكاميرا نحو الباركود</Text>
        <View style={{ width: 40 }} />
      </View>
      {scanned ? (
        <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>مسح مرة أخرى</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noAccess: { fontSize: 16, fontFamily: 'Cairo' },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: 'Cairo' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanArea: { width: 250, height: 150, borderWidth: 2, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  topBar: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  topText: { color: '#fff', fontSize: 16, fontFamily: 'Cairo', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  rescanButton: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(37,99,235,0.9)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  rescanText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
});
