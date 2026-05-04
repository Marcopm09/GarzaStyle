import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
<<<<<<< HEAD
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
=======
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
>>>>>>> main
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';

export function HelloWave() {
  const rotationAnimation = useSharedValue(0);

  useEffect(() => {
    rotationAnimation.value = withRepeat(
      withSequence(withTiming(25, { duration: 150 }), withTiming(0, { duration: 150 })),
      4 // Run the animation 4 times
    );
<<<<<<< HEAD
  }, []);
=======
  }, [rotationAnimation]);
>>>>>>> main

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnimation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
