import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { TextInput, Button, Snackbar, IconButton } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './AuthContext';
import DeviceInfo from 'react-native-device-info';
import { serverHost, serverPort } from './consts';
import { apiKey } from './frontend_secret_key';
import AsyncStorage from '@react-native-async-storage/async-storage';
import catBackground from './cat_background.jpg';
import logo from './logo.png'; // Import the logo image

export default function AuthScreen() {
  const { t } = useTranslation();
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    DeviceInfo.getUniqueId().then(id => {
      setDeviceId(id);
    });
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const saveToken = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (error) {
      console.error("Error saving token", error);
    }
  };

  const handleFirebaseError = (errorCode) => {
    return t(`firebaseErrors.${errorCode}`) || errorCode;
  };

  const handleLogin = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar(t('emailPasswordEmpty'));
      return;
    }

    auth().signInWithEmailAndPassword(email, password)
      .then(async userCredential => {
        setUser(userCredential.user);
        showSnackbar(t('loginSuccessful'));
        const response = await fetch(`http://${serverHost}:${serverPort}/get_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: email, device_id: deviceId, app_key: apiKey })
        });
        const data = await response.json();
        if (response.ok) {
          await saveToken(data.token);
        } else {
          showSnackbar('Failed to get token');
        }
      })
      .catch(error => {
        showSnackbar(handleFirebaseError(error.code));
      });
  };

  const handleSignUp = () => {
    if (email.trim() === '' || password.trim() === '') {
      showSnackbar(t('emailPasswordEmpty'));
      return;
    }

    auth().createUserWithEmailAndPassword(email, password)
      .then(async userCredential => {
        setUser(userCredential.user);
        showSnackbar(t('registrationSuccessful'));
        const response = await fetch(`http://${serverHost}:${serverPort}/get_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: email, device_id: deviceId, app_key: apiKey })
        });
        const data = await response.json();
        if (response.ok) {
          await saveToken(data.token);
        } else {
          showSnackbar('Failed to get token');
        }
      })
      .catch(error => {
        showSnackbar(handleFirebaseError(error.code));
      });
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} />
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    flex: 0,
    width: 150,
    height: 150,
    alignSelf: 'center',
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
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
});