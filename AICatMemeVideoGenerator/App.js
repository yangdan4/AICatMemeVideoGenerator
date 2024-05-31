import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, Text } from 'react-native-paper';

import { StripeProvider } from '@stripe/stripe-react-native';
import AuthScreen from './AuthScreen';
import { useTranslation } from 'react-i18next';
import { AuthProvider, AuthContext } from './AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { initializeApp } from 'firebase/app';
import VideoManagementScreen from './VideoManagementScreen';
import { VideoProvider } from './VideoContext';
import SettingsScreen from './SettingsScreen';
import { apiKey } from './firebase_key';
import { apiKey as stripeKey } from './stripe_key';
import BugReportScreen from './BugReportScreen';
import HeaderWithBugReport from './HeaderWithBugReport';
import SupportTicketsScreen from './SupportTicketsScreen';
import AdminSupportTicketsScreen from './AdminSupportTicketsScreen';
import TicketDetailsScreen from './TicketDetailsScreen';
import AdminTicketDetailScreen from './AdminTicketDetailScreen';
import ScriptScreen from './ScriptScreen';
import VideoEditor from './VideoEditor';
import PaymentScreen from './PaymentScreen.js';
import SuccessScreen from './SuccessScreen'; // Import SuccessScreen
import CancelScreen from './CancelScreen'; // Import CancelScreen
import './i18n.js'; // Make sure to import the i18n configuration

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
          } else if (route.name === 'VideoEditor') {
            iconName = 'video';
          } else if (route.name === 'Payment') {
            iconName = 'credit-card';
          }

          return <Icon name={iconName} size={size} color={"rgb(103, 80, 164)"} />;
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
          } else if (route.name === 'VideoEditor') {
            label = t('videoEditor');
          } else if (route.name === 'Payment') {
            label = t('payment');
          }

          return <Text style={{ color: "rgb(103, 80, 164)", fontSize: 10 }}>{label}</Text>;
        },
        tabBarStyle: { backgroundColor: '#f5f5f5' }
      })}
    >
      <Tab.Screen name="ScriptEditor" component={ScriptScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Manage" component={VideoManagementScreen} options={{ headerShown: false }} />
      <Tab.Screen name="SupportTickets" component={SupportTicketsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const AdminTabs = () => {
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
          } else if (route.name === 'VideoEditor') {
            iconName = 'video';
          }

          return <Icon name={iconName} size={size} color={"rgb(103, 80, 164)"} />;
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
          } else if (route.name === 'VideoEditor') {
            label = t('videoEditor');
          }

          return <Text style={{ color: "rgb(103, 80, 164)", fontSize: 10 }}>{label}</Text>;
        },
        tabBarStyle: { backgroundColor: '#f5f5f5' }
      })}
    >
      <Tab.Screen name="SupportTickets" component={AdminSupportTicketsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const linking = {
  prefixes: ['Clipurr://'], // Replace with your actual URL scheme
  config: {
    screens: {
      Success: 'success',
      Cancel: 'cancel',
    },
  },
};

const AppNavigator = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const { t } = useTranslation();

  return (
    <VideoProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator>
          {user ? (
            isAdmin ? (
              <>
                <Stack.Screen
                  name="AdminHome"
                  component={AdminTabs}
                  options={{ header: ({ navigation }) => <HeaderWithBugReport navigation={navigation} /> }}
                />
                <Stack.Screen
                  name="AdminTicketDetail"
                  component={AdminTicketDetailScreen}
                  options={{ title: t('ticketDetail') }}
                />
              </>
            ) : (
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
                  component={TicketDetailsScreen}
                  options={{ title: t('ticketDetail') }}
                />
                <Stack.Screen
                  name="VideoEditor"
                  component={VideoEditor}
                  options={{ title: t('videoEditor') }}
                />
              </>
            )
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
    <StripeProvider
      publishableKey={stripeKey}
    >
      <AuthProvider>
        <PaperProvider>
          <AppNavigator />
        </PaperProvider>
      </AuthProvider>
    </StripeProvider>
  );
}