"use client";
import React, { useState, useRef, useEffect } from 'react';
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

const TaxPage = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const taxes = data.taxes || [];

  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [form, setForm] = useState({ name: '', rate: '', isActive: true });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!tableRef.current || loading.taxes) return;
    tabulatorRef.current?.destroy();

    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        setForm({
          name: rec.name || '',
          rate: rec.rate?.toString() || '',
          isActive: rec.isActive === true || rec.isActive === 1
        });
        setShowForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ id, name })
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: taxes,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: 'No tax rates found',
      columns: [
        {
          title: 'ID', field: 'id', width: 80, hozAlign: 'center', headerSort: true,
          formatter: (cell) => `<span style="font-weight:700;color:#94a3b8;font-size:12px">#${cell.getValue()}</span>`,
        },
        {
          title: 'TAX NAME', field: 'name', minWidth: 280,
          formatter: (cell) => `<div style="font-weight:800;color:#1e293b;font-size:15px;padding:6px 0">${cell.getValue() || '—'}</div>`,
        },
        {
          title: 'RATE (%)', field: 'rate', width: 140, hozAlign: 'center',
          formatter: (cell) => `<span style="font-family:'SF Mono',monospace;font-size:13px;font-weight:800;color:#6366f1;background:#f5f3ff;padding:6px 16px;border-radius:10px;border:1px solid rgba(99,102,241,0.2)">${cell.getValue()}%</span>`,
        },
        {
          title: 'STATUS', field: 'isActive', width: 140, hozAlign: 'center',
          formatter: (cell) => {
            const active = cell.getValue() === true || cell.getValue() === 1;
            return `<div style="display:inline-flex;padding:6px 16px;border-radius:12px;font-size:11px;font-weight:800;background:${active ? '#ecfdf5' : '#fef2f2'};color:${active ? '#059669' : '#dc2626'};border:1px solid ${active ? '#10b981' : '#fecaca'};text-transform:uppercase;letter-spacing:0.04em">${active ? 'active' : 'disabled'}</div>`;
          },
        },
        {
          title: 'ACTIONS', headerSort: false, hozAlign: 'right', width: 130,
          formatter: () => `<div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-icon btn-icon-edit" style="width:36px;height:36px;background:#f5f3ff;color:#6366f1;border-radius:10px" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" style="width:36px;height:36px;background:#fef2f2;color:#ef4444;border-radius:10px" title="Delete"><i class="fas fa-trash-alt"></i></button>
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
  }, [taxes, loading.taxes]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'isActive' ? value === 'active' : value)
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Tax name is required';
    if (!form.rate || isNaN(form.rate)) errs.rate = 'Enter a valid tax percentage';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSubmitting(true);
    const payload = { ...form, rate: parseFloat(form.rate) };
    
    try {
      let result;
      if (editingRecord) {
        result = await updateRecord('taxes', editingRecord.id, payload, api.updateTaxRate);
      } else {
        result = await addRecord('taxes', payload, api.createTaxRate);
      }
      
      if (result) {
        closeModal();
        await refetch.taxes();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({ name: '', rate: '', isActive: true });
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const success = await deleteRecord('taxes', deleteTarget.id, api.deleteTaxRate);
      if (success) {
        setDeleteTarget(null);
        await refetch.taxes();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Management"
        subtitle="Manage global tax rates and VAT configurations for your products"
        action={{ label: 'Configure New Tax', icon: 'fas fa-plus', onClick: () => setShowForm(true) }}
      />

      <div className="admin-card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div className="admin-card-header" style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Available Tax Rates</h3>
        </div>
        {loading.taxes && taxes.length === 0 ? (
          <div style={{ padding: 100 }}><Loader message="Syncing tax configurations..." /></div>
        ) : errors.taxes ? (
          <div style={{ padding: 40 }}><ErrorBanner message={errors.taxes} onRetry={() => refetch.taxes()} /></div>
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 12px 12px' }}>
            <div style={{ minWidth: 800 }}><div ref={tableRef}></div></div>
          </div>
        )}
      </div>

      {/* Tax Modal (Create/Edit) */}
      <AdminModal 
        isOpen={showForm} 
        onClose={closeModal} 
        title={editingRecord ? "Edit Tax Configuration" : "New Tax Configuration"} 
        maxWidth={500}
      >
        <form onSubmit={handleSubmit} style={{ padding: '4px' }}>
          <div className="space-y-6">
            <FormField 
                label="Tax Display Name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="e.g. GST 18% (Standard)" 
                required 
                error={formErrors.name}
                hint="Use a clear name that identifies the tax type and percentage"
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <FormField 
                    label="Rate Percentage (%)" 
                    name="rate" 
                    type="number" 
                    value={form.rate} 
                    onChange={handleChange} 
                    placeholder="18" 
                    required 
                    error={formErrors.rate} 
                />

                <FormField 
                    label="Application Status" 
                    name="isActive" 
                    type="select" 
                    value={form.isActive ? 'active' : 'inactive'} 
                    onChange={handleChange}
                    options={[
                        { value: 'active', label: 'Active — Live' }, 
                        { value: 'inactive', label: 'Inactive — Disabled' }
                    ]}
                />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: 10 }} onClick={closeModal}>Discard</button>
            <button type="submit" className="btn-indigo-gradient px-8" style={{ height: 42, borderRadius: 10 }} disabled={submitting}>
              {submitting ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className={editingRecord ? "fas fa-save mr-2" : "fas fa-check-circle mr-2"}></i>}
              {editingRecord ? 'Update Configuration' : 'Confirm & Create'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Tax Rate?"
        message={`Warning: Deleting "${deleteTarget?.name}" may affect active products using this tax class. Are you absolutely sure?`}
        confirmLabel="Confirm Removal"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default TaxPage;
