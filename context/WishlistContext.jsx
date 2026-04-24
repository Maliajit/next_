"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, toggleWishlistApi } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { success, error, info } = useToast() || {};
  const { user } = useAuth();

  // Initial load from backend
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchWishlist(user.id);
        if (data && Array.isArray(data)) {
            const mapped = data.map(item => ({
                ...item,
                id: item.id.toString(),
                price: item.price ? `₹${item.price.toLocaleString()}` : '₹0',
                image: item.heroImage || item.image || (item.product?.heroImage) || '/assets/fylex-watch-v2/premium.png'
            }));
            setWishlist(mapped);
        }
      } catch (err) {
        console.error('Failed to load wishlist', err);
      }
    };
    loadWishlist();
  }, [user?.id]);

  const toggleWishlist = async (product) => {
    if (!user?.id) {
      error?.('Please login to manage your wishlist');
      return;
    }
    try {
      const result = await toggleWishlistApi(user.id, product);
      if (result) {
        if (result.isInWishlist === false) {
          setWishlist(prev => prev.filter(i => i.id !== product.id));
          info?.(`${product.title} removed from wishlist`);
        } else {
          setWishlist(prev => [...prev, product]);
          success?.(`${product.title} added to wishlist`);
        }
      }
    } catch (err) {
      error?.('Failed to update wishlist');
    }
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id);

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
