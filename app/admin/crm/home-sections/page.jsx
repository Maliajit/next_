"use client";
import React, { useState, useEffect } from 'react';
import * as api from '@/services/adminApi';
import { useAdminData } from '@/context/AdminDataContext';
import PageHeader from '@/components/admin/ui/PageHeader';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import AdminModal from '@/components/admin/AdminModal';
import { useToast } from '@/context/ToastContext';

const HomeSections = () => {
    const toast = useToast();
    const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
    const sections = (data.homeSections || []).sort((a,b) => a.order - b.order);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'products', order: 1, status: true });
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleAdd = () => {
        setFormData({ name: '', type: 'products', order: (sections.length + 1), status: true });
        setShowModal(true);
    };

    const handleEdit = (section) => {
        setFormData(section);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.name) return;
        setSubmitting(true);
        let success;
        if (formData.id) {
           success = await updateRecord('homeSections', formData.id, formData, api.updateHomeSection);
        } else {
           success = await addRecord('homeSections', formData, api.createHomeSection);
        }
        setSubmitting(false);
        if (success || success === undefined) {
          setShowModal(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const success = await deleteRecord('homeSections', deleteTarget.id, api.deleteHomeSection);
        setDeleting(false);
        if (success) {
          setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader 
                title="Home Page Sections" 
                subtitle="Manage the structure and layout of the homepage"
                action={{ label: 'Add Section', icon: 'fas fa-plus', onClick: handleAdd }}
            />

            <div className="admin-card" style={{ borderRadius: 16 }}>
                <div className="admin-card-header"><h3>Active Layout Structure</h3></div>
                {loading.homeSections ? <Loader message="Loading layout..." /> :
                 errors.homeSections  ? <ErrorBanner message={errors.homeSections} onRetry={() => refetch.homeSections()} /> :
                 <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 80, textAlign: 'center' }}>ORDER</th>
                                <th>SECTION NAME</th>
                                <th>TYPE</th>
                                <th style={{ textAlign: 'center' }}>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No sections added yet</td></tr> : 
                             sections.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: '#f5f3ff', color: '#6366f1', fontWeight: 800, fontSize: 13, border: '1px solid #ddd6fe' }}>{s.order}</div>
                                    </td>
                                    <td className="cell-primary" style={{ fontWeight: 800 }}>{s.name}</td>
                                    <td><span className="cell-mono" style={{ textTransform: 'uppercase', fontSize: 11, background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, color: '#475569', fontWeight: 700 }}>{s.type}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="status-badge" style={{ display: 'inline-flex', padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: s.status ? '#ecfdf5' : '#f8fafc', color: s.status ? '#10b981' : '#94a3b8', border: `1px solid ${s.status ? '#d1fae5' : '#e2e8f0'}`, textTransform: 'uppercase' }}>{s.status ? 'Visible' : 'Hidden'}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-icon btn-icon-edit" style={{ background: '#f1f5f9', color: '#6366f1' }} onClick={() => handleEdit(s)}><i className="fas fa-edit"></i></button>
                                            <button className="btn-icon btn-icon-delete" style={{ background: '#fef2f2', color: '#ef4444' }} onClick={() => setDeleteTarget({ id: s.id, name: s.name })}><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                }
            </div>

            <AdminModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={formData.id ? "Edit Section" : "Add New Section"}
                maxWidth={480}
            >
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Section Display Name</label>
                            <input 
                                type="text" 
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none' }}
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. New Seasonal Arrivals"
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Content Type</label>
                                <select 
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#fff' }}
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="products">Products Grid</option>
                                    <option value="categories">Categories Showcase</option>
                                    <option value="testimonials">Testimonials / Reviews</option>
                                    <option value="custom">Custom Banner</option>
                                    <option value="video">Promotional Video</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Display Order</label>
                                <input 
                                    type="number" 
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none' }}
                                    value={formData.order} 
                                    onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Status</label>
                            <select 
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#fff' }}
                                value={String(formData.status ?? true)}
                                onChange={e => setFormData({...formData, status: e.target.value === 'true'})}
                            >
                                <option value="true">Visible (Active)</option>
                                <option value="false">Hidden (Inactive)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : 'Save Section'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Section"
                message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
                loading={deleting}
                danger
            />
        </div>
    );
};

export default HomeSections;
