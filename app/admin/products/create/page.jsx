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
import { getFileUrl } from '@/lib/utils';

const AddProductPage = () => {
    const toast = useToast();
    const router = useRouter();
    const { data, loading, addRecord } = useAdminData();
    const brands = data.brands || [];
    const categories = data.categories || [];
    const taxClasses = data.taxClasses || [];
    const [tags, setTags] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', slug: '', productCode: '',
        shortDesc: '', description: '',
        status: 'draft', productType: 'simple',
        brandId: '', categoryId: '', taxClassId: '',
        heroImage: null,
        gallery: [],
        tagIds: [],
        specifications: {},
    });

    const [categoryDetails, setCategoryDetails] = useState(null);
    const [selectedAttributeValues, setSelectedAttributeValues] = useState({});
    const [variants, setVariants] = useState([]);
    const [pickerTarget, setPickerTarget] = useState(null);
    const [variantImageModal, setVariantImageModal] = useState(null);

    useEffect(() => {
        const fetchTags = async () => {
            const res = await api.getTags();
            if (res.success) setTags(res.data);
        };
        fetchTags();
    }, []);

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

    const handleSpecChange = (specId, value) => {
        setForm(prev => ({
            ...prev,
            specifications: { ...prev.specifications, [specId]: value }
        }));
    };

    const toggleAttributeValue = (attrId, valId) => {
        setSelectedAttributeValues(prev => {
            const current = prev[attrId] || [];
            if (current.includes(valId)) {
                return { ...prev, [attrId]: current.filter(id => id !== valId) };
            } else {
                return { ...prev, [attrId]: [...current, valId] };
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

    const generateVariants = () => {
        if (!categoryDetails || !categoryDetails.attributes) return;

        const arrays = categoryDetails.attributes
            .filter(ca => selectedAttributeValues[ca.attribute.id]?.length > 0)
            .map(ca => ({
                id: ca.attribute.id,
                name: ca.attribute.name,
                values: ca.attribute.values.filter(v => selectedAttributeValues[ca.attribute.id].includes(v.id))
            }));

        if (arrays.length === 0) {
            toast.error("Please select at least one value for an attribute.");
            return;
        }

        const cartesian = arrays.reduce((acc, curr) => {
            return acc.flatMap(a => curr.values.map(b => [...a, { attrId: curr.id, attrName: curr.name, valId: b.id, valLabel: b.label }]));
        }, [[]]);

        const newVariants = cartesian.map(combo => {
            const name = combo.map(c => c.valLabel).join(' / ');
            const skuSuffix = combo.map(c => c.valLabel.substring(0, 3).toUpperCase()).join('-');
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
                : (parseFloat(form.price) || 0).toString(),
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
                sku: v.sku,
                price: parseFloat(v.price) || 0,
                stock: parseInt(v.stock) || 0,
                attributeValues: v.attributeValues,
                heroImageId: v.heroImage?.id || undefined,
                galleryIds: v.gallery?.map(g => g.id).filter(id => id != null) || []
            }))
        };

        const success = await addRecord('products', payload, api.createProduct);
        setSubmitting(false);

        if (success) {
            toast.success("Product created successfully!");
            router.push('/admin/products');
        }
    };

    if (loading.brands || loading.categories) return <Loader />;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="mb-8">
                <PageHeader title="Add New Product" subtitle="Create unique items for your premium catalog" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Core Information */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-info-circle text-indigo-600"></i> 
                            Basic Information
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <FormField label="Product Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Fylex Chronograph X" required />
                            </div>
                            <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="fylex-chronograph-x" />
                            <FormField label="Product Code (Art. No.)" name="productCode" value={form.productCode} onChange={handleChange} placeholder="FY-CHR-001" />
                            <div className="md:col-span-2">
                                <FormField label="Short Description" name="shortDesc" type="textarea" value={form.shortDesc} onChange={handleChange} rows={2} />
                            </div>
                            <div className="md:col-span-2">
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
                </div>

                {/* 2. Media (Only for Simple Products) */}
                {form.productType === 'simple' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <i className="fas fa-images text-indigo-600"></i> 
                                Product Media
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Primary Image</label>
                                    <div 
                                        onClick={() => setPickerTarget('primary')}
                                        className="h-64 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                                    >
                                        {form.heroImage ? (
                                            <img src={getFileUrl(form.heroImage.url)} className="w-full h-full object-contain" alt="Preview" />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-3">
                                                    <i className="fas fa-plus"></i>
                                                </div>
                                                <p className="text-gray-500 text-sm">Select Main Image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Gallery Images</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {form.gallery.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-lg border border-gray-200 overflow-hidden relative group bg-gray-50">
                                                <img src={getFileUrl(img.url)} className="w-full h-full object-cover" alt="Gallery" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => moveGalleryImage(i, -1)}
                                                        disabled={i === 0}
                                                        className="w-8 h-8 bg-white/90 text-gray-700 rounded-full flex items-center justify-center hover:bg-white disabled:opacity-50 cursor-pointer"
                                                        title="Move Left"
                                                    >
                                                        <i className="fas fa-arrow-left text-xs"></i>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => moveGalleryImage(i, 1)}
                                                        disabled={i === form.gallery.length - 1}
                                                        className="w-8 h-8 bg-white/90 text-gray-700 rounded-full flex items-center justify-center hover:bg-white disabled:opacity-50 cursor-pointer"
                                                        title="Move Right"
                                                    >
                                                        <i className="fas fa-arrow-right text-xs"></i>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, gallery: prev.gallery.filter(g => g.id !== img.id) }))}
                                                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer"
                                                        title="Remove"
                                                    >
                                                        <i className="fas fa-trash-alt text-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            type="button"
                                            onClick={() => setPickerTarget('gallery')}
                                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"
                                        >
                                            <i className="fas fa-plus mb-1"></i>
                                            <span className="text-xs">Add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Organization */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-folder text-indigo-600"></i> 
                            Organization
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <label className="text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[50px]">
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
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                form.tagIds.includes(tag.id.toString()) 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-400'
                                            }`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Specifications */}
                {categoryDetails && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <i className="fas fa-list-ul text-indigo-600"></i> 
                                Specifications
                            </h3>
                        </div>
                        <div className="p-8">
                            {categoryDetails.specGroups?.map((group, gIdx) => (
                                <div key={gIdx} className="mb-8 last:mb-0">
                                    <h4 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                                        {group.specGroup.name}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {group.specGroup.specifications?.map((spec, sIdx) => {
                                            const s = spec.specification;
                                            return (
                                                <div key={sIdx}>
                                                    {s.type === 'select' ? (
                                                        <FormField 
                                                            label={s.name} 
                                                            type="select" 
                                                            value={form.specifications[s.id] || ''} 
                                                            onChange={(e) => handleSpecChange(s.id, e.target.value)}
                                                            options={[{ value: '', label: `Select ${s.name}` }, ...s.values.map(v => ({ value: v.id.toString(), label: v.label || v.value }))]}
                                                        />
                                                    ) : (
                                                        <FormField 
                                                            label={s.name} 
                                                            value={form.specifications[s.id] || ''} 
                                                            onChange={(e) => handleSpecChange(s.id, e.target.value)}
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
                    </div>
                )}

                {/* 5. Variants (Conditional) */}
                {form.productType === 'configurable' && categoryDetails && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <i className="fas fa-cubes text-indigo-600"></i> 
                                Product Variants
                            </h3>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                <p className="text-sm text-gray-500">Select Attribute Values to Generate Variants</p>
                                <div className="grid grid-cols-1 gap-4">
                                    {categoryDetails.attributes?.map((attrWrapper, idx) => {
                                        const attr = attrWrapper.attribute;
                                        return (
                                            <div key={idx} className="p-5 rounded-lg border border-gray-200 bg-white">
                                                <label className="flex items-center gap-2 font-medium text-gray-700 mb-4 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-indigo-600 rounded"
                                                        checked={selectedAttributeValues[attr.id]?.length > 0}
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
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                selectedAttributeValues[attr.id]?.includes(val.id)
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
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
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Generate Variants
                                </button>

                                {variants.length > 0 && (
                                    <div className="mt-8 overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-200">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Variant Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Images</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {variants.map((variant, vIdx) => (
                                                    <tr key={vIdx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{variant.name}</td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="text" 
                                                                value={variant.sku} 
                                                                onChange={(e) => updateVariantField(vIdx, 'sku', e.target.value)}
                                                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number" 
                                                                value={variant.price} 
                                                                onChange={(e) => updateVariantField(vIdx, 'price', e.target.value)}
                                                                placeholder="0.00"
                                                                className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number" 
                                                                value={variant.stock} 
                                                                onChange={(e) => updateVariantField(vIdx, 'stock', e.target.value)}
                                                                className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex -space-x-2">
                                                                    {variant.heroImage ? (
                                                                        <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                                                            <img src={getFileUrl(variant.heroImage.url)} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400">
                                                                            <i className="fas fa-image text-xs"></i>
                                                                        </div>
                                                                    )}
                                                                    {variant.gallery?.length > 0 && (
                                                                        <div className="w-8 h-8 rounded-full border-2 border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                                            +{variant.gallery.length}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setVariantImageModal({ index: vIdx, name: variant.name })}
                                                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                                                                >
                                                                    Manage
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeVariant(vIdx)}
                                                                className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
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
                    </div>
                )}

                {/* Form Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between rounded-xl shadow-lg">
                    <div className="text-sm text-gray-500">
                        <i className="fas fa-save mr-2"></i> All changes are saved on submit
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/products')}
                            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : <><i className="fas fa-plus"></i> Create Product</>}
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
                <div className="fixed inset-0 z-[100] flex items-end justify-center pb-48 p-4 bg-black/50" onClick={() => setVariantImageModal(null)}>
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">Manage Variant Images</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Configure media for <span className="text-indigo-600 font-semibold">{variantImageModal.name}</span></p>
                            </div>
                            <button type="button" onClick={() => setVariantImageModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Variant Gallery Preview & Reorder */}
                            {variants[variantImageModal.index]?.gallery?.length > 0 && (
                                <div className="mb-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Display Order</label>
                                    <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-thin">
                                        {variants[variantImageModal.index].gallery.map((img, gIdx) => (
                                            <div key={gIdx} className="relative flex-none w-16 h-16 rounded-xl border border-gray-200 overflow-hidden group/item shadow-sm">
                                                <img src={getFileUrl(img.url)} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/item:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5">
                                                    <div className="flex gap-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => moveVariantGalleryImage(variantImageModal.index, gIdx, -1)}
                                                            disabled={gIdx === 0}
                                                            className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 cursor-pointer shadow-sm"
                                                        ><i className="fas fa-chevron-left text-[10px]"></i></button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => moveVariantGalleryImage(variantImageModal.index, gIdx, 1)}
                                                            disabled={gIdx === variants[variantImageModal.index].gallery.length - 1}
                                                            className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo-600 disabled:opacity-30 hover:bg-indigo-50 cursor-pointer shadow-sm"
                                                        ><i className="fas fa-chevron-right text-[10px]"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="button"
                                onClick={() => {
                                    setPickerTarget({ variantIndex: variantImageModal.index, type: 'primary' });
                                    setVariantImageModal(null);
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group/btn cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover/btn:bg-indigo-600 group-hover/btn:text-white transition-all">
                                    <i className="fas fa-star text-lg"></i>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900">Primary Image</div>
                                    <div className="text-xs text-gray-500">Main image for this variant</div>
                                </div>
                            </button>

                            <button 
                                type="button"
                                onClick={() => {
                                    setPickerTarget({ variantIndex: variantImageModal.index, type: 'gallery' });
                                    setVariantImageModal(null);
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-400 hover:bg-purple-50/50 transition-all group/btn cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover/btn:bg-purple-600 group-hover/btn:text-white transition-all">
                                    <i className="fas fa-images text-lg"></i>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-900">Add to Gallery</div>
                                    <div className="text-xs text-gray-500">Upload lifestyle or angle shots</div>
                                </div>
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex justify-center">
                            <button 
                                type="button"
                                onClick={() => setVariantImageModal(null)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest cursor-pointer"
                            >
                                Close Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddProductPage;