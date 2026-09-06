import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './database/db';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
      })
      .catch(err => {
        console.error('Database initialization failed:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return null;
  }

  if (!dbReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}