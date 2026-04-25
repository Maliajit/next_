"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

import { signupApi, loginApi } from '@/lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('fylexx_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('fylexx_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const result = await loginApi(credentials);
      // result usually contains { access_token, user }
      const userData = result.user || result;
      setUser(userData);
      localStorage.setItem('fylexx_user', JSON.stringify(userData));
      if (result.access_token) localStorage.setItem('fylexx_token', result.access_token);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fylexx_user');
    localStorage.removeItem('fylexx_token');
  };

  const signup = async (userData) => {
    try {
      const result = await signupApi(userData);
      // If signup returns user/token, log them in
      const finalUser = result.user || result;
      setUser(finalUser);
      localStorage.setItem('fylexx_user', JSON.stringify(finalUser));
      if (result.access_token) localStorage.setItem('fylexx_token', result.access_token);
      return finalUser;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
