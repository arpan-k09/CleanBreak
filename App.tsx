import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineNotice } from './src/components/OfflineNotice';

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <OfflineNotice />
        <AppNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
