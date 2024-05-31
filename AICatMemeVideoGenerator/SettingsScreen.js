import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform, UIManager, ImageBackground, Text, TouchableOpacity } from 'react-native';
import { Button, Snackbar, Card, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useStripe } from '@stripe/stripe-react-native';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import { serverPort, serverHost } from './consts';
import { fetchWithToken } from './api';
import catBackground from './cat_background.jpg';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { setUser, setSubscriptionId, setPlanType, setSubEndDate, planType, subEndDate, user } = useContext(AuthContext);
  const stripe = useStripe();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to logout: ' + error.message);
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const getLocalizedErrorMessage = (errorCode) => {
    return t(`stripeError.${errorCode}`, { defaultValue: t('stripeError.payment_failed') });
  };

  const handleCheckout = async (checkoutPlan) => {
    showSnackbar(t('waitMessage'));
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, plan: checkoutPlan, language: i18n.language }),
      });

      const { paymentIntent, ephemeralKey, customer, subscriptionId, plan, subscriptionEndDate } = await response.json();

      const { error } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'Clipurr',
        defaultBillingDetails: {
          address: {
            country: i18n.language, // Use the current language as the country code if applicable
          }
        }
      });

      if (!error) {
        const { error: paymentError } = await stripe.presentPaymentSheet();

        if (paymentError) {
          paymentError.code !== 'Canceled' && showSnackbar(`${t('error')}: ${getLocalizedErrorMessage(paymentError.code)}`);
        } else {
          setSubscriptionId(subscriptionId);
          setPlanType(plan);
          setSubEndDate(subscriptionEndDate);
          showSnackbar(t('paymentSuccess'));
        }
      } else {
        showSnackbar(t('failedToInitialize'));
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      showSnackbar(t('failedToInitialize'));
    }
  };

  return (
    <ImageBackground source={catBackground} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TouchableOpacity
          disabled
          style={styles.accordionBanner}
        >
          <List.Icon icon="credit-card" />
          <Text style={styles.accordionTitle}>{t('subscription')}</Text>
        </TouchableOpacity>
        <View style={styles.paymentContainer}>
          <View style={styles.cardContainer}>
            <Card style={[styles.card, planType === "monthly" && { borderWidth: 2, borderColor: 'rgb(103, 80, 164)' }]}>
              <Card.Title title={t('subscribeMonthly')} />
              <Card.Content>
                <Text>{t('monthlyPlanDescription')}</Text>
                {planType === "monthly" && subEndDate && (
                  <Text style={styles.subscriptionEndDate}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() => handleCheckout('monthly')}
                  style={styles.button}
                >
                  {t('subscribe')}
                </Button>
              </Card.Actions>
            </Card>
            <Card style={[styles.card, planType === "yearly" && { borderWidth: 2, borderColor: 'rgb(103, 80, 164)' }]}>
              <Card.Title title={t('subscribeYearly')} />
              <Card.Content>
                <Text>{t('yearlyPlanDescription')}</Text>
                {planType === "yearly" && subEndDate && (
                  <Text style={styles.subscriptionEndDate}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button
                  onPress={() => handleCheckout('yearly')}
                  style={styles.button}
                >
                  {t('subscribe')}
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <List.Icon icon="logout" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        {snackbarMessage}
      </Snackbar>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  accordionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'stretch',
    justifyContent: 'center',
  },
  paymentContainer: {
    padding: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    margin: 8,
  },
  button: {
    marginTop: 16,
  },
  subscriptionEndDate: {
    marginTop: 8,
    color: 'rgb(103, 80, 164)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 18,
    marginLeft: 8,
  },
});