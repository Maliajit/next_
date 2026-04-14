"use client";
import React, { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import { useAdminData } from '@/context/AdminDataContext';
import AdminModal from '@/components/admin/AdminModal';

const BrandList = () => {
  const { data, addRecord, deleteRecord } = useAdminData();
  const brandsUrlData = data.brands || [];

  const tableRef = useRef(null);
  const [table, setTable] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', featured: false });

  // Ref trick to prevent stale closures in Tabulator formatter events
  const actionsRef = useRef({ deleteRecord });
  useEffect(() => { actionsRef.current = { deleteRecord }; }, [deleteRecord]);

  useEffect(() => {
    if (tableRef.current) {
      const tabulator = new Tabulator(tableRef.current, {
        data: brandsUrlData,
        layout: "fitDataFill",
        responsiveLayout: false,
        pagination: "local",
        paginationSize: 10,
        columns: [
          {
            title: "BRAND", field: "name", width: 320,
            formatter: (cell) => {
              const d = cell.getRow().getData();
              return `
                <div style="display:flex;align-items:center;gap:14px;padding:4px 0">
                  <div style="width:40px;height:40px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fas fa-award" style="color:#6366f1;font-size:14px"></i>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:2px">
                    <div style="font-weight:700;color:#1e293b;font-size:14px">${d.name}</div>
                    <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.02em">/${d.slug}</div>
                  </div>
                </div>
              `;
            }
          },
          { 
            title: "PRODUCTS", field: "product_count", width: 130, hozAlign: "center",
            formatter: (cell) => `<div class="pill-stock" style="margin-top:4px"><span style="margin-right:2px">${cell.getValue()}</span> items</div>`
          },
          { 
            title: "STATUS", field: "status", width: 120, hozAlign: "center",
            formatter: (cell) => {
              const v = cell.getValue();
              return `<span class="status-pill ${v === 'active' ? 'pill-info' : 'pill-inactive'}" style="border-radius:8px;padding:4px 12px">${v?.toUpperCase()}</span>`;
            }
          },
          {
            title: "FEATURED", field: "featured", width: 110, hozAlign: "center",
            formatter: (cell) => cell.getValue() 
              ? `<i class="fas fa-star" style="color:#f59e0b;font-size:14px"></i>` 
              : `<i class="far fa-star" style="color:#cbd5e1;font-size:14px"></i>`
          },
          {
            title: "ACTIONS", headerSort: false, hozAlign: "right", width: 120,
            formatter: () => `
              <div style="display:flex;gap:12px;justify-content:flex-end">
                <button class="btn-icon-edit" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:16px"><i class="fas fa-edit"></i></button>
                <button class="btn-icon-delete" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:16px"><i class="fas fa-trash-alt"></i></button>
              </div>
            `,
            cellClick: (e, cell) => {
              if (e.target.closest('.btn-icon-delete')) {
                if(window.confirm("Delete this brand?")) {
                  actionsRef.current.deleteRecord('brands', cell.getRow().getData().id);
                }
              }
            }
          }
        ],
      });
      setTable(tabulator);
    }
  }, []);

  useEffect(() => {
    if (table) table.replaceData(brandsUrlData);
  }, [brandsUrlData, table]);

  const handleSave = () => {
    if (!formData.name) return;
    addRecord('brands', {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-'),
      product_count: 0,
      status: 'active',
      featured: formData.featured
    });
    setFormData({ name: '', slug: '', featured: false });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header" style={{ alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Brands</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: 500 }}>Manage manufacturer profiles and brand assets</p>
        </div>
        <button className="btn-indigo-gradient" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus mr-2" style={{ fontSize: 12 }}></i>New Brand
        </button>
      </div>

      <div className="admin-card" style={{ padding: '20px 24px', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="admin-search" style={{ flex: 2, minWidth: 300 }}>
            <i className="fas fa-search" style={{ color: '#94a3b8' }}></i>
            <input 
              type="text" 
              placeholder="Search by brand name, slug..." 
              style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '11px 16px 11px 42px' }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <select style={{ width: '100%', padding: '11px 16px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#4b5a7a', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Featured Only</option>
            </select>
          </div>
          <button className="btn-filter-dark">
            <i className="fas fa-filter mr-2"></i> Filter
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ overflowX: 'auto', padding: '0 8px 8px' }}>
          <div style={{ minWidth: 900 }}>
            <div ref={tableRef}></div>
          </div>
        </div>
      </div>

      {/* Add Brand Modal */}
      {/* Add Brand Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Brand"
        maxWidth={400}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save Brand</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group mb-0">
            <label>Brand Name</label>
            <input type="text" className="form-control" placeholder="e.g. Seiko" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group mb-0">
            <label>URL Slug</label>
            <input type="text" className="form-control" placeholder="e.g. seiko" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
          </div>
          <div className="form-group mb-0" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <label className="switch" style={{ margin: 0 }}>
              <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
              <span className="slider round"></span>
            </label>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Highlight as Featured Brand</span>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default BrandList;
