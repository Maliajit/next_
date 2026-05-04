"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWishlist, toggleWishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';
import { getFileUrl } from '../lib/utils';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();

  // Initial load from backend
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user?.id) return;
      try {
        const res = await fetchWishlist(user.id);
        const items = Array.isArray(res) ? res : (res?.items || []);
        
        if (items.length >= 0) {
            const mapped = items
                .map(item => {
                    const variant = item.productVariant || item.variant || {};
                    const product = variant.product || item.product || {};
                    const targetId = variant.id || item.productVariantId;
                    
                    if (!targetId) return null;

                    const vName = (variant.variantAttributes && variant.variantAttributes.length > 0)
                        ? variant.variantAttributes
                            .map(va => va.attributeValue?.label || va.attributeValue?.value)
                            .filter(Boolean)
                            .join(', ')
                        : (item.subtitle || item.titleAccent || '');

                    // Find variant image
                    const vImg = variant.variantImages?.find(vi => vi.type === 'MAIN' || vi.isPrimary === 1)?.media || variant.variantImages?.[0]?.media;
                    let imgPath = vImg?.url || vImg?.filePath || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : '');
                    if (!imgPath) {
                        imgPath = variant.heroImage || product.heroImage || item.heroImage || item.image || '';
                    }

                    const finalImage = getFileUrl(imgPath);

                    // Build redirect URL
                    let redirectUrl = `/discover?watch=${product.slug || product.id || item.productId}`;
                    if (variant.variantAttributes) {
                        variant.variantAttributes.forEach(va => {
                            const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
                            const valLabel = va.attributeValue?.label;
                            if (attrName && valLabel) {
                                redirectUrl += `&${attrName}=${encodeURIComponent(valLabel)}`;
                            }
                        });
                    }

                    return {
                        ...item,
                        id: targetId.toString(),
                        productId: product.id?.toString(),
                        variantId: targetId.toString(),
                        productName: product.name || item.title || 'Fylex Watch',
                        variantName: vName,
                        price: variant.price ? `₹${Number(variant.price).toLocaleString()}` : (item.price ? `₹${Number(item.price).toLocaleString()}` : '₹0'),
                        image: finalImage || '/assets/fylex-watch-v2/premium.png',
                        redirectUrl
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
      return;
    }
    try {
      const variantIdStr = (product.variantId || product.currentVariantId || product.id).toString();
      const result = await toggleWishlistApi(user.id, product);
      if (result) {
        
        setWishlist(prev => {
            const exists = prev.some(i => i.id === variantIdStr);
            if (result.added === false) {
                return prev.filter(i => i.id !== variantIdStr);
            } else {
                if (exists) return prev;
                
                // Build redirect URL for local item
                let localRedirectUrl = `/discover?watch=${product.slug || product.id}`;
                const activeVariant = (product.variants || []).find(v => v.id.toString() === variantIdStr);
                if (activeVariant?.variantAttributes) {
                    activeVariant.variantAttributes.forEach(va => {
                        const attrName = va.attributeValue?.attribute?.name?.toLowerCase();
                        const valLabel = va.attributeValue?.label;
                        if (attrName && valLabel) {
                            localRedirectUrl += `&${attrName}=${encodeURIComponent(valLabel)}`;
                        }
                    });
                }

                return [...prev, { 
                    ...product, 
                    id: variantIdStr, 
                    variantId: variantIdStr,
                    redirectUrl: localRedirectUrl
                }];
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
