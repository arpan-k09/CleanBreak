import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Something went wrong.</Text>
            <Text style={styles.error}>{error.message}</Text>
            <Button title="Try Again" onPress={resetErrorBoundary} />
        </View>
    );
};

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    return (
        <ReactErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
        </ReactErrorBoundary>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    error: { marginBottom: 20, color: 'red', textAlign: 'center' },
});
