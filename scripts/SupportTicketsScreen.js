import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Snackbar } from 'react-native-paper';
import { AuthContext } from './AuthContext';
import { serverHost, serverPort } from './consts';

export default function SupportTicketsScreen() {
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
        throw new Error(data.error || 'Failed to fetch support tickets');
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
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.ticketId}>Ticket ID: {item.ticket_id}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text>Status: {item.status}</Text>
              <FlatList
                data={item.chat}
                renderItem={({ item }) => (
                  <View style={styles.chatMessage}>
                    <Text>{item.sender}: {item.message}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </Card.Content>
          </Card>
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
  chatMessage: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 4,
  },
});