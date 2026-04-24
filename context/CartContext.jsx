import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartApi, removeFromCartApi, updateCartQtyApi } from '../lib/api';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { success, error, info } = useToast() || {};

  // Initial load from backend
  useEffect(() => {
    const loadCart = async () => {
      try {
        const data = await fetchCart();
        if (data && Array.isArray(data)) {
            const mapped = data.map(item => ({
                ...item,
                id: item.id.toString(),
                price: item.price ? `₹${item.price.toLocaleString()}` : '₹0',
                image: item.product?.heroImage || item.image || '/assets/fylex-watch-v2/premium.png'
            }));
            setItems(mapped);
        }
      } catch (err) {
        console.error('Initial cart load failed', err);
      }
    };
    loadCart();
  }, []);

  const addToCart = async (product) => {
    try {
      const updatedItem = await addToCartApi(product);
      if (updatedItem) {
        setItems(prev => {
          const existing = prev.find(i => i.id === product.id);
          if (existing) {
            return prev.map(i => i.id === product.id ? updatedItem : i);
          }
          return [...prev, updatedItem];
        });
        success?.(`${product.title} added to cart`);
      }
    } catch (err) {
      error?.('Failed to add item to cart');
    }
  };

  const removeFromCart = async (id) => {
    try {
      const result = await removeFromCartApi(id);
      if (result?.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        info?.('Item removed from cart');
      }
    } catch (err) {
      error?.('Failed to remove item from cart');
    }
  };

  const updateQty = async (id, delta) => {
    try {
      const updatedItem = await updateCartQtyApi(id, delta);
      if (updatedItem) {
        setItems(prev =>
          prev.map(i => i.id === id ? updatedItem : i)
        );
      }
    } catch (err) {
      error?.('Failed to update quantity');
    }
  };

  const clearCart = () => {
    // We could add a clearCartApi if needed, for now just local
    setItems([]);
  };

  const totalCount = items.reduce((s, i) => s + (i.qty || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
