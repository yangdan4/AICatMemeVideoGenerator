import React, { useContext, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Divider, Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import DropDownPicker from 'react-native-dropdown-picker';

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { setUser } = useContext(AuthContext);
  const [language, setLanguage] = useState(i18n.language);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
    { label: '中文', value: 'zh' },
  ]);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      navigation.navigate('VideoScreen');
    } catch (error) {
      console.error('Failed to logout: ' + error.message);
    }
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    i18n.changeLanguage(value);
  };

  const settingsOptions = [
    {
      title: t('logout'),
      icon: 'logout',
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <DropDownPicker
        open={open}
        value={language}
        items={items}
        setOpen={setOpen}
        setValue={setLanguage}
        setItems={setItems}
        onChangeValue={handleLanguageChange}
        style={styles.dropdown}
      />
      <FlatList
        style={styles.list}
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
  dropdown: {
    margin: 16,
    zIndex: 1000, // Ensure the dropdown is on top
  },
});