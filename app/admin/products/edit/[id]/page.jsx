"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '@/app/admin/css/custom.css';
import { productService, categoryService, brandService } from '@/services';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
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
    heroImage: '',
    gallery: [],
    sku: '', // Added SKU
    slug: '', // Added Slug
  });

  const [pickerTarget, setPickerTarget] = useState(null); // 'primary' | 'gallery' | null

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
      
      // Parse images safely
      let gallery = [];
      if (Array.isArray(p?.images)) {
          gallery = p.images;
      } else if (typeof p?.images === 'string') {
          try { gallery = JSON.parse(p.images); } catch { gallery = []; }
      }

      setForm({
        name: p?.name || '',
        price: p?.price?.toString() || '',
        categoryId: p?.categoryId?.toString() || p?.category?.id?.toString() || '',
        brandId: p?.brandId?.toString() || p?.brand?.id?.toString() || '',
        description: p?.description || '',
        sku: p?.sku || '',
        slug: p?.slug || '',
        heroImage: p?.heroImage || '',
        gallery: gallery.filter(img => img !== p?.heroImage), // Avoid showing hero in gallery
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

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleMediaSelect = (selection) => {
    if (pickerTarget === 'primary') {
        setForm(prev => ({ ...prev, heroImage: selection }));
    } else if (pickerTarget === 'gallery') {
        setForm(prev => {
            const newGallery = [...prev.gallery];
            selection.forEach(url => {
                if (!newGallery.includes(url)) newGallery.push(url);
            });
            return { ...prev, gallery: newGallery };
        });
    }
  };

  const removeGalleryImage = (url) => {
    setForm(prev => ({
        ...prev,
        gallery: prev.gallery.filter(u => u !== url)
    }));
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
    
    const payload = {
        name: form.name,
        price: parseFloat(form.price) || 0,
        mainCategoryId: form.categoryId,
        brandId: form.brandId || null,
        description: form.description,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        sku: form.sku,
        heroImage: form.heroImage,
        images: form.heroImage ? [form.heroImage, ...form.gallery] : form.gallery,
    };

    const res = await productService.updateProduct(productId, payload);
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
              <div className="admin-card-header"><h3>Product Visuals</h3></div>
              <div className="admin-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Primary Image */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Primary Image</p>
                        <div 
                            onClick={() => setPickerTarget('primary')}
                            style={{ 
                                width: '100%', 
                                height: 160, 
                                borderRadius: 12, 
                                border: '2px dashed #e2e8f0', 
                                background: '#f8fafc',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'all 0.2s'
                            }}
                        >
                            {form.heroImage ? (
                                <img src={form.heroImage} alt="Primary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <i className="fas fa-plus mb-1"></i>
                                    <p style={{ fontSize: 11, fontWeight: 600 }}>Select Main</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gallery */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Sub Images (Gallery)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {form.gallery.map((url, i) => (
                                <div key={i} style={{ position: 'relative', height: 75, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <img src={url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                        type="button" 
                                        onClick={() => removeGalleryImage(url)}
                                        style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button"
                                onClick={() => setPickerTarget('gallery')}
                                style={{ 
                                    height: 75, borderRadius: 8, border: '2px dashed #e2e8f0', background: '#f8fafc',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#94a3b8'
                                }}
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
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

      <MediaPickerModal 
        isOpen={!!pickerTarget} 
        onClose={() => setPickerTarget(null)} 
        onSelect={handleMediaSelect}
        multiple={pickerTarget === 'gallery'}
      />
    </div>
  );
};

export default EditProduct;
