import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useSessionStore } from '../../../store/sessionStore';

export const SettingsScreen = () => {
    const { durations, setDurations } = useSessionStore();

    const [active, setActive] = useState(durations.activeDuration.toString());
    const [escalation, setEscalation] = useState(durations.escalationDuration.toString());
    const [lock, setLock] = useState(durations.lockDuration.toString());

    const handleSave = () => {
        const a = parseInt(active, 10);
        const e = parseInt(escalation, 10);
        const l = parseInt(lock, 10);

        if (isNaN(a) || isNaN(e) || isNaN(l)) {
            Alert.alert("Error", "Please enter valid numbers");
            return;
        }

        setDurations({
            activeDuration: a,
            escalationDuration: e,
            lockDuration: l,
        });
        Alert.alert("Success", "Settings saved");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Session Durations (seconds)</Text>

            <View style={styles.inputContainer}>
                <Text>Active Duration:</Text>
                <TextInput
                    style={styles.input}
                    value={active}
                    onChangeText={setActive}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text>Escalation Duration:</Text>
                <TextInput
                    style={styles.input}
                    value={escalation}
                    onChangeText={setEscalation}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text>Lock Duration:</Text>
                <TextInput
                    style={styles.input}
                    value={lock}
                    onChangeText={setLock}
                    keyboardType="numeric"
                />
            </View>

            <Button title="Save Settings" onPress={handleSave} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    inputContainer: { marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginTop: 5 },
});
