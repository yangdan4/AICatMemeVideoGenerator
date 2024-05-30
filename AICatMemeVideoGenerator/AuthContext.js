import axios from 'axios';
import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { serverPort, serverHost } from './consts';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sentReport, setSentReport] = useState(false);
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(setUser);
        return subscriber;
    }, []);

    useEffect(() => {
      isAdmin && setPaid(true)
    }, [isAdmin]);

    useEffect(() => {
        if (user) {
            /*const checkSubscriptionStatus = async () => {
                try {
                    const response = await axios.get(`https://${serverHost}:${serverPort}/subscription-status?email=${user.email}`);
                    setPaid(response.data.paid);
                } catch (error) {
                    console.error(error);
                }
            };

            checkSubscriptionStatus();*/

            setIsAdmin(user && user.email === 'dannielyang1996@gmail.com')
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, sentReport, setSentReport, isAdmin, paid }}>
            {children}
        </AuthContext.Provider>
    );
};