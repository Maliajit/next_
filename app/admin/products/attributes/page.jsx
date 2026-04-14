"use client";
import React, { useState, useRef, useEffect } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import { useAdminData } from '@/context/AdminDataContext';
import AdminModal from '@/components/admin/AdminModal';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import FormField from '@/components/admin/ui/FormField';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';

const AttributeList = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const attributes = data.attributes || [];

  const [view, setView] = useState('list'); // 'list' or 'values'
  const [selectedAttr, setSelectedAttr] = useState(null);
  
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [showValForm, setShowValForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [attrForm, setAttrForm] = useState({ name: '', code: '', type: 'select', isVariant: true, isActive: true });
  const [valForm, setValForm] = useState({ label: '', value: '', isActive: true });
  
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  // ─── Attribute Table ───
  useEffect(() => {
    if (!tableRef.current || loading.attributes || view !== 'list') return;
    tabulatorRef.current?.destroy();

    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        setAttrForm({
          name: rec.name || '',
          code: rec.code || '',
          type: rec.type || 'select',
          isVariant: !!rec.isVariant,
          isActive: rec.isActive === true || rec.isActive === 1
        });
        setShowAttrForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ type: 'attribute', id, name }),
      onViewValues: (attr) => {
        setSelectedAttr(attr);
        setView('values');
      }
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: attributes,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: 'No attributes found',
      columns: [
        { title: "ID", field: "id", width: 70, hozAlign: "center", formatter: cell => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>` },
        {
          title: "ATTRIBUTE NAME", field: "name", minWidth: 200,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            return `<div><div style="font-weight:700;color:#1e293b;font-size:14px">${d.name}</div><div style="font-size:11px;color:#94a3b8;font-family:monospace">#${d.code}</div></div>`;
          }
        },
        {
            title: "FORMAT", field: "type", width: 120,
            formatter: (cell) => `<span style="font-family:monospace;font-size:11px;font-weight:800;color:#6366f1;background:#f5f3ff;padding:4px 10px;border-radius:6px;text-transform:uppercase;border:1px solid rgba(99,102,241,0.1)">${cell.getValue()}</span>`
        },
        {
            title: "CONFIGS", field: "values", width: 130, hozAlign: "center",
            formatter: (cell) => {
                const count = cell.getValue()?.length || 0;
                return `<button class="btn-sm-action" style="background:#f0f9ff;color:#0369a1;font-weight:700;padding:4px 12px;border-radius:10px;border:1px solid #bae6fd;cursor:pointer">${count} Options</button>`;
            },
            cellClick: (e, cell) => {
                if (e.target.closest('.btn-sm-action')) actionsRef.current.onViewValues(cell.getRow().getData());
            }
        },
        {
            title: "IS VARIANT", field: "isVariant", width: 100, hozAlign: "center",
            formatter: (cell) => cell.getValue() 
                ? `<div style="color:#10b981;font-size:16px"><i class="fas fa-check-circle"></i></div>` 
                : `<div style="color:#e2e8f0;font-size:16px"><i class="fas fa-times-circle"></i></div>`
        },
        {
            title: "STATUS", field: "isActive", width: 120, hozAlign: "center",
            formatter: (cell) => {
                const active = cell.getValue() === true || cell.getValue() === 1;
                return `<div class="status-badge" style="background:${active ? '#ecfdf5' : '#f8fafc'};color:${active ? '#10b981' : '#64748b'};font-weight:700;padding:4px 12px;border-radius:8px">${active ? 'active' : 'inactive'}</div>`;
            }
        },
        {
          title: "ACTIONS", width: 110, headerSort: false, hozAlign: "right",
          formatter: () => `<div style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn-icon btn-icon-edit" style="background:#f5f3ff;color:#6366f1"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444"><i class="fas fa-trash-alt"></i></button>
          </div>`,
          cellClick: (e, cell) => {
            const d = cell.getRow().getData();
            if (e.target.closest('.btn-icon-edit')) actionsRef.current.onEdit(d);
            if (e.target.closest('.btn-icon-delete')) actionsRef.current.onDelete(d.id, d.name);
          }
        },
      ],
    });

    return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
  }, [attributes, loading.attributes, view]);

  // ─── Attribute Handlers ───
  const handleSaveAttribute = async (e) => {
    e.preventDefault();
    if (!attrForm.name) return;
    
    setSubmitting(true);
    const payload = {
      ...attrForm,
      code: attrForm.code || attrForm.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      status: attrForm.isActive ? 'active' : 'inactive'
    };
    
    let success;
    if (editingRecord) {
        success = await updateRecord('attributes', editingRecord.id, payload, api.updateAttribute);
    } else {
        success = await addRecord('attributes', payload, api.createAttribute);
    }
    
    setSubmitting(false);
    if (success) {
      closeAttrModal();
    }
  };

  const closeAttrModal = () => {
      setShowAttrForm(false);
      setEditingRecord(null);
      setAttrForm({ name: '', code: '', type: 'select', isVariant: true, isActive: true });
  };

  // ─── Value Handlers ───
  const handleEditValue = (val) => {
      setEditingRecord(val);
      setValForm({
          label: val.label || '',
          value: val.value || '',
          isActive: true // Value status tracking can be expanded later
      });
      setShowValForm(true);
  };

  const handleSaveValue = async (e) => {
    e.preventDefault();
    if (!valForm.label || !selectedAttr) return;
    
    setSubmitting(true);
    const payload = {
      label: valForm.label,
      value: valForm.value || valForm.label,
      status: 'active',
      sortOrder: 0
    };

    let res;
    if (editingRecord) {
        res = await api.updateAttributeValue(editingRecord.id, payload);
    } else {
        res = await api.createAttributeValue(selectedAttr.id, payload);
    }

    setSubmitting(false);
    if (res.success) {
      refetch.attributes();
      closeValModal();
      toast?.success(`Option ${editingRecord ? 'updated' : 'added'} successfully`);
    } else {
      toast?.error(res.error || 'Failed to save option');
    }
  };

  const closeValModal = () => {
    setShowValForm(false);
    setEditingRecord(null);
    setValForm({ label: '', value: '', isActive: true });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    
    let success;
    if (deleteTarget.type === 'attribute') {
        success = await deleteRecord('attributes', deleteTarget.id, api.deleteAttribute);
    } else {
        const res = await api.deleteAttributeValue(deleteTarget.id);
        success = res.success;
        if (success) refetch.attributes();
    }
    
    setDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setAttrForm(prev => ({ 
          ...prev, 
          [name]: type === 'checkbox' ? checked : (name === 'isActive' ? value === 'active' : value) 
      }));
  };

  // ─── Value List View ───
  if (view === 'values' && selectedAttr) {
    const values = attributes.find(a => a.id === selectedAttr.id)?.values || [];
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button onClick={() => setView('list')} className="btn-secondary" style={{ width: 44, height: 44, borderRadius: 12, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-chevron-left"></i>
            </button>
            <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedAttr.name} Options</h2>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Code: {selectedAttr.code}</span>
                    <span>Type: {selectedAttr.type}</span>
                </div>
            </div>
            <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowValForm(true)}>
                <i className="fas fa-plus mr-2"></i> Add Option
            </button>
        </div>

        <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>Option Label</th>
                        <th>Value</th>
                        <th style={{ width: 120, textAlign: 'center' }}>Status</th>
                        <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {values.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>No options added for this attribute yet.</td></tr>
                    ) : values.map(val => (
                        <tr key={val.id}>
                            <td><span style={{ fontWeight: 600, color: '#cbd5e1' }}>#{val.id}</span></td>
                            <td><span style={{ fontWeight: 700, color: '#1e293b' }}>{val.label}</span></td>
                            <td>
                                {selectedAttr.type === 'color' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 8, background: val.value, border: '1px solid #e2e8f0' }}></div>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b', fontSize: 13 }}>{val.value}</span>
                                    </div>
                                ) : (
                                    <span style={{ color: '#64748b', fontWeight: 600 }}>{val.value}</span>
                                )}
                            </td>
                            <td style={{ textAlign: 'center' }}><span className="status-badge" style={{ background: '#ecfdf5', color: '#10b981', fontWeight: 700 }}>ACTIVE</span></td>
                            <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button className="btn-icon btn-icon-edit" onClick={() => handleEditValue(val)} style={{ background: '#f5f3ff', color: '#6366f1' }}><i className="fas fa-edit"></i></button>
                                    <button className="btn-icon btn-icon-delete" onClick={() => setDeleteTarget({ type: 'option', id: val.id, name: val.label })} style={{ background: '#fef2f2', color: '#ef4444' }}><i className="fas fa-trash-alt"></i></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Option Modal */}
        <AdminModal isOpen={showValForm} onClose={closeValModal} title={editingRecord ? `Edit ${selectedAttr.name} Option` : `Add ${selectedAttr.name} Option`} maxWidth={420}>
            <form onSubmit={handleSaveValue} className="space-y-4">
                <FormField label="Option Label" value={valForm.label} onChange={e => setValForm({...valForm, label: e.target.value})} placeholder="e.g. Matte Black, XL, Leather" required />
                {selectedAttr.type === 'color' ? (
                    <div className="form-group">
                        <label className="admin-label">Color Hex Code</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <input type="color" value={valForm.value || '#6366f1'} onChange={e => setValForm({...valForm, value: e.target.value})} style={{ width: 44, height: 44, padding: 0, border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', overflow: 'hidden' }} />
                            <input type="text" className="admin-input" value={valForm.value} onChange={e => setValForm({...valForm, value: e.target.value})} placeholder="#000000" />
                        </div>
                    </div>
                ) : (
                    <FormField label="System Value" value={valForm.value} onChange={e => setValForm({...valForm, value: e.target.value})} placeholder="e.g. matte_black, xl, leather" />
                )}
                
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <button type="button" onClick={closeValModal} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : <><i className="fas fa-save mr-2"></i> {editingRecord ? 'Update Option' : 'Save Option'}</>}
                    </button>
                </div>
            </form>
        </AdminModal>

        <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title={deleteTarget?.type === 'attribute' ? "Delete Attribute" : "Delete Option"}
            message={`This will permanently remove the ${deleteTarget?.type} "${deleteTarget?.name}". This action cannot be undone. Continue?`}
            confirmLabel="Delete Permanently"
            loading={deleting}
            danger
        />
      </div>
    );
  }

  // ─── Main Attribute Page ───
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Product Attributes"
        subtitle="Define global properties like Size, Material, or Color"
        action={{ label: 'New Attribute', icon: 'fas fa-plus', onClick: () => setShowAttrForm(true) }}
      />

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {loading.attributes ? (
          <Loader message="Loading attribute set..." />
        ) : errors.attributes ? (
          <ErrorBanner message={errors.attributes} onRetry={() => refetch.attributes()} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 900 }}>
              <div ref={tableRef}></div>
            </div>
          </div>
        )}
      </div>

      {/* Attribute Modal */}
      <AdminModal isOpen={showAttrForm} onClose={closeAttrModal} title={editingRecord ? "Edit Attribute" : "Add Global Attribute"} maxWidth={460}>
        <form onSubmit={handleSaveAttribute} className="space-y-4">
          <FormField label="Attribute Display Name" name="name" value={attrForm.name} onChange={handleChange} placeholder="e.g. Dial Type" required />
          <FormField label="Reference Code" name="code" value={attrForm.code} onChange={handleChange} placeholder="dial_type" hint="Used for internal logic & filters" />
          
          <div className="form-group">
            <label className="admin-label">Selection UI Type</label>
            <select className="admin-input" name="type" value={attrForm.type} onChange={handleChange}>
              <option value="select">Dropdown List</option>
              <option value="color">Color Palette</option>
              <option value="text">Label Tags</option>
            </select>
          </div>

          <FormField 
            label="Visibility Status" 
            name="isActive" 
            type="select" 
            value={attrForm.isActive ? 'active' : 'inactive'} 
            onChange={handleChange}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          />

          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" name="isVariant" checked={attrForm.isVariant} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600 border-slate-300" />
            <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Variant Property</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>If checked, this attribute will be used to generate product variants.</div>
            </div>
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={closeAttrModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : <><i className="fas fa-save mr-2"></i> {editingRecord ? 'Update Attribute' : 'Create Attribute'}</>}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'attribute' ? "Delete Attribute" : "Delete Option"}
        message={`This will permanently remove the ${deleteTarget?.type} "${deleteTarget?.name}". This action cannot be undone. Continue?`}
        confirmLabel="Confirm Delete"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default AttributeList;
