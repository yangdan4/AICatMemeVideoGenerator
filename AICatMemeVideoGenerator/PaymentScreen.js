import React, { useState, useContext } from 'react';
import { View, StyleSheet, ImageBackground, Text } from 'react-native';
import { Button, Snackbar, Card } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import { serverPort, serverHost } from './consts';
import { fetchWithToken } from './api';
import { AuthContext } from './AuthContext';
import { useTranslation } from 'react-i18next';

import catBackground from './cat_background.jpg';

export default function PaymentScreen() {
    const { setSubscriptionId, user } = useContext(AuthContext);
    const stripe = useStripe();
    const { t } = useTranslation();
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    const handleCheckout = async (plan) => {
        showSnackbar(t('waitMessage'));
        try {
            const response = await fetchWithToken(`https://${serverHost}:${serverPort}/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email, plan: plan }),
            });

            const { paymentIntent, ephemeralKey, customer, subscriptionId } = await response.json();

            const { error } = await stripe.initPaymentSheet({
                paymentIntentClientSecret: paymentIntent,
                customerEphemeralKeySecret: ephemeralKey,
                customerId: customer,
                merchantDisplayName: 'Clipurr',
            });

            if (!error) {
                const { error: paymentError } = await stripe.presentPaymentSheet();

                if (paymentError) {
                    showSnackbar(`${t('error')}: ${paymentError.message}`);
                } else {
                    setSubscriptionId(subscriptionId);
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
                <Text style={styles.title}>{t('chooseYourPlan')}</Text>
                <View style={styles.cardContainer}>
                    <Card style={styles.card}>
                        <Card.Title title={t('subscribeMonthly')} />
                        <Card.Content>
                            <Text>{t('monthlyPlanDescription')}</Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="contained"
                                onPress={() => handleCheckout('monthly')}
                                style={styles.button}
                            >
                                {t('subscribe')}
                            </Button>
                        </Card.Actions>
                    </Card>
                    <Card style={styles.card}>
                        <Card.Title title={t('subscribeYearly')} />
                        <Card.Content>
                            <Text>{t('yearlyPlanDescription')}</Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="contained"
                                onPress={() => handleCheckout('yearly')}
                                style={styles.button}
                            >
                                {t('subscribe')}
                            </Button>
                        </Card.Actions>
                    </Card>
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
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    cardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    card: {
        width: '45%',
    },
    button: {
        marginTop: 16,
    },

    backgroundImage: {
      flex: 1,
      resizeMode: 'stretch',
      justifyContent: 'center',
    },
});