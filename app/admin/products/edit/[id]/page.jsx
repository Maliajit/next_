"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getFileUrl } from '@/lib/utils';

const EditProductPage = () => {
    const toast = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = params?.id;

    const { data, loading, updateRecord } = useAdminData();
    const brands = data.brands || [];
    const categories = data.categories || [];
    const taxClasses = data.taxClasses || [];
    const [tags, setTags] = useState([]);

    const [processing, setProcessing] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        name: '', slug: '', productCode: '',
        shortDesc: '', description: '',
        status: 'draft', productType: 'simple',
        brandId: '', categoryId: '', taxClassId: '',
        heroImage: null, // {id, url}
        gallery: [], // [{id, url}]
        tagIds: [],
        specifications: {}, // specId: value
        sku: '',
        price: '',
        qty: '',
        subtitle: '',
        tagline: '',
        bgColor: '#ffffff',
        accentColor: '#c4a35a',
        textColor: '#1a1a1a',
        gradient: '',
        mistColor: '#f8fafc',
    });

    const [categoryDetails, setCategoryDetails] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [selectedAttributeValues, setSelectedAttributeValues] = useState({}); // attrId: [valIds]
    const [variants, setVariants] = useState([]);
    const [pickerTarget, setPickerTarget] = useState(null); // 'primary' | 'gallery' | {variantIndex, type}
    const [variantImageModal, setVariantImageModal] = useState(null); // { index, name }

    const fetchProductDetails = useCallback(async () => {
        if (!productId) return;
        setProcessing(true);
        
        try {
            const [prodRes, tagsRes] = await Promise.all([
                api.getProduct(productId),
                api.getTags()
            ]);

            if (tagsRes.success) setTags(tagsRes.data);

            if (prodRes.success) {
                const p = prodRes.data;
                
                // 1. Basic Form
                setForm(prev => ({
                    ...prev,
                    name: p.name || '',
                    slug: p.slug || '',
                    productCode: p.productCode || '',
                    sku: p.sku || '',
                    shortDesc: p.shortDescription || '',
                    description: p.description || '',
                    heritageText: p.heritageText || '',
                    status: p.status || 'draft',
                    productType: p.productType || 'simple',
                    brandId: p.brandId?.toString() || '',
                    categoryId: p.mainCategoryId?.toString() || '',
                    taxClassId: p.taxClassId?.toString() || '',
                    price: p.price?.toString() || '',
                    qty: p.qty?.toString() || '0',
                    subtitle: p.subtitle || '',
                    tagline: p.tagline || '',
                    bgColor: p.bgColor || '#ffffff',
                    accentColor: p.accentColor || '#c4a35a',
                    textColor: p.textColor || '#1a1a1a',
                    gradient: p.gradient || '',
                    mistColor: p.mistColor || '#f8fafc',
                    // Hero Image
                    heroImage: p.heroImage ? { url: p.heroImage.startsWith('http') || p.heroImage.startsWith('/') ? p.heroImage : `/uploads/${p.heroImage}` } : null,
                    // Gallery
                    gallery: (p.productMedia?.length > 0) 
                        ? p.productMedia.map(pm => ({ 
                            id: pm.mediaId.toString(), 
                            url: pm.media?.url || (pm.media?.fileName ? `/uploads/${pm.media.fileName}` : '')
                        })) 
                        : (p.images || []).filter(img => img !== p.heroImage).map((img, idx) => ({
                            id: `img-${idx}`,
                            url: img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`
                        })),
                    tagIds: p.tags?.map(t => t.tagId.toString()) || [],
                    specifications: p.specifications?.reduce((acc, s) => {
                        acc[s.specificationId.toString()] = s.specificationValueId ? s.specificationValueId.toString() : s.value;
                        return acc;
                    }, {}) || {}
                }));

                // 2. Fetch Category Details
                if (p.mainCategoryId) {
                    const catRes = await api.getCategory(p.mainCategoryId);
                    if (catRes.success) setCategoryDetails(catRes.data);
                }

                // 3. Hydrate Variants
                if (p.variants?.length > 0) {
                    setVariants(p.variants.map(v => ({
                        id: v.id,
                        sku: v.sku,
                        price: v.price?.toString(),
                        stock: v.qty?.toString(),
                        name: v.variantAttributes?.map(va => va.attributeValue?.label || va.attributeValue?.value).join(', ') || v.sku,
                        attributeValues: v.variantAttributes?.map(va => ({
                            attributeId: va.attributeId.toString(),
                            attributeValueId: va.attributeValueId.toString()
                        })) || [],
                        heroImage: v.variantImages?.find(vi => vi.type === 'MAIN')?.media ? {
                            id: v.variantImages.find(vi => vi.type === 'MAIN').mediaId.toString(),
                            url: v.variantImages.find(vi => vi.type === 'MAIN').media.url || `/uploads/${v.variantImages.find(vi => vi.type === 'MAIN').media.fileName}`
                        } : null,
                        gallery: v.variantImages?.filter(vi => vi.type === 'GALLERY').map(vi => ({
                            id: vi.mediaId.toString(),
                            url: vi.media.url || `/uploads/${vi.media.fileName}`
                        })) || []
                    })));

                    // Hydrate selectedAttributeValues
                    const attrMap = {};
                    p.variants.forEach(v => {
                        v.variantAttributes?.forEach(va => {
                            const aid = va.attributeId.toString();
                            const avid = va.attributeValueId.toString();
                            if (!attrMap[aid]) attrMap[aid] = [];
                            if (!attrMap[aid].includes(avid)) attrMap[aid].push(avid);
                        });
                    });
                    setSelectedAttributeValues(attrMap);
                }
            }
        } catch (err) {
            console.error("Hydration Error:", err);
            toast.error("Failed to load product details.");
        } finally {
            setProcessing(false);
        }
    }, [productId, toast]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setForm(prev => ({ ...prev, categoryId: catId, specifications: {} }));
        setSelectedAttributeValues({});
        setVariants([]);
        
        if (catId) {
            const res = await api.getCategory(catId);
            if (res.success) setCategoryDetails(res.data);
        } else {
            setCategoryDetails(null);
        }
    };

    const handleSpecChange = (specId, value) => {
        setForm(prev => ({
            ...prev,
            specifications: { ...prev.specifications, [specId]: value }
        }));
    };

    const toggleAttributeValue = (attrId, valId) => {
        setSelectedAttributeValues(prev => {
            const current = prev[attrId] || [];
            const valIdStr = valId.toString();
            if (current.includes(valIdStr)) {
                return { ...prev, [attrId]: current.filter(id => id !== valIdStr) };
            } else {
                return { ...prev, [attrId]: [...current, valIdStr] };
            }
        });
    };

    const generateVariants = async () => {
        if (!form.categoryId) return toast.error("Select category first");
        
        const selections = Object.entries(selectedAttributeValues)
            .filter(([_, vals]) => vals.length > 0)
            .map(([attrId, vals]) => ({
                attributeId: parseInt(attrId),
                attributeValueIds: vals.map(id => parseInt(id))
            }));

        if (selections.length === 0) return toast.error("Select at least one attribute value");

        const res = await api.generateVariants(productId, selections);
        if (res.success) {
            setVariants(res.data.map(v => ({
                sku: v.sku,
                price: form.price,
                stock: '0',
                name: v.name,
                attributeValues: v.attributeValues,
                heroImage: null,
                gallery: []
            })));
            toast.success(`Generated ${res.data.length} variants`);
        } else {
            toast.error(res.error || "Generation failed");
        }
    };

    const updateVariantField = (idx, field, value) => {
        setVariants(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    const removeVariant = (idx) => {
        setVariants(prev => prev.filter((_, i) => i !== idx));
    };

    const handleMediaSelect = (selection) => {
        if (pickerTarget === 'primary') {
            setForm(prev => ({ ...prev, heroImage: selection[0] }));
        } else if (pickerTarget === 'gallery') {
            setForm(prev => ({
                ...prev,
                gallery: [...prev.gallery, ...selection]
            }));
        } else if (typeof pickerTarget === 'object') {
            const { variantIndex, type } = pickerTarget;
            setVariants(prev => {
                const next = [...prev];
                if (type === 'primary') {
                    next[variantIndex].heroImage = selection[0];
                } else {
                    next[variantIndex].gallery = [...(next[variantIndex].gallery || []), ...selection];
                }
                return next;
            });
        }
        setPickerTarget(null);
    };

    const removeVariantImage = (vIdx, imgId) => {
        setVariants(prev => {
            const next = [...prev];
            next[vIdx].gallery = next[vIdx].gallery.filter(img => img.id !== imgId);
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.categoryId) return toast.error("Please fill required fields.");

        setSubmitting(true);
        const payload = {
            ...form,
            shortDescription: form.shortDesc,
            mainCategoryId: form.categoryId,
            sku: form.sku || form.productCode || `SKU-${Date.now()}`,
            price: variants.length > 0 
                ? Math.min(...variants.map(v => parseFloat(v.price) || Infinity)).toString()
                : (form.price || '0'),
            qty: variants.length > 0 
                ? variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0)
                : (parseInt(form.qty) || 0),
            tagIds: form.tagIds,
            heroImage: form.heroImage?.url,
            images: [form.heroImage?.url, ...form.gallery.map(g => g.url)].filter(Boolean),
            specifications: Object.entries(form.specifications).map(([id, val]) => {
                const specItem = categoryDetails?.specGroups?.flatMap(sg => sg.specGroup.specifications).find(s => s.specification.id.toString() === id);
                const isDropdown = specItem?.specification.type === 'select';
                return {
                    specificationId: id,
                    value: isDropdown ? (specItem.specification.values.find(v => v.id.toString() === val)?.value || '') : (val || ''),
                    specificationValueId: isDropdown ? val : null
                };
            }),
            variants: variants.map(v => ({
                id: v.id,
                sku: v.sku,
                price: parseFloat(v.price) || 0,
                stock: parseInt(v.stock) || 0,
                attributeValues: v.attributeValues,
                heroImageId: v.heroImage?.id || undefined,
                galleryIds: v.gallery?.map(g => g.id).filter(id => id != null) || []
            }))
        };

        const success = await updateRecord('products', productId, payload, api.updateProduct);
        setSubmitting(false);
        if (success) {
            toast.success("Product updated successfully!");
            router.push('/admin/products');
        }
    };

    if (processing || loading.brands || loading.categories) return <Loader />;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-8">
                <PageHeader title="Edit Product" subtitle={`Refining details for ${form.name}`} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="flex flex-col md:flex-row min-h-[600px]">
                        {/* Sidebar Tabs */}
                        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-6 space-y-2">
                            {[
                                { id: 'basic', label: 'Basic Info', icon: 'fa-info-circle' },
                                { id: 'story', label: 'Story & Copy', icon: 'fa-align-left' },
                                { id: 'taxonomy', label: 'Taxonomy', icon: 'fa-tags' },
                                { id: 'theme', label: 'Visual Theme', icon: 'fa-palette' },
                                { id: 'variants', label: 'Variants', icon: 'fa-cubes' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
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

                        {/* Tab Content */}
                        <div className="flex-1 p-8">
                            {activeTab === 'basic' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Core Specifications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <FormField label="Product Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fylex Chronograph X" required />
                                        </div>
                                        <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="fylex-chronograph-x" />
                                        <FormField label="Product Subtitle" name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="e.g. Luxury Collection" />
                                        <FormField label="Product Tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="e.g. A Legacy of Precision" />
                                        <FormField label="Product Code" name="productCode" value={form.productCode} onChange={handleChange} placeholder="FY-CHR-001" />
                                        <FormField label="Base SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="FY-001" />
                                        
                                        <FormField label="Status" name="status" type="select" value={form.status} onChange={handleChange} options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'inactive', label: 'Inactive' },
                                            { value: 'draft', label: 'Draft' }
                                        ]} />
                                        
                                        <FormField label="Product Type" name="productType" type="select" value={form.productType} onChange={handleChange} options={[
                                            { value: 'simple', label: 'Simple Product' },
                                            { value: 'configurable', label: 'Configurable (Variants)' }
                                        ]} />

                                        {form.productType === 'simple' && (
                                            <>
                                                <FormField label="Base Price (₹) *" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00" required />
                                                <FormField label="Stock Quantity *" name="qty" type="number" value={form.qty} onChange={handleChange} placeholder="0" required />
                                            </>
                                        )}

                                        {/* Media for Simple Product */}
                                        {form.productType === 'simple' && (
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
                                                                    onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter(g => g.id !== img.id) }))}
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
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'story' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Marketing & Content</h3>
                                    <div className="space-y-6">
                                        <FormField label="Short Description" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} placeholder="A brief summary for listings..." />
                                        <FormField label="Full Description" name="description" type="textarea" value={form.description} onChange={handleChange} rows={6} placeholder="Detailed product storytelling..." />
                                        <FormField label="Heritage Story" name="heritageText" type="textarea" value={form.heritageText} onChange={handleChange} rows={4} placeholder="The legacy and craftsmanship behind this piece..." />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'taxonomy' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Classification</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="Brand" name="brandId" type="select" value={form.brandId} onChange={handleChange} options={[{ value: '', label: 'Select Brand' }, ...brands.map(b => ({ value: b.id.toString(), label: b.name }))]} />
                                        <FormField label="Main Category *" name="categoryId" type="select" value={form.categoryId} onChange={handleCategoryChange} options={[{ value: '', label: 'Select Category' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]} required />
                                        <FormField label="Tax Class" name="taxClassId" type="select" value={form.taxClassId} onChange={handleChange} options={[{ value: '', label: 'Select Tax Class' }, ...taxClasses.map(t => ({ value: t.id.toString(), label: t.name }))]} />
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Product Tags</label>
                                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => setForm(prev => ({
                                                            ...prev,
                                                            tagIds: prev.tagIds.includes(tag.id.toString()) 
                                                                ? prev.tagIds.filter(id => id !== tag.id.toString())
                                                                : [...prev.tagIds, tag.id.toString()]
                                                        }))}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                            form.tagIds.includes(tag.id.toString()) 
                                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                                            : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-400'
                                                        }`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {categoryDetails && (
                                            <div className="md:col-span-2 mt-4 border-t pt-8">
                                                <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                    <i className="fas fa-list-ul text-indigo-600"></i> Technical Specifications
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {categoryDetails.specGroups?.map((group) => 
                                                        group.specGroup.specifications?.map((spec, sIdx) => {
                                                            const s = spec.specification;
                                                            return (
                                                                <div key={sIdx}>
                                                                    {s.type === 'select' ? (
                                                                        <FormField 
                                                                            label={s.name} 
                                                                            type="select" 
                                                                            value={form.specifications[s.id.toString()] || ''} 
                                                                            onChange={(e) => handleSpecChange(s.id.toString(), e.target.value)}
                                                                            options={[{ value: '', label: `Select ${s.name}` }, ...s.values.map(v => ({ value: v.id.toString(), label: v.label || v.value }))]}
                                                                        />
                                                                    ) : (
                                                                        <FormField 
                                                                            label={s.name} 
                                                                            value={form.specifications[s.id.toString()] || ''} 
                                                                            onChange={(e) => handleSpecChange(s.id.toString(), e.target.value)}
                                                                            placeholder={s.name}
                                                                        />
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'theme' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">UI Theme Customization</h3>
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

                            {activeTab === 'variants' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-xl font-bold text-gray-900 border-b pb-4">Product Variants</h3>
                                    {form.productType === 'configurable' && categoryDetails ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                {categoryDetails.attributes?.map((attrWrapper, idx) => {
                                                    const attr = attrWrapper.attribute;
                                                    return (
                                                        <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-white">
                                                            <label className="font-bold text-gray-700 mb-3 block">{attr.name}</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {attr.values?.map(val => (
                                                                    <button
                                                                        key={val.id}
                                                                        type="button"
                                                                        onClick={() => toggleAttributeValue(attr.id, val.id)}
                                                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                                                            selectedAttributeValues[attr.id.toString()]?.includes(val.id.toString())
                                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'
                                                                        }`}
                                                                    >
                                                                        {val.label || val.value}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={generateVariants}
                                                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2"
                                            >
                                                <i className="fas fa-magic"></i> Update Configurations
                                            </button>

                                            {variants.length > 0 && (
                                                <div className="mt-8 overflow-x-auto rounded-xl border border-gray-100">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variant</th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media</th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {variants.map((variant, vIdx) => (
                                                                <tr key={vIdx} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-4 py-4 text-sm font-bold text-gray-900">{variant.name}</td>
                                                                    <td className="px-4 py-4">
                                                                        <input type="text" value={variant.sku} onChange={(e) => updateVariantField(vIdx, 'sku', e.target.value)} className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <input type="number" value={variant.price} onChange={(e) => updateVariantField(vIdx, 'price', e.target.value)} className="w-20 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <input type="number" value={variant.stock} onChange={(e) => updateVariantField(vIdx, 'stock', e.target.value)} className="w-16 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
                                                                    </td>
                                                                    <td className="px-4 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex -space-x-2">
                                                                                {variant.heroImage ? (
                                                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                                                        <img src={getFileUrl(variant.heroImage.url)} className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-300 shadow-sm">
                                                                                        <i className="fas fa-image text-[10px]"></i>
                                                                                    </div>
                                                                                )}
                                                                                {variant.gallery?.length > 0 && (
                                                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-indigo-600 text-[8px] font-bold shadow-sm">
                                                                                        +{variant.gallery.length}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <button type="button" onClick={() => setVariantImageModal({ index: vIdx, name: variant.name })} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition-all">Manage</button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-4 text-right">
                                                                        <button type="button" onClick={() => removeVariant(vIdx)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt"></i></button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                                                <i className="fas fa-cubes text-2xl"></i>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900">Simple Product Mode</h4>
                                            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                                                Switch to "Configurable" in Basic Info to manage variations like Size, Color, or Material.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                        <div className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                            <i className="fas fa-shield-alt text-indigo-500"></i>
                            Modifying existing products updates all store listings instantly
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/products')}
                                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-10 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-check-circle"></i> Update Product</>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <MediaPickerModal 
                isOpen={!!pickerTarget} 
                onClose={() => setPickerTarget(null)}
                onSelect={handleMediaSelect}
                multiple={pickerTarget === 'gallery' || (pickerTarget && typeof pickerTarget === 'object' && pickerTarget.type === 'gallery')}
            />

            {variantImageModal !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-900">Manage Variant Media</h3>
                                <p className="text-xs text-gray-500 mt-1">{variantImageModal.name}</p>
                            </div>
                            <button onClick={() => setVariantImageModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto space-y-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Primary Image</label>
                                <div onClick={() => setPickerTarget({ variantIndex: variantImageModal.index, type: 'primary' })} className="h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-400 transition-all">
                                    {variants[variantImageModal.index].heroImage ? (
                                        <img src={getFileUrl(variants[variantImageModal.index].heroImage.url)} className="w-full h-full object-contain" alt="Variant Hero" />
                                    ) : (
                                        <div className="text-center">
                                            <i className="fas fa-plus text-gray-300 text-xl mb-2"></i>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase">Add Main Image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Gallery Images</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {variants[variantImageModal.index].gallery?.map((img, i) => (
                                        <div key={i} className="aspect-square rounded-xl border border-gray-100 overflow-hidden relative group">
                                            <img src={getFileUrl(img.url)} className="w-full h-full object-cover" alt="Gallery" />
                                            <button type="button" onClick={() => removeVariantImage(variantImageModal.index, img.id)} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setPickerTarget({ variantIndex: variantImageModal.index, type: 'gallery' })} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 hover:border-indigo-400 hover:text-indigo-500 transition-all">
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 text-right">
                            <button onClick={() => setVariantImageModal(null)} className="px-8 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-all">Save Media</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProductPage;
