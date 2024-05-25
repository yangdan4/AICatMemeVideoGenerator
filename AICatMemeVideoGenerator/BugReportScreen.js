import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';
import { v4 as uuidv4 } from 'uuid';
import { fetchWithToken } from './api';

export default function BugReportScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { screenshotUri } = route.params;
  const { user } = useContext(AuthContext);

  const sendBugReport = async () => {
    const uniqueFilename = `${uuidv4()}.jpg`;

    const formData = new FormData();
    formData.append('username', user.email);
    formData.append('message', message);
    formData.append('screenshot', {
      uri: screenshotUri,
      name: uniqueFilename,
      type: 'image/jpeg',
    });

    try {
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/submit_bug_report`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSnackbarMessage(t('bugReportSent'));
        setSnackbarVisible(true);
        navigation.goBack();
      } else {
        throw new Error(t('failedToSendBugReport'));
      }
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  screenshot: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
});