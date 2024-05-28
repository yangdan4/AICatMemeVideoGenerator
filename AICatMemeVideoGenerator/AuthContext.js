// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sentReport, setSentReport] = useState(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, sentReport, setSentReport }}>
      {children}
    </AuthContext.Provider>
  );
};