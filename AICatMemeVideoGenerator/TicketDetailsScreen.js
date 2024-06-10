import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, FlatList, StyleSheet, Image, Alert, RefreshControl, ImageBackground } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';
import catBackground from './cat_background.jpg';

export default function TicketDetailScreen({ route }) {
  const { t } = useTranslation();
  const { ticket } = route.params;
  const { user, fetchWithToken } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/get_ticket_messages?ticket_id=${ticket.ticket_id}`);
      const data = await response.json();

      if (response.ok) {
        const sortedMessages = data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(sortedMessages);
        setScreenshotUrl(data.screenshot_url);
      } else {
        setSnackbarMessage(data.error || t('failedToFetchMessages'));
        setSnackbarVisible(true);
      }
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  }, [ticket.ticket_id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!message.trim()) {
      return;
    }

    const formData = new FormData();
    formData.append('ticket_id', ticket.ticket_id);
    formData.append('username', user.email);
    formData.append('message', message);

    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/add_message`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const newMessage = { sender: user.email === 'dannielyang1996@gmail.com' ? t('admin') : user.email, message, timestamp: new Date().toISOString() };
        setMessages(prevMessages => [...prevMessages, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setMessage('');
        setSnackbarMessage(t('messageSent'));
      } else {
        setSnackbarMessage(data.error || t('failedToSendMessage'));
      }
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages().finally(() => setRefreshing(false));
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={styles.chatMessage}>
            <Text>{item.sender}: {item.message}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.ticketId}>{t('ticketId')}: {ticket.ticket_id}</Text>
              <Text style={styles.message}>{ticket.message}</Text>
              {screenshotUrl ? <Image source={{ uri: screenshotUrl }} style={styles.screenshot} /> : null}
            </Card.Content>
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.contentContainer}
      />
      <View style={styles.footer}>
        <TextInput
          label={t('yourMessage')}
          value={message}
          onChangeText={setMessage}
          style={styles.input}
        />
        <Button mode="contained" onPress={sendMessage} style={styles.button}>
          {t('send')}
        </Button>
      </View>
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
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  ticketId: {
    fontSize: 14, // Adjust the size to make it smaller
    marginBottom: 8,
  },
  message: {
    marginBottom: 8,
  },
  screenshot: {
    width: '65%',
    height: 400,
    marginBottom: 16,
  },
  chatMessage: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  footer: {
    marginTop: 16,
    padding: 16
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});