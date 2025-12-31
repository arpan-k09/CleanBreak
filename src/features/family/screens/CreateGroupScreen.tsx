import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Clipboard } from 'react-native';
import { familyService } from '../../../services/family';
import { useNavigation } from '@react-navigation/native';

export const CreateGroupScreen = () => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    const handleCreate = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await familyService.createGroup(name);
            navigation.goBack();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Family Group</Text>
            <Text style={styles.label}>Family Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. The Smiths" />

            <Button title={loading ? "Creating..." : "Create Group"} onPress={handleCreate} disabled={loading} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    label: { marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 },
});
