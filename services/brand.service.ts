import api from './api';

export const getBrands = () => api.get('/brands');
export const getBrandById = (id: string | number) => api.get(`/brands/${id}`);
export const createBrand = (data: any) => api.post('/brands', data);
export const updateBrand = (id: string | number, data: any) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id: string | number) => api.delete(`/brands/${id}`);

const brandService = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};

export default brandService;
