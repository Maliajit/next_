"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartApi, removeFromCartApi, updateCartQtyApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { resolveProductImage, getDisplayData } from '../lib/utils';
import { eventBus, EVENTS } from '../lib/events';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth() || {};
  const userId = user?.id;

  const loadCart = async () => {
    if (!userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    const result = await fetchCart(userId);
    if (result.success) {
        const cartItems = result.data?.items || [];
        const mapped = cartItems.map(item => {
            const variant = item.productVariant;
            const product = variant?.product;
            
            if (!variant || !product) return null;

            const display = getDisplayData(product, variant);

            return {
                id: item.id.toString(), // Database CartItem ID
                productId: product.id.toString(),
                variantId: variant.id.toString(),
                sku: display.sku,
                title: display.name,
                subtitle: display.subtitle,
                unitPrice: Number(item.unitPrice || 0),
                image: display.image,
                qty: item.quantity,
                // Full display data for UI convenience
                ...display
            };
        }).filter(Boolean);
        setItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
    const unsub = eventBus.on(EVENTS.CART_UPDATED, loadCart);
    return () => unsub();
  }, [userId]);

  const addToCart = async (variantId, quantity = 1) => {
    if (!userId) return { success: false, error: 'Login required' };
    
    const result = await addToCartApi(userId, variantId, quantity);
    if (result.success) {
        eventBus.emit(EVENTS.CART_UPDATED);
    }
    return result;
  };

  const removeFromCart = async (id) => {
    if (!userId) return;
    const result = await removeFromCartApi(userId, id);
    if (result.success) {
        eventBus.emit(EVENTS.CART_UPDATED);
    }
  };

  const updateQty = async (id, delta) => {
    if (!userId) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const newQty = Math.max(1, item.qty + delta);
    const result = await updateCartQtyApi(userId, id, newQty);
    if (result.success) {
        eventBus.emit(EVENTS.CART_UPDATED);
    }
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((s, i) => s + (i.qty || 0), 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQty, clearCart, totalCount, refreshCart: loadCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
