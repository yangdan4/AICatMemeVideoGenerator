import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';

export default function BugReportScreen({ route, navigation }) {
  const [message, setMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { screenshotUri } = route.params;
  const { user } = useContext(AuthContext);

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
      const response = await fetch(`http://${serverHost}:${serverPort}/submit_bug_report`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSnackbarMessage('Bug report sent successfully!');
        setSnackbarVisible(true);
        navigation.goBack();
      } else {
        throw new Error('Failed to send bug report');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: screenshotUri }} style={styles.screenshot} />
      <TextInput
        label="Describe the issue"
        value={message}
        onChangeText={setMessage}
        multiline
        style={styles.input}
      />
      <Button mode="contained" onPress={sendBugReport} style={styles.button}>
        Send Bug Report
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