"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { useToast } from '@/context/ToastContext';
import { getFileUrl } from '@/lib/utils';
import '@/app/admin/css/custom.css';

const ProductEditPageContent = () => {
    const toast = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');
    const { data, loading, updateRecord } = useAdminData();
    const brands = data.brands || [];
    const categories = data.categories || [];
    
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [form, setForm] = useState({
        name: '', slug: '', tagline: '', subtitle: '', 
        shortDesc: '', longDesc: '', heritageText: '',
        sku: '', basePrice: '', stock: '',
        brandId: '', categoryId: '', isActive: true,
        heroImage: null, 
        gallery: [],
        bgColor: '#ffffff', accentColor: '#6366f1', textColor: '#1e293b', 
        gradient: '', mistColor: '#f8fafc'
    });
    const [formErrors, setFormErrors] = useState({});
    const [pickerTarget, setPickerTarget] = useState(null);
    const [variantImageModal, setVariantImageModal] = useState(null);

    useEffect(() => {
        if (productId && data.products && data.products.length > 0) {
            const p = data.products.find(item => item.id.toString() === productId);
            if (p) {
                setForm({
                    name: p.name || '',
                    slug: p.slug || '',
                    tagline: p.tagline || '',
                    subtitle: p.subtitle || '',
                    shortDesc: p.shortDescription || '',
                    longDesc: p.description || '',
                    heritageText: p.heritageText || '',
                    sku: p.sku || '',
                    basePrice: p.price?.toString() || '',
                    stock: p.qty?.toString() || '0',
                    brandId: p.brandId?.toString() || '',
                    categoryId: p.mainCategoryId?.toString() || '',
                    isActive: p.status === 'active',
                    heroImage: p.heroImage ? { url: p.heroImage } : (p.images?.length > 0 ? { url: p.images[0] } : null),
                    gallery: p.images?.slice(1).map(url => ({ url })) || [],
                    bgColor: p.bgColor || '#ffffff',
                    accentColor: p.accentColor || '#6366f1',
                    textColor: p.textColor || '#1e293b',
                    gradient: p.gradient || '',
                    mistColor: p.mistColor || '#f8fafc'
                });
            }
        }
    }, [productId, data.products]);

    const handleMediaSelect = (selection) => {
        if (pickerTarget === 'primary') {
            setForm(prev => ({ ...prev, heroImage: selection[0] }));
        } else if (pickerTarget === 'gallery') {
            setForm(prev => ({
                ...prev,
                gallery: [...prev.gallery, ...selection].filter((v, i, a) => a.findIndex(t => t.url === v.url) === i)
            }));
        }
        setPickerTarget(null);
    };

    const moveGalleryImage = (index, direction) => {
        const newGallery = [...form.gallery];
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < newGallery.length) {
            [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
            setForm(prev => ({ ...prev, gallery: newGallery }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'isActive' ? value === 'active' : value),
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
        }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
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
            handleFinalUpdate();
        }
    };

    const handleFinalUpdate = async () => {
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
            heroImage: form.heroImage?.url,
            images: [form.heroImage?.url, ...form.gallery.map(g => g.url)].filter(Boolean),
            bgColor: form.bgColor,
            accentColor: form.accentColor,
            textColor: form.textColor,
            gradient: form.gradient,
            mistColor: form.mistColor,
            status: form.isActive ? 'active' : 'inactive'
        };
        
        await updateRecord('products', productId, payload, api.updateProduct);
        setSubmitting(false);
        router.push('/admin/products');
    };

    if (loading.brands || loading.categories || (productId && loading.products)) {
        return <Loader message="Loading product record..." />;
    }

    const getButtonText = () => {
        if (submitting) return "Updating Product...";
        switch(activeTab) {
            case 'basic': return "Update Basic Info (Go to Story)";
            case 'desc': return "Update Story (Go to Taxonomy)";
            case 'taxonomy': return "Update Taxonomy (Go to Visuals)";
            case 'theme': return "Confirm & Update Product in DB";
            default: return "Update Product";
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 pb-20 animate-fade-in">
            <PageHeader
                title="Edit Product"
                subtitle={`Modifying: ${form.name || productId}`}
            />

            <form onSubmit={handleNextStep} className="mt-8 space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="flex flex-col md:flex-row min-h-[600px]">
                        {/* Sidebar Tabs */}
                        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-6 space-y-2">
                            {[
                                { id: 'basic', label: 'Basic Info', icon: 'fa-info-circle' },
                                { id: 'desc', label: 'Story & Copy', icon: 'fa-align-left' },
                                { id: 'taxonomy', label: 'Taxonomy & Media', icon: 'fa-tags' },
                                { id: 'theme', label: 'Visual Theme', icon: 'fa-palette' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className={`fas ${tab.icon} w-5`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Main Form Content */}
                        <div className="flex-1 p-8">
                            {activeTab === 'basic' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="text-xl font-bold text-gray-900 border-b pb-4">Core Specifications</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
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
                                    <h4 className="text-xl font-bold text-gray-900 border-b pb-4">Brand Storytelling</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Marketing Tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="Legacy of Excellence..." />
                                        <FormField label="Product Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Limited Edition / Premium Finish" />
                                        <div className="md:col-span-2">
                                            <FormField label="Short Summary (Hover/Card)" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} />
                                            <FormField label="Main Product Description" name="longDesc" type="textarea" value={form.longDesc} onChange={handleChange} rows={5} />
                                            <FormField label="Heritage Story" name="heritageText" type="textarea" value={form.heritageText} onChange={handleChange} rows={3} placeholder="The legacy behind this craftsmanship..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'taxonomy' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="text-xl font-bold text-gray-900 border-b pb-4">Classification & Media</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        
                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Primary Image</label>
                                                <div 
                                                    onClick={() => setPickerTarget('primary')}
                                                    className="h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-400 transition-all shadow-inner"
                                                >
                                                    {form.heroImage ? (
                                                        <img src={getFileUrl(form.heroImage.url)} className="w-full h-full object-contain" alt="Preview" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <i className="fas fa-image text-gray-400 text-2xl mb-2"></i>
                                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Select Image</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Gallery</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {form.gallery.map((img, i) => (
                                                        <div key={i} className="aspect-square rounded-lg border border-gray-200 overflow-hidden relative group">
                                                            <img src={getFileUrl(img.url)} className="w-full h-full object-cover" alt="Gallery" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter(g => g.url !== img.url) }))}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                            >
                                                                <i className="fas fa-times text-[10px]"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setPickerTarget('gallery')}
                                                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 hover:border-indigo-400 transition-all"
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'theme' && (
                                <div className="space-y-6 animate-slide-up">
                                    <h4 className="text-xl font-bold text-gray-900 border-b pb-4">UI Theme Customization</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField label="Page Background" name="bgColor" type="color" value={form.bgColor} onChange={handleChange} />
                                        <FormField label="Brand Accent" name="accentColor" type="color" value={form.accentColor} onChange={handleChange} />
                                        <FormField label="Interface Text" name="textColor" type="color" value={form.textColor} onChange={handleChange} />
                                        <FormField label="Surface Tint (Mist)" name="mistColor" type="color" value={form.mistColor} onChange={handleChange} />
                                        <div className="md:col-span-2">
                                            <FormField label="CSS Background Gradient" name="gradient" value={form.gradient} onChange={handleChange} placeholder="linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                            <i className="fas fa-save text-indigo-500"></i>
                            Changes are saved to the master catalog
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                                onClick={() => router.push('/admin/products')}
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Updating...</> : <><i className={`fas ${activeTab === 'theme' ? 'fa-save' : 'fa-arrow-right'} mr-2`}></i> {getButtonText()}</>}
                            </button>
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

const ProductEditPage = () => {
    return (
        <Suspense fallback={<Loader message="Loading Editor..." />}>
            <ProductEditPageContent />
        </Suspense>
    );
};

export default ProductEditPage;
