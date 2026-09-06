import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, StatusBar, View, ActivityIndicator } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { useDatabase } from './hooks/useDatabase';
import { PinLockScreen } from './screens/PinLockScreen';
import { getSettings } from './database/db';
import { useTheme } from './constants/theme';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

function AppContent() {
  const theme = useTheme();
  const { ready, error } = useDatabase();
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const s = await getSettings();
        if (s.pin_enabled === 1) {
          setLocked(true);
        }
      } catch {}
      setChecking(false);
    })();
  }, [ready]);

  if (!ready || checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 32 }}>
        <ActivityIndicator size="large" color={theme.error} />
      </View>
    );
  }

  if (locked) {
    return <PinLockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <AppContent />
    </SafeAreaProvider>
  );
}
