import React, { useState, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Snackbar } from 'react-native-paper';
import Video from 'react-native-video';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { VideoContext } from './VideoContext';
import auth from '@react-native-firebase/auth';
import RNFetchBlob from 'rn-fetch-blob';
import { serverHost, serverPort } from './consts';
import { fetchWithToken } from './api';

export default function VideoScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [videos, setVideos] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { setUser } = useContext(AuthContext);
  const { addVideo } = useContext(VideoContext);

  const getLanguage = () => {
    const language = i18n.language;
    switch (language) {
      case 'zh':
        return 'Simplified Chinese';
      case 'zh-TW':
        return 'Traditional Chinese';
      case 'ja':
        return 'Japanese';
      case 'en':
      default:
        return 'English';
    }
  };

  const sendVideoPrompt = async () => {
    setIsSending(true);
    try {
      const language = getLanguage();
      const response = await fetchWithToken(`http://${serverHost}:${serverPort}/create_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input, language: language }),
      });

      if (!response.ok) {
        throw new Error(t('errorGeneratingVideo'));
      }

      const videoPath = await saveVideoBlob(response);

      setVideos([{ text: input, videoUrl: videoPath }]);
      setInput('');
      addVideo(videoPath);
    } catch (error) {
      console.error("Error in sendVideoPrompt:", error);
      setSnackbarMessage(error.message);
      setSnackbarVisible(true);
    } finally {
      setIsSending(false);
    }
  };

  const saveVideoBlob = async (response) => {
    const { fs } = RNFetchBlob;
    const videoDir = fs.dirs.DocumentDir;
    const filePath = `${videoDir}/${input}.mp4`;

    return new Promise((resolve, reject) => {
      response.blob().then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]; // Extract base64 data
          RNFetchBlob.fs.writeFile(filePath, base64data, 'base64')
            .then(() => resolve(filePath)) // Return the file path
            .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }).catch(reject);
    });
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setSnackbarMessage(t('logoutSuccessful'));
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage(t('failedToLogout', { error: error.message }));
      setSnackbarVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.messageText}>{item.text}</Text>
              {item.videoUrl && (
                <Video
                  source={{ uri: `file://${item.videoUrl}` }}
                  style={styles.video}
                  controls={true}
                  paused={true} // Prevents auto-play
                />
              )}
            </Card.Content>
          </Card>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <TextInput
        label={t('enterVideoPrompt')}
        value={input}
        onChangeText={setInput}
        style={styles.input}
        mode="outlined"
      />
      <Button mode="contained" onPress={sendVideoPrompt} style={styles.button} disabled={isSending}>
        {t('send')}
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
    backgroundColor: '#f5f5f5'
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 20,
  },
  card: {
    marginBottom: 16,
  },
  messageText: {
    fontSize: 16,
  },
  video: {
    width: '100%',
    height: 200,
    marginTop: 8,
  },
});