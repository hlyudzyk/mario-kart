import {
  View,
  Button,
} from 'react-native';

type HomePageProps = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

export const HomePage = ({ navigation }: HomePageProps) => {
  return (
    <View>
      <Button
        title="Play game"
        onPress={() => navigation.navigate('Profile')}
      />
    </View>
  );
};
