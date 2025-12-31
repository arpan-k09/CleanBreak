import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSessionStore } from '../../../store/sessionStore';
import { authService } from '../../../services/auth';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { startSession, streak, totalTime, initialize, currentState } = useSessionStore();

    useEffect(() => {
        initialize(); // Ensure data is loaded
    }, []);

    useEffect(() => {
        // If session becomes active (e.g. via remote trigger), navigate
        if (currentState === 'ACTIVE' || currentState === 'ESCALATING' || currentState === 'LOCKED') {
            navigation.navigate('Session');
        }
    }, [currentState]);

    const handleStart = () => {
        startSession();
        navigation.navigate('Session');
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CleanBreak</Text>
            <View style={styles.statsContainer}>
                <Text style={styles.streak}>Streak: {streak} 🔥</Text>
                <Text style={styles.totalTime}>Time Saved: {formatTime(totalTime)}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <Button title="Start Bathroom Session" onPress={handleStart} />
            </View>

            <View style={styles.settingsContainer}>
                <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
            </View>

            <View style={{ marginTop: 10 }}>
                <Button title="Family Group" onPress={() => navigation.navigate('FamilyDashboard')} color="#2196F3" />
            </View>

            <View style={{ marginTop: 20 }}>
                <Button title="Sign Out" onPress={() => authService.signOut()} color="red" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
    statsContainer: { flexDirection: 'row', gap: 20, marginBottom: 40 },
    streak: { fontSize: 18, color: '#FF5722', fontWeight: 'bold' },
    totalTime: { fontSize: 18, color: '#4CAF50', fontWeight: 'bold' },
    buttonContainer: { marginBottom: 20, width: '80%' },
    settingsContainer: { marginTop: 20 },
});
