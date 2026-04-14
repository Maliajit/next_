'use client';
import { useState, useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import * as api from '@/services/adminApi';
import { useAdminData } from '@/context/AdminDataContext';
import PageHeader from '@/components/admin/ui/PageHeader';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import AdminModal from '@/components/admin/AdminModal';
import { useToast } from '@/context/ToastContext';

const BannerList = () => {
    const toast = useToast();
    const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
    const banners = data.banners || [];

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', position: 'Hero', status: 'active', image: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    
    const tableRef = useRef(null);
    const tabulatorRef = useRef(null);
    const actionsRef = useRef({});

    useEffect(() => {
        if (!tableRef.current || loading.banners) return;
        tabulatorRef.current?.destroy();

        actionsRef.current = {
            onEdit: (d) => { setFormData({ ...d, image: d.image || d.image_url || '' }); setShowModal(true); },
            onDelete: (id, title) => setDeleteTarget({ id, title }),
        };

        tabulatorRef.current = new Tabulator(tableRef.current, {
            data: banners,
            layout: "fitDataFill",
            pagination: "local",
            paginationSize: 10,
            placeholder: "No banners found",
            columns: [
                {
                    title: "ID", field: "id", width: 70, hozAlign: "center",
                    formatter: (cell) => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>`
                },
                {
                    title: "BANNER INFO", field: "title", width: 340,
                    formatter: (cell) => {
                        const d = cell.getRow().getData();
                        const img = d.image || d.image_url;
                        return `
                            <div style="display:flex;align-items:center;gap:14px;padding:6px 0">
                                <div style="width:64px;height:40px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">
                                    ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover" />` : `<i class="fas fa-image" style="color:#cbd5e1;font-size:14px"></i>`}
                                </div>
                                <div style="min-width:0">
                                    <div style="font-weight:800;color:#1e293b;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title || 'Untitled Banner'}</div>
                                    <div style="font-size:11px;color:#6366f1;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${d.position || 'HERO'}</div>
                                </div>
                            </div>
                        `;
                    }
                },
                {
                    title: "STATUS", field: "status", width: 140, hozAlign: "center",
                    formatter: (cell) => {
                        const v = (cell.getValue() || '').toLowerCase();
                        const active = v === 'active' || v === '1' || v === 'true';
                        return `<div class="status-badge" style="display:inline-flex;padding:5px 14px;border-radius:10px;font-size:11px;font-weight:700;background:${active ? '#ecfdf5' : '#10b981'};color:${active ? '#10b981' : '#ef4444'};border:1px solid ${active ? '#d1fae5' : '#fee2e2'};text-transform:uppercase">${active ? 'ACTIVE' : 'INACTIVE'}</div>`;
                    }
                },
                {
                    title: "ACTIONS", headerSort: false, hozAlign: "right", width: 110,
                    formatter: () => `
                        <div style="display:flex;gap:8px;justify-content:flex-end">
                            <button class="btn-icon btn-icon-edit" style="background:#f1f5f9;color:#6366f1" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444" title="Delete"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    `,
                    cellClick: (e, cell) => {
                        const d = cell.getRow().getData();
                        if (e.target.closest('.btn-icon-edit')) actionsRef.current.onEdit(d);
                        if (e.target.closest('.btn-icon-delete')) actionsRef.current.onDelete(d.id, d.title);
                    }
                }
            ],
        });

        return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
    }, [banners, loading.banners]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.title) return;
        setSubmitting(true);
        let success;
        if (formData.id) {
           success = await updateRecord('banners', formData.id, formData, api.updateBanner);
        } else {
           success = await addRecord('banners', formData, api.createBanner);
        }
        setSubmitting(false);
        if (success || success === undefined) {
          setShowModal(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const success = await deleteRecord('banners', deleteTarget.id, api.deleteBanner);
        setDeleting(false);
        if (success) {
          setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader 
                title="Sliders & Banners" 
                subtitle="Manage homepage sliders and promotional campaign assets"
                action={{ label: 'Add Banner', icon: 'fas fa-plus', onClick: () => { setFormData({ title: '', position: 'Hero', status: 'active', image: '' }); setShowModal(true); } }}
            />

            <div className="admin-card" style={{ padding: '20px 24px', borderRadius: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="admin-search" style={{ flex: 2, minWidth: 300 }}>
                        <i className="fas fa-search" style={{ color: '#94a3b8' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search by title, position..." 
                            style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '11px 16px 11px 42px' }} 
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <select style={{ width: '100%', padding: '11px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#4b5a7a', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                            <option>All Positions</option>
                            <option>Hero</option>
                            <option>Below Hero</option>
                            <option>Footer</option>
                        </select>
                    </div>
                    <button className="btn-filter-dark">
                        <i className="fas fa-filter mr-2"></i> Filter
                    </button>
                </div>
            </div>

            <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                {loading.banners ? <Loader message="Loading banners..." /> :
                 errors.banners  ? <ErrorBanner message={errors.banners} onRetry={() => refetch.banners()} /> :
                 <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 900 }}><div ref={tableRef}></div></div></div>
                }
            </div>

            <AdminModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={formData.id ? "Edit Banner" : "Add New Banner"}
                maxWidth={520}
            >
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Banner Title</label>
                            <input 
                                type="text" 
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none' }}
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Summer Collection 2024"
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Position</label>
                                <select 
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#fff' }}
                                    value={formData.position}
                                    onChange={e => setFormData({...formData, position: e.target.value})}
                                >
                                    <option>Hero</option>
                                    <option>Below Hero</option>
                                    <option>Footer</option>
                                    <option>Sidebar</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Status</label>
                                <select 
                                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#fff' }}
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' }}>Image URL</label>
                            <input 
                                type="text" 
                                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none' }}
                                value={formData.image || ''} 
                                onChange={e => setFormData({...formData, image: e.target.value})}
                                placeholder="https://example.com/banner.jpg"
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : 'Save Banner'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Banner"
                message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
                loading={deleting}
                danger
            />
        </div>
    );
};

export default BannerList;
