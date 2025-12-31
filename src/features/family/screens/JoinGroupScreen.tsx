import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { familyService } from '../../../services/family';
import { useNavigation } from '@react-navigation/native';

export const JoinGroupScreen = () => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    const handleJoin = async () => {
        if (!code) return;
        setLoading(true);
        try {
            await familyService.joinGroup(code.trim().toUpperCase());
            navigation.goBack();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join Family Group</Text>
            <Text style={styles.label}>Invite Code</Text>
            <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="6-character code"
                autoCapitalize="characters"
            />

            <Button title={loading ? "Joining..." : "Join Group"} onPress={handleJoin} disabled={loading} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    label: { marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 },
});
