// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sentReport, setSentReport] = useState(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber;
  }, []);


  useEffect(() => {
    setIsAdmin(user && user.email === 'dannielyang1996@gmail.com')
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, sentReport, setSentReport, isAdmin}}>
      {children}
    </AuthContext.Provider>
  );
};