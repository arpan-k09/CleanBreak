import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { SessionState } from '../../../store/sessionStore';

interface Props {
    state: SessionState;
}

export const DisruptionOverlay = ({ state }: Props) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (state === 'ESCALATING') {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.4, { duration: 1000 }),
                    withTiming(0.1, { duration: 1000 })
                ),
                -1,
                true
            );
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else if (state === 'LOCKED') {
            opacity.value = withTiming(0.95, { duration: 500 });
            scale.value = withTiming(1, { duration: 500 });
        } else {
            opacity.value = withTiming(0, { duration: 300 });
            scale.value = withTiming(1, { duration: 300 });
        }
    }, [state]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
        };
    });

    if (state !== 'ESCALATING' && state !== 'LOCKED') return null;

    return (
        <Animated.View style={[styles.container, animatedStyle, state === 'LOCKED' ? styles.locked : styles.escalating]} pointerEvents="none" />
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    escalating: {
        backgroundColor: 'rgba(255, 165, 0, 1)', // Orange tint
    },
    locked: {
        backgroundColor: 'rgba(0, 0, 0, 1)', // Blackout
    },
});
