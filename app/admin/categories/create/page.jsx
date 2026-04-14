"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/context/AdminDataContext';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import { useToast } from '@/context/ToastContext';

const AddCategoryPage = () => {
    const toast = useToast();
    const router = useRouter();
    const { data, loading, addRecord } = useAdminData();
    const categories = data.categories || [];

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true, parentId: '' });
    const [formErrors, setFormErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'isActive' ? value === 'active' : value,
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
        }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Category name is required';
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
            description: form.description,
            parentId: form.parentId || null,
            status: form.isActive ? 1 : 0
        };
        
        const success = await addRecord('categories', payload, api.createCategory);
        setSubmitting(false);

        if (success) {
            router.push('/admin/categories');
        }
    };

    if (loading.categories) {
        return <Loader message="Accessing taxonomy catalog..." />;
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <PageHeader
                title="Create Marketplace Category"
                subtitle="Organize your portfolio with hierarchical taxonomy structures"
            />

            <div className="admin-card overflow-hidden shadow-2xl" style={{ borderRadius: 24 }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '30px 40px' }}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <i className="fas fa-plus-circle" style={{ opacity: 0.8 }}></i>
                        Add New Classification
                    </h3>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '40px' }} className="space-y-8">
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 30 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FormField label="Classification Label" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Mechanical Luxury Watches" required error={formErrors.name} />
                        </div>
                        <FormField label="URL Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="mechanical-luxury" />
                        <FormField 
                            label="Parent Hierarchy" 
                            name="parentId" 
                            type="select" 
                            value={form.parentId} 
                            onChange={handleChange}
                            options={[{ value: '', label: 'None (Top Level)' }, ...categories.map(c => ({ value: c.id.toString(), label: c.name }))]}
                        />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FormField label="Definition & Description" name="description" type="textarea" value={form.description} onChange={handleChange} rows={4} placeholder="Brief context about sub-products..." />
                        </div>
                        <FormField label="Availability" name="isActive" type="select" value={form.isActive ? 'active' : 'inactive'} onChange={handleChange} options={[{ value: 'active', label: 'Active (Enabled)' }, { value: 'inactive', label: 'Inactive (Disabled)' }]} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, paddingTop: 30, borderTop: '1px solid #f1f5f9' }}>
                        <button type="submit" className="btn-primary shadow-xl" disabled={submitting} style={{ padding: '14px 28px', minWidth: 160 }}>
                            {submitting ? 'Registering...' : 'Confirm Entry'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => router.push('/admin/categories')} style={{ padding: '14px 28px' }}>
                            Discard Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryPage;
