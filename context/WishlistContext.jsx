"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, toggleWishlistApi } from '../lib/api';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { success, error, info } = useToast() || {};

  // Initial load from backend
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const data = await fetchWishlist();
        if (data) setWishlist(data);
      } catch (err) {
        console.error('Failed to load wishlist', err);
      }
    };
    loadWishlist();
  }, []);

  const toggleWishlist = async (product) => {
    try {
      const result = await toggleWishlistApi(product);
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
