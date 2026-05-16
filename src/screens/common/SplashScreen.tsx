import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';

type SplashScreenProps = {
  onFinish?: () => void;
};

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width, height } = useWindowDimensions();
  const circleSize = Math.sqrt(width * width + height * height);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 1 }
    );
    pulse.start();

    const expandTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onFinish?.();
        }
      });
    }, 1500);

    return () => {
      pulse.stop();
      clearTimeout(expandTimer);
    };
  }, [logoOpacity, logoScale, onFinish, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animationWrap,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            left: (width - circleSize) / 2,
            top: (height - circleSize) / 2,
          },
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logo,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <Text style={styles.title}>P</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1321',
  },

  animationWrap: {
    position: 'absolute',
    backgroundColor: '#F6F1E9',
  },

  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F6F1E9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  title: {
    color: 'black',
    fontSize: 90,
    fontWeight: '800',
  },
});