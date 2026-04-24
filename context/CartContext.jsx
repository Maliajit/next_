import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartApi, removeFromCartApi, updateCartQtyApi } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { success, error, info } = useToast() || {};
  const { user } = useAuth() || {};
  const userId = user?.id;

  // Initial load from backend
  useEffect(() => {
    const loadCart = async () => {
      if (!userId) {
        setItems([]);
        return;
      }
      try {
        const data = await fetchCart();
        const cartItems = data?.items || [];
        if (Array.isArray(cartItems)) {
            const mapped = cartItems.map(item => ({
                ...item,
                id: item.id.toString(),
                title: item.productVariant?.product?.name || 'Watch',
                subtitle: item.productVariant?.sku || 'Custom Configuration',
                price: item.unitPrice ? `₹${Number(item.unitPrice).toLocaleString()}` : '₹0',
                image: item.productVariant?.product?.heroImage || '/assets/fylex-watch-v2/premium.png',
                qty: item.quantity
            }));
            setItems(mapped);
        }
      } catch (err) {
        console.error('Initial cart load failed', err);
      }
    };
    loadCart();
  }, [userId]);

  const addToCart = async (variantId, quantity = 1, productInfo = {}) => {
    if (!userId) {
      error?.('Please sign in to add items to cart');
      return;
    }
    try {
      const result = await addToCartApi(userId, variantId, quantity);
      if (result) {
        // Refresh cart after adding
        const data = await fetchCart();
        const cartItems = data?.items || [];
        const mapped = cartItems.map(item => ({
            ...item,
            id: item.id.toString(),
            title: item.productVariant?.product?.name || 'Watch',
            subtitle: item.productVariant?.sku || 'Custom Configuration',
            price: item.unitPrice ? `₹${Number(item.unitPrice).toLocaleString()}` : '₹0',
            image: item.productVariant?.product?.heroImage || '/assets/fylex-watch-v2/premium.png',
            qty: item.quantity
        }));
        setItems(mapped);
        success?.(`${productInfo.title || 'Item'} added to cart`);
      }
    } catch (err) {
      error?.('Failed to add item to cart');
    }
  };

  const removeFromCart = async (id) => {
    if (!userId) return;
    try {
      const result = await removeFromCartApi(id);
      setItems(prev => prev.filter(i => i.id !== id));
      info?.('Item removed from cart');
    } catch (err) {
      error?.('Failed to remove item from cart');
    }
  };

  const updateQty = async (id, delta) => {
    if (!userId) return;
    try {
      // Find current item to get new absolute quantity
      const item = items.find(i => i.id === id);
      if (!item) return;
      
      const newQty = Math.max(1, item.qty + delta);
      const updatedItem = await updateCartQtyApi(id, newQty);
      if (updatedItem) {
        setItems(prev =>
          prev.map(i => i.id === id ? { 
              ...i, 
              qty: updatedItem.quantity,
              total: updatedItem.total
          } : i)
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
