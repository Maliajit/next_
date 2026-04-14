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

const BrandsPage = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const brands = data.brands || [];
  
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!tableRef.current || loading.brands) return;
    tabulatorRef.current?.destroy();

    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        setForm({
          name: rec.name || '',
          slug: rec.slug || '',
          description: rec.description || '',
          isActive: rec.isActive === true || rec.isActive === 1
        });
        setShowForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ id, name })
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: brands,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 15,
      placeholder: 'No brands found',
      columnHeaderVertAlign: 'bottom',
      columns: [
        {
          title: 'ID', field: 'id', width: 80, hozAlign: 'center', headerSort: true,
          formatter: (cell) => `<span style="font-weight:600;color:#94a3b8;font-size:12px">#${cell.getValue()}</span>`,
        },
        {
          title: 'BRAND IDENTITY', field: 'name', minWidth: 300,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            const img = d.logo?.filePath || d.logo?.url || d.logo || d.image_url;
            const letter = (d.name || '?')[0].toUpperCase();
            return `
              <div style="display:flex;align-items:center;gap:14px;padding:8px 0">
                <div style="width:44px;height:44px;background:#f8fafc;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,0.02)">
                  ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:contain;padding:4px" />` : `<span style="font-weight:800;color:#6366f1;font-size:16px;opacity:0.8">${letter}</span>`}
                </div>
                <div style="min-width:0">
                  <div style="font-weight:800;color:#1e293b;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.01em">${d.name}</div>
                  <div style="font-size:11px;color:#6366f1;font-weight:700;margin-top:2px;text-transform:lowercase;font-family:'SF Mono',monospace">/${d.slug}</div>
                </div>
              </div>
            `;
          },
        },
        {
          title: 'ITEMS', field: '_count.products', width: 120, hozAlign: 'center',
          formatter: (cell) => `<div style="text-align:center"><span style="font-weight:800;color:#1e293b;font-size:15px">${cell.getValue() ?? 0}</span><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;font-weight:700">Catalog</div></div>`,
        },
        {
          title: 'STATUS', field: 'isActive', width: 130, hozAlign: 'center',
          formatter: (cell) => {
            const active = cell.getValue() === true || cell.getValue() === 1;
            return `<div class="status-badge" style="display:inline-flex;padding:5px 14px;border-radius:10px;font-size:10px;font-weight:800;background:${active ? '#ecfdf5' : '#fef2f2'};color:${active ? '#10b981' : '#ef4444'};border:1px solid ${active ? '#d1fae5' : '#fee2e2'};text-transform:uppercase;letter-spacing:0.04em">${active ? 'active' : 'hidden'}</div>`;
          },
        },
        {
          title: 'ACTIONS', headerSort: false, hozAlign: 'right', width: 110,
          formatter: () => `<div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-icon btn-icon-edit" style="background:#f5f3ff;color:#6366f1;width:32px;height:32px;border-radius:8px" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444;width:32px;height:32px;border-radius:8px" title="Delete"><i class="fas fa-trash-alt"></i></button>
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
  }, [brands, loading.brands]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'isActive' ? value === 'active' : value,
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {}),
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormErrors({ name: 'Brand name is required' }); return; }

    setSubmitting(true);
    const payload = {
        ...form,
        status: form.isActive ? 1 : 0
    };

    let success;
    if (editingRecord) {
      success = await updateRecord('brands', editingRecord.id, payload, api.updateBrand);
    } else {
      success = await addRecord('brands', payload, api.createBrand);
    }
    
    setSubmitting(false);
    if (success) closeModal();
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({ name: '', slug: '', description: '', isActive: true });
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const success = await deleteRecord('brands', deleteTarget.id, api.deleteBrand);
    setDeleting(false);
    if (success) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Brands"
        subtitle="Manage product brands and their global presence"
        action={{ label: 'Add Brand', icon: 'fas fa-plus', onClick: () => setShowForm(true) }}
      />

      <div className="admin-card" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--admin-shadow-sm)', border: '1px solid var(--admin-border-light)' }}>
        {loading.brands ? <Loader message="Loading brands..." /> :
         errors.brands   ? <ErrorBanner message={errors.brands} onRetry={() => refetch.brands()} /> :
         <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 800 }}><div ref={tableRef}></div></div></div>
        }
      </div>

      <AdminModal isOpen={showForm} onClose={closeModal} title={editingRecord ? "Edit Brand" : "Create New Brand"} maxWidth={520} icon="fas fa-certificate">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Brand Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rolex" required error={formErrors.name} />
            </div>
            
            <FormField label="Slug / Handle" name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. rolex" hint="URL index key" />
            
            <FormField 
              label="Availability" 
              name="isActive" 
              type="select" 
              value={form.isActive ? 'active' : 'inactive'} 
              onChange={handleChange}
              options={[{ value: 'active', label: 'Active (Live)' }, { value: 'inactive', label: 'Hidden' }]}
            />

            <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Brand Description" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Tell the brand's story..." rows={3} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--admin-border-light)' }}>
            <button type="button" className="btn-secondary" onClick={closeModal} style={{ borderRadius: 12, padding: '10px 20px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ borderRadius: 12, padding: '10px 24px' }}>
              {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : <><i className={editingRecord ? "fas fa-save mr-2" : "fas fa-plus mr-2"}></i> {editingRecord ? 'Update Brand' : 'Create Brand'}</>}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={`This will permanently delete "${deleteTarget?.name}" and all its records. Continue?`}
        confirmLabel="Confirm Delete"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default BrandsPage;
