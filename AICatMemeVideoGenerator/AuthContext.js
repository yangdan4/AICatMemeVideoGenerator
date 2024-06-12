import React, { createContext, useRef, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { serverPort, serverHost } from './consts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiKey } from './frontend_secret_key';
//import io from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sentReport, setSentReport] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState(null);
    const [planType, setPlanType] = useState(null);
    const [subEndDate, setSubEndDate] = useState(null);
    const [email, setEmail] = useState('');
    const [deviceId, setDeviceId] = useState(null);

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



const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return token;
    } catch (error) {
      console.error("Error getting token", error);
      return null;
    }
  };
  
  const saveToken = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (error) {
      console.error("Error saving token", error);
    }
  };
  
  const refreshToken = async () => {
    try {
      const response = await fetch(`https://${serverHost}:${serverPort}/get_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, device_id: deviceId, app_key: apiKey })
      });
      const data = await response.json();
      if (response.ok) {
        await saveToken(data.token);
        return data.token;
      } else {
        console.error('Failed to get token', data);
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error("Error during token refresh", error);
      throw error;
    }
  };


    const fetchWithToken = async (endpoint, options = {}) => {
    try {
      const token = await getToken();
      const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : ''
      };
      const response = await fetch(endpoint, { ...options, headers });
      if (response.status === 403) {
        console.log('Token expired, attempting to refresh');
        const newToken = await refreshToken();
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`
        };
        const retryResponse = await fetch(endpoint, { ...options, headers: newHeaders });
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(`HTTP error after retry! status: ${retryResponse.status}, message: ${errorText}`);
        }
        return retryResponse;
      } else if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      return response;
    } catch (error) {
      // console.error(`Fetch request failed: ${error.message}`);
      throw error;
    }
  };

    return (
        <AuthContext.Provider value={{ user, setUser, sentReport, setSentReport, isAdmin, subscriptionId, setSubscriptionId, planType, setPlanType, subEndDate, setSubEndDate, email, setEmail, deviceId, setDeviceId, saveToken, getToken, refreshToken, fetchWithToken }}>
            {children}
        </AuthContext.Provider>
    );
};