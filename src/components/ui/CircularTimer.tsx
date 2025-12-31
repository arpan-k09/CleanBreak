import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withLinear } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
    radius: number;
    strokeWidth: number;
    duration: number; // Total duration in seconds
    elapsed: number; // Elapsed time in seconds
    color: string;
}

export const CircularTimer = ({ radius, strokeWidth, duration, elapsed, color }: Props) => {
    const innerRadius = radius - strokeWidth / 2;
    const circumference = 2 * Math.PI * innerRadius;

    const progress = useSharedValue(0);

    useEffect(() => {
        // Calculate progress (0 to 1) based on elapsed/duration
        // If elapsed is 0, progress is 0 (full circle visible if dashoffset=0? No, we want it to deplete)
        // Actually, usually a timer depletes. So at start (elapsed=0), dashoffset should be 0 (full length).
        // At end (elapsed=duration), dashoffset should be circumference (empty).

        // progress value 0 -> Full Circle
        // progress value 1 -> Empty Circle

        // We want smooth animation. The simple way is to set value based on prop.
        // Ideally, the parent drives 'elapsed' via a tick (e.g. every second). 
        // We can animate to the new position.

        const newProgress = Math.min(Math.max(elapsed / duration, 0), 1);
        progress.value = withTiming(newProgress, {
            duration: 1000,
            easing: Easing.linear
        });
    }, [elapsed, duration]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * progress.value,
        };
    });

    return (
        <View style={{ width: radius * 2, height: radius * 2, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={radius * 2} height={radius * 2}>
                {/* Background Circle */}
                <Circle
                    cx={radius}
                    cy={radius}
                    r={innerRadius}
                    stroke="#E0E0E0"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Foreground Circle */}
                <AnimatedCircle
                    cx={radius}
                    cy={radius}
                    r={innerRadius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${radius}, ${radius}`}
                />
            </Svg>
        </View>
    );
};
