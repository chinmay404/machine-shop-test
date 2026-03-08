import React, { useState, useEffect } from 'react';
import { importAPI } from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_ROW = { master_type: 'CUTTING_TOOL', code: '', name: '', description: '', specifications: {} };

export default function MasterImport() {
  const [tab, setTab] = useState('import');
  const [rows, setRows] = useState([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [history, setHistory] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const loadHistory = () => {
    importAPI.getHistory().then(r => setHistory(r.data)).catch(() => {});
  };

  const updateRow = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleImport = async () => {
    const valid = rows.filter(r => r.name.trim());
    if (!valid.length) { toast.error('Add at least one item with a name'); return; }
    setImporting(true);
    try {
      const res = await importAPI.importToolMaster({ rows: valid });
      toast.success(`Imported: ${res.data.success_count} success, ${res.data.error_count} errors`);
      setRows([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <header className="px-6 py-4 border-b border-dark-500 bg-dark-800">
        <h1 className="text-xl font-bold text-white">Master Data Import</h1>
        <div className="flex gap-4 mt-3">
          <button onClick={() => setTab('import')} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === 'import' ? 'border-accent-cyan text-accent-cyan' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Import Data</button>
          <button onClick={() => setTab('history')} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === 'history' ? 'border-accent-cyan text-accent-cyan' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Import History</button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'import' ? (
          <div className="space-y-4">
            <div className="card overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase border-b border-dark-500">
                    <th className="py-2 px-2 text-left w-8">#</th>
                    <th className="py-2 px-2 text-left">Type</th>
                    <th className="py-2 px-2 text-left">Code</th>
                    <th className="py-2 px-2 text-left">Name</th>
                    <th className="py-2 px-2 text-left">Description</th>
                    <th className="py-2 px-2 text-left w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-dark-600">
                      <td className="py-1.5 px-2 text-gray-600">{i + 1}</td>
                      <td className="py-1.5 px-2">
                        <select className="select-dark text-xs w-full" value={row.master_type} onChange={e => updateRow(i, 'master_type', e.target.value)}>
                          <option value="CUTTING_TOOL">Cutting Tool</option>
                          <option value="INSERT">Insert</option>
                          <option value="ADAPTOR">Adaptor</option>
                          <option value="PULLSTUD">Pull Stud</option>
                          <option value="COLLET">Collet</option>
                          <option value="SUPPLIER">Supplier</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2"><input className="input-dark text-xs w-full" placeholder="Auto if empty" value={row.code} onChange={e => updateRow(i, 'code', e.target.value)} /></td>
                      <td className="py-1.5 px-2"><input className="input-dark text-xs w-full" value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} /></td>
                      <td className="py-1.5 px-2"><input className="input-dark text-xs w-full" value={row.description} onChange={e => updateRow(i, 'description', e.target.value)} /></td>
                      <td className="py-1.5 px-2">
                        <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={addRow} className="btn-outline text-xs">+ Add Row</button>
              <button onClick={handleImport} disabled={importing} className="btn-primary text-xs disabled:opacity-50">
                {importing ? 'Importing...' : 'Import All'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase border-b border-dark-500">
                  <th className="py-2 px-2 text-left">ID</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Imported By</th>
                  <th className="py-2 px-2 text-left">Total Rows</th>
                  <th className="py-2 px-2 text-left">Success</th>
                  <th className="py-2 px-2 text-left">Errors</th>
                  <th className="py-2 px-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="py-2 px-2 font-mono text-accent-cyan">#{h.id}</td>
                    <td className="py-2 px-2 text-gray-400">{h.created_at?.slice(0, 10)}</td>
                    <td className="py-2 px-2 text-gray-300">{h.imported_by_name || '—'}</td>
                    <td className="py-2 px-2 text-gray-300 font-mono">{h.total_rows}</td>
                    <td className="py-2 px-2 text-accent-green font-mono">{h.success_count}</td>
                    <td className="py-2 px-2 text-accent-red font-mono">{h.error_count}</td>
                    <td className="py-2 px-2"><span className={`badge-${h.status === 'completed' ? 'green' : 'red'}`}>{h.status}</span></td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-600">No import history</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
