import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import NetInfo from '@react-native-community/netinfo';

export interface GroupMember {
    uid: string;
    role: 'owner' | 'member';
    email: string;
}

export interface FamilyGroup {
    id: string;
    name: string;
    inviteCode: string;
    members: GroupMember[];
    createdAt: any;
}

class FamilyService {
    private generateInviteCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async createGroup(name: string): Promise<string> {
        const net = await NetInfo.fetch();
        if (!net.isConnected) throw new Error("No Internet Connection");

        const user = auth().currentUser;
        if (!user) throw new Error("Not logged in");

        const inviteCode = this.generateInviteCode();
        // Note: For production, ensure inviteCode uniqueness via transaction or retry loop

        const groupRef = await firestore().collection('groups').add({
            name,
            inviteCode,
            createdAt: firestore.FieldValue.serverTimestamp(),
            members: [{
                uid: user.uid,
                role: 'owner',
                email: user.email || 'Unknown'
            }]
        });

        await firestore().collection('users').doc(user.uid).update({
            groupId: groupRef.id
        });

        return groupRef.id;
    }

    async joinGroup(inviteCode: string): Promise<string> {
        const net = await NetInfo.fetch();
        if (!net.isConnected) throw new Error("No Internet Connection");

        const user = auth().currentUser;
        if (!user) throw new Error("Not logged in");

        const snapshot = await firestore().collection('groups').where('inviteCode', '==', inviteCode).limit(1).get();

        if (snapshot.empty) throw new Error("Invalid Code");

        const groupDoc = snapshot.docs[0];

        await groupDoc.ref.update({
            members: firestore.FieldValue.arrayUnion({
                uid: user.uid,
                role: 'member',
                email: user.email || 'Unknown'
            })
        });

        await firestore().collection('users').doc(user.uid).update({
            groupId: groupDoc.id
        });

        return groupDoc.id;
    }

    // Listen to group changes
    onGroupChanged(groupId: string, callback: (group: FamilyGroup | null) => void) {
        return firestore().collection('groups').doc(groupId).onSnapshot(doc => {
            // @ts-ignore
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() } as FamilyGroup);
            } else {
                callback(null);
            }
        });
    }

    async getUserGroupId(uid: string): Promise<string | null> {
        const doc = await firestore().collection('users').doc(uid).get();
        return doc.data()?.groupId || null;
    }

    async sendTrigger(targetUid: string) {
        // Send a command to another user to start a session
        await firestore().collection('users').doc(targetUid).collection('commands').add({
            type: 'START_SESSION',
            createdAt: firestore.FieldValue.serverTimestamp(),
            createdBy: auth().currentUser?.uid
        });
    }

    async sendLock(targetUid: string) {
        await firestore().collection('users').doc(targetUid).collection('commands').add({
            type: 'TRIGGER_LOCK',
            createdAt: firestore.FieldValue.serverTimestamp(),
            createdBy: auth().currentUser?.uid
        });
    }

    onRemoteCommand(callback: (command: any) => void) {
        const user = auth().currentUser;
        if (!user) return () => { };

        // Listen for recent commands (last 10 seconds to avoid old ones on restart)
        // For MVP, just listen to added. We might need to handle "handled" state.
        const now = new Date();
        // Firestore timestamp limitation in queries involves some complexity, 
        // let's just listen to the collection and filter client side or assume ephemeral.

        return firestore().collection('users').doc(user.uid).collection('commands')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        // Basic dedupe: check if created recently?
                        // For MVP, just callback.
                        callback(data);
                    }
                });
            });
    }
}

export const familyService = new FamilyService();
