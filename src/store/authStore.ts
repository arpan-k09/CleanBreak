import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthState {
    user: FirebaseAuthTypes.User | null;
    isLoading: boolean;
    setUser: (user: FirebaseAuthTypes.User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // Initial load is true while checking auth state
    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),
}));
