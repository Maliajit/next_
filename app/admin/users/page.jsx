"use client";
import React, { useState, useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '@/app/admin/css/datatable.css';
import '@/app/admin/css/custom.css';
import { useAdminData } from '@/context/AdminDataContext';
import * as api from '@/services/adminApi';
import PageHeader from '@/components/admin/ui/PageHeader';
import Loader from '@/components/admin/ui/Loader';
import ErrorBanner from '@/components/admin/ui/ErrorBanner';
import ConfirmModal from '@/components/admin/ui/ConfirmModal';
import AdminModal from '@/components/admin/AdminModal';
import { useToast } from '@/context/ToastContext';

const UsersPage = () => {
  const toast = useToast();
  const { data, loading, errors, refetch, updateRecord } = useAdminData();
  const users = data.users || [];

  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);

  const [search, setSearch] = useState('');
  const [blockTarget, setBlockTarget] = useState(null); // { id, name, isBlocked }
  const [blocking, setBlocking] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const actionsRef = useRef({});

  useEffect(() => {
    if (!tableRef.current || loading.users) return;
    tabulatorRef.current?.destroy();

    actionsRef.current = {
      onView: (u) => { setSelectedUser(u); setShowDetails(true); },
      onBlock: (u) => setBlockTarget({ id: u.id, name: u.name, isBlocked: u.isBlocked }),
    };

    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: users,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 10,
      placeholder: 'No customers found',
      columns: [
        {
          title: 'CUSTOMER', field: 'name', minWidth: 280,
          formatter: (cell) => {
            const d = cell.getRow().getData();
            const letter = (d.name || '?')[0].toUpperCase();
            return `<div style="display:flex;align-items:center;gap:14px;padding:6px 0">
              <div style="width:40px;height:40px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#6366f1;font-size:14px;flex-shrink:0">${letter}</div>
              <div style="min-width:0">
                <div style="font-weight:800;color:#1e293b;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.name || '—'}</div>
                <div style="font-size:11px;font-weight:600;color:#94a3b8">${d.email || d.mobile || 'No contact'}</div>
              </div>
            </div>`;
          },
        },
        {
          title: 'ORDERS', field: '_count.orders', width: 100, hozAlign: 'center',
          formatter: (cell) => `<div style="text-align:center"><span style="font-weight:800;color:#1e293b">${cell.getValue() ?? 0}</span><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;letter-spacing:0.02em">Orders</div></div>`,
        },
        {
          title: 'TOTAL SPENT', field: 'totalSpent', width: 140, hozAlign: 'center',
          formatter: (cell) => `<div style="font-weight:800;color:#1e293b;font-size:14px">₹${Number(cell.getValue() || 0).toLocaleString('en-IN')}</div>`,
        },
        {
          title: 'STATUS', field: 'isActive', width: 120, hozAlign: 'center',
          formatter: (cell) => {
            const u = cell.getRow().getData();
            const blocked = u.isBlocked === true;
            const active = u.isActive === true;
            return `<div class="status-badge" style="display:inline-flex;padding:5px 14px;border-radius:10px;font-size:11px;font-weight:700;background:${blocked ? '#fef2f2' : active ? '#ecfdf5' : '#f8fafc'};color:${blocked ? '#ef4444' : active ? '#10b981' : '#64748b'};border:1px solid ${blocked ? '#fee2e2' : active ? '#d1fae5' : '#e2e8f0'}">
                ${blocked ? 'BLOCKED' : active ? 'ACTIVE' : 'INACTIVE'}
            </div>`;
          },
        },
        {
          title: 'ACTIONS', headerSort: false, hozAlign: 'right', width: 110,
          formatter: (cell) => {
            const u = cell.getRow().getData();
            const blockIcon = u.isBlocked ? 'fa-unlock' : 'fa-ban';
            return `<div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn-icon btn-icon-edit" style="background:#f5f3ff;color:#6366f1" title="View Details"><i class="fas fa-eye"></i></button>
              <button class="btn-icon btn-icon-delete" style="background:#fef2f2;color:#ef4444" title="${u.isBlocked ? 'Unblock' : 'Block'} User"><i class="fas ${blockIcon}"></i></button>
            </div>`;
          },
          cellClick: (e, cell) => {
            const u = cell.getRow().getData();
            if (e.target.closest('.btn-icon-edit')) actionsRef.current.onView(u);
            if (e.target.closest('.btn-icon-delete')) actionsRef.current.onBlock(u);
          },
        },
      ],
    });

    return () => { tabulatorRef.current?.destroy(); tabulatorRef.current = null; };
  }, [users, loading.users]);

  useEffect(() => {
    if (!tabulatorRef.current) return;
    if (search) {
      tabulatorRef.current.setFilter([
        { field: 'name', type: 'like', value: search },
        { field: 'email', type: 'like', value: search },
      ], 'or');
    } else {
      tabulatorRef.current.clearFilter();
    }
  }, [search]);

  const handleBlockToggle = async () => {
    if (!blockTarget) return;
    setBlocking(true);
    const newBlockValue = !blockTarget.isBlocked;
    const success = await updateRecord('users', blockTarget.id, { isBlocked: newBlockValue, isActive: !newBlockValue }, api.updateUser);
    setBlocking(false);
    if (success) {
      setBlockTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Customer Management" subtitle="View and manage user accounts" />

      <div className="admin-card" style={{ padding: '16px 20px', borderRadius: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300, position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }}></i>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: 42 }}
            />
          </div>
          <button onClick={() => refetch.users()} className="btn-secondary">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {loading.users ? <Loader message="Loading customers..." /> :
         errors.users   ? <ErrorBanner message={errors.users} onRetry={() => refetch.users()} /> :
         <div style={{ overflowX: 'auto' }}><div style={{ minWidth: 900 }}><div ref={tableRef}></div></div></div>
        }
      </div>

      <AdminModal isOpen={showDetails && !!selectedUser} onClose={() => setShowDetails(false)} title="Customer Profile" maxWidth={600}>
        {selectedUser && (
          <div className="space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6366f1', fontSize: 22 }}>
                {(selectedUser.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>{selectedUser.name}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Orders', value: selectedUser._count?.orders ?? 0, icon: 'fa-shopping-bag' },
                    { label: 'Total Spent', value: `₹${Number(selectedUser.totalSpent || 0).toLocaleString('en-IN')}`, icon: 'fa-wallet' },
                    { label: 'Joined', value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', icon: 'fa-calendar' },
                ].map((stat, i) => (
                    <div key={i} className="admin-card" style={{ padding: '16px', borderRadius: 14, textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ color: '#6366f1', fontSize: 14, marginBottom: 8 }}><i className={`fas ${stat.icon}`}></i></div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{stat.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </AdminModal>

      <ConfirmModal
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlockToggle}
        title={blockTarget?.isBlocked ? 'Unlock Customer' : 'Block Customer'}
        message={blockTarget?.isBlocked
          ? `Are you sure you want to unlock "${blockTarget?.name}"?`
          : `Block "${blockTarget?.name}"? This will prevent them from making new orders.`}
        confirmLabel={blockTarget?.isBlocked ? 'Unblock Account' : 'Block Account'}
        loading={blocking}
        danger={!blockTarget?.isBlocked}
      />
    </div>
  );
};

export default UsersPage;
