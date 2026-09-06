import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { getSettings } from '@/database/db';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await SecureStore.getItemAsync('app_pin');
      setStoredPin(p);
    })();
  }, []);

  const handlePress = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);
    if (newPin.length >= 4 && storedPin) {
      if (newPin === storedPin) {
        setTimeout(() => onUnlock(), 200);
      } else if (newPin.length === storedPin.length) {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.lockIconWrap}>
        <View style={[styles.lockIcon, { backgroundColor: theme.accent + '15' }]}>
          <Ionicons name="lock-closed" size={36} color={theme.accent} />
        </View>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>أدخل الرقم السري</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>لفتح التطبيق أدخل الرقم السري</Text>

      <View style={[styles.dotsRow, error && { borderColor: theme.error }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? (error ? theme.error : theme.accent) : 'transparent',
                borderColor: i < pin.length ? (error ? theme.error : theme.accent) : theme.border,
              },
            ]}
          />
        ))}
      </View>

      {error ? <Text style={[styles.errorText, { color: theme.error }]}>رقم سري خاطئ</Text> : null}

      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <TouchableOpacity key={d} style={[styles.key, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handlePress(d)}>
            <Text style={[styles.keyText, { color: theme.text }]}>{d}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.key} />
        <TouchableOpacity style={[styles.key, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handlePress('0')}>
          <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Ionicons name="backspace" size={28} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lockIconWrap: { marginBottom: 24 },
  lockIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', fontFamily: 'Cairo', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Cairo', marginBottom: 32 },
  dotsRow: { flexDirection: 'row-reverse', gap: 16, padding: 8, borderWidth: 2, borderRadius: 12, borderColor: 'transparent' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  errorText: { fontSize: 14, fontFamily: 'Cairo', marginTop: 12 },
  keypad: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 40 },
  key: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  keyText: { fontSize: 28, fontFamily: 'Cairo' },
});
