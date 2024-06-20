import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {NavigationContainer} from "@react-navigation/native";
import logScreen from "../Rave/screen/logScreen";
import recordScreen from "../Rave/screen/recordScreen"
import manageTabScreen from "../Rave/screen/manageTabScreen"


export default function App() {

  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={'Home'}>

          <Stack.Screen name={"Home"} component={logScreen}>
          </Stack.Screen>

          <Stack.Screen name={"Record"} component={recordScreen}>
          </Stack.Screen>

          <Stack.Screen name={"ManageAudio"} component={manageTabScreen}>
          </Stack.Screen>



      </Stack.Navigator>
    </NavigationContainer>
  );

}
