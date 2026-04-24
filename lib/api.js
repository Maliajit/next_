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
export const fetchCart = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`);
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

export const addToCartApi = async (userId, variantId, quantity = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, variantId, quantity }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to add to cart:', error);
  }
};

export const removeFromCartApi = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${id}`, { method: 'DELETE' });
    return await response.json();
  } catch (error) {
    console.error('Failed to remove from cart:', error);
  }
};

export const updateCartQtyApi = async (id, delta) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
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
export const fetchOrders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
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
    return await response.json();
  } catch (error) {
    console.error('Failed to create order:', error);
  }
};
