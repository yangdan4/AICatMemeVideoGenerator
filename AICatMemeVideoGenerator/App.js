import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, Text } from 'react-native-paper';
import AuthScreen from './AuthScreen';
import { useTranslation } from 'react-i18next';
import i18n from './i18n'; // Import the i18n configuration
import { AuthProvider, AuthContext } from './AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { Button } from 'react-native-paper';
import VideoManagementScreen from './VideoManagementScreen';
import { VideoProvider } from './VideoContext';
import SettingsScreen from './SettingsScreen';
import {apiKey} from './firebase_key';
import BugReportScreen from './BugReportScreen';
import HeaderWithBugReport from './HeaderWithBugReport';
import SupportTicketsScreen from './SupportTicketsScreen';
import TicketDetailScreen from './TicketDetailsScreen';
import ScriptScreen from './ScriptScreen';

// Your web app's Firebase configuration
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
const HomeTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Manage') {
            iconName = 'file-video';
          } else if (route.name === 'Settings') {
            iconName = 'account-settings';
          } else if (route.name === 'SupportTickets') {
            iconName = 'message';
          } else if (route.name === 'ScriptEditor') {
            iconName = 'script';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          let label;

          if (route.name === 'Manage') {
            label = t('manage');
          } else if (route.name === 'Settings') {
            label = t('settings');
          } else if (route.name === 'SupportTickets') {
            label = t('supportTickets');
          } else if (route.name === 'ScriptEditor') {
            label = t('script');
          }

          return <Text style={{ color, fontSize: 10 }}>{label}</Text>;
        },
        tabBarStyle: {backgroundColor: '#f5f5f5'}
      })}
    >
      <Tab.Screen name="ScriptEditor" component={ScriptScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Manage" component={VideoManagementScreen} options={{ headerShown: false }} />
      <Tab.Screen name="SupportTickets" component={SupportTicketsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

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
                options={{ title: t('bugReport') }}
              />
              <Stack.Screen
                name="TicketDetail"
                component={TicketDetailScreen}
                options={{ title: t('ticketDetail') }}
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