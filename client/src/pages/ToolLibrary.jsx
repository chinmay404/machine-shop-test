import React, { useState, useEffect } from 'react';
import { masterAPI } from '../services/api';
import toast from 'react-hot-toast';

const MASTER_TYPES = [
  { value: 'PULLSTUD', label: 'Pull Stud' },
  { value: 'ADAPTOR', label: 'Adaptor' },
  { value: 'COLLET', label: 'Collet' },
  { value: 'CUTTING_TOOL', label: 'Cutting Tool' },
  { value: 'INSERT', label: 'Insert' },
  { value: 'SUPPLIER', label: 'Supplier' },
];

const TYPE_COLOR = {
  PULLSTUD: 'red',
  ADAPTOR: 'blue',
  COLLET: 'orange',
  CUTTING_TOOL: 'green',
  INSERT: 'yellow',
  SUPPLIER: 'cyan',
  UNCATEGORIZED: 'slate',
};

function normalizeMasterType(value) {
  if (!value || typeof value !== 'string') {
    return 'UNCATEGORIZED';
  }

  return value.trim().toUpperCase().replace(/\s+/g, '_') || 'UNCATEGORIZED';
}

function formatMasterTypeLabel(value) {
  const normalized = normalizeMasterType(value);
  return normalized
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ToolLibrary() {
  const [items, setItems] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ master_type: 'CUTTING_TOOL', code: '', name: '', description: '', specifications: {} });

  useEffect(() => { loadItems(); }, [filterType, search]);

  const loadItems = () => {
    const params = {};
    if (filterType) params.master_type = filterType;
    if (search) params.search = search;
    masterAPI.list(params).then(r => setItems(r.data.results || r.data)).catch(() => toast.error('Failed to load'));
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await masterAPI.update(editItem.id, form);
        toast.success('Updated');
      } else {
        await masterAPI.create(form);
        toast.success('Created');
      }
      setShowForm(false);
      setEditItem(null);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.code?.[0] || 'Failed to save');
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <header className="px-6 py-4 border-b border-dark-500 bg-dark-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Tool Library</h1>
        <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ master_type: 'CUTTING_TOOL', code: '', name: '', description: '', specifications: {} }); }}
          className="btn-primary text-sm">+ Add Item</button>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="card-dark flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">Master Catalog</p>
            <p className="mt-1 text-sm text-gray-300">{items.length} visible item{items.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input className="input-dark text-sm min-w-0 sm:w-72" placeholder="Search by code, name..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="select-dark text-sm sm:w-48" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {MASTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase border-b border-dark-500">
                <th className="py-2 px-2 text-left">Code</th>
                <th className="py-2 px-2 text-left">Name</th>
                <th className="py-2 px-2 text-left">Type</th>
                <th className="py-2 px-2 text-left">Description</th>
                <th className="py-2 px-2 text-left">Status</th>
                <th className="py-2 px-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {items.map(item => {
                const masterType = normalizeMasterType(item.master_type);
                const typeBadge = TYPE_COLOR[masterType] || 'slate';
                const status = String(item.status || 'UNKNOWN').toUpperCase();
                const statusBadge = status === 'ACTIVE' ? 'green' : status === 'UNKNOWN' ? 'slate' : 'red';

                return (
                  <tr key={item.id} className="hover:bg-dark-600/30">
                    <td className="py-2 px-2 font-mono text-accent-cyan">{item.code || '—'}</td>
                    <td className="py-2 px-2 text-gray-200 font-medium">{item.name || 'Unnamed Item'}</td>
                    <td className="py-2 px-2"><span className={`badge-${typeBadge}`}>{formatMasterTypeLabel(masterType)}</span></td>
                    <td className="py-2 px-2 text-gray-400 truncate max-w-xs">{item.description || '—'}</td>
                    <td className="py-2 px-2"><span className={`badge-${statusBadge}`}>{status}</span></td>
                    <td className="py-2 px-2">
                      <button onClick={() => { setEditItem(item); setForm({ ...item }); setShowForm(true); }}
                        className="text-accent-cyan hover:text-white text-[10px] font-bold">EDIT</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-600">No items found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-700 border border-dark-400 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit' : 'Add'} Master Item</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select className="select-dark w-full text-sm" value={form.master_type} onChange={e => setForm(prev => ({ ...prev, master_type: e.target.value }))} disabled={!!editItem}>
                  {MASTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Code</label>
                <input className="input-dark w-full text-sm" value={form.code} onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input className="input-dark w-full text-sm" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea className="input-dark w-full text-sm" rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
