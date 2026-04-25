"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchOrders, createOrderApi } from '../lib/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  const normalizeOrder = (order) => {
    // Determine items array from various possible backend fields
    const rawItems = Array.isArray(order.items) 
      ? order.items 
      : Array.isArray(order.products) 
      ? order.products 
      : [];

    const formatCurrency = (val) => {
      if (typeof val === 'string' && val.startsWith('₹')) return val;
      const num = Number(val);
      return isNaN(num) ? '₹0' : `₹${num.toLocaleString()}`;
    };

    return {
      ...order,
      id: order.id?.toString() || order.orderNumber || Date.now().toString(),
      date: order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString() 
        : (order.date || new Date().toLocaleDateString()),
      total: order.total || formatCurrency(order.grandTotal || order.amount || 0),
      items: rawItems.map(item => ({
        ...item,
        price: item.price || formatCurrency(item.unitPrice || 0),
        image: item.product?.heroImage || item.image || '/assets/fylex-watch-v2/premium.png',
        title: item.title || item.productName || item.product?.name || 'Luxury Timepiece',
        qty: item.qty || item.quantity || 1
      }))
    };
  };

  // Initial load from backend
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) {
        setOrders([]);
        return;
      }
      
      try {
        const response = await fetchOrders(user.id);
        // Handle both { success: true, data: [] }, { orders: [] } and raw array responses
        const data = response?.data || response?.orders || (Array.isArray(response) ? response : []);
        const normalized = data.map(normalizeOrder);
        setOrders(normalized);
      } catch (err) {
        console.warn('Order API unavailable, using local data:', err.message);
      }
    };
    loadOrders();
  }, [user?.id]);

  const addOrder = async (orderData) => {
    try {
      const apiResponse = await createOrderApi(orderData);
      
      // The API should now return the created order from the database
      // If it doesn't, normalize the sent data as a fallback (but only on success)
      const newOrder = apiResponse || orderData;
      const normalized = normalizeOrder(newOrder);
      
      setOrders(prev => [normalized, ...prev]);
      return normalized;
    } catch (err) {
      console.error('Order creation failed:', err.message);
      // Rethrow to allow the checkout page to show the error
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used inside OrderProvider');
  return ctx;
}
