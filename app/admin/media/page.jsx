"use client";
import React, { useState, useEffect, useRef } from 'react';
import '@/app/admin/css/custom.css';
import AdminModal from '@/components/admin/AdminModal';
import * as api from '@/services/adminApi';
import { useAdminData } from '@/context/AdminDataContext';
import { useToast } from '@/context/ToastContext';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';

const MediaList = () => {
    const toast = useToast();
    const { data, loading, errors, refetch, deleteRecord } = useAdminData();
    const files = data.media || [];
    
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        const res = await api.uploadMedia(formData);
        setUploading(false);

        if (res.error) {
            toast?.error?.(res.error);
        } else {
            toast?.success?.('File uploaded successfully');
            refetch.media();
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        await deleteRecord('media', id, api.deleteMedia);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
        return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>Media Library</h2>
                    <p style={{ color: '#64748b' }}>Manage images, videos, and documents</p>
                </div>
                <div>
                   <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
                   <button className="btn-primary" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                       {uploading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-cloud-upload-alt mr-2"></i>}
                       {uploading ? 'Uploading...' : 'Upload Files'}
                   </button>
                </div>
            </div>

            {/* Files Grid/Table */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h3>All Files</h3>
                    <div className="admin-search" style={{ width: 220 }}>
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Search files..." />
                    </div>
                </div>
                {loading.media ? <Loader message="Loading media..." /> : 
                 errors.media  ? <ErrorBanner message={errors.media} onRetry={() => refetch.media()} /> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr><th>File Name</th><th>Type</th><th style={{ textAlign: 'center' }}>Size</th><th style={{ textAlign: 'center' }}>Uploaded</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                            </thead>
                            <tbody>
                                {files.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No files found</td></tr>
                                ) : files.map((f) => (
                                    <tr key={f.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {f.mimeType?.includes('image') ? (
                                                        <img src={`${API_URL}/uploads/${f.fileName}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://placehold.co/40x40?text=IMG'; }} />
                                                    ) : (
                                                        <i className="fas fa-file" style={{ color: '#94a3b8' }}></i>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="cell-primary" style={{ display: 'block' }}>{f.originalFilename || f.name}</span>
                                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{f.fileName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#f5f3ff', padding: '3px 8px', borderRadius: 4 }}>{f.extension?.toUpperCase() || f.fileType?.toUpperCase()}</span></td>
                                        <td style={{ textAlign: 'center' }}>{formatSize(f.fileSize)}</td>
                                        <td style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <a href={`${API_URL}/uploads/${f.fileName}`} target="_blank" rel="noreferrer" className="btn-icon btn-icon-edit" title="View/Download"><i className="fas fa-external-link-alt"></i></a>
                                                <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(f.id)}><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaList;
