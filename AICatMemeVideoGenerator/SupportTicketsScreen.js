import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';

export default function SupportTicketsScreen({ navigation }) {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`http://${serverHost}:${serverPort}/get_support_tickets?username=${user.email}`);
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
    <View style={styles.container}>
      <FlatList
        data={tickets}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TicketDetail', { ticket: item })}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
});