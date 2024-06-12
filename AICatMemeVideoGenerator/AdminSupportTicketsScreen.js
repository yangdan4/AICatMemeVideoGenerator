import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, Card, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';
import catBackground from './cat_background_new.png';

export default function AdminSupportTicketsScreen({ navigation }) {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { sentReport, fetchWithToken, user } = useContext(AuthContext);

  useEffect(() => {
    fetchTickets();
  }, [sentReport, user]);

  const fetchTickets = async () => {
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/get_all_support_tickets`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets);
      } else {
        throw new Error(data.error || t('failedToFetchTickets'));
      }
    } catch (error) {
      setSnackbarMessage(error.message);
      setSnackbarVisible(true);
    }
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
      <View style={styles.container}>
        <FlatList
          data={tickets}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('AdminTicketDetail', { ticket: item })}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.ticketId}>{t('ticketId')}: {item.ticket_id}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text>{t('status')}: {t(item.status)}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
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
  card: {
    marginBottom: 16,
  },
  ticketId: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    marginBottom: 8,
  },

  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});