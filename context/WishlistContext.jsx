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
            const mapped = data
                .map(item => {
                    // STRICT: Only track variant-based wishlist items for the configurator
                    const targetId = item.productVariantId || item.productVariant?.id;
                    if (!targetId) return null;

                    return {
                        ...item,
                        id: targetId.toString(),
                        price: item.price ? `₹${item.price.toLocaleString()}` : '₹0',
                        image: item.heroImage || item.image || item.product?.heroImage || '/assets/fylex-watch-v2/premium.png'
                    };
                })
                .filter(Boolean);
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
        const productIdStr = product.id.toString();
        
        setWishlist(prev => {
            const exists = prev.some(i => i.id === productIdStr);
            if (result.added === false) {
                return prev.filter(i => i.id !== productIdStr);
            } else {
                if (exists) return prev;
                return [...prev, { ...product, id: productIdStr }];
            }
        });
      }
    } catch (err) {
      console.error('Failed to update wishlist', err);
    }
  };

  const isInWishlist = (id) => wishlist.some(i => i.id === id?.toString());

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
