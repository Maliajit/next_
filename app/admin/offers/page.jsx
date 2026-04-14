"use client";
import React, { useState, useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import { useAdminData } from '@/context/AdminDataContext';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import FormField from '@/components/admin/ui/FormField';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import AdminModal from '@/components/admin/AdminModal';
import { useToast } from '@/context/ToastContext';

const OffersPage = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const offers = data.offers || [];
  const categories = data.categories || [];

  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [form, setForm] = useState({
    name: '', code: '', offerType: 'percentage', discountValue: '',
    startsAt: '', endsAt: '', description: '',
    isActive: true, maxUses: '', categoryIds: []
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!tableRef.current || loading.offers) return;
    tabulatorRef.current?.destroy();
    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        setForm({
          name: rec.name || '',
          code: rec.code || '',
          offerType: rec.offerType || 'percentage',
          discountValue: rec.discountValue?.toString() || '',
          startsAt: rec.startsAt ? new Date(rec.startsAt).toISOString().split('T')[0] : '',
          endsAt: rec.endsAt ? new Date(rec.endsAt).toISOString().split('T')[0] : '',
          description: rec.description || '',
          isActive: rec.status === 1 || rec.isActive === true,
          maxUses: rec.maxUses?.toString() || '',
          categoryIds: rec.categories?.map(c => c.categoryId.toString()) || []
        });
        setShowForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ id, name })
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: offers,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: 'No offers found',
      columns: [
        {
          title: 'ID', field: 'id', width: 70, hozAlign: 'center', headerSort: true,
          formatter: (cell) => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>`,
        },
        {
          title: 'OFFER / CODE', field: 'name', minWidth: 240,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            return `<div style="padding:4px 0">
              <div style="font-weight:800;color:#1e293b;font-size:14px">${d.name || '—'}</div>
              <div style="font-family:'SF Mono',monospace;font-size:11px;font-weight:700;color:#6366f1;margin-top:2px">${d.code || 'NO CODE'}</div>
            </div>`;
          },
        },
        {
          title: 'DISCOUNT', field: 'discountValue', width: 140, hozAlign: 'center',
          formatter: (cell) => {
            const d = cell.getRow().getData();
            const isPerc = d.offerType === 'percentage';
            return `<div style="text-align:center"><div style="font-weight:800;color:#10b981;font-size:15px">${!isPerc ? '₹' : ''}${cell.getValue()}${isPerc ? '%' : ''}</div><div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase">${d.offerType}</div></div>`;
          },
        },
        {
          title: 'USAGE', field: 'usedCount', width: 100, hozAlign: 'center',
          formatter: (cell) => {
            const d = cell.getRow().getData();
            return `<div style="text-align:center"><div style="font-weight:800;color:#1e293b">${cell.getValue() ?? 0}</div><div style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase">${d.maxUses ? `/ ${d.maxUses}` : 'Uses'}</div></div>`;
          }
        },
        {
          title: 'VALID THRU', field: 'endsAt', width: 140,
          formatter: (cell) => {
            const val = cell.getValue();
            if (!val) return `<span style="font-size:11px;color:#94a3b8;font-weight:600">Forever</span>`;
            const d = new Date(val);
            const expired = d < new Date();
            return `<div style="font-size:12px;font-weight:600;color:${expired ? '#ef4444' : '#64748b'}">${d.toLocaleDateString('en-GB')}</div>`;
          }
        },
        {
          title: 'STATUS', field: 'isActive', width: 120, hozAlign: 'center',
          formatter: (cell) => {
            const active = cell.getValue() === true;
            return `<div class="status-badge" style="display:inline-flex;padding:5px 14px;border-radius:10px;font-size:11px;font-weight:700;background:${active ? '#ecfdf5' : '#fef2f2'};color:${active ? '#10b981' : '#ef4444'};border:1px solid ${active ? '#d1fae5' : '#fee2e2'};text-transform:uppercase;letter-spacing:0.02em">${active ? 'active' : 'inactive'}</div>`;
          },
        },
        {
          title: 'ACTIONS', headerSort: false, hozAlign: 'right', width: 110,
          formatter: () => `<div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-icon btn-icon-edit" style="background:#f5f3ff;color:#6366f1" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </div>`,
          cellClick: (e, cell) => {
            const d = cell.getRow().getData();
            if (e.target.closest('.btn-icon-edit')) actionsRef.current.onEdit(d);
            if (e.target.closest('.btn-icon-delete')) actionsRef.current.onDelete(d.id, d.name);
          },
        },
      ],
    });

    return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
  }, [offers, loading.offers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special validation for discountValue if percentage
    if (name === 'discountValue' && form.offerType === 'percentage') {
       if (value !== '' && (!/^\d+$/.test(value) || value.length > 2)) return;
       if (parseInt(value) > 99) return;
    }
    
    setForm(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'active' : value 
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Offer name is required';
    if (!form.code.trim()) errs.code = 'Coupon code is required';
    if (!form.discountValue || isNaN(form.discountValue)) errs.discountValue = 'Valid discount value is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSubmitting(true);
    const payload = { 
      ...form, 
      discountValue: parseFloat(form.discountValue || 0),
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      status: form.isActive ? 1 : 0
    };

    let success;
    if (editingRecord) {
      success = await updateRecord('offers', editingRecord.id, payload, api.updateOffer);
    } else {
      success = await addRecord('offers', payload, api.createOffer);
    }
    
    setSubmitting(false);

    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({
      name: '', code: '', offerType: 'percentage', discountValue: '',
      startsAt: '', endsAt: '', description: '',
      isActive: true, maxUses: '', categoryIds: []
    });
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const success = await deleteRecord('offers', deleteTarget.id, api.deleteOffer);
    setDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const handleCategoryToggle = (catId) => {
      const id = catId.toString();
      setForm(prev => ({
          ...prev,
          categoryIds: prev.categoryIds.includes(id) 
            ? prev.categoryIds.filter(x => x !== id) 
            : [...prev.categoryIds, id]
      }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Promotional Offers"
        subtitle="Manage discounts, coupons and campaign validity."
        action={{ label: 'Add New Offer', icon: 'fas fa-plus', onClick: () => setShowForm(true) }}
      />

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {loading.offers ? <Loader message="Loading offers..." /> :
         errors.offers   ? <ErrorBanner message={errors.offers} onRetry={() => refetch.offers()} /> :
         <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 900 }}><div ref={tableRef}></div></div></div>
        }
      </div>

      {/* Offer Modal (Create/Edit) */}
      <AdminModal isOpen={showForm} onClose={closeModal} title={editingRecord ? "Edit Promotional Offer" : "Create New Offer"} maxWidth={680}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Campaign/Offer Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Festive Flash Sale" required error={formErrors.name} />
            </div>
            
            <FormField label="Coupon Code" name="code" value={form.code} onChange={handleChange} placeholder="e.g. FLASH30" required error={formErrors.code} />
            
            <FormField 
              label="Availability Status" 
              name="isActive" 
              type="select" 
              value={form.isActive ? 'active' : 'inactive'} 
              onChange={handleChange}
              options={[{ value: 'active', label: 'Active (Live)' }, { value: 'inactive', label: 'Inactive (Hidden)' }]}
            />

            <FormField
              label="Discount Type"
              name="offerType"
              type="select"
              value={form.offerType}
              onChange={handleChange}
              options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount (₹)' }]}
            />
            
            <FormField
              label={form.offerType === 'percentage' ? 'Discount Percentage (%)' : 'Fixed Amount (₹)'}
              name="discountValue"
              type="text"
              value={form.discountValue}
              onChange={handleChange}
              placeholder={form.offerType === 'percentage' ? 'Max 99' : 'e.g. 1000'}
              hint={form.offerType === 'percentage' ? "Max 2 digits (e.g., 30)" : ""}
              required
              error={formErrors.discountValue}
            />

            <FormField label="Usage Limit (Expires after X uses)" name="maxUses" type="number" value={form.maxUses} onChange={handleChange} placeholder="Unlimited if empty" />

            <div className="form-group">
                <label className="admin-label">Applicable Categories (Optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, maxHeight: 120, overflowY: 'auto', padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    {categories.length === 0 ? <span style={{ fontSize: 12, color: '#94a3b8' }}>No categories available</span> : categories.map(cat => (
                        <button 
                          key={cat.id} 
                          type="button"
                          onClick={() => handleCategoryToggle(cat.id)}
                          style={{
                              padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                              background: form.categoryIds.includes(cat.id.toString()) ? '#6366f1' : '#fff',
                              color: form.categoryIds.includes(cat.id.toString()) ? '#fff' : '#475569',
                              border: '1px solid ' + (form.categoryIds.includes(cat.id.toString()) ? '#6366f1' : '#e2e8f0'),
                              transition: 'all 0.2s'
                          }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <FormField label="Launch Date" name="startsAt" type="date" value={form.startsAt} onChange={handleChange} />
            <FormField label="Expiry Date" name="endsAt" type="date" value={form.endsAt} onChange={handleChange} />

            <div style={{ gridColumn: '1 / -1' }}>
              <FormField label="Offer Description / Details" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Explain the terms of this offer..." rows={3} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : <><i className="fas fa-save mr-2"></i> {editingRecord ? 'Update Offer' : 'Create Offer'}</>}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message={`This will permanently remove the coupon "${deleteTarget?.name}". Continue?`}
        confirmLabel="Confirm Delete"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default OffersPage;
