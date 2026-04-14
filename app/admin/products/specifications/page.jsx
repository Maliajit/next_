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

const SpecificationList = () => {
  const { data, loading, errors, refetch, addRecord, updateRecord, deleteRecord } = useAdminData();
  const specifications = data.specifications || [];
  const groups = data.specificationGroups || [];
  
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'groups'
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [form, setForm] = useState({ name: '', code: '', type: 'text', sortOrder: 0, groupId: '', isActive: true });
  const [formErrors, setFormErrors] = useState({});
  
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);
  const actionsRef = useRef({});

  // ─── Table Effect ───
  useEffect(() => {
    if (!tableRef.current || loading.specifications || loading.specificationGroups) return;
    tabulatorRef.current?.destroy();

    const currentData = activeTab === 'specs' ? specifications : groups;
    
    actionsRef.current = {
      onEdit: (rec) => {
        setEditingRecord(rec);
        if (activeTab === 'specs') {
            setForm({
                name: rec.name || '',
                code: rec.code || '',
                type: rec.type || 'text',
                sortOrder: rec.sortOrder || 0,
                groupId: rec.groupId?.toString() || '',
                isActive: rec.isActive === true || rec.isActive === 1
            });
        } else {
            setForm({
                name: rec.name || '',
                sortOrder: rec.sortOrder || 0,
                isActive: rec.isActive === true || rec.isActive === 1
            });
        }
        setShowForm(true);
      },
      onDelete: (id, name) => setDeleteTarget({ type: activeTab, id, name })
    };

    const columns = activeTab === 'specs' ? [
        { title: "ID", field: "id", width: 70, hozAlign: "center", formatter: cell => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>` },
        {
          title: "SPECIFICATION", field: "name", minWidth: 200,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            return `<div><div style="font-weight:700;color:#1e293b;font-size:14px">${d.name}</div><div style="font-size:11px;color:#94a3b8;font-family:monospace">#${d.code}</div></div>`;
          }
        },
        {
            title: "FORMAT", field: "type", width: 120, hozAlign: "center",
            formatter: (cell) => `<span style="font-family:monospace;font-size:11px;font-weight:800;color:#6366f1;background:#f5f3ff;padding:4px 10px;border-radius:6px;text-transform:uppercase;border:1px solid rgba(99,102,241,0.1)">${cell.getValue() || 'text'}</span>`
        },
        { 
            title: "GROUP", field: "group.name", width: 140,
            formatter: (cell) => cell.getValue() ? `<span style="font-size:11px;font-weight:700;color:#64748b">${cell.getValue()}</span>` : '<span style="color:#cbd5e1;font-size:11px">—</span>'
        },
        { title: "SORT", field: "sortOrder", width: 80, hozAlign: "center", formatter: (cell) => `<span style="color:#64748b;font-weight:600">${cell.getValue() || 0}</span>` },
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
    ] : [
        { title: "ID", field: "id", width: 70, hozAlign: "center", formatter: cell => `<span style="font-weight:600;color:#94a3b8">#${cell.getValue()}</span>` },
        { title: "GROUP NAME", field: "name", minWidth: 200, formatter: (cell) => `<span style="font-weight:800;color:#1e293b;font-size:14px">${cell.getValue()}</span>` },
        {
            title: "SPECS", field: "_count.specifications", width: 120, hozAlign: "center",
            formatter: (cell) => {
                const count = cell.getValue() || 0;
                return `<span class="status-badge" style="background:#ecfdf5;color:#10b981;font-weight:700;padding:4px 12px;border-radius:10px">${count} Specs</span>`;
            }
        },
        { title: "SORT", field: "sortOrder", width: 80, hozAlign: "center", formatter: (cell) => `<span style="color:#64748b;font-weight:600">${cell.getValue() || 0}</span>` },
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
    ];

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: currentData,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: `No ${activeTab === 'specs' ? 'specifications' : 'groups'} found`,
      columns: columns,
    });

    return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
  }, [specifications, groups, loading.specifications, loading.specificationGroups, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    setSubmitting(true);
    const type = activeTab === 'specs' ? 'specifications' : 'specificationGroups';
    const createFn = activeTab === 'specs' ? api.createSpecification : api.createSpecificationGroup;
    const updateFn = activeTab === 'specs' ? api.updateSpecification : api.updateSpecificationGroup;

    const payload = { 
        ...form, 
        groupId: form.groupId || null,
        status: form.isActive ? 1 : 0
    };

    let success;
    if (editingRecord) {
        success = await updateRecord(type, editingRecord.id, payload, updateFn);
    } else {
        success = await addRecord(type, payload, createFn);
    }
    
    setSubmitting(false);
    if (success) {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingRecord(null);
    setForm({ name: '', code: '', type: 'text', sortOrder: 0, groupId: '', isActive: true });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const type = deleteTarget.type === 'specs' ? 'specifications' : 'specificationGroups';
    const deleteFn = deleteTarget.type === 'specs' ? api.deleteSpecification : api.deleteSpecificationGroup;
    
    const success = await deleteRecord(type, deleteTarget.id, deleteFn);
    setDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
        ...prev, 
        [name]: name === 'isActive' ? value === 'active' : value,
        ...(name === 'sortOrder' ? { [name]: parseInt(value) || 0 } : {})
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Specifications"
        subtitle="Configure product technical details and groups"
        action={{ label: activeTab === 'specs' ? 'Add Spec' : 'Add Group', icon: 'fas fa-plus', onClick: () => setShowForm(true) }}
      />

      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {[
          { key: 'specs', label: 'Specifications', icon: 'fa-list-ul' },
          { key: 'groups', label: 'Spec Groups', icon: 'fa-layer-group' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); closeModal(); }}
            style={{
              padding: '8px 24px', borderRadius: 10, border: 'none', background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#1e293b' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, boxShadow: activeTab === tab.key ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fas ${tab.icon}`} style={{ fontSize: 12, opacity: activeTab === tab.key ? 1 : 0.6 }}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        { (activeTab === 'specs' ? loading.specifications : loading.specificationGroups) ? (
          <Loader message={`Loading ${activeTab}...`} />
        ) : (activeTab === 'specs' ? errors.specifications : errors.specificationGroups) ? (
          <ErrorBanner message={errors.specifications || errors.specificationGroups} onRetry={() => refetch[activeTab === 'specs' ? 'specifications' : 'specificationGroups']()} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 800 }}>
              <div ref={tableRef}></div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Modal */}
      <AdminModal isOpen={showForm} onClose={closeModal} title={editingRecord ? `Edit ${activeTab === 'specs' ? 'Specification' : 'Group'}` : `Add New ${activeTab === 'specs' ? 'Specification' : 'Group'}`} maxWidth={480}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={activeTab === 'specs' ? "Spec Name" : "Group Name"} name="name" value={form.name} onChange={handleChange} placeholder={activeTab === 'specs' ? "e.g. Battery Capacity" : "e.g. Smart Features"} required />
          
          {activeTab === 'specs' && (
            <>
              <FormField label="Reference Code" name="code" value={form.code} onChange={handleChange} placeholder="e.g. battery_capacity" hint="Internal key for API/Filters" />
              <div className="form-group">
                <label className="admin-label">Selection Format</label>
                <select className="admin-input" name="type" value={form.type} onChange={handleChange}>
                  <option value="text">Single Line Text</option>
                  <option value="select">Dropdown Menu</option>
                  <option value="boolean">Toggle (Yes/No)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="admin-label">Assign to Group</label>
                <select className="admin-input" name="groupId" value={form.groupId} onChange={handleChange}>
                    <option value="">No Group</option>
                    {groups.map(g => <option key={g.id} value={g.id.toString()}>{g.name}</option>)}
                </select>
              </div>
            </>
          )}

          <FormField label="Sorting Order" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />

          <FormField 
            label="Visibility Status" 
            name="isActive" 
            type="select" 
            value={form.isActive ? 'active' : 'inactive'} 
            onChange={handleChange}
            options={[{ value: 'active', label: 'Active (Visible)' }, { value: 'inactive', label: 'Inactive (Hidden)' }]}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : <><i className="fas fa-save mr-2"></i> {editingRecord ? 'Update' : 'Confirm Save'}</>}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'specs' ? "Remove Specification" : "Remove Group"}
        message={`This will permanently delete "${deleteTarget?.name}". This action cannot be reversed. Continue?`}
        confirmLabel="Proceed with Delete"
        loading={deleting}
        danger
      />
    </div>
  );
};

export default SpecificationList;
