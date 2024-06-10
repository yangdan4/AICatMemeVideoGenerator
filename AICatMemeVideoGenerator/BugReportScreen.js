import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, Alert, ImageBackground } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';
import catBackground from './cat_background.jpg';

export default function BugReportScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { screenshotUri } = route.params;
  const { user, setSentReport, sentReport, fetchWithToken } = useContext(AuthContext);

  const sendBugReport = async () => {
    const formData = new FormData();
    formData.append('username', user.email);
    formData.append('message', message);
    formData.append('screenshot', {
      uri: screenshotUri,
      name: 'screenshot.jpg',
      type: 'image/jpeg',
    });
  
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/submit_bug_report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      if (response.ok) {
        setSnackbarMessage(t('bugReportSent'));
        setSnackbarVisible(true);
        setSentReport(!sentReport);
        navigation.goBack();
      } else {
        throw new Error(t('failedToSendBugReport'));
      }
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Image source={{ uri: screenshotUri }} style={styles.screenshot} />
        <TextInput
          label={t('describeIssue')}
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.input}
        />
        <Button mode="contained" onPress={sendBugReport} style={styles.button}>
          {t('sendBugReport')}
        </Button>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_SHORT}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  screenshot: {
    flex: 1,
    width: '100%',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});