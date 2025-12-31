import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class AuthService {
    // Sign Up
    async signUp(email: string, pass: string): Promise<FirebaseAuthTypes.User | null> {
        try {
            const cred = await auth().createUserWithEmailAndPassword(email, pass);
            const user = cred.user;

            // Create user record in Firestore
            await firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                createdAt: firestore.FieldValue.serverTimestamp(),
                currentSessionId: null,
            });

            return user;
        } catch (error) {
            console.error("SignUp Error:", error);
            throw error;
        }
    }

    // Sign In
    async signIn(email: string, pass: string): Promise<FirebaseAuthTypes.User | null> {
        try {
            const cred = await auth().signInWithEmailAndPassword(email, pass);
            return cred.user;
        } catch (error) {
            console.error("SignIn Error:", error);
            throw error;
        }
    }

    // Sign Out
    async signOut(): Promise<void> {
        try {
            await auth().signOut();
        } catch (error) {
            console.error("SignOut Error:", error);
            throw error;
        }
    }

    // Auth State Listener
    onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
        return auth().onAuthStateChanged(callback);
    }
}

export const authService = new AuthService();
