// AuthScreen.js
import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { AuthContext } from './AuthContext';

export default function AuthScreen() {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogin = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar('Email and password cannot be empty.');
      return;
    }
    
    auth().signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        setUser(userCredential.user);
        showSnackbar('Login successful!');
      })
      .catch(error => {
        showSnackbar(error.message);
      });
  };

  const handleSignUp = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar('Email and password cannot be empty.');
      return;
    }

    auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        setUser(userCredential.user);
        showSnackbar('Registration successful!');
      })
      .catch(error => {
        showSnackbar(error.message);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button mode="outlined" onPress={handleSignUp} style={styles.button}>
        Sign Up
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
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
});