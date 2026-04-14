import api from './api';

export const getOrders = (params?: any) => api.get('/orders', { params });
export const getOrderById = (id: string | number) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id: string | number, status: string, notes?: string) => 
  api.put(`/orders/${id}/status`, { status, notes });
export const updateOrderPaymentStatus = (id: string | number, status: string, notes?: string) => 
  api.put(`/orders/${id}/payment-status`, { payment_status: status, notes });
export const updateOrderTracking = (id: string | number, data: any) => 
  api.post(`/orders/${id}/tracking`, data);

const orderService = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderTracking,
};

export default orderService;
