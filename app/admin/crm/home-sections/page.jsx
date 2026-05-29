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
    const { data, loading, errors, refetch, updateRecord } = useAdminData();
    const activeSectionKeys = ['s1', 's2', 's3', 's4', 'featured', 'gallery'];
    const sections = (data.homeSections || [])
        .filter(s => activeSectionKeys.includes(s.type))
        .sort((a,b) => a.order - b.order);

    const [confirmTarget, setConfirmTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleToggleStatus = async () => {
        if (!confirmTarget) return;
        setSubmitting(true);
        
        const updatedData = {
            ...confirmTarget,
            status: !confirmTarget.status
        };

        const success = await updateRecord('homeSections', confirmTarget.id, updatedData, api.updateHomeSection);
        setSubmitting(false);
        if (success || success === undefined) {
            setConfirmTarget(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader 
                title="Home Page Sections" 
                subtitle="Instantly enable or disable fixed sections of the homepage"
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
                                <th>KEY</th>
                                <th style={{ textAlign: 'center' }}>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No sections found. Please ensure database is seeded.</td></tr> : 
                             sections.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: '#f5f3ff', color: '#6366f1', fontWeight: 800, fontSize: 13, border: '1px solid #ddd6fe' }}>{s.order}</div>
                                    </td>
                                    <td className="cell-primary" style={{ fontWeight: 800 }}>{s.name}</td>
                                    <td><span className="cell-mono" style={{ textTransform: 'uppercase', fontSize: 11, background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, color: '#475569', fontWeight: 700 }}>{s.type}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="status-badge" style={{ 
                                            display: 'inline-flex', 
                                            padding: '5px 12px', 
                                            borderRadius: 10, 
                                            fontSize: 11, 
                                            fontWeight: 700, 
                                            background: s.status ? '#ecfdf5' : '#fff1f2', 
                                            color: s.status ? '#10b981' : '#f43f5e', 
                                            border: `1px solid ${s.status ? '#d1fae5' : '#fecdd3'}`, 
                                            textTransform: 'uppercase' 
                                        }}>
                                            {s.status ? 'Visible' : 'Hidden'}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            onClick={() => setConfirmTarget(s)}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: 8,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                background: s.status ? '#fef2f2' : '#f0fdf4',
                                                color: s.status ? '#ef4444' : '#22c55e',
                                                border: `1px solid ${s.status ? '#fee2e2' : '#dcfce7'}`,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <i className={`fas ${s.status ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
                                            {s.status ? 'Hide Section' : 'Show Section'}
                                        </button>
                                    </td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                 </div>
                }
            </div>

            <ConfirmModal
                isOpen={!!confirmTarget}
                onClose={() => setConfirmTarget(null)}
                onConfirm={handleToggleStatus}
                title={confirmTarget?.status ? "Hide Section" : "Show Section"}
                message={`Are you sure you want to ${confirmTarget?.status ? 'hide' : 'show'} the "${confirmTarget?.name}" section on the home page?`}
                confirmLabel={confirmTarget?.status ? "Hide" : "Show"}
                loading={submitting}
                danger={confirmTarget?.status}
            />
        </div>
    );
};

export default HomeSections;
