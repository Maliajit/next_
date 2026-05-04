"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartApi, removeFromCartApi, updateCartQtyApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { getFileUrl } from '../lib/utils';
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
            
            const vImg = variant?.variantImages?.find(vi => vi.type === 'MAIN' || vi.isPrimary === 1)?.media || variant?.variantImages?.[0]?.media;
            const imgPath = vImg?.url || vImg?.filePath || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : (product?.heroImage || ''));

            return {
                ...item,
                id: item.id.toString(),
                productId: product?.id?.toString(),
                variantId: variant?.id?.toString(),
                title: product?.name || 'Watch',
                subtitle: variant?.sku || 'Custom Configuration',
                unitPrice: Number(item.unitPrice || 0),
                image: getFileUrl(imgPath) || '/assets/fylex-watch-v2/premium.png',
                qty: item.quantity,
            };
        });
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
