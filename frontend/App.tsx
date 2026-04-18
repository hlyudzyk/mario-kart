import { enableScreens } from 'react-native-screens'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

enableScreens()
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Profile" component={GamePage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

