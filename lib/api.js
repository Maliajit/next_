// lib/api.js
import { eventBus, EVENTS } from './events';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

/**
 * Standardized request handler with strict error policy and auth handling.
 */
async function request(method, path, body = null, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Idempotency-Key': options.idempotencyKey || `idemp-${Date.now()}-${Math.random()}`,
    ...options.headers,
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fylexx_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fetchOptions = {
      method,
      headers,
    };
    if (body && method !== 'GET') fetchOptions.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
    
    if (response.status === 401) {
        eventBus.emit(EVENTS.AUTH_EXPIRED);
        throw new Error('Session expired. Please login again.');
    }

    const result = await response.json();
    
    // Response Standardization
    if (!response.ok) {
        return {
            success: false,
            data: null,
            error: result.message || result.error || `API Error: ${response.statusText}`
        };
    }

    return {
        success: true,
        data: result.data || result,
        error: null
    };
  } catch (error) {
    console.error(`API ${method} ${path} failed:`, error);
    return {
        success: false,
        data: null,
        error: error.message || 'Network connectivity issue'
    };
  }
}

// Products API
export const fetchProducts = () => request('GET', '/products');
export const fetchFeaturedProducts = () => request('GET', '/products/featured');

// Cart API
export const fetchCart = (userId) => request('GET', userId ? `/cart?userId=${userId}` : '/cart');

export const addToCartApi = (userId, variantId, quantity = 1) => {
  if (!variantId) throw new Error("CRITICAL: variantId is mandatory for cart operations");
  return request('POST', '/cart/items', { userId, variantId, quantity });
};

export const removeFromCartApi = (userId, id) => request('DELETE', `/cart/items/${id}`, { userId });

export const updateCartQtyApi = (userId, id, quantity) => request('PATCH', `/cart/items/${id}`, { userId, quantity });

// Wishlist API
export const fetchWishlist = (userId) => request('GET', userId ? `/wishlist?customerId=${userId}` : '/wishlist');

export const toggleWishlistApi = (userId, product) => {
  const variantId = product.variantId || product.currentVariantId;
  if (!variantId) throw new Error("CRITICAL: variantId is mandatory for wishlist operations");
  
  // Strip non-essential data, keep config query
  return request('POST', `/wishlist/${variantId}`, { 
    customerId: userId,
    configQuery: product.configQuery || ''
  });
};

// Orders API
export const fetchOrders = (userId) => request('GET', userId ? `/orders?customerId=${userId}` : '/orders');

export const calculateTotalApi = (items, pincode) => {
    return request('POST', '/checkout/calculate-total', { items, pincode });
};

export const createOrderApi = (orderData) => {
  // SECURITY: Delete any total/price fields sent from frontend
  const securedData = { ...orderData };
  delete securedData.total;
  delete securedData.subtotal;
  delete securedData.shipping;
  
  return request('POST', '/orders', securedData);
};

export const calculateShippingApi = (customerId, pincode) => {
    return request('POST', '/orders/calculate-shipping', { customerId, pincode });
};

// Payment API
export const initiatePaymentApi = (amount, receipt) => request('POST', '/payments/create-order', { amount, receipt });
export const verifyPaymentApi = (paymentData) => request('POST', '/payments/verify', paymentData);

// Address API
export const addAddressApi = (userId, addressData) => request('POST', `/customers/${userId}/addresses`, addressData);
export const fetchAddressesApi = (userId) => request('GET', `/customers/${userId}/addresses`);

// Auth API
export const signupApi = (userData) => request('POST', '/auth/register', userData);
export const loginApi = (credentials) => request('POST', '/auth/login', credentials);
