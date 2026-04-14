"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import * as api from '@/services/adminApi';

const AdminDataContext = createContext();
export const useAdminData = () => useContext(AdminDataContext);

/**
 * AdminDataProvider
 *
 * Fetches all admin data from the NestJS backend on mount.
 * Falls back gracefully — if an endpoint fails, that entity gets an empty array
 * and an error state is set so pages can show a proper message.
 *
 * Pages use: const { data, loading, errors, addRecord, updateRecord, deleteRecord } = useAdminData();
 */
export const AdminDataProvider = ({ children }) => {
  const toast = useToast();

  // Per-entity state
  const [data, setData] = useState({
    products: [],
    categories: [],
    brands: [],
    orders: [],
    users: [],
    offers: [],
    reviews: [],
    taxes: [],
    tags: [],
    attributes: [],
    specifications: [],
    specificationGroups: [],
    media: [],
    pages: [],
    banners: [],
    testimonials: [],
    homeSections: [],
    settings: null,
    inventory: [],
    shippingMethods: [],
  });

  const [loading, setLoading] = useState({
    products: true,
    categories: true,
    brands: true,
    orders: true,
    users: true,
    offers: true,
    reviews: true,
    taxes: true,
    tags: true,
    attributes: true,
    specifications: true,
    specificationGroups: true,
    media: true,
    pages: true,
    banners: true,
    testimonials: true,
    homeSections: true,
    settings: true,
    inventory: true,
    shippingMethods: true,
  });

  const [errors, setErrors] = useState({});

  // ─── Fetch helpers ──────────────────────────────────────────
  const fetchEntity = useCallback(async (entity, apiFn) => {
    setLoading(prev => ({ ...prev, [entity]: true }));
    setErrors(prev => ({ ...prev, [entity]: null }));

    const { data: result, error } = await apiFn();

    if (error) {
      setErrors(prev => ({ ...prev, [entity]: error }));
      setData(prev => ({ ...prev, [entity]: [] }));
    } else {
      // Normalize: some APIs may return { data: [...] } or directly [...]
      const list = Array.isArray(result)
        ? result
        : (result?.data ?? result?.items ?? result ?? []);
      setData(prev => ({ ...prev, [entity]: list }));
    }

    setLoading(prev => ({ ...prev, [entity]: false }));
  }, []);

  // ─── Initial data load ──────────────────────────────────────
  useEffect(() => {
    fetchEntity('products', api.getProducts);
    fetchEntity('categories', api.getCategories);
    fetchEntity('brands', api.getBrands);
    fetchEntity('orders', api.getOrders);
    fetchEntity('users', api.getUsers);
    fetchEntity('offers', api.getOffers);
    fetchEntity('reviews', api.getReviews);
    fetchEntity('tags', api.getTags);
    fetchEntity('attributes', api.getAttributes);
    fetchEntity('specifications', api.getSpecifications);
    fetchEntity('specificationGroups', api.getSpecificationGroups);
    fetchEntity('taxes', api.getTaxes);
    fetchEntity('media', api.getMedia);
    fetchEntity('pages', api.getPages);
    fetchEntity('banners', api.getBanners);
    fetchEntity('testimonials', api.getTestimonials);
    fetchEntity('homeSections', api.getHomeSections);
    fetchEntity('settings', api.getSettings);
    fetchEntity('inventory', api.getInventory);
    fetchEntity('shippingMethods', api.getShippingMethods);
  }, [fetchEntity]);

  // ─── Refetch helpers exposed to pages ───────────────────────
  const refetch = {
    products: () => fetchEntity('products', api.getProducts),
    categories: () => fetchEntity('categories', api.getCategories),
    brands: () => fetchEntity('brands', api.getBrands),
    orders: () => fetchEntity('orders', api.getOrders),
    users: () => fetchEntity('users', api.getUsers),
    offers: () => fetchEntity('offers', api.getOffers),
    reviews: () => fetchEntity('reviews', api.getReviews),
    tags: () => fetchEntity('tags', api.getTags),
    attributes: () => fetchEntity('attributes', api.getAttributes),
    specifications: () => fetchEntity('specifications', api.getSpecifications),
    specificationGroups: () => fetchEntity('specificationGroups', api.getSpecificationGroups),
    taxes: () => fetchEntity('taxes', api.getTaxes),
    media: () => fetchEntity('media', api.getMedia),
    pages: () => fetchEntity('pages', api.getPages),
    banners: () => fetchEntity('banners', api.getBanners),
    testimonials: () => fetchEntity('testimonials', api.getTestimonials),
    homeSections: () => fetchEntity('homeSections', api.getHomeSections),
    settings: () => fetchEntity('settings', api.getSettings),
    inventory: () => fetchEntity('inventory', api.getInventory),
    shippingMethods: () => fetchEntity('shippingMethods', api.getShippingMethods),
  };

  // ─── CRUD Operations (optimistic + real API) ────────────────

  /**
   * addRecord — POST to API, then refresh entity list.
   * @param {string} entity  - e.g. 'products'
   * @param {object} record  - payload to send
   * @param {function} apiFn - API function to call (e.g. api.createProduct)
   * @returns {object|null}  - created record or null on failure
   */
  const addRecord = async (entity, record, apiFn) => {
    if (!apiFn) {
      // Fallback: local only
      const local = { ...record, id: Date.now() };
      setData(prev => ({ ...prev, [entity]: [local, ...(prev[entity] || [])] }));
      toast?.success?.(`Added successfully`);
      return local;
    }

    const res = await apiFn(record);
    const { data: created, error, success } = res;

    if (error || success === false) {
      toast?.error?.(error || 'Failed to save record');
      return null;
    }
    
    // Refresh list from server to ensure visibility
    await refetch[entity]?.();
    toast?.success?.(`Added successfully`);
    return created?.data || created;
  };

  /**
   * updateRecord — PUT to API, then refresh.
   */
  const updateRecord = async (entity, id, updates, apiFn) => {
    if (!apiFn) {
      setData(prev => ({
        ...prev,
        [entity]: (prev[entity] || []).map(item => item.id === id ? { ...item, ...updates } : item),
      }));
      toast?.success?.(`Updated successfully`);
      return;
    }

    const { error, success } = await apiFn(id, updates);
    if (error || success === false) {
      toast?.error?.(error || 'Failed to update');
      return;
    }
    // Optimistic update for immediate UI response
    setData(prev => ({
      ...prev,
      [entity]: (prev[entity] || []).map(item => item.id === id ? { ...item, ...updates } : item),
    }));
    toast?.success?.(`Updated successfully`);
  };

  /**
   * deleteRecord — DELETE from API, then remove from local state.
   */
  const deleteRecord = async (entity, id, apiFn) => {
    if (!apiFn) {
      setData(prev => ({
        ...prev,
        [entity]: (prev[entity] || []).filter(item => item.id !== id),
      }));
      toast?.success?.(`Deleted successfully`);
      return true;
    }

    const { error, success } = await apiFn(id);
    if (error || success === false) {
      toast?.error?.(error || 'Failed to delete');
      return false;
    }
    setData(prev => ({
      ...prev,
      [entity]: (prev[entity] || []).filter(item => item.id !== id),
    }));
    toast?.success?.(`Deleted successfully`);
    return true;
  };

  const generateVariants = async (productId, selections) => {
    const res = await api.generateVariants(productId, selections);
    if (res.error || res.success === false) {
      toast?.error?.(res.error || 'Failed to generate variants');
      return null;
    }
    toast?.success?.(`Generated ${res.data?.count || 0} variants`);
    return res.data;
  };

  const getProductVariants = async (productId) => {
    const res = await api.getProductVariants(productId);
    if (res.error || res.success === false) {
      toast?.error?.(res.error || 'Failed to fetch variants');
      return [];
    }
    return res.data;
  };

  const upload360Media = async (productId, formData) => {
    const res = await api.upload360Media(productId, formData);
    if (res.error || res.success === false) {
      toast?.error?.(res.error || 'Failed to upload 360 media');
      return null;
    }
    toast?.success?.('360 media uploaded');
    return res.data;
  };

  return (
    <AdminDataContext.Provider value={{
      data,
      loading,
      errors,
      refetch,
      addRecord,
      updateRecord,
      deleteRecord,
      generateVariants,
      getProductVariants,
      upload360Media,
    }}>
      {children}
    </AdminDataContext.Provider>
  );
};
