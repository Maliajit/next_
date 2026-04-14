"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import { useAdminData } from '@/context/AdminDataContext';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import AdminModal from '@/components/admin/AdminModal';
import { useToast } from '@/context/ToastContext';

const AdminProducts = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const products = data.products || [];
  const brands = data.brands || [];
  const categories = data.categories || [];

  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', subtitle: '', 
    shortDesc: '', longDesc: '', heritageText: '',
    sku: '', basePrice: '', stock: '',
    brandId: '', categoryId: '', isActive: true,
    heroImage: '', 
    bgColor: '#ffffff', accentColor: '#6366f1', textColor: '#1e293b', 
    gradient: '', mistColor: '#f8fafc'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!tableRef.current || loading.products) return;
    tabulatorRef.current?.destroy();

    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        setForm({
          name: rec.name || '',
          slug: rec.slug || '',
          tagline: rec.tagline || '',
          subtitle: rec.subtitle || '',
          shortDesc: rec.shortDescription || rec.shortDesc || '',
          longDesc: rec.description || rec.longDesc || '',
          heritageText: rec.heritageText || '',
          sku: rec.sku || '',
          basePrice: rec.price?.toString() || '',
          stock: (rec.qty ?? rec.stock)?.toString() || '0',
          brandId: rec.brandId?.toString() || '',
          categoryId: rec.mainCategoryId?.toString() || '',
          isActive: rec.status === 'active' || rec.isActive === true || rec.isActive === 1,
          heroImage: rec.heroImage || (Array.isArray(rec.images) && rec.images[0]) || '',
          bgColor: rec.bgColor || '#ffffff',
          accentColor: rec.accentColor || '#6366f1',
          textColor: rec.textColor || '#1e293b',
          gradient: rec.gradient || '',
          mistColor: rec.mistColor || '#f8fafc'
        });
        setActiveTab('basic');
        setShowForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ id, name }),
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: products,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: 'No products found',
      columns: [
        {
          title: 'ID', field: 'id', width: 70, hozAlign: 'center', headerSort: true,
          formatter: (cell) => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>`,
        },
        {
          title: 'PRODUCT INFO', field: 'name', minWidth: 300,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            const imgSrc = d.heroImage || (Array.isArray(d.images) && d.images[0]) || d.image || d.image_url || '';
            const cat = d.mainCategory?.name || d.category?.name || 'Uncategorized';
            return `
              <div style="display:flex;align-items:center;gap:14px;padding:6px 0">
                <div style="width:52px;height:52px;background:#f8fafc;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #e2e8f0">
                  ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover" />` : `<i class="fas fa-box" style="color:#cbd5e1;font-size:18px"></i>`}
                </div>
                <div style="min-width:0">
                  <div style="font-weight:800;color:#1e293b;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name}</div>
                  <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.04em;margin-top:3px">${cat}</div>
                </div>
              </div>`;
          },
        },
        {
          title: 'PRICE / STOCK', field: 'price', width: 180,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            const price = Number(d.price || 0).toLocaleString('en-IN');
            const stock = d.qty ?? d.stock ?? 0;
            const lowStock = stock <= 5;
            return `
              <div>
                <div style="font-weight:800;color:#1e293b;font-size:15px">₹${price}</div>
                <div style="font-size:11px;font-weight:700;color:${lowStock ? '#ef4444' : '#64748b'};margin-top:2px">
                  <i class="fas fa-cubes" style="margin-right:4px;opacity:0.6"></i>${stock} in stock
                </div>
              </div>`;
          },
        },
        {
          title: 'BRAND', field: 'brand.name', width: 130,
          formatter: (cell) => `<span style="color:#475569;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.02em">${cell.getValue() || '—'}</span>`,
        },
        {
          title: 'STATUS', field: 'isActive', width: 120, hozAlign: 'center',
          formatter: (cell) => {
            const active = cell.getValue() === true || cell.getValue() === 1;
            return `<div class="status-badge" style="display:inline-flex;padding:5px 14px;border-radius:10px;font-size:11px;font-weight:700;background:${active ? '#ecfdf5' : '#fef2f2'};color:${active ? '#10b981' : '#64748b'};border:1px solid ${active ? '#d1fae5' : '#e2e8f0'};text-transform:uppercase">${active ? 'active' : 'inactive'}</div>`;
          },
        },
        {
          title: 'ACTIONS', headerSort: false, hozAlign: 'right', width: 110,
          formatter: () => `<div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-icon btn-icon-edit" style="background:#f5f3ff;color:#6366f1" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </div>`,
          cellClick: (e, cell) => {
            const d = cell.getRow().getData();
            if (e.target.closest('.btn-icon-edit')) actionsRef.current.onEdit(d);
            if (e.target.closest('.btn-icon-delete')) actionsRef.current.onDelete(d.id, d.name);
          },
        },
      ],
    });

    return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
  }, [products, loading.products]);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
      // Clean up URL without reload
      const newPath = window.location.pathname;
      window.history.replaceState({}, '', newPath);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'isActive' ? value === 'active' : value),
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.basePrice || isNaN(form.basePrice)) errs.basePrice = 'Valid price is required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    if (!form.brandId) errs.brandId = 'Brand is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSubmitting(true);
    const payload = { 
        name: form.name,
        slug: form.slug,
        sku: form.sku,
        price: parseFloat(form.basePrice) || 0,
        qty: parseInt(form.stock) || 0,
        brandId: form.brandId,
        mainCategoryId: form.categoryId,
        shortDescription: form.shortDesc,
        description: form.longDesc,
        tagline: form.tagline,
        subtitle: form.subtitle,
        heritageText: form.heritageText,
        images: form.heroImage ? [form.heroImage] : [],
        bgColor: form.bgColor,
        accentColor: form.accentColor,
        textColor: form.textColor,
        gradient: form.gradient,
        mistColor: form.mistColor,
        status: form.isActive ? 'active' : 'inactive'
    };
    
    let success;
    if (editingRecord) {
      success = await updateRecord('products', editingRecord.id, payload, api.updateProduct);
    } else {
      success = await addRecord('products', payload, api.createProduct);
    }
    
    setSubmitting(false);

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({
      name: '', slug: '', tagline: '', subtitle: '', 
      shortDesc: '', longDesc: '', heritageText: '',
      sku: '', basePrice: '', stock: '',
      brandId: '', categoryId: '', isActive: true,
      heroImage: '', 
      bgColor: '#ffffff', accentColor: '#6366f1', textColor: '#1e293b', 
      gradient: '', mistColor: '#f8fafc'
    });
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const success = await deleteRecord('products', deleteTarget.id, api.deleteProduct);
    setDeleting(false);
    if (success) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Products"
        subtitle="Full Catalog & Inventory Management"
        action={{ label: 'Add Product', icon: 'fas fa-plus', href: '/admin/products/create' }}
      />

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {loading.products ? <Loader message="Loading catalog..." /> :
         errors.products   ? <ErrorBanner message={errors.products} onRetry={() => refetch.products()} /> :
         <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 1000 }}><div ref={tableRef}></div></div></div>
        }
      </div>

      {/* Product Comprehensive Modal */}
      <AdminModal isOpen={showForm} onClose={closeModal} title={editingRecord ? "Edit Product" : "Register New Product"} maxWidth={900}>
        <div style={{ display: 'flex', gap: 24 }}>
            {/* Left Sidebar for Tabs */}
            <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                    { id: 'basic', label: 'Basic Info', icon: 'fa-info-circle' },
                    { id: 'desc', label: 'Description', icon: 'fa-align-left' },
                    { id: 'taxonomy', label: 'Organize', icon: 'fa-tags' },
                    { id: 'theme', label: 'Visuals/Theme', icon: 'fa-palette' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 16px', borderRadius: 10, border: 'none', textAlign: 'left',
                            background: activeTab === tab.id ? '#6366f115' : 'transparent',
                            color: activeTab === tab.id ? '#6366f1' : '#64748b',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 10
                        }}
                    >
                        <i className={`fas ${tab.icon}`} style={{ width: 16 }}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Form Content */}
            <div style={{ flex: 1 }}>
                <form onSubmit={handleSubmit}>
                    {activeTab === 'basic' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <FormField label="Product Title" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fylex Chronograph SE" required error={formErrors.name} />
                            </div>
                            <FormField label="Price (Base)" name="basePrice" type="number" value={form.basePrice} onChange={handleChange} placeholder="e.g. 15999" required error={formErrors.basePrice} />
                            <FormField label="Initial Stock" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="e.g. 50" />
                            <FormField label="SKU / Internal Model" name="sku" value={form.sku} onChange={handleChange} placeholder="FY-CHR-001" />
                            <FormField label="Status" name="isActive" type="select" value={form.isActive ? 'active' : 'inactive'} onChange={handleChange} options={[{ value: 'active', label: 'Active (Live)' }, { value: 'inactive', label: 'Inactive (Hidden)' }]} />
                        </div>
                    )}

                    {activeTab === 'desc' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <FormField label="Tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="Brief catchy text..." />
                            <FormField label="Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Model variants info..." />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <FormField label="Short Summary" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} />
                                <FormField label="Long Description" name="longDesc" type="textarea" value={form.longDesc} onChange={handleChange} rows={4} />
                                <FormField label="Heritage / Story Text" name="heritageText" type="textarea" value={form.heritageText} onChange={handleChange} rows={2} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'taxonomy' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <FormField 
                                label="Brand" 
                                name="brandId" 
                                type="select" 
                                value={form.brandId} 
                                onChange={handleChange}
                                options={[{ value: '', label: 'Select Brand' }, ...brands.map(b => ({ value: b.id.toString(), label: b.name }))]}
                                required
                                error={formErrors.brandId}
                            />
                            <FormField 
                                label="Main Category" 
                                name="categoryId" 
                                type="select" 
                                value={form.categoryId} 
                                onChange={handleChange}
                                options={[{ value: '', label: 'Select Category' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]}
                                required
                                error={formErrors.categoryId}
                            />
                            <div style={{ gridColumn: '1 / -1' }}>
                                <FormField label="Hero Image URL" name="heroImage" value={form.heroImage} onChange={handleChange} placeholder="https://..." />
                            </div>
                        </div>
                    )}

                    {activeTab === 'theme' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <FormField label="Background Color" name="bgColor" type="color" value={form.bgColor} onChange={handleChange} />
                            <FormField label="Accent Color" name="accentColor" type="color" value={form.accentColor} onChange={handleChange} />
                            <FormField label="Text Color" name="textColor" type="color" value={form.textColor} onChange={handleChange} />
                            <FormField label="Mist Color" name="mistColor" type="color" value={form.mistColor} onChange={handleChange} />
                            {/* <div style={{ gridColumn: '1 / -1' }}>
                                <FormField label="Background Gradient (CSS)" name="gradient" value={form.gradient} onChange={handleChange} placeholder="linear-gradient(...)" />
                            </div> */}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : <><i className={editingRecord ? "fas fa-save mr-2" : "fas fa-plus mr-2"}></i> {editingRecord ? 'Update Catalog' : 'Add to Catalog'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Warning: You are about to remove "${deleteTarget?.name}" from your catalog. This cannot be undone. History of orders will be preserved.`}
        confirmLabel="Destroy Product"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default AdminProducts;
