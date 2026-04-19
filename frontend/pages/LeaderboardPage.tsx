import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LeaderboardPageProps = {
  navigation?: {
    goBack?: () => void;
    navigate?: (screen: string) => void;
  };
};

const TOP_RESULTS = [
  { rank: 1, name: 'Janez Janša', score: 99, track: 'RAINBOW ROAD' },
  { rank: 2, name: 'Challe Salle', score: 46, track: 'KOOPA BEACH' },
  { rank: 3, name: 'Denis Avdić', score: 37, track: 'ROYAL CIRCUIT' },
  { rank: 4, name: 'Damjan Murko', score: 35, track: 'MUSHROOM CUP' },
  { rank: 5, name: 'Karl Erjavec', score: 32, track: 'YOSHI VALLEY' },
  { rank: 6, name: 'Helena Blagne', score: 22, track: 'BOWSER CASTLE' },
  { rank: 7, name: 'Cimerotić', score: 18, track: 'JUNGLE PARKWAY' },
  { rank: 8, name: 'Robert Golob', score: 17, track: 'WARIO STADIUM' },
  { rank: 9, name: 'Magnifico', score: 16, track: 'SHERBET LAND' },
  { rank: 10, name: 'Zlatko Zahovič', score: 15, track: 'PEACH GARDENS' },
] as const;

const pixelFont = Platform.select({
  ios: 'Courier-Bold',
  android: 'monospace',
  default: 'monospace',
});
const COIN_ASSET = require('../assets/coin.png');

export const LeaderboardPage = ({ navigation }: LeaderboardPageProps) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden />

      <Pressable
        accessibilityRole="button"
        testID="leaderboard-back-button"
        onPress={() => {
          if (navigation?.goBack) {
            navigation.goBack();
            return;
          }

          navigation?.navigate?.('Home');
        }}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
      >
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image source={COIN_ASSET} style={styles.titleCoin} resizeMode="contain" />
          <Text style={styles.title}>TOP 10</Text>
          <Image source={COIN_ASSET} style={styles.titleCoin} resizeMode="contain" />
        </View>
        <Text style={styles.subtitle}>PIXEL CUP LEADERBOARD</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.boardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.board}>
          {TOP_RESULTS.map(entry => (
            <View
              key={entry.rank}
              style={[
                styles.row,
                entry.rank <= 3 ? styles.rowTopThree : undefined,
              ]}
            >
              <Text style={styles.rank}>{String(entry.rank).padStart(2, '0')}</Text>
              <View style={styles.nameBlock}>
                <Text style={styles.name}>{entry.name}</Text>
                <Text style={styles.track}>{entry.track}</Text>
              </View>
              <Text style={styles.score}>{entry.score}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2355',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 18,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ translateY: 2 }],
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  title: {
    color: '#ffd94f',
    fontSize: 38,
    lineHeight: 42,
    fontFamily: pixelFont,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: '#c33c1b',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  titleCoin: {
    width: 34,
    height: 34,
    marginTop: 4,
  },
  subtitle: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 18,
    fontFamily: pixelFont,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  boardContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  board: {
    backgroundColor: '#1f3b7a',
    borderWidth: 4,
    borderColor: '#ffffff',
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#2f54a3',
    borderWidth: 2,
    borderColor: '#89b7ff',
    marginBottom: 8,
  },
  rowTopThree: {
    backgroundColor: '#3d247a',
    borderColor: '#ffd94f',
  },
  rank: {
    width: 40,
    color: '#ffd94f',
    fontSize: 20,
    fontFamily: pixelFont,
    fontWeight: '900',
  },
  nameBlock: {
    flex: 1,
    paddingHorizontal: 8,
  },
  name: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 24,
    fontFamily: pixelFont,
    fontWeight: '900',
    letterSpacing: 1,
  },
  track: {
    marginTop: 4,
    color: '#c8ddff',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: pixelFont,
    fontWeight: '700',
    letterSpacing: 1,
  },
  score: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: pixelFont,
    fontWeight: '900',
    minWidth: 72,
    textAlign: 'right',
  },
});
