import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// App Stack
import { HomeScreen } from '../features/session/screens/HomeScreen';
import { SessionScreen } from '../features/session/screens/SessionScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { FamilyDashboardScreen } from '../features/family/screens/FamilyDashboardScreen';
import { CreateGroupScreen } from '../features/family/screens/CreateGroupScreen';
import { JoinGroupScreen } from '../features/family/screens/JoinGroupScreen';

// Auth Stack
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';

import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const AppStackScreen = () => (
    <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Session" component={SessionScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ title: 'Family' }} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
    </Stack.Navigator>
);

const AuthStackScreen = () => (
    <AuthStack.Navigator initialRouteName="Login">
        <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </AuthStack.Navigator>
);

// ... imports
import { familyService } from '../services/family';
import { useSessionStore } from '../store/sessionStore';

export const AppNavigator = () => {
    const { user, setUser, isLoading, setLoading } = useAuthStore();
    const startSession = useSessionStore(state => state.startSession);

    useEffect(() => {
        const subscriber = authService.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return subscriber; // unsubscribe on unmount
    }, [setUser, setLoading]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = familyService.onRemoteCommand((command) => {
            if (command?.type === 'START_SESSION') {
                startSession();
            } else if (command?.type === 'TRIGGER_LOCK') {
                // Access store state to check if we can lock?
                // For now, just call triggerLock. It might need to be exposed from store actions in a way that doesn't check state strictness or we check it here.
                // Store `triggerLock` sets usage state to LOCKED.
                useSessionStore.getState().triggerLock();
            }
        });
        return unsubscribe;
    }, [user, startSession]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <AppStackScreen /> : <AuthStackScreen />}
        </NavigationContainer>
    );
};
