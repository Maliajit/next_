"use client";
import React, { useState, useEffect } from 'react';
import '@/app/admin/css/custom.css';
import * as api from '@/services/adminApi';
import { useAdminData } from '@/context/AdminDataContext';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import { useToast } from '@/context/ToastContext';

const TAB_KEYS = ['general', 'seo', 'payment'];
const TAB_LABELS = { general: 'General', seo: 'SEO & Meta', payment: 'Payment' };
const TAB_ICONS  = { general: 'fas fa-cog', seo: 'fas fa-search', payment: 'fas fa-credit-card' };

const SettingsPage = () => {
    const toast = useToast();
    const { data, loading, errors, refetch } = useAdminData();
    const remoteSettings = data.settings || {};

    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (remoteSettings && typeof remoteSettings === 'object') {
            // Normalize data from backend to frontend keys if necessary
            // Backend might send snake_case or slightly different names
            const normalized = {
                storeName: remoteSettings.storeName || remoteSettings.store_name || '',
                storeEmail: remoteSettings.storeEmail || remoteSettings.store_email || remoteSettings.contactEmail || '',
                storePhone: remoteSettings.storePhone || remoteSettings.store_phone || remoteSettings.phone || '',
                storeAddress: remoteSettings.storeAddress || remoteSettings.store_address || remoteSettings.address || '',
                currency: remoteSettings.currency || 'INR',
                logo: remoteSettings.logo || '',
                metaTitle: remoteSettings.metaTitle || remoteSettings.meta_title || '',
                metaDescription: remoteSettings.metaDescription || remoteSettings.meta_desc || remoteSettings.meta_description || '',
                gaId: remoteSettings.gaId || remoteSettings.ga_id || '',
                fbPixelId: remoteSettings.fbPixelId || remoteSettings.fb_pixel_id || '',
                seoIndexing: !!(remoteSettings.seoIndexing ?? remoteSettings.seo_indexing),
                razorpayKey: remoteSettings.razorpayKey || remoteSettings.razorpay_key || '',
                razorpaySecret: remoteSettings.razorpaySecret || remoteSettings.razorpay_secret || '',
                codEnabled: !!(remoteSettings.codEnabled ?? remoteSettings.cod_enabled),
                codCharge: remoteSettings.codCharge || remoteSettings.cod_charge || 0,
                codMaxAmount: remoteSettings.codMaxAmount || remoteSettings.cod_max_amount || 0,
            };
            setSettings(normalized);
        }
    }, [remoteSettings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) 
        }));
        setIsDirty(true);
        setSaveError(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaveError(null);
        setSaving(true);
        
        try {
            const { error: err, success } = await api.saveSettings(settings);
            if (err || success === false) { 
                const msg = err || 'Failed to save settings';
                setSaveError(msg); 
                toast?.error?.(msg); 
            } else { 
                toast?.success?.('Settings updated successfully!'); 
                setIsDirty(false); 
                await refetch.settings();
            }
        } catch (err) {
            setSaveError(err.message);
            toast?.error?.(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading.settings && !settings.storeName && !remoteSettings.id) return <Loader message="Fetching system settings..." />;
    if (errors.settings) return <ErrorBanner message={errors.settings} onRetry={() => refetch.settings()} />;

    const s = settings;

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader title="Global Settings" subtitle="Control your storefront appearance and backend behavior">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {isDirty && (
                        <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', padding: '6px 12px', borderRadius: 8, border: '1px solid #fef3c7' }}>
                            <i className="fas fa-exclamation-circle"></i>
                            Unsaved Changes
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn-indigo-gradient"
                        disabled={saving || !isDirty}
                        style={{ height: 42, padding: '0 20px' }}
                    >
                        {saving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </PageHeader>

            <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
                {/* Fixed Sidebar for Tabs */}
                <div className="admin-card" style={{ borderRadius: 16, width: 240, flexShrink: 0, padding: 12, background: '#fff', border: '1px solid #e2e8f0', position: 'sticky', top: 20 }}>
                    <div style={{ padding: '8px 12px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuration</h4>
                    </div>
                    {TAB_KEYS.map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: 'none',
                                background: activeTab === key ? '#6366f1' : 'transparent',
                                color: activeTab === key ? '#fff' : '#64748b',
                                fontWeight: activeTab === key ? 700 : 600,
                                fontSize: 14,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left',
                                marginBottom: 4,
                                boxShadow: activeTab === key ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                            }}
                        >
                            <i className={TAB_ICONS[key]} style={{ width: 18, textAlign: 'center', fontSize: 15 }}></i>
                            {TAB_LABELS[key]}
                        </button>
                    ))}
                </div>

                {/* Main Settings Form */}
                <div style={{ flex: 1 }}>
                    <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <div className="admin-card-header" style={{ padding: '24px 30px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                    <i className={TAB_ICONS[activeTab]}></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{TAB_LABELS[activeTab]} Settings</h3>
                                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Update your {TAB_LABELS[activeTab].toLowerCase()} preferences</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-card-body" style={{ padding: '30px' }}>
                            {saveError && <ErrorBanner message={saveError} compact style={{ marginBottom: 24 }} />}

                            <form onSubmit={handleSave} className="space-y-6">
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                            <FormField label="Store Name" name="storeName" value={s.storeName} onChange={handleChange} placeholder="e.g. Fylex Premium" required />
                                            <FormField label="Contact Email" name="storeEmail" type="email" value={s.storeEmail} onChange={handleChange} placeholder="hello@fylex.com" />
                                            <FormField label="Support Phone" name="storePhone" value={s.storePhone} onChange={handleChange} placeholder="+91 123 456 7890" />
                                            <FormField
                                                label="Primary Currency"
                                                name="currency"
                                                type="select"
                                                value={s.currency}
                                                onChange={handleChange}
                                                options={[
                                                    { value: 'INR', label: 'INR — Indian Rupee (₹)' },
                                                    { value: 'USD', label: 'USD — US Dollar ($)' },
                                                    { value: 'EUR', label: 'EUR — Euro (€)' },
                                                    { value: 'GBP', label: 'GBP — British Pound (£)' },
                                                ]}
                                            />
                                        </div>
                                        <FormField label="Business Address" name="storeAddress" type="textarea" value={s.storeAddress} onChange={handleChange} placeholder="Enter your full business address..." rows={3} />

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 30 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                                                <div style={{ flex: 1 }}>
                                                    <h5 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Brand Logo</h5>
                                                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>This logo will appear on your storefront and invoices.</p>
                                                    <FormField label="Logo URL" name="logo" value={s.logo} onChange={handleChange} placeholder="https://..." hint="SVG or transparent PNG recommended" />
                                                </div>
                                                {s.logo && (
                                                    <div style={{ 
                                                        width: 160, 
                                                        height: 100, 
                                                        background: '#f8fafc', 
                                                        borderRadius: 12, 
                                                        border: '2px dashed #e2e8f0', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        padding: 12
                                                    }}>
                                                        <img src={s.logo} alt="Store Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                            onError={e => { e.target.style.display = 'none'; }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <div className="space-y-6">
                                        <FormField label="Meta Title" name="metaTitle" value={s.metaTitle} onChange={handleChange} placeholder="The Ultimate Watch Collection" hint="Characters: 50–60 (Ideal for Google)" />
                                        <FormField label="Meta Description" name="metaDescription" type="textarea" value={s.metaDescription} onChange={handleChange} placeholder="Discover luxury timepieces crafted with precision..." rows={3} hint="Characters: 120–160 (Ideal for Google)" />
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                                            <FormField label="Google Analytics ID" name="gaId" value={s.gaId} onChange={handleChange} placeholder="G-XXXXXXXXXX" />
                                            <FormField label="Facebook Pixel ID" name="fbPixelId" value={s.fbPixelId} onChange={handleChange} placeholder="123456789012345" />
                                        </div>

                                        <div style={{ padding: '20px', background: '#f8fbfc', borderRadius: 16, border: '1px solid #e0f2fe' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', gap: 14 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fas fa-robot"></i>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>Search Engine Visibility</div>
                                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0ea5e9', opacity: 0.8 }}>Allow search engines to crawl and index your site.</p>
                                                    </div>
                                                </div>
                                                <label className="admin-switch">
                                                    <input type="checkbox" name="seoIndexing" checked={s.seoIndexing} onChange={handleChange} />
                                                    <span className="admin-slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'payment' && (
                                    <div className="space-y-8">
                                        {/* Razorpay Section */}
                                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                                <div style={{ width: 44, height: 44, background: '#fff7ed', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <i className="fas fa-credit-card" style={{ color: '#ea580c', fontSize: 20 }}></i>
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Razorpay Integration</h4>
                                                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Accept UPI, Cards, and Netbanking</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                                <FormField label="API Key ID" name="razorpayKey" value={s.razorpayKey} onChange={handleChange} placeholder="rzp_live_xxxxxxxx" />
                                                <FormField label="API Key Secret" name="razorpaySecret" type="password" value={s.razorpaySecret} onChange={handleChange} placeholder="••••••••••••••••" />
                                            </div>
                                        </div>

                                        {/* COD Section */}
                                        <div style={{ background: '#fcfdfd', borderRadius: 16, border: '1px solid #dcfce7', padding: 24 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 44, height: 44, background: '#f0fdf4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fas fa-truck-loading" style={{ color: '#16a34a', fontSize: 20 }}></i>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Cash on Delivery (COD)</h4>
                                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#16a34a', opacity: 0.8 }}>Enable pay-at-doorstep option</p>
                                                    </div>
                                                </div>
                                                <label className="admin-switch">
                                                    <input type="checkbox" name="codEnabled" checked={s.codEnabled} onChange={handleChange} />
                                                    <span className="admin-slider success"></span>
                                                </label>
                                            </div>
                                            
                                            {s.codEnabled && (
                                                <div className="animate-slide-down" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', animation: 'slideDown 0.3s ease-out' }}>
                                                    <FormField label="COD Handling Fee (₹)" name="codCharge" type="number" value={s.codCharge} onChange={handleChange} placeholder="0" />
                                                    <FormField label="Maximum Order Limit (₹)" name="codMaxAmount" type="number" value={s.codMaxAmount} onChange={handleChange} placeholder="50000" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down {
                    animation: slideDown 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SettingsPage;
