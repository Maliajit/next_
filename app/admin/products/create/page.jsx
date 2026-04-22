"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import { useToast } from '@/context/ToastContext';

const AddProductPage = () => {
    const toast = useToast();
    const router = useRouter();
    const { data, loading, addRecord } = useAdminData();
    const brands = data.brands || [];
    const categories = data.categories || [];

    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [form, setForm] = useState({
        name: '', slug: '', tagline: '', subtitle: '', 
        shortDesc: '', longDesc: '', heritageText: '',
        sku: '', basePrice: '', stock: '',
        brandId: '', categoryId: '', isActive: true,
        heroImage: '', 
        gallery: [],
        bgColor: '#ffffff', accentColor: '#6366f1', textColor: '#1e293b', 
        gradient: '', mistColor: '#f8fafc'
    });
    const [pickerTarget, setPickerTarget] = useState(null); // 'primary' | 'gallery' | null
    const [formErrors, setFormErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'isActive' ? value === 'active' : value),
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
        }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleMediaSelect = (selection) => {
        if (pickerTarget === 'primary') {
            setForm(prev => ({ ...prev, heroImage: selection }));
        } else if (pickerTarget === 'gallery') {
            // Append new selections to gallery, avoid duplicates
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

    const steps = ['basic', 'desc', 'taxonomy', 'theme'];
    
    const validateStep = (step) => {
        const errs = {};
        if (step === 'basic') {
            if (!form.name.trim()) errs.name = 'Product name is required';
            if (!form.basePrice || isNaN(form.basePrice)) errs.basePrice = 'Valid price is required';
        }
        if (step === 'taxonomy') {
            if (!form.categoryId) errs.categoryId = 'Category is required';
            if (!form.brandId) errs.brandId = 'Brand is required';
        }
        return errs;
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        const currentIndex = steps.indexOf(activeTab);
        const errs = validateStep(activeTab);

        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            toast.error("Please fix the errors before continuing.");
            return;
        }

        if (currentIndex < steps.length - 1) {
            setActiveTab(steps[currentIndex + 1]);
        } else {
            handleFinalSubmit();
        }
    };

    const handleFinalSubmit = async () => {
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
            images: form.heroImage ? [form.heroImage, ...form.gallery] : form.gallery,
            heroImage: form.heroImage,
            bgColor: form.bgColor,
            accentColor: form.accentColor,
            textColor: form.textColor,
            gradient: form.gradient,
            mistColor: form.mistColor,
            status: form.isActive ? 'active' : 'inactive'
        };
        
        const success = await addRecord('products', payload, api.createProduct);
        setSubmitting(false);

        if (success) {
            toast.success("Product saved to catalog successfully!");
            router.push('/admin/products');
        }
    };

    if (loading.brands || loading.categories) {
        return <Loader message="Preparing product form..." />;
    }

    const getButtonText = () => {
        if (submitting) return "Saving Product...";
        switch(activeTab) {
            case 'basic': return "Save Product to Catalog (Go to Story)";
            case 'desc': return "Save Product in Catalog (Go to Taxonomy)";
            case 'taxonomy': return "Save Product in Catalog (Go to Visuals)";
            case 'theme': return "Save Product & Finish to DB";
            default: return "Save Product to Catalog";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader
                title="Add New Product"
                subtitle="Specify model details, heritage branding, and theme visuals"
            />

            <div className="admin-card" style={{ padding: '30px', borderRadius: 20 }}>
                <div style={{ display: 'flex', gap: 40 }}>
                    {/* Sidebar Tabs */}
                    <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { id: 'basic', label: 'Basic Info', icon: 'fa-info-circle' },
                            { id: 'desc', label: 'Story & Copy', icon: 'fa-align-left' },
                            { id: 'taxonomy', label: 'Taxonomy', icon: 'fa-tags' },
                            { id: 'theme', label: 'Visual Theme', icon: 'fa-palette' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                disabled={submitting}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '14px 20px', borderRadius: 12, border: 'none', textAlign: 'left',
                                    background: activeTab === tab.id ? '#6366f1' : '#f8fafc',
                                    color: activeTab === tab.id ? '#fff' : '#64748b',
                                    fontSize: 14, fontWeight: 700, cursor: activeTab === tab.id ? 'default' : 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
                                    opacity: submitting ? 0.5 : 1
                                }}
                            >
                                <i className={`fas ${tab.icon}`} style={{ width: 18 }}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Form Content */}
                    <div style={{ flex: 1 }}>
                        <form onSubmit={handleNextStep} className="space-y-8">
                            {activeTab === 'basic' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs">1</span>
                                        Core Specifications
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <FormField label="Product Title" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fylex Chronograph SE" required error={formErrors.name} />
                                        </div>
                                        <FormField label="Base Price" name="basePrice" type="number" value={form.basePrice} onChange={handleChange} placeholder="15999" required error={formErrors.basePrice} />
                                        <FormField label="Initial Stock Qty" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="50" />
                                        <FormField label="SKU / Model Number" name="sku" value={form.sku} onChange={handleChange} placeholder="FY-CHR-001" />
                                        <FormField label="Publishing Status" name="isActive" type="select" value={form.isActive ? 'active' : 'inactive'} onChange={handleChange} options={[{ value: 'active', label: 'Active (Public)' }, { value: 'inactive', label: 'Inactive (Private)' }]} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'desc' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs">2</span>
                                        Brand Storytelling
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <FormField label="Marketing Tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="Legacy of Excellence..." />
                                        <FormField label="Product Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Limited Edition / Premium Finish" />
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <FormField label="Short Summary (Hover/Card)" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} />
                                            <FormField label="Main Product Description" name="longDesc" type="textarea" value={form.longDesc} onChange={handleChange} rows={5} />
                                            <FormField label="Heritage Story" name="heritageText" type="textarea" value={form.heritageText} onChange={handleChange} rows={3} placeholder="The legacy behind this craftsmanship..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'taxonomy' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs">3</span>
                                        Classification
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <FormField 
                                            label="Brand Owner" 
                                            name="brandId" 
                                            type="select" 
                                            value={form.brandId} 
                                            onChange={handleChange}
                                            options={[{ value: '', label: 'Select Brand' }, ...brands.map(b => ({ value: b.id.toString(), label: b.name }))]}
                                            required
                                            error={formErrors.brandId}
                                        />
                                            <FormField 
                                                label="Primary Category" 
                                                name="categoryId" 
                                                type="select" 
                                                value={form.categoryId} 
                                                onChange={handleChange}
                                                options={[{ value: '', label: 'Select Category' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]}
                                                required
                                                error={formErrors.categoryId}
                                            />

                                            {/* Media Selection Section */}
                                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 24, marginTop: 10 }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                                                    {/* Primary Image */}
                                                    <div>
                                                        <h5 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <i className="fas fa-image text-indigo-500"></i>
                                                            Primary Display Image
                                                        </h5>
                                                        <div 
                                                            onClick={() => setPickerTarget('primary')}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: 200, 
                                                                borderRadius: 16, 
                                                                border: '2px dashed #cbd5e1', 
                                                                background: '#f8fafc',
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                overflow: 'hidden',
                                                                transition: 'all 0.2s',
                                                                position: 'relative'
                                                            }}
                                                            className="hover:border-indigo-400 hover:bg-indigo-50/10"
                                                        >
                                                            {form.heroImage ? (
                                                                <img src={form.heroImage} alt="Primary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                                                    <i className="fas fa-plus-circle text-2xl mb-2"></i>
                                                                    <p style={{ fontSize: 13, fontWeight: 600 }}>Select From Library</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Gallery Images */}
                                                    <div>
                                                        <h5 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <i className="fas fa-images text-indigo-500"></i>
                                                            Product Gallery (Sub Images)
                                                        </h5>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                                            {form.gallery.map((url, i) => (
                                                                <div key={i} style={{ position: 'relative', height: 95, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                    <img src={url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeGalleryImage(url)}
                                                                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button 
                                                                type="button"
                                                                onClick={() => setPickerTarget('gallery')}
                                                                style={{ 
                                                                    height: 95, borderRadius: 12, border: '2px dashed #e2e8f0', background: 'transparent',
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                                    cursor: 'pointer', transition: 'all 0.2s', color: '#94a3b8'
                                                                }}
                                                                className="hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/20"
                                                            >
                                                                <i className="fas fa-plus mb-1"></i>
                                                                <span style={{ fontSize: 10, fontWeight: 700 }}>Add More</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'theme' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                                        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs">4</span>
                                        UI Theme Customization
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                                        <FormField label="Page Background" name="bgColor" type="color" value={form.bgColor} onChange={handleChange} />
                                        <FormField label="Brand Accent" name="accentColor" type="color" value={form.accentColor} onChange={handleChange} />
                                        <FormField label="Interface Text" name="textColor" type="color" value={form.textColor} onChange={handleChange} />
                                        <FormField label="Surface Tint (Mist)" name="mistColor" type="color" value={form.mistColor} onChange={handleChange} />
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <FormField label="CSS Background Gradient" name="gradient" value={form.gradient} onChange={handleChange} placeholder="linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 14, paddingTop: 30, borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                    style={{ padding: '14px 28px' }}
                                >
                                    {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Initializing...</> : <><i className={`fas ${activeTab === 'theme' ? 'fa-check' : 'fa-arrow-right'} mr-2`}></i> {getButtonText()}</>}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => router.push('/admin/products')}
                                    style={{ padding: '14px 28px' }}
                                >
                                    Discard Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
        </div>

        <MediaPickerModal 
            isOpen={!!pickerTarget} 
            onClose={() => setPickerTarget(null)} 
            onSelect={handleMediaSelect}
            multiple={pickerTarget === 'gallery'}
        />
    </div>
);
};

export default AddProductPage;
