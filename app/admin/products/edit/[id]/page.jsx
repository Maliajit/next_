"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '@/app/admin/css/custom.css';
import { productService, categoryService, brandService } from '@/services';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

const EditProduct = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    brandId: '',
    description: '',
    existingImages: [],
    newImages: [],
    sku: '', // Added SKU
    slug: '', // Added Slug
  });

  const [previews, setPreviews] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const [productRes, catRes, brandRes] = await Promise.all([
      productService.getProductById(productId),
      categoryService.getCategories(),
      brandService.getBrands(),
    ]);

    if (productRes.error) {
      setFetchError(productRes.error);
    } else {
      const p = productRes.data?.data ?? productRes.data;
      setForm({
        name: p?.name || '',
        price: p?.price?.toString() || '',
        categoryId: p?.categoryId?.toString() || p?.category?.id?.toString() || '',
        brandId: p?.brandId?.toString() || p?.brand?.id?.toString() || '',
        description: p?.description || '',
        sku: p?.sku || '',
        slug: p?.slug || '',
        existingImages: p?.images || (p?.image ? [p.image] : []) || [],
        newImages: [],
      });
    }

    const cats  = Array.isArray(catRes.data?.data) ? catRes.data.data : (Array.isArray(catRes.data) ? catRes.data : []);
    const brnds = Array.isArray(brandRes.data?.data) ? brandRes.data.data : (Array.isArray(brandRes.data) ? brandRes.data : []);
    setCategories(cats);
    setBrands(brnds);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    if (productId) fetchData();
  }, [productId, fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setForm(prev => ({ ...prev, newImages: [...prev.newImages, ...files] }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setForm(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const removeNewImage = (index) => {
    setForm(prev => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index)
    }));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = 'Enter a valid price';
    if (!form.categoryId) errs.categoryId = 'Please select a category';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('price', form.price);
    formData.append('mainCategoryId', form.categoryId);
    if (form.brandId) formData.append('brandId', form.brandId);
    formData.append('description', form.description);
    
    // Auto-generate slug from name if missing
    formData.append('slug', form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    // Ensure SKU is sent
    formData.append('sku', form.sku || `SKU-${Date.now()}`);
    
    // Existing images (to keep)
    form.existingImages.forEach((img) => {
      formData.append('existingImages[]', img);
    });
    
    // New files to upload
    form.newImages.forEach((file) => {
      formData.append('images', file);
    });

    const res = await productService.updateProduct(productId, formData);
    setSubmitting(false);

    const result = res.data || {};

    if (result.success) {
      toast?.success?.('Product updated successfully!');
      router.push('/admin/products');
    } else {
      setSubmitError(result.error);
      toast?.error?.(result.error || 'Failed to update product');
    }
  };

  if (loading) return <Loader message="Loading product..." />;
  if (fetchError) return <ErrorBanner message={fetchError} onRetry={fetchData} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Edit Product"
        subtitle={`Editing: ${form.name || 'Product'}`}
      >
        <Link href="/admin/products" className="btn-secondary">
          <i className="fas fa-arrow-left" style={{ fontSize: 12 }}></i>
          Back to Products
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="admin-card" style={{ borderRadius: 16 }}>
              <div className="admin-card-header"><h3>Basic Information</h3></div>
              <div className="admin-card-body">
                {submitError && <ErrorBanner message={submitError} compact style={{ marginBottom: 18 }} />}
                <FormField label="Product Name" name="name" value={form.name} onChange={handleChange} placeholder="Product name" required error={errors.name} />
                <FormField label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="Product SKU" required error={errors.sku} />
                <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="product-slug" hint="Leave empty to auto-generate from name" />
                <FormField label="Price (₹)" name="price" type="number" value={form.price} onChange={handleChange} placeholder="e.g. 1250" required error={errors.price} />
                <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Describe the product..." rows={5} />
              </div>
            </div>

            <div className="admin-card" style={{ borderRadius: 16 }}>
              <div className="admin-card-header"><h3>Product Images</h3></div>
              <div className="admin-card-body">
                <FormField 
                  label="Select New Images" 
                  name="images" 
                  type="file" 
                  onChange={handleFileChange} 
                  multiple={true} 
                  accept="image/*" 
                  hint="Add more images from your local machine." 
                />
                
                {/* Existing Images */}
                {form.existingImages.length > 0 && (
                  <div style={{ marginBottom: 15 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--admin-text-secondary)' }}>EXISTING IMAGES</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                      {form.existingImages.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-border)', height: 80 }}>
                          <img src={src} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => removeExistingImage(idx)}
                            style={{ 
                              position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.85)', 
                              border: 'none', borderRadius: '50%', width: 18, height: 18, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              color: 'var(--admin-danger)', fontSize: 9
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Image Previews */}
                {previews.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--admin-text-secondary)' }}>NEWLY SELECTED</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                      {previews.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-border)', height: 80, borderStyle: 'dashed', borderColor: 'var(--admin-primary)' }}>
                          <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => removeNewImage(idx)}
                            style={{ 
                              position: 'absolute', top: 2, right: 2, background: 'rgba(255,255,255,0.85)', 
                              border: 'none', borderRadius: '50%', width: 18, height: 18, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              color: 'var(--admin-danger)', fontSize: 9
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="admin-card" style={{ borderRadius: 16 }}>
              <div className="admin-card-header"><h3>Organization</h3></div>
              <div className="admin-card-body">
                <FormField label="Category" name="categoryId" type="select" value={form.categoryId} onChange={handleChange} required error={errors.categoryId} options={(categories || []).map(c => ({ value: c.id, label: c.name }))} />
                <FormField label="Brand" name="brandId" type="select" value={form.brandId} onChange={handleChange} options={(brands || []).map(b => ({ value: b.id, label: b.name }))} hint="Optional" />
              </div>
            </div>

            <div className="admin-card" style={{ borderRadius: 16 }}>
              <div className="admin-card-body">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting
                    ? <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                    : <><i className="fas fa-save"></i> Save Changes</>
                  }
                </button>
                <Link href="/admin/products" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, display: 'flex' }}>
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
