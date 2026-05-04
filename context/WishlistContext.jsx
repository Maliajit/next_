"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, toggleWishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { resolveProductImage, getDisplayData } from '../lib/utils';
import { eventBus, EVENTS } from '../lib/events';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();
  const userId = user?.id;

  const loadWishlist = async () => {
    if (!userId) {
      setWishlist([]);
      return;
    }
    const result = await fetchWishlist(userId);
    if (result.success) {
        const items = result.data?.items || [];
        const mapped = items.map(item => {
            const variant = item.productVariant;
            const product = variant?.product;
            
            if (!variant || !product) return null;

            const display = getDisplayData(product, variant);

            return {
                id: item.id.toString(), // WishlistItem ID
                productId: product.id.toString(),
                variantId: variant.id.toString(),
                title: display.name,
                variantName: display.subtitle,
                price: display.price,
                formattedPrice: display.formattedPrice,
                image: display.image,
                redirectUrl: `/discover?watch=${product.id}&variant=${variant.id}`,
                ...display
            };
        }).filter(Boolean);
        setWishlist(mapped);
    }
  };

  useEffect(() => {
    loadWishlist();
    const unsub = eventBus.on(EVENTS.WISHLIST_UPDATED, loadWishlist);
    return () => unsub();
  }, [userId]);

  const toggleWishlist = async (product) => {
    if (!userId) return;
    const variantId = product.variantId || product.currentVariantId;
    if (!variantId) throw new Error("ENFORCEMENT: Cannot wishlist without variantId");

    const result = await toggleWishlistApi(userId, product);
    if (result.success) {
        eventBus.emit(EVENTS.WISHLIST_UPDATED);
    }
  };

  const isInWishlist = (id) => wishlist.some(i => i.variantId === id?.toString());

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, refreshWishlist: loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
