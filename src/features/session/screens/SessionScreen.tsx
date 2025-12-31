import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, AppState } from 'react-native';
import { useSessionStore } from '../../../store/sessionStore';
import { useNavigation } from '@react-navigation/native';
import { differenceInSeconds } from 'date-fns';
import { notificationService } from '../../../services/notifications';
import { DisruptionOverlay } from '../components/DisruptionOverlay';
import { CircularTimer } from '../../../components/ui/CircularTimer';

export const SessionScreen = () => {
    const navigation = useNavigation<any>();
    const { currentState, endSession, checkTransitions, durations, initialize, startTime } = useSessionStore();

    // Calculate progress for timer
    // If ACTIVE, progress is based on activeDuration
    // If ESCALATING, can also show timer?

    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (startTime) {
                const now = Date.now();
                const diff = differenceInSeconds(now, startTime);
                // Adjust diff based on state? 
                // Actually startTime is session start.
                // In Active: elapsed = diff
                // In Escalating: elapsed = diff - activeDuration (if we want a fresh timer)

                setElapsed(diff);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const getTimerProps = () => {
        if (currentState === 'ACTIVE') {
            return { duration: durations.activeDuration, elapsed: elapsed, color: '#4CAF50' };
        } else if (currentState === 'ESCALATING') {
            // Show countdown for escalation
            return { duration: durations.escalationDuration, elapsed: elapsed - durations.activeDuration, color: '#FF9800' };
        } else if (currentState === 'LOCKED') {
            return { duration: durations.lockDuration, elapsed: elapsed - (durations.activeDuration + durations.escalationDuration), color: '#F44336' };
        }
        return { duration: 100, elapsed: 0, color: '#Grey' };
    };

    const timerProps = getTimerProps();

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Timer loop
    useEffect(() => {
        const interval = setInterval(() => {
            checkTransitions();
        }, 1000);
        return () => clearInterval(interval);
    }, [checkTransitions]);

    // Background handling
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                // App came to foreground
                await notificationService.cancelAll();
                checkTransitions();
            } else if (nextAppState === 'background') {
                // App went to background
                // Schedule next transitions
                if (currentState === 'ACTIVE' && startTime) {
                    const activeLeft = durations.activeDuration - differenceInSeconds(Date.now(), startTime);
                    if (activeLeft > 0) {
                        await notificationService.scheduleNotification(
                            "Time's Up!",
                            "Escalation phase starting. Please wrap up.",
                            activeLeft,
                            'active_end'
                        );
                    }

                    const escalationLeft = (durations.activeDuration + durations.escalationDuration) - differenceInSeconds(Date.now(), startTime);
                    if (escalationLeft > 0) {
                        await notificationService.scheduleNotification(
                            "Support Lock Incoming",
                            "Escalation ending. Lock will engage shortly.",
                            escalationLeft,
                            'escalation_end'
                        );
                    }
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, [currentState, startTime, durations, checkTransitions]);

    const handleEnd = () => {
        endSession();
        notificationService.cancelAll();
        navigation.navigate('Home');
    };

    return (
        <View style={[styles.container, currentState === 'ESCALATING' && styles.escalating, currentState === 'LOCKED' && styles.locked]}>
            <DisruptionOverlay state={currentState} />

            <View style={{ marginBottom: 40 }}>
                <CircularTimer
                    radius={120}
                    strokeWidth={15}
                    duration={timerProps.duration}
                    elapsed={timerProps.elapsed}
                    color={timerProps.color}
                />
            </View>

            <Text style={styles.state}>{currentState}</Text>

            {currentState === 'ACTIVE' && <Text style={{ fontSize: 20, marginBottom: 10 }}>Time remaining: {Math.max(timerProps.duration - timerProps.elapsed, 0)}s</Text>}
            {currentState === 'ESCALATING' && <Text style={styles.warningText}>ESCALATING! Wrap up!</Text>}

            {currentState !== 'LOCKED' && (
                <Button title="End Session" onPress={handleEnd} />
            )}

            {currentState === 'LOCKED' && (
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.warning}>LOCKED - Cannot Exit</Text>
                    <Text style={{ marginTop: 10 }}>Take a deep breath.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    escalating: { backgroundColor: '#fff3cd' }, // Yellowish
    locked: { backgroundColor: '#f8d7da' }, // Reddish
    state: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
    warning: { color: 'red', marginTop: 20, fontSize: 20, fontWeight: 'bold' },
    warningText: { fontSize: 18, color: 'orange', marginBottom: 10 },
});
