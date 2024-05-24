// SettingsScreen.js
import React, { useContext } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';

export default function SettingsScreen({ navigation }) {
  const { setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      navigation.navigate('VideoScreen');
    } catch (error) {
      console.error('Failed to logout: ' + error.message);
    }
  };

  const settingsOptions = [
    {
      title: 'Logout',
      icon: 'logout',
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList style={styles.list}
        data={settingsOptions}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <>
            <List.Item
              title={item.title}
              left={() => <List.Icon icon={item.icon} />}
              onPress={item.onPress}
            />
            <Divider />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
});