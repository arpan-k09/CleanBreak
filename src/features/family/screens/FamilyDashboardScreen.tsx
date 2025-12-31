import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { familyService, FamilyGroup } from '../../../services/family';
import { useAuthStore } from '../../../store/authStore';
import { useNavigation } from '@react-navigation/native';

export const FamilyDashboardScreen = () => {
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const [group, setGroup] = useState<FamilyGroup | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        let unsubscribeGroup: () => void;

        const fetchGroup = async () => {
            const groupId = await familyService.getUserGroupId(user.uid);
            if (groupId) {
                unsubscribeGroup = familyService.onGroupChanged(groupId, (updatedGroup) => {
                    setGroup(updatedGroup);
                    setLoading(false);
                });
            } else {
                setGroup(null);
                setLoading(false);
            }
        };

        fetchGroup();

        return () => {
            if (unsubscribeGroup) unsubscribeGroup();
        };
    }, [user]);

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

    if (!group) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Family Dashboard</Text>
                <Text style={styles.subtitle}>You are not in a group yet.</Text>
                <View style={styles.buttonGap}>
                    <Button title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
                </View>
                <View style={styles.buttonGap}>
                    <Button title="Join Group" onPress={() => navigation.navigate('JoinGroup')} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{group.name}</Text>
            <Text style={styles.code}>Invite Code: {group.inviteCode}</Text>

            <Text style={styles.sectionHeader}>Members</Text>
            <FlatList
                data={group.members}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                    <View style={styles.memberRow}>
                        <View>
                            <Text style={styles.memberName}>{item.email} {item.uid === user?.uid ? '(You)' : ''}</Text>
                            <Text style={styles.memberRole}>{item.role}</Text>
                        </View>
                        {item.uid !== user?.uid && (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <Button title="Trigger" onPress={() => familyService.sendTrigger(item.uid)} />
                                <Button title="Lock" onPress={() => familyService.sendLock(item.uid)} color="orange" />
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
    code: { fontSize: 18, color: 'blue', marginBottom: 20 },
    buttonGap: { marginBottom: 15 },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
    memberRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
    memberName: { fontSize: 16 },
    memberRole: { color: '#888' },
});
