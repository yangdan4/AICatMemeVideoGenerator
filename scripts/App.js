// App.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import AuthScreen from './AuthScreen';
import VideoScreen from './VideoScreen';
import { AuthProvider, AuthContext } from './AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { Button } from 'react-native-paper';
import VideoManagementScreen from './VideoManagementScreen';
import { VideoProvider } from './VideoContext';
import SettingsScreen from './SettingsScreen';
import apiKey from './firebase_key';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "aicatmemevideogenerator.firebaseapp.com",
  projectId: "aicatmemevideogenerator",
  storageBucket: "aicatmemevideogenerator.appspot.com",
  messagingSenderId: "23683689997",
  appId: "1:23683689997:web:f6fbc65eee13544b5d6f44",
  measurementId: "G-8WKEEXQFM9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'Video') {
          iconName = 'film';
        } else if (route.name === 'Manage') {
          iconName = 'file-video';
        } else if (route.name === 'Settings') {
          iconName = 'account-settings';
        }

        // You can return any component that you like here!
        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Video" component={VideoScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Manage" component={VideoManagementScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <VideoProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <>
            <Stack.Screen
              name="Home"
              component={HomeTabs}
              options={{ header: ({ navigation }) => <HeaderWithBugReport navigation={navigation} /> }}
            />
            <Stack.Screen
              name="BugReport"
              component={BugReportScreen}
              options={{ title: 'Bug Report' }}
            />
          </>
          ) : (
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </VideoProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}