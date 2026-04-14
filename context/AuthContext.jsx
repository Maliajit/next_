"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('fylexx_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // If userData already has required fields, use them; otherwise add mock data
    const user = {
      ...userData,
      id: userData.id || 'usr_' + Math.random().toString(36).substr(2, 9),
      joinDate: userData.joinDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      role: userData.role || 'customer',
      orderHistory: userData.orderHistory || [
        { id: 'ORD-77291', date: '2026-03-15', total: '$12,400', status: 'Delivered', items: 'Datejust Gold' },
        { id: 'ORD-66102', date: '2026-02-10', total: '$36,500', status: 'Shipped', items: 'Submariner Blue' },
      ],
      recentOrders: userData.recentOrders || [
         { id: 'ORD-77291', name: 'Datejust Gold', status: 'Delivered', img: '/assets/fylex-watch-v2/premium.png' }
      ]
    };
    setUser(user);
    localStorage.setItem('fylexx_user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fylexx_user');
  };

  const signup = (userData) => {
    login(userData);
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
