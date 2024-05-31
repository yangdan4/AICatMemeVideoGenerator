import React, { createContext, useRef, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { serverPort, serverHost } from './consts';
import { fetchWithToken } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import io from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sentReport, setSentReport] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState(null);
    const [planType, setPlanType] = useState(null);
    const [subEndDate, setSubEndDate] = useState(null);

    //const socket = useRef(null);
    

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(setUser);
        return subscriber;
    }, []);
    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            try {
                const response = await fetchWithToken(`https://${serverHost}:${serverPort}/subscription-status?email=${encodeURIComponent(user.email)}`);
                const { subscriptionId, plan, subscriptionEndDate } = await response.json();
                setSubscriptionId(isAdmin ? "admin" : subscriptionId);
                setPlanType(isAdmin ? "yearly" : plan);
                setSubEndDate(isAdmin ? "2099/12/31" : subscriptionEndDate);
                await AsyncStorage.setItem('lastPaymentCheck', new Date().toISOString());
            } catch (error) {
                console.error(error);
            }
        };

        const checkAndUpdatePaymentStatus = async () => {
            const lastCheck = await AsyncStorage.getItem('lastPaymentCheck');
            const now = new Date();
            if (!lastCheck || (now - new Date(lastCheck)) > 1000 * 3600 * 24) {
                checkSubscriptionStatus();
            }
        };

        if (user) {
            checkSubscriptionStatus();
            setIsAdmin(user && user.email === 'dannielyang1996@gmail.com');

            /* if (!socket.current) {
                socket.current = io(`https://${serverHost}:${serverPort}`);
                socket.current.on('connect', () => {
                  console.log('Socket connected');
                });

                socket.current.on('payment_status', (data) => {
                    console.log("qqqqqqqqq")
                    console.log(subscriptionId)
                    if (subscriptionId === data.subscription && data.status === 'canceled') {
                        setSubscriptionId(null);
                        Alert.alert('Subscription Canceled', 'Your subscription has been canceled.');
                    }
                });

              } */
            const interval = setInterval(checkAndUpdatePaymentStatus, 1000 * 3600 * 24);
            return () => {clearInterval(interval); /*socket.current.off('payment_status'); socket.current.off('connect');*/};
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, sentReport, setSentReport, isAdmin, subscriptionId, setSubscriptionId, planType, setPlanType, subEndDate, setSubEndDate }}>
            {children}
        </AuthContext.Provider>
    );
};