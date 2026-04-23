"use client";
import React, { useState } from 'react';
import AdminModal from './AdminModal';
import { useAdminData } from '@/context/AdminDataContext';
import Loader from './ui/Loader';

/**
 * MediaPickerModal
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close callback
 * @param {function} onSelect - Callback receiving selected URL(s)
 * @param {boolean} multiple - Allow multiple selection
 */
const MediaPickerModal = ({ isOpen, onClose, onSelect, multiple = false }) => {
    const { data, loading } = useAdminData();
    const media = data.media || [];
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // Backend URL for uploads

    const toggleSelect = (m) => {
        const item = { id: m.id.toString(), url: `/uploads/${m.fileName}` };
        if (multiple) {
            setSelected(prev => 
                prev.find(u => u.id === item.id) ? prev.filter(u => u.id !== item.id) : [...prev, item]
            );
        } else {
            setSelected([item]);
        }
    };

    const handleConfirm = () => {
        if (selected.length > 0) {
            onSelect(multiple ? selected : [selected[0]]);
            onClose();
        }
    };

    const filteredMedia = media.filter(m => 
        m.mimeType?.includes('image') && 
        (m.originalFilename?.toLowerCase().includes(search.toLowerCase()) || 
         m.fileName?.toLowerCase().includes(search.toLowerCase()))
    );

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, width: '100%' }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button 
                className="btn-primary" 
                onClick={handleConfirm}
                disabled={selected.length === 0}
            >
                Confirm Selection ({selected.length})
            </button>
        </div>
    );

    return (
        <AdminModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Select Media" 
            maxWidth={900}
            footer={footer}
        >
            <div style={{ minHeight: 400 }}>
                <div style={{ marginBottom: 20 }}>
                    <div className="admin-search" style={{ width: '100%' }}>
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Find images by name..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading.media ? <Loader message="Loading media library..." /> : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                        gap: 16,
                        maxHeight: 500,
                        overflowY: 'auto',
                        padding: 2
                    }}>
                        {filteredMedia.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                <i className="fas fa-image" style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}></i>
                                <p>No images found in your library.</p>
                            </div>
                        ) : filteredMedia.map((m) => {
                            const showUrl = `${API_URL}/uploads/${m.fileName}`;
                            const isSelected = selected.find(s => s.id === m.id.toString());
                            
                            return (
                                <div 
                                    key={m.id}
                                    onClick={() => toggleSelect(m)}
                                    style={{ 
                                        position: 'relative',
                                        aspectRatio: '1 / 1',
                                        borderRadius: 12,
                                        border: isSelected ? '3px solid #6366f1' : '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: '#f8fafc'
                                    }}
                                >
                                    <img 
                                        src={showUrl} 
                                        alt={m.originalFilename} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {isSelected && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: 8, right: 8, 
                                            width: 24, height: 24, 
                                            background: '#6366f1', 
                                            color: '#fff',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            <i className="fas fa-check"></i>
                                        </div>
                                    )}
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: 0, left: 0, right: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        color: '#fff',
                                        fontSize: 10,
                                        padding: '4px 8px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {m.originalFilename || m.fileName}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminModal>
    );
};

export default MediaPickerModal;
