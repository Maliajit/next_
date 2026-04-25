// lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

// Products API
export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) throw new Error(`Error fetching products: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

export const fetchFeaturedProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    if (!response.ok) throw new Error(`Error fetching featured products: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
};

// Cart API
export const fetchCart = async (userId) => {
  try {
    const url = userId ? `${API_BASE_URL}/cart?userId=${userId}` : `${API_BASE_URL}/cart`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return [];
      throw new Error(`Error fetching cart: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch cart:', error.message);
    return [];
  }
};

export const addToCartApi = async (userId, variantId, quantity = 1, productId = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, variantId, quantity, productId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to add to cart:', error);
  }
};

export const removeFromCartApi = async (userId, id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to remove from cart:', error);
  }
};

export const updateCartQtyApi = async (userId, id, quantity) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, quantity }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to update cart quantity:', error);
  }
};

// Wishlist API
export const fetchWishlist = async (userId) => {
  try {
    const url = userId ? `${API_BASE_URL}/wishlist?customerId=${userId}` : `${API_BASE_URL}/wishlist`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return [];
      throw new Error(`Error fetching wishlist: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch wishlist:', error.message);
    return [];
  }
};

export const toggleWishlistApi = async (userId, product) => {
  try {
    const variantId = product.variantId || product.id;
    const response = await fetch(`${API_BASE_URL}/wishlist/${variantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: userId, ...product }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to toggle wishlist:', error);
  }
};

// Orders API
export const fetchOrders = async (userId) => {
  try {
    const url = userId ? `${API_BASE_URL}/orders?customerId=${userId}` : `${API_BASE_URL}/orders`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return [];
      throw new Error(`Error fetching orders: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch orders:', error.message);
    return [];
  }
};

export const createOrderApi = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to place order');
    }
    return result;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error; // Rethrow to let the caller handle it
  }
};

// Payment API
export const initiatePaymentApi = async (amount, receipt) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to initiate payment:', error);
  }
};

export const verifyPaymentApi = async (paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to verify payment:', error);
  }
};

// Address API
export const addAddressApi = async (userId, addressData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${userId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to add address:', error);
  }
};

export const fetchAddressesApi = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${userId}/addresses`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return [];
  }
};
// Auth API
export const signupApi = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Signup failed');
    return result;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const loginApi = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login failed');
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
