"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchOrders, createOrderApi } from '../lib/api';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  // Initial load from backend
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        if (data && Array.isArray(data)) {
            const mapped = data.map(order => ({
                ...order,
                id: order.id.toString(),
                date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent',
                items: (order.items || []).map(item => ({
                    ...item,
                    price: item.price ? `₹${item.price.toLocaleString()}` : '₹0',
                    image: item.product?.heroImage || item.image || '/assets/fylex-watch-v2/premium.png'
                }))
            }));
            setOrders(mapped);
        }
      } catch (err) {
        console.warn('Order API unavailable, using local data:', err.message);
      }
    };
    loadOrders();
  }, []);

  const addOrder = async (order) => {
    try {
      const newOrder = await createOrderApi(order);
      if (newOrder) {
        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
      }
    } catch (err) {
      console.warn('Order API unavailable, saving locally:', err.message);
      // Fallback: create order locally
      const localOrder = { ...order, id: Date.now() };
      setOrders(prev => [localOrder, ...prev]);
      return localOrder;
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
