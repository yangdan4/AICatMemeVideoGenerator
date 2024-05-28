import React, { useContext, useState } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform, UIManager, ImageBackground } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import catBackground from './cat_background.jpg';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { setUser } = useContext(AuthContext);
  const [language, setLanguage] = useState(i18n.language);
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to logout: ' + error.message);
    }
  };

  const handleLanguageChange = (value) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLanguage(value);
    i18n.changeLanguage(value);
    setExpanded(false);
  };

  const items = [
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
    { label: '简体中文', value: 'zh' },
    { label: '繁體中文', value: 'zh-TW' }
  ];

  const getLanguageLabel = (value) => {
    const item = items.find((item) => item.value === value);
    return item ? item.label : 'English';
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
    <View style={styles.container}>
      <List.Section>
        <List.Accordion
          title={`${t('language')}: ${getLanguageLabel(language)}`}
          left={() => <List.Icon icon="earth" />}
          expanded={expanded}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(!expanded);
          }}
          style={styles.accordionBanner} // Styling the clickable banner
        >
          {items.map((item) => (
            <List.Item
              key={item.value}
              title={item.label}
              onPress={() => handleLanguageChange(item.value)}
              style={styles.listItem} // Ensure expanded items are transparent
            />
          ))}
        </List.Accordion>
        <List.Item
          title={t('logout')}
          left={() => <List.Icon icon="logout" />}
          onPress={handleLogout}
          style={styles.listItem} // Apply consistent styling
        />
      </List.Section>
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  accordionBanner: {
    backgroundColor: '#f5f5f5'
  },
  listItem: {
    backgroundColor: 'transparent'
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});