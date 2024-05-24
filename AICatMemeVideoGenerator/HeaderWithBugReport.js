import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureScreen } from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';

export default function HeaderWithBugReport({ navigation }) {
  const { t } = useTranslation();

  const handleBugReport = async () => {
    const uri = await captureScreen({
      format: 'jpg',
      quality: 0.8,
    });

    navigation.navigate('BugReport', { screenshotUri: uri });
  };

  return (
    <Appbar.Header style={styles.header}>
      <Appbar.Content style={styles.content} />
      <TouchableOpacity 
          onPress={handleBugReport}
          style={{flexDirection: 'row'}}>
        <Text style={{color: 'grey', fontSize: 12, marginTop: 6}}>{t('reportBug')}</Text>
        <Icon
          name="bug"
          size={24}
          color="white"
          style={styles.icon}
        />
      </TouchableOpacity>
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 40, // Adjusted height for thinner header
    backgroundColor: 'transparent'
  },
  content: {
    flex: 1,
  },
  icon: {
    marginTop: 5,
    marginRight: 5,
    color: 'grey'
  },
});