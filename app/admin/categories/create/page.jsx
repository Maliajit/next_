"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import { useToast } from '@/context/ToastContext';

const AddCategoryPage = () => {
    const toast = useToast();
    const router = useRouter();
    const { data, loading, refetch, addRecord } = useAdminData();
    const categories = data.categories || [];
    const allAttributes = data.attributes || [];
    const allSpecGroups = data.specificationGroups || [];

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', slug: '', description: '', 
        parentId: '', imageId: '', image: '',
        metaTitle: '', metaDescription: '', metaKeywords: '',
        sortOrder: 0,
        status: 1,
        featured: 0,
        showInNav: 1
    });

    const [selectedSpecGroups, setSelectedSpecGroups] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    
    const [specSearch, setSpecSearch] = useState('');
    const [attrSearch, setAttrSearch] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
        }));
    };

    const handleToggle = (name) => {
        setForm(prev => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }));
    };

    const filteredSpecGroups = useMemo(() => {
        if (!specSearch) return allSpecGroups;
        return allSpecGroups.filter(g => g.name.toLowerCase().includes(specSearch.toLowerCase()));
    }, [allSpecGroups, specSearch]);

    const filteredAttributes = useMemo(() => {
        if (!attrSearch) return allAttributes;
        return allAttributes.filter(a => a.name.toLowerCase().includes(attrSearch.toLowerCase()));
    }, [allAttributes, attrSearch]);

    const toggleSpecGroup = (id) => {
        setSelectedSpecGroups(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAttribute = (attrId) => {
        setSelectedAttributes(prev => {
            const exists = prev.find(a => a.attributeId === attrId);
            if (exists) {
                return prev.filter(a => a.attributeId !== attrId);
            } else {
                return [...prev, { attributeId: attrId, isRequired: false, isFilterable: true, sortOrder: 0 }];
            }
        });
    };

    const updateAttrSetting = (attrId, key, value) => {
        setSelectedAttributes(prev => prev.map(a => 
            a.attributeId === attrId ? { ...a, [key]: value } : a
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        setSubmitting(true);
        const payload = {
            ...form,
            parentId: form.parentId || null,
            imageId: form.imageId || null,
            specificationGroupIds: selectedSpecGroups.filter(id => id !== null && id !== undefined && id !== ''),
            attributeIds: selectedAttributes
                .filter(a => a.attributeId && !isNaN(parseInt(a.attributeId)))
                .map(a => ({
                    attributeId: parseInt(a.attributeId),
                    isRequired: !!a.isRequired,
                    isFilterable: !!a.isFilterable,
                    sortOrder: parseInt(a.sortOrder) || 0
                }))
        };

        const success = await addRecord('categories', payload, api.createCategory);
        setSubmitting(false);

        if (success) {
            router.push('/admin/categories');
        }
    };

    if (loading.categories || loading.attributes || loading.specificationGroups) {
        return <Loader message="Accessing taxonomy catalog..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/admin/categories')} 
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                            <span>Admin</span>
                            <i className="fas fa-chevron-right text-[10px] opacity-50"></i>
                            <span className="text-slate-400">Products</span>
                            <i className="fas fa-chevron-right text-[10px] opacity-50"></i>
                            <span className="text-slate-900">Categories</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create New Category</h1>
                        <p className="text-slate-500 text-sm font-medium">Add a new category to organize your products</p>
                    </div>
                </div>
                <button onClick={() => router.push('/admin/categories')} className="btn-secondary" style={{ borderRadius: 12 }}>
                    <i className="fas fa-list-ul mr-2"></i> View All
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="col-span-8 space-y-8">
                    {/* Basic Information */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm">
                                <i className="fas fa-info-circle"></i>
                            </span>
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <FormField label="Category Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Men's Clothing" required />
                            <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="e.g., mens-clothing" />
                            <div className="col-span-2">
                                <FormField 
                                    label="Parent Category" 
                                    name="parentId" 
                                    type="select" 
                                    value={form.parentId} 
                                    onChange={handleChange}
                                    options={[{ value: '', label: 'No Parent (Main Category)' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]}
                                />
                            </div>
                            <div className="col-span-2">
                                <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} rows={4} placeholder="Describe this category..." />
                            </div>
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm">
                                <i className="fas fa-search"></i>
                            </span>
                            SEO Settings
                        </h3>
                        <div className="space-y-6">
                            <FormField label="Meta Title" name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="Title for search engines" hint="Title for search engines (optional)" />
                            <FormField label="Meta Description" name="metaDescription" type="textarea" value={form.metaDescription} onChange={handleChange} rows={3} placeholder="Description for search engines" hint="Description for search engines (optional)" />
                            <FormField label="Meta Keywords" name="metaKeywords" value={form.metaKeywords} onChange={handleChange} placeholder="keyword1, keyword2, keyword3" hint="Comma-separated keywords (optional)" />
                        </div>
                    </div>

                    {/* Specification Groups */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-sm">
                                <i className="fas fa-layer-group"></i>
                            </span>
                            Specification Groups
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 ml-11">Select specification groups to assign to this category</p>
                        
                        <div className="relative mb-6">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                                type="text" 
                                className="admin-input pl-12" 
                                placeholder="Search specification groups..." 
                                value={specSearch}
                                onChange={(e) => setSpecSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredSpecGroups.map(group => (
                                <label 
                                    key={group.id} 
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedSpecGroups.includes(group.id) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                                >
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedSpecGroups.includes(group.id)}
                                        onChange={() => toggleSpecGroup(group.id)}
                                    />
                                    <span className="font-bold text-slate-700">{group.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Attributes */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm">
                                <i className="fas fa-tags"></i>
                            </span>
                            Attributes
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 ml-11">Select attributes for variant creation (size, color, etc.)</p>

                        <div className="relative mb-6">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                                type="text" 
                                className="admin-input pl-12" 
                                placeholder="Search attributes..." 
                                value={attrSearch}
                                onChange={(e) => setAttrSearch(e.target.value)}
                            />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80">
                                    <tr>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-10"></th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attribute</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Required</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Filterable</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-32">Sort Order</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAttributes.map(attr => {
                                        const selected = selectedAttributes.find(a => a.attributeId === attr.id);
                                        return (
                                            <tr key={attr.id} className={`${selected ? 'bg-indigo-50/10' : ''}`}>
                                                <td className="p-4">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                                                        checked={!!selected}
                                                        onChange={() => toggleAttribute(attr.id)}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{attr.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">({attr.code})</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        disabled={!selected}
                                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 disabled:opacity-30"
                                                        checked={selected?.isRequired || false}
                                                        onChange={(e) => updateAttrSetting(attr.id, 'isRequired', e.target.checked)}
                                                    />
                                                </td>
                                                <td className="p-4 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        disabled={!selected}
                                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 disabled:opacity-30"
                                                        checked={selected?.isFilterable || false}
                                                        onChange={(e) => updateAttrSetting(attr.id, 'isFilterable', e.target.checked)}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input 
                                                        type="number" 
                                                        disabled={!selected}
                                                        className="admin-input h-9 text-center font-bold disabled:opacity-30"
                                                        value={selected?.sortOrder || 0}
                                                        onChange={(e) => updateAttrSetting(attr.id, 'sortOrder', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="col-span-4 space-y-8">
                    {/* Category Image */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm">
                                <i className="fas fa-image"></i>
                            </span>
                            Category Image
                        </h3>
                        
                        <div 
                            onClick={() => setIsPickerOpen(true)}
                            className="group relative w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden"
                        >
                            {form.image ? (
                                <>
                                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <span className="text-white font-bold text-sm bg-indigo-500 px-4 py-2 rounded-xl">Change Image</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-indigo-400 transition-all">
                                        <i className="fas fa-image text-3xl"></i>
                                    </div>
                                    <p className="text-slate-400 font-bold text-sm">No image selected</p>
                                </>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            <button 
                                type="button" 
                                onClick={() => setIsPickerOpen(true)}
                                className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                            >
                                <i className="fas fa-images"></i>
                                Select from Media Library
                            </button>
                            {form.image && (
                                <button 
                                    type="button" 
                                    onClick={() => setForm(prev => ({ ...prev, image: '', imageId: '' }))}
                                    className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    <i className="fas fa-times-circle mr-2"></i>
                                    Remove Image
                                </button>
                            )}
                            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Recommended size: 800x800px</p>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm">
                                <i className="fas fa-cog"></i>
                            </span>
                            Settings
                        </h3>
                        <div className="space-y-6">
                            <FormField label="Sort Order" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} placeholder="0" hint="Lower numbers appear first" />
                            
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">Status</div>
                                        <div className="text-[10px] text-slate-400 font-bold">Category visibility</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={form.status === 1} onChange={() => handleToggle('status')} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">Featured</div>
                                        <div className="text-[10px] text-slate-400 font-bold">Show in featured sections</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={form.featured === 1} onChange={() => handleToggle('featured')} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">Show in Navigation</div>
                                        <div className="text-[10px] text-slate-400 font-bold">Display in main navigation</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={form.showInNav === 1} onChange={() => handleToggle('showInNav')} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Publish */}
                    <div className="admin-card" style={{ borderRadius: 20, padding: 30 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Publish</h3>
                        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-6 flex gap-3">
                            <i className="fas fa-info-circle mt-0.5"></i>
                            <span>Review all information before saving</span>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                type="button" 
                                onClick={() => router.push('/admin/categories')} 
                                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className="flex-[1.5] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save font-light"></i>}
                                Save Category
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase">Click "Save Category" to create this category</p>
                    </div>
                </div>
            </form>

            <MediaPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onSelect={(selection) => {
                    setForm(prev => ({ 
                        ...prev, 
                        image: Array.isArray(selection) ? selection[0] : selection,
                        imageId: '' // If the selection is just URL, we leave imageId empty. If selection is objects, we'd take id.
                    }));
                }} 
            />
        </div>
    );
};

export default AddCategoryPage;
