import React, { useContext, useState, useEffect } from 'react';
import { View, StyleSheet, LayoutAnimation, Platform, UIManager, ImageBackground, Text, TouchableOpacity } from 'react-native';
import { Button, Snackbar, Card, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useStripe } from '@stripe/stripe-react-native';
import { AuthContext } from './AuthContext';
import auth from '@react-native-firebase/auth';
import { serverPort, serverHost } from './consts';
import catBackground from './cat_background.jpg';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function SettingsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { setUser, setSubscriptionId, setPlanType, setSubEndDate, planType, subEndDate, user, fetchWithToken } = useContext(AuthContext);
  const stripe = useStripe();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(null);


  const [isUpgradeMode, setIsUpgradeMode] = useState(false);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetchWithToken(`https://${serverHost}:${serverPort}/subscription-status?email=${user.email}`, {
          method: 'GET',
        });
        const data = await response.json();
        setSubscriptionId(data.subscriptionId);
        setPlanType(data.plan);
        setSubEndDate(data.subscriptionEndDate);
        setCancelAtPeriodEnd(data.cancelAtPeriodEnd);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    user && fetchSubscriptionStatus();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      setUser(null);
    } catch (error) {
      // console.error('Failed to logout: ' + error.message);
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
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/${isUpgradeMode ? 'upgrade-subscription' : 'create-subscription'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, plan: checkoutPlan, language: i18n.language }),
      });
  
      const { paymentIntent, ephemeralKey, customer, subscriptionId, plan, subscriptionEndDate, cancelAtPeriodEnd } = await response.json();
  
      const { error } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        merchantDisplayName: 'Clipurr',
        defaultBillingDetails: {
          address: {
            country: i18n.language,
          }
        }
      });
  
      if (!error) {
        const { error: paymentError } = await stripe.presentPaymentSheet();
  
        if (paymentError) {
          paymentError.code !== 'Canceled' && showSnackbar(`${t('error')}: ${getLocalizedErrorMessage(paymentError.code)}`);
          if (paymentError.code === 'Canceled' && isUpgradeMode) {
            setIsUpgradeMode(false); // Reset upgrade mode if payment is canceled
          }
        } else {
          showSnackbar(t('paymentSuccess'));
          if (isUpgradeMode) {
            setIsUpgradeMode(false); // Reset upgrade mode after successful payment
          } else {
            setSubscriptionId(subscriptionId);
            setPlanType(plan);
            setSubEndDate(subscriptionEndDate);
            setCancelAtPeriodEnd(cancelAtPeriodEnd);
          }
        }
      } else {
        showSnackbar(t('failedToInitialize'));
        if (isUpgradeMode) {
          setIsUpgradeMode(false); // Reset upgrade mode if initialization fails
        }
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      showSnackbar(t('failedToInitialize'));
      if (isUpgradeMode) {
        setIsUpgradeMode(false); // Reset upgrade mode if error occurs
      }
    }
  };



  const handleCancelSubscription = async () => {
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setCancelAtPeriodEnd(true);
        setSnackbarMessage(t('subscriptionCancelled'));
        showSnackbar(t('subscriptionCancelled'));
      } else {
        showSnackbar(result.error || t('failedToCancel'));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showSnackbar(t('failedToCancel'));
    }
  };

  const handleRenewSubscription = async () => {
    try {
      const response = await fetchWithToken(`https://${serverHost}:${serverPort}/renew-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setCancelAtPeriodEnd(false);
        setSnackbarMessage(t('subscriptionRenewed'));
        showSnackbar(t('subscriptionRenewed'));
      } else {
        showSnackbar(result.error || t('failedToRenew'));
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      showSnackbar(t('failedToRenew'));
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
                { subEndDate && ( planType === "monthly" ?

                <Text style={styles.subscriptionEndDate}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text> : 

                <Text style={[styles.subscriptionEndDate, {color: 'rgba(0,0,0,0)'}]}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text>
                )}
                {planType === "monthly" ? (
                  cancelAtPeriodEnd ? (
                    <Button
                      mode="outlined"
                      onPress={handleRenewSubscription}
                      style={styles.button}
                    >
                      {t('renew')}
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={handleCancelSubscription}
                      style={styles.button}
                    >
                      {t('cancel')}
                    </Button>
                  )
                ) : (
                  planType === null &&
                    <Button
                      mode="outlined"
                      style={styles.button}
                      onPress={() => {handleCheckout("monthly");}}
                    >
                      {t('subscribe')}
                    </Button>
                  
                )}
              </Card.Content>
            </Card>
            <Card style={[styles.card, planType === "yearly" && { borderWidth: 2, borderColor: 'rgb(103, 80, 164)' }]}>
              <Card.Title title={t('subscribeYearly')} />
              <Card.Content>
                <Text>{t('yearlyPlanDescription')}</Text>
                { subEndDate && ( planType === "yearly" ?

                <Text style={styles.subscriptionEndDate}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text> : 

                <Text style={[styles.subscriptionEndDate, {color: 'rgba(0,0,0,0)'}]}>{`${t('subscriptionEndDate')}: ${subEndDate}`}</Text>
                )}
                {planType === "yearly" ? (
                  cancelAtPeriodEnd ? (
                    <Button
                      mode="outlined"
                      onPress={handleRenewSubscription}
                      style={styles.button}
                    >
                      {t('renew')}
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={handleCancelSubscription}
                      style={styles.button}
                    >
                      {t('cancel')}
                    </Button>
                  )
                ) : (
                  planType === null &&
                    <Button
                      mode="outlined"
                      style={styles.button}
                      onPress={() => {handleCheckout("yearly");}}
                    >
                      {t('subscribe')}
                    </Button>
                  
                )}
              </Card.Content>
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
    padding: -10,
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