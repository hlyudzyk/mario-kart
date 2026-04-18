import {
  View,
  Button,
} from "react-native";

export const HomePage = ({ navigation }) => {
    return (
        <View>
            <Button
                title="Play game"
                onPress={() => navigation.navigate("Profile")}
            />
        </View>
    );
}