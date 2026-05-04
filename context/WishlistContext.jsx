"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, toggleWishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { getFileUrl } from '../lib/utils';
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
        const items = result.data?.items || result.data || [];
        const mapped = items.map(item => {
            const variant = item.productVariant || item.variant;
            const product = variant?.product || item.product;
            const variantId = variant?.id || item.productVariantId;
            
            if (!variantId) return null;

            const vImg = variant?.variantImages?.find(vi => vi.type === 'MAIN' || vi.isPrimary === 1)?.media || variant?.variantImages?.[0]?.media;
            const imgPath = vImg?.url || vImg?.filePath || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : (product?.heroImage || ''));

            return {
                id: variantId.toString(),
                productId: product?.id?.toString(),
                variantId: variantId.toString(),
                productName: product?.name || 'Fylex Watch',
                price: variant?.price || 0,
                image: getFileUrl(imgPath) || '/assets/fylex-watch-v2/premium.png',
                configQuery: item.configQuery || ''
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
