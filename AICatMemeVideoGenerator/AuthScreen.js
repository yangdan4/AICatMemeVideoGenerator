import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar, IconButton } from 'react-native-paper';
import { Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleLogin = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar(t('emailPasswordEmpty'));
      return;
    }

    auth().signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        setUser(userCredential.user);
        showSnackbar(t('loginSuccessful'));
      })
      .catch(error => {
        showSnackbar(error.message);
      });
  };

  const handleSignUp = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar(t('emailPasswordEmpty'));
      return;
    }

    auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        setUser(userCredential.user);
        showSnackbar(t('registrationSuccessful'));
      })
      .catch(error => {
        showSnackbar(error.message);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={t('email')}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          style={styles.passwordInput}
          mode="outlined"
        />
        <IconButton
          icon={passwordVisible ? "eye-off" : "eye"}
          onPress={() => setPasswordVisible(!passwordVisible)}
          style={styles.eyeIcon}
        />
      </View>
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        {t('login')}
      </Button>
      <Button mode="outlined" onPress={handleSignUp} style={styles.button}>
        {t('signUp')}
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
    backgroundColor: '#f5f5f5',
  },
  input: {
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    marginLeft: -40,
  },
  button: {
    marginBottom: 8,
  },
});