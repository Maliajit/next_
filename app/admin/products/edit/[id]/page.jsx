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
    });

    const [categoryDetails, setCategoryDetails] = useState(null);
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
                    status: p.status || 'draft',
                    productType: p.productType || 'simple',
                    brandId: p.brandId?.toString() || '',
                    categoryId: p.mainCategoryId?.toString() || '',
                    taxClassId: p.taxClassId?.toString() || '',
                    // Hero Image
                    heroImage: p.heroImage ? { url: p.heroImage } : null,
                    // Gallery (if available) - ProductMedia relation or images array
                    gallery: p.productMedia?.map(pm => ({ 
                        id: pm.mediaId.toString(), 
                        url: pm.media.url || `/uploads/${pm.media.fileName}` 
                    })) || [],
                    tagIds: p.tags?.map(t => t.tagId.toString()) || []
                }));

                // 2. Fetch Category Details if category selected
                if (p.mainCategoryId) {
                    const catRes = await api.getCategory(p.mainCategoryId);
                    if (catRes.success) {
                        setCategoryDetails(catRes.data);
                        
                        // Hydrate Specs
                        const specMap = {};
                        p.specifications?.forEach(ps => {
                            specMap[ps.specificationId.toString()] = ps.specificationValueId?.toString() || ps.value;
                        });
                        setForm(prev => ({ ...prev, specifications: specMap }));
                    }
                }

                // 3. Hydrate Variants
                if (p.variants && p.variants.length > 0) {
                    const attrValSelection = {};
                    const mappedVariants = p.variants.map(v => {
                        // Collect attribute selection
                        v.variantAttributes?.forEach(va => {
                            if (!attrValSelection[va.attributeId.toString()]) {
                                attrValSelection[va.attributeId.toString()] = [];
                            }
                            if (!attrValSelection[va.attributeId.toString()].includes(va.attributeValueId.toString())) {
                                attrValSelection[va.attributeId.toString()].push(va.attributeValueId.toString());
                            }
                        });

                        return {
                            id: v.id.toString(),
                            name: v.variantAttributes?.map(va => va.attributeValue.label || va.attributeValue.value).join(' / ') || 'Unnamed Variant',
                            sku: v.sku,
                            price: v.price?.toString() || '',
                            stock: v.qty?.toString() || '0',
                            attributeValues: v.variantAttributes?.map(va => ({
                                attributeId: va.attributeId.toString(),
                                attributeValueId: va.attributeValueId.toString()
                            })),
                            heroImage: v.variantImages?.find(vi => vi.type === 'MAIN')?.media ? { 
                                id: v.variantImages.find(vi => vi.type === 'MAIN').media.id.toString(), 
                                url: v.variantImages.find(vi => vi.type === 'MAIN').media.url || `/uploads/${v.variantImages.find(vi => vi.type === 'MAIN').media.fileName}`
                            } : null,
                            gallery: v.variantImages?.filter(vi => vi.type === 'GALLERY').map(vi => ({
                                id: vi.media.id.toString(),
                                url: vi.media.url || `/uploads/${vi.media.fileName}`
                            })) || []
                        };
                    });
                    setVariants(mappedVariants);
                    setSelectedAttributeValues(attrValSelection);
                }

            } else {
                toast.error("Failed to load product details.");
                router.push('/admin/products');
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("An error occurred while loading the product.");
        } finally {
            setProcessing(false);
        }
    }, [productId, router, toast]);

    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
        }));
    };

    const handleCategoryChange = async (e) => {
        const catId = e.target.value;
        setForm(prev => ({ ...prev, categoryId: catId, specifications: {} }));
        setSelectedAttributeValues({});
        setVariants([]);
        
        if (catId) {
            const res = await api.getCategory(catId);
            if (res.success) {
                setCategoryDetails(res.data);
            }
        } else {
            setCategoryDetails(null);
        }
    };

    const moveGalleryImage = (index, direction) => {
        const newGallery = [...form.gallery];
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < newGallery.length) {
            [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
            setForm(prev => ({ ...prev, gallery: newGallery }));
        }
    };

    const moveVariantGalleryImage = (vIdx, gIdx, direction) => {
        setVariants(prev => {
            const newVariants = [...prev];
            const variant = { ...newVariants[vIdx] };
            const newGallery = [...(variant.gallery || [])];
            const targetIndex = gIdx + direction;
            if (targetIndex >= 0 && targetIndex < newGallery.length) {
                [newGallery[gIdx], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[gIdx]];
                variant.gallery = newGallery;
                newVariants[vIdx] = variant;
            }
            return newVariants;
        });
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

    const handleMediaSelect = (selection) => {
        if (pickerTarget === 'primary') {
            setForm(prev => ({ ...prev, heroImage: selection[0] }));
        } else if (pickerTarget === 'gallery') {
            setForm(prev => ({
                ...prev,
                gallery: [...prev.gallery, ...selection].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            }));
        } else if (typeof pickerTarget === 'object') {
            const { variantIndex, type } = pickerTarget;
            setVariants(prev => {
                const newVariants = [...prev];
                if (type === 'primary') {
                    newVariants[variantIndex].heroImage = selection[0];
                } else {
                    newVariants[variantIndex].gallery = [...(newVariants[variantIndex].gallery || []), ...selection].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                }
                return newVariants;
            });
        }
        setPickerTarget(null);
    };

    const generateVariants = () => {
        if (!categoryDetails || !categoryDetails.attributes) return;

        const arrays = categoryDetails.attributes
            .filter(ca => selectedAttributeValues[ca.attribute.id.toString()]?.length > 0)
            .map(ca => ({
                id: ca.attribute.id.toString(),
                name: ca.attribute.name,
                values: ca.attribute.values.filter(v => selectedAttributeValues[ca.attribute.id.toString()].includes(v.id.toString()))
            }));

        if (arrays.length === 0) {
            toast.error("Please select at least one value for an attribute.");
            return;
        }

        const cartesian = arrays.reduce((acc, curr) => {
            return acc.flatMap(a => curr.values.map(b => [...a, { attrId: curr.id, attrName: curr.name, valId: b.id.toString(), valLabel: b.label || b.value }]));
        }, [[]]);

        const newVariants = cartesian.map(combo => {
            const name = combo.map(c => c.valLabel).join(' / ');
            const skuSuffix = combo.map(c => c.valLabel.substring(0, 3).toUpperCase()).join('-');
            
            // Try to find if this variant already exists to preserve data
            const existing = variants.find(v => 
                v.attributeValues?.length === combo.length && 
                v.attributeValues.every(av => combo.find(c => c.attrId === av.attributeId && c.valId === av.attributeValueId))
            );

            if (existing) return existing;

            return {
                name,
                sku: `${form.sku || 'SKU'}-${skuSuffix}`,
                price: '',
                stock: '0',
                attributeValues: combo.map(c => ({ 
                    attributeId: c.attrId, 
                    attributeValueId: c.valId 
                })),
                heroImage: null,
                gallery: [],
                id: Math.random().toString(36).substr(2, 9)
            };
        });

        setVariants(newVariants);
    };

    const updateVariantField = (index, field, value) => {
        setVariants(prev => {
            const newVariants = [...prev];
            newVariants[index][field] = value;
            return newVariants;
        });
    };

    const removeVariant = (index) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.categoryId) {
            toast.error("Please fill required fields.");
            return;
        }

        setSubmitting(true);
        const { shortDesc, categoryId, ...formData } = form;
        const payload = {
            ...formData,
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
                const specItem = categoryDetails.specGroups.flatMap(sg => sg.specGroup.specifications).find(s => s.specification.id.toString() === id);
                const isDropdown = specItem?.specification.type === 'select';
                return {
                    specificationId: id,
                    value: isDropdown ? (specItem.specification.values.find(v => v.id.toString() === val)?.value || '') : (val || ''),
                    specificationValueId: isDropdown ? val : null
                };
            }),
            variants: variants.map(v => ({
                id: (v.id && !v.id.includes('.')) ? v.id : undefined, // Only send numeric IDs for existing ones
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
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
            <PageHeader title="Edit Product" subtitle={`Refining details for ${form.name}`} />

            <form onSubmit={handleSubmit} className="space-y-8 mt-8">
                {/* 1. Core Information */}
                <div className="admin-card p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-info-circle text-indigo-500"></i> Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <FormField label="Product Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fylex Chronograph X" required />
                        </div>
                        <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="fylex-chronograph-x" />
                        <FormField label="Product Code (Art. No.)" name="productCode" value={form.productCode} onChange={handleChange} placeholder="FY-CHR-001" />
                        <div className="col-span-2">
                            <FormField label="Short Description" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} />
                        </div>
                        <div className="col-span-2">
                            <FormField label="Full Description" name="description" type="textarea" value={form.description} onChange={handleChange} rows={5} />
                        </div>
                        <FormField label="Status" name="status" type="select" value={form.status} onChange={handleChange} options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'draft', label: 'Draft' }
                        ]} />
                        {form.productType === 'simple' && (
                            <>
                                <FormField label="Base Price *" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0.00" required />
                                <FormField label="Inventory (Quantity) *" name="qty" type="number" value={form.qty} onChange={handleChange} placeholder="0" required />
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Media (Only for Simple Products) */}
                {form.productType === 'simple' && (
                    <div className="admin-card p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i className="fas fa-images text-indigo-500"></i> Product Media
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Primary Image</label>
                                <div 
                                    onClick={() => setPickerTarget('primary')}
                                    className="h-64 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-400 hover:bg-indigo-50/10 transition-all"
                                >
                                    {form.heroImage ? (
                                        <img src={getFileUrl(form.heroImage.url)} className="w-full h-full object-contain" alt="Preview" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-all">
                                                <i className="fas fa-plus"></i>
                                            </div>
                                            <p className="text-slate-400 font-semibold">Select Main Image</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Gallery Images</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {form.gallery.map((img, i) => (
                                        <div key={i} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group">
                                            <img src={getFileUrl(img.url)} className="w-full h-full object-cover" alt="Gallery" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => moveGalleryImage(i, -1)}
                                                    disabled={i === 0}
                                                    className="w-8 h-8 bg-white/90 text-slate-700 rounded-full flex items-center justify-center hover:bg-white disabled:opacity-50 cursor-pointer"
                                                >
                                                    <i className="fas fa-arrow-left text-xs"></i>
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => moveGalleryImage(i, 1)}
                                                    disabled={i === form.gallery.length - 1}
                                                    className="w-8 h-8 bg-white/90 text-slate-700 rounded-full flex items-center justify-center hover:bg-white disabled:opacity-50 cursor-pointer"
                                                >
                                                    <i className="fas fa-arrow-right text-xs"></i>
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter(g => g.id !== img.id) }))}
                                                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => setPickerTarget('gallery')}
                                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                                    >
                                        <i className="fas fa-plus mb-1"></i>
                                        <span className="text-[10px] font-bold">Add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Organization */}
                <div className="admin-card p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Organization</h3>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                        <FormField label="Product Type" name="productType" type="select" value={form.productType} onChange={handleChange} options={[
                            { value: 'simple', label: 'Simple Product' },
                            { value: 'configurable', label: 'Configurable (Variants)' }
                        ]} />
                        <FormField label="Main Category *" name="categoryId" type="select" value={form.categoryId} onChange={handleCategoryChange} options={[
                            { value: '', label: 'Select Category' },
                            ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
                        ]} />
                        <FormField label="Brand" name="brandId" type="select" value={form.brandId} onChange={handleChange} options={[
                            { value: '', label: 'Select Brand' },
                            ...brands.map(b => ({ value: b.id.toString(), label: b.name }))
                        ]} />
                        <FormField label="Tax Class" name="taxClassId" type="select" value={form.taxClassId} onChange={handleChange} options={[
                            { value: '', label: 'None' },
                            ...taxClasses.map(tc => ({ value: tc.id.toString(), label: tc.name }))
                        ]} />
                        <div className="flex flex-col">
                            <label className="text-sm font-bold text-slate-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[50px]">
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
                                            ? 'bg-indigo-500 text-white shadow-md' 
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Specifications */}
                {categoryDetails && (
                    <div className="admin-card p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i className="fas fa-list-ul text-indigo-500"></i> Specifications
                        </h3>
                        {categoryDetails.specGroups?.map((group, gIdx) => (
                            <div key={gIdx} className="mb-8 last:mb-0">
                                <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                                    <span className="h-px bg-slate-200 flex-1"></span>
                                    {group.specGroup.name}
                                    <span className="h-px bg-slate-200 flex-1"></span>
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    {group.specGroup.specifications?.map((spec, sIdx) => {
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
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 5. Variants */}
                {form.productType === 'configurable' && categoryDetails && (
                    <div className="admin-card p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Product Variants</h3>
                        
                        <div className="space-y-6">
                            <p className="text-sm text-slate-500 italic">Manage Attribute Values for Variants</p>
                            <div className="grid grid-cols-1 gap-4">
                                {categoryDetails.attributes?.map((attrWrapper, idx) => {
                                    const attr = attrWrapper.attribute;
                                    return (
                                        <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-white">
                                            <label className="flex items-center gap-2 font-bold text-slate-700 mb-4 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                    checked={selectedAttributeValues[attr.id.toString()]?.length > 0}
                                                    readOnly
                                                />
                                                {attr.name}
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {attr.values?.map(val => (
                                                    <button
                                                        key={val.id}
                                                        type="button"
                                                        onClick={() => toggleAttributeValue(attr.id, val.id)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                            selectedAttributeValues[attr.id.toString()]?.includes(val.id.toString())
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
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
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                            >
                                Regenerate / Update Variants
                            </button>

                            {variants.length > 0 && (
                                <div className="mt-8 overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-left">
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl">Variant Name</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">SKU</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Price</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Stock</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Images</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {variants.map((variant, vIdx) => (
                                                <tr key={vIdx} className="hover:bg-slate-50/50 transition-all">
                                                    <td className="p-4 font-bold text-slate-700">{variant.name}</td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="text" 
                                                            value={variant.sku} 
                                                            onChange={(e) => updateVariantField(vIdx, 'sku', e.target.value)}
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="number" 
                                                            value={variant.price} 
                                                            onChange={(e) => updateVariantField(vIdx, 'price', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input 
                                                            type="number" 
                                                            value={variant.stock} 
                                                            onChange={(e) => updateVariantField(vIdx, 'stock', e.target.value)}
                                                            className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex -space-x-2">
                                                                {variant.heroImage ? (
                                                                    <div className="w-10 h-10 rounded-full border-2 border-white object-cover overflow-hidden bg-slate-100 shadow-sm" title="Main Image">
                                                                        <img src={getFileUrl(variant.heroImage.url)} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-300 shadow-sm" title="No Main Image">
                                                                        <i className="fas fa-image text-xs"></i>
                                                                    </div>
                                                                )}
                                                                {variant.gallery?.length > 0 && (
                                                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-bold shadow-sm" title={`${variant.gallery.length} Gallery Images`}>
                                                                        +{variant.gallery.length}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setVariantImageModal({ index: vIdx, name: variant.name })}
                                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-wider"
                                                            >
                                                                Manage
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeVariant(vIdx)}
                                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-6 border-t border-slate-100 flex items-center justify-between mt-12 z-10 rounded-2xl shadow-xl border border-slate-200">
                    <div className="flex items-center gap-4 text-slate-400 text-sm italic">
                        <i className="fas fa-history"></i> Last saved: Just now
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/products')}
                            className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            {submitting ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
                        </button>
                    </div>
                </div>
            </form>

            <MediaPickerModal 
                isOpen={!!pickerTarget} 
                onClose={() => setPickerTarget(null)} 
                onSelect={handleMediaSelect}
                multiple={pickerTarget === 'gallery' || (pickerTarget && typeof pickerTarget === 'object' && pickerTarget.type === 'gallery')}
            />

            {/* Variant Image Type Selection Modal */}
            {variantImageModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center pb-48 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setVariantImageModal(null)}>
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-extrabold text-slate-900">Manage Variant Images</h4>
                                <p className="text-xs text-slate-500 mt-1">Configure media for <span className="text-indigo-600 font-semibold">{variantImageModal.name}</span></p>
                            </div>
                            <button type="button" onClick={() => setVariantImageModal(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* Variant Gallery Preview & Reorder */}
                            {variants[variantImageModal.index]?.gallery?.length > 0 && (
                                <div className="mb-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Current Gallery Display Order</label>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                                        {variants[variantImageModal.index].gallery.map((img, gIdx) => (
                                            <div key={gIdx} className="relative flex-none w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden group/item shadow-sm">
                                                <img src={getFileUrl(img.url)} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/item:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5">
                                                    <div className="flex gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => moveVariantGalleryImage(variantImageModal.index, gIdx, -1)}
                                                            disabled={gIdx === 0}
                                                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                                                        ><i className="fas fa-chevron-left text-xs"></i></button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => moveVariantGalleryImage(variantImageModal.index, gIdx, 1)}
                                                            disabled={gIdx === variants[variantImageModal.index].gallery.length - 1}
                                                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                                                        ><i className="fas fa-chevron-right text-xs"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setPickerTarget({ variantIndex: variantImageModal.index, type: 'primary' });
                                        setVariantImageModal(null);
                                    }}
                                    className="w-full flex items-center gap-5 p-5 rounded-3xl border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group/btn cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all shadow-sm">
                                        <i className="fas fa-star text-xl"></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-extrabold text-slate-900">Primary Product Image</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Hero image for the catalog view</div>
                                    </div>
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => {
                                        setPickerTarget({ variantIndex: variantImageModal.index, type: 'gallery' });
                                        setVariantImageModal(null);
                                    }}
                                    className="w-full flex items-center gap-5 p-5 rounded-3xl border border-slate-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all group/btn cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-all shadow-sm">
                                        <i className="fas fa-images text-xl"></i>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-extrabold text-slate-900">Add Gallery Images</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Detailed views and lifestyle shots</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-center">
                            <button 
                                type="button"
                                onClick={() => setVariantImageModal(null)}
                                className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] cursor-pointer transition-colors"
                            >
                                Dismiss Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProductPage;
