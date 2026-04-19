import React, { useEffect, useRef } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Sound from 'react-native-sound';

type HomePageProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

const HOME_THEME_ASSET = require('../assets/sounds/mariobros-theme.mp3');
const HOME_THEME_VOLUME = 0.55;

export const HomePage = ({ navigation }: HomePageProps) => {
  const { width, height } = useWindowDimensions();
  const themeSoundRef = useRef<Sound | null>(null);
  const buttonWidth = Math.min(width - 48, 320);
  const cloudOffset = Math.max(18, width * 0.08);
  const hillWidth = Math.min(220, width * 0.42);
  const hillHeight = Math.min(140, height * 0.16);

  const stopThemeSound = () => {
    const currentThemeSound = themeSoundRef.current;
    themeSoundRef.current = null;
    currentThemeSound?.stop();
    currentThemeSound?.release();
  };

  useEffect(() => {
    Sound.setCategory('Playback');
    const homeThemeUri = Image.resolveAssetSource(HOME_THEME_ASSET)?.uri;

    if (!homeThemeUri) {
      console.warn('Failed to resolve home theme asset');
      return;
    }

    let isMounted = true;
    const themeSound = new Sound(homeThemeUri, error => {
      if (error) {
        console.warn('Failed to load home theme', error);
        return;
      }

      setTimeout(() => {
        if (!isMounted) {
          themeSound.release();
          return;
        }

        themeSound.setVolume(HOME_THEME_VOLUME);
        themeSound.setNumberOfLoops(-1);
        themeSound.play(success => {
          if (!success) {
            console.warn('Home theme playback ended unexpectedly');
          }
        });
      }, 0);
    });

    themeSoundRef.current = themeSound;

    return () => {
      isMounted = false;
      stopThemeSound();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden />

      <View style={[styles.cloud, { top: 96, left: cloudOffset }]}>
        <View style={[styles.cloudPuff, styles.cloudPuffLeft]} />
        <View style={[styles.cloudPuff, styles.cloudPuffCenter]} />
        <View style={[styles.cloudPuff, styles.cloudPuffRight]} />
      </View>

      <View style={[styles.cloud, { top: 172, right: cloudOffset }]}>
        <View style={[styles.cloudPuff, styles.cloudPuffLeft]} />
        <View style={[styles.cloudPuff, styles.cloudPuffCenter]} />
        <View style={[styles.cloudPuff, styles.cloudPuffRight]} />
      </View>

      <View style={styles.skyline}>
        <View style={[styles.hill, { width: hillWidth, height: hillHeight }]} />
        <View
          style={[
            styles.hill,
            styles.hillTall,
            { width: hillWidth * 0.88, height: hillHeight * 1.2 },
          ]}
        />
      </View>

      <View style={styles.centerContent}>
        <View style={styles.titleCard}>
          <Text style={styles.title}>MARIO KART</Text>
          <Text style={styles.subtitle}>PIXEL CUP</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          testID="start-button"
          onPress={() => {
            stopThemeSound();
            navigation.navigate('Game');
          }}
          style={({ pressed }) => [
            styles.button,
            { width: buttonWidth },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>START</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          testID="leaderboard-button"
          onPress={() => navigation.navigate('Leaderboard')}
          style={({ pressed }) => [
            styles.secondaryLink,
            pressed && styles.secondaryLinkPressed,
          ]}
        >
          <Text style={styles.secondaryLinkText}>LEADERBOARD</Text>
        </Pressable>
      </View>

      <View style={styles.groundStrip}>
        <View style={styles.grassTop} />
        <View style={styles.brickRow}>
          <View style={styles.brick} />
          <View style={[styles.brick, styles.questionBrick]} />
          <View style={styles.brick} />
          <View style={styles.brick} />
        </View>
      </View>
    </View>
  );
};

const pixelFont = Platform.select({
  ios: 'Courier-Bold',
  android: 'monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5ec8ff',
    overflow: 'hidden',
  },
  cloud: {
    position: 'absolute',
    width: 108,
    height: 48,
  },
  cloudPuff: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderColor: '#d6f0ff',
    borderWidth: 4,
  },
  cloudPuffLeft: {
    left: 0,
    bottom: 0,
    width: 38,
    height: 26,
  },
  cloudPuffCenter: {
    left: 26,
    top: 0,
    width: 46,
    height: 34,
  },
  cloudPuffRight: {
    right: 0,
    bottom: 0,
    width: 34,
    height: 24,
  },
  skyline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 108,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  hill: {
    backgroundColor: '#6fcf59',
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    borderWidth: 5,
    borderColor: '#3f9f3a',
    borderBottomWidth: 0,
  },
  hillTall: {
    alignSelf: 'flex-end',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  titleCard: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    color: '#ffeb63',
    fontFamily: pixelFont,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#be2d16',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 22,
    color: '#ffffff',
    fontFamily: pixelFont,
    fontWeight: '700',
    letterSpacing: 4,
    textShadowColor: '#1750a6',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 106,
    paddingHorizontal: 20,
    backgroundColor: '#df2b1f',
    borderWidth: 6,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 0,
    elevation: 10,
  },
  buttonPressed: {
    transform: [{ translateY: 4 }],
    shadowOpacity: 0.12,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 38,
    lineHeight: 42,
    fontFamily: pixelFont,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#8b1007',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  secondaryLink: {
    marginTop: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secondaryLinkPressed: {
    opacity: 0.72,
  },
  secondaryLinkText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: pixelFont,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: '#1750a6',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  groundStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: '#ad662f',
    borderTopWidth: 6,
    borderTopColor: '#ffffff',
  },
  grassTop: {
    height: 22,
    backgroundColor: '#42b935',
    borderBottomWidth: 4,
    borderBottomColor: '#2c8926',
  },
  brickRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  brick: {
    width: 42,
    height: 42,
    backgroundColor: '#c77434',
    borderWidth: 4,
    borderColor: '#7c3c13',
  },
  questionBrick: {
    backgroundColor: '#f8c63d',
    borderColor: '#a35d00',
  },
});
