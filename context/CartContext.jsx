import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart, addToCartApi, removeFromCartApi, updateCartQtyApi } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { getFileUrl } from '../lib/utils';

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
        const data = await fetchCart(userId);
        const cartItems = data?.items || [];
        if (Array.isArray(cartItems)) {
            const mapped = cartItems.map(item => {
                const variant = item.productVariant;
                const product = variant?.product;
                
                // Find variant image
                const vImg = variant?.variantImages?.find(vi => vi.type === 'MAIN')?.media || variant?.variantImages?.[0]?.media;
                let imgPath = vImg?.url || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : '');
                if (!imgPath) {
                    imgPath = product?.heroImage || '';
                }

                // Build redirect URL
                let redirectUrl = `/discover?watch=${product?.id}`;
                if (variant?.variantAttributes) {
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
                    id: item.id.toString(),
                    productId: product?.id?.toString(),
                    variantId: variant?.id?.toString(),
                    title: product?.name || 'Watch',
                    subtitle: variant?.sku || 'Custom Configuration',
                    unitPrice: Number(item.unitPrice || 0),
                    priceDisplay: item.unitPrice ? `₹${Number(item.unitPrice).toLocaleString()}` : '₹0',
                    image: getFileUrl(imgPath) || '/assets/fylex-watch-v2/premium.png',
                    qty: item.quantity,
                    redirectUrl
                };
            });
            setItems(mapped);
        }
      } catch (err) {
        console.error('Initial cart load failed', err);
      }
    };
    loadCart();
  }, [userId]);

  const addToCart = async (variantId, quantity = 1, productInfo = {}, productId = null) => {
    if (!userId) {
      error?.('Please sign in to add items to cart');
      return;
    }
    try {
      const result = await addToCartApi(userId, variantId, quantity, productId);
      if (result && !result.error) {
        // Refresh cart after adding
        const data = await fetchCart(userId);
        const cartItems = data?.items || [];
        const mapped = cartItems.map(item => {
            const variant = item.productVariant;
            const product = variant?.product;
            
            // Find variant image
            const vImg = variant?.variantImages?.find(vi => vi.type === 'MAIN')?.media || variant?.variantImages?.[0]?.media;
            let imgPath = vImg?.url || vImg?.path || (vImg?.fileName ? `/uploads/${vImg.fileName}` : '');
            if (!imgPath) {
                imgPath = product?.heroImage || '';
            }

            // Build redirect URL
            let redirectUrl = `/discover?watch=${product?.id}`;
            if (variant?.variantAttributes) {
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
                id: item.id.toString(),
                productId: product?.id?.toString(),
                variantId: variant?.id?.toString(),
                title: product?.name || 'Watch',
                subtitle: variant?.sku || 'Custom Configuration',
                unitPrice: Number(item.unitPrice || 0),
                priceDisplay: item.unitPrice ? `₹${Number(item.unitPrice).toLocaleString()}` : '₹0',
                image: getFileUrl(imgPath) || '/assets/fylex-watch-v2/premium.png',
                qty: item.quantity,
                redirectUrl
            };
        });
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
      const result = await removeFromCartApi(userId, id);
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
      const updatedItem = await updateCartQtyApi(userId, id, newQty);
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
