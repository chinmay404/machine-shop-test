import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../router/nextRouterCompat';
import { trialAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RunningTrials() {
  const navigate = useNavigate();
  const [trials, setTrials] = useState([]);
  const [summary, setSummary] = useState({ active_count: 0, total_monthly_savings: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState('short'); // 'short' or 'expanded'

  useEffect(() => { loadTrials(); loadSummary(); }, [page, statusFilter]);

  const loadTrials = () => {
    const params = { page };
    if (statusFilter) params.status = statusFilter;
    trialAPI.list(params).then(r => {
      setTrials(r.data.results || r.data);
      setTotal(r.data.count || (r.data.results || r.data).length);
    }).catch(() => toast.error('Failed to load trials'));
  };

  const loadSummary = () => {
    trialAPI.getActiveSummary().then(r => setSummary(r.data)).catch(() => {});
  };

  const toggleRow = useCallback((id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (expandedRows.size === trials.length) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(trials.map(t => t.id)));
    }
  }, [expandedRows.size, trials]);

  const handleSubmit = async (trialId) => {
    try {
      await trialAPI.submit(trialId, {});
      toast.success('Trial submitted for approval');
      loadTrials(); loadSummary();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit trial'); }
  };

  const handleApprove = async (trialId) => {
    try {
      await trialAPI.approve(trialId, {});
      toast.success('Trial approved');
      loadTrials(); loadSummary();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to approve trial'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await trialAPI.reject(rejectModal, { reason: rejectReason });
      toast.success('Trial rejected');
      setRejectModal(null); setRejectReason('');
      loadTrials(); loadSummary();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reject trial'); }
  };

  const handleDownloadPDF = async (trialId) => {
    try {
      const res = await trialAPI.downloadPDF(trialId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `trial_report_${trialId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to generate PDF'); }
  };

  const statusColorMap = {
    DRAFT: 'bg-orange-500/20 text-orange-400',
    SUBMITTED: 'bg-blue-500/20 text-blue-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-green-500/20 text-green-400',
    REJECTED: 'bg-red-500/20 text-red-400',
  };

  const val = (v, fallback = '—') => (v !== null && v !== undefined && v !== '') ? v : fallback;
  const num = (v, d = 2) => { const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(d); };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <header className="px-6 py-4 border-b border-dark-500 bg-dark-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Trial Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-dark-700 rounded-lg p-0.5 border border-dark-500">
            <button
              onClick={() => setViewMode('short')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'short' ? 'bg-accent-cyan text-dark-900' : 'text-gray-400 hover:text-gray-200'}`}
            >Short View</button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === 'expanded' ? 'bg-accent-cyan text-dark-900' : 'text-gray-400 hover:text-gray-200'}`}
            >Expanded View</button>
          </div>
          <select className="select-dark text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft (Running)</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button onClick={loadTrials} className="btn-outline text-sm">Refresh</button>
          <button onClick={() => navigate('/trials/new')} className="btn-primary text-sm">+ New Trial</button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="Active Trials" value={summary.active_count} color="cyan" />
          <SummaryCard label="Monthly Savings" value={`₹${(summary.total_monthly_savings || 0).toLocaleString()}`} color="green" />
          <SummaryCard label="Draft (Running)" value={summary.by_status?.draft || 0} color="orange" />
          <SummaryCard label="Pending Approval" value={summary.by_status?.pending || 0} color="yellow" />
        </div>

        {/* ==================== SHORT VIEW ==================== */}
        {viewMode === 'short' && (
          <div className="card">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase border-b border-dark-500">
                  <th className="py-2 px-2 text-left">ID</th>
                  <th className="py-2 px-2 text-left">Tool</th>
                  <th className="py-2 px-2 text-left">Machine</th>
                  <th className="py-2 px-2 text-left">Component</th>
                  <th className="py-2 px-2 text-left">Existing Mfg</th>
                  <th className="py-2 px-2 text-left">New Mfg</th>
                  <th className="py-2 px-2 text-left">Savings/Comp</th>
                  <th className="py-2 px-2 text-left">Monthly</th>
                  <th className="py-2 px-2 text-left">Status</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {trials.map(t => (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-dark-600/30">
                      <td className="py-2 px-2 font-mono text-accent-cyan">#{t.id}</td>
                      <td className="py-2 px-2 text-gray-200">{t.tool_number} {t.tool_name}</td>
                      <td className="py-2 px-2 text-gray-400">{t.machine_name}</td>
                      <td className="py-2 px-2 text-gray-400">{t.component_name}</td>
                      <td className="py-2 px-2 text-gray-400">{val(t.existing_manufacturer)}</td>
                      <td className="py-2 px-2 text-gray-300">{val(t.new_manufacturer)}</td>
                      <td className="py-2 px-2 text-accent-green font-mono">{t.savings_per_component ? `₹${t.savings_per_component}` : '—'}</td>
                      <td className="py-2 px-2 text-accent-green font-mono">{t.monthly_savings ? `₹${Number(t.monthly_savings).toLocaleString()}` : '—'}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColorMap[t.status] || 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t.trial_date || t.created_at?.slice(0, 10)}</td>
                      <td className="py-2 px-2 flex gap-1 flex-wrap">
                        <button onClick={() => toggleRow(t.id)} className="text-yellow-400 hover:text-white text-[10px] font-bold" title="Expand">
                          {expandedRows.has(t.id) ? '▼' : '▶'}
                        </button>
                        <button onClick={() => handleDownloadPDF(t.id)} className="text-purple-400 hover:text-white text-[10px] font-bold">PDF</button>
                        <button onClick={() => navigate(`/trials/${t.id}/edit`)} className="text-accent-cyan hover:text-white text-[10px] font-bold">EDIT</button>
                        {t.status === 'DRAFT' && <button onClick={() => handleSubmit(t.id)} className="text-accent-blue hover:text-white text-[10px] font-bold">SUBMIT</button>}
                        {(t.status === 'SUBMITTED' || t.status === 'PENDING') && (
                          <>
                            <button onClick={() => handleApprove(t.id)} className="text-accent-green hover:text-white text-[10px] font-bold">APPROVE</button>
                            <button onClick={() => { setRejectModal(t.id); setRejectReason(''); }} className="text-red-400 hover:text-white text-[10px] font-bold">REJECT</button>
                          </>
                        )}
                      </td>
                    </tr>
                    {expandedRows.has(t.id) && (
                      <tr>
                        <td colSpan={11} className="p-0">
                          <ExpandedDetail trial={t} val={val} num={num} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {trials.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-gray-600">No trials found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== EXPANDED VIEW ==================== */}
        {viewMode === 'expanded' && (
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-green-400 font-bold">● Live Update Active</span>
                <span className="text-[10px] text-gray-500">Showing {trials.length} of {total} records</span>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Basic Info</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Existing Tool</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> New Tool</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Performance</span>
              </div>
            </div>
            <table className="w-full text-[10px] whitespace-nowrap">
              <thead>
                {/* Section header row */}
                <tr>
                  <th colSpan={7} className="py-1 px-1 text-center text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 border-b border-amber-200">Basic Info</th>
                  <th colSpan={9} className="py-1 px-1 text-center text-[9px] font-bold uppercase tracking-wider text-green-800 bg-green-100/80 border-b border-green-200">Existing Tool Data</th>
                  <th colSpan={9} className="py-1 px-1 text-center text-[9px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-100/80 border-b border-cyan-200">New Tool Data</th>
                  <th colSpan={4} className="py-1 px-1 text-center text-[9px] font-bold uppercase tracking-wider text-gray-600 bg-gray-200/80 border-b border-gray-300">Performance</th>
                  <th className="py-1 px-1 bg-dark-700" />
                </tr>
                {/* Column header row */}
                <tr className="text-[9px] text-gray-500 uppercase border-b border-dark-500 bg-dark-800">
                  {/* BASIC INFO - 7 cols */}
                  <th className="py-2 px-1.5 text-left font-semibold">Sr.</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Unit</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Job Name</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Operation</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Mach. No</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Dia (⌀)</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Status</th>
                  {/* EXISTING - 9 cols */}
                  <th className="py-2 px-1.5 text-left font-semibold border-l border-dark-500">Insert Code</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Grade</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Make</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Edges</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Vc</th>
                  <th className="py-2 px-1.5 text-center font-semibold">RPM</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Feed</th>
                  <th className="py-2 px-1.5 text-center font-semibold">DoC</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Life</th>
                  {/* NEW - 9 cols */}
                  <th className="py-2 px-1.5 text-left font-semibold border-l border-dark-500">Insert Code</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Grade</th>
                  <th className="py-2 px-1.5 text-left font-semibold">Make</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Edges</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Vc</th>
                  <th className="py-2 px-1.5 text-center font-semibold">RPM</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Feed</th>
                  <th className="py-2 px-1.5 text-center font-semibold">DoC</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Life</th>
                  {/* PERFORMANCE - 4 cols */}
                  <th className="py-2 px-1.5 text-center font-semibold border-l border-dark-500">CPC Exist</th>
                  <th className="py-2 px-1.5 text-center font-semibold">CPC New</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Savings</th>
                  <th className="py-2 px-1.5 text-center font-semibold">Monthly</th>
                  {/* REMARKS col */}
                  <th className="py-2 px-1.5 text-left font-semibold border-l border-dark-500">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {trials.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-dark-600/20 group">
                    {/* BASIC INFO */}
                    <td className="py-2 px-1.5 font-mono text-accent-cyan font-bold">{idx + 1 + (page - 1) * 50}</td>
                    <td className="py-2 px-1.5 text-gray-300">{val(t.machine_name)}</td>
                    <td className="py-2 px-1.5 text-gray-200 font-medium">{val(t.part_name || t.component_name)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.operation)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.tool_number)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.depth_of_cut)}</td>
                    <td className="py-2 px-1.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${statusColorMap[t.status] || 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
                    </td>
                    {/* EXISTING TOOL */}
                    <td className="py-2 px-1.5 text-gray-300 border-l border-dark-500">{val(t.existing_insert_code)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.existing_manufacturer)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.existing_manufacturer)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.existing_cutting_edges)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.existing_cutting_speed)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.spindle_speed)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.existing_feed)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.depth_of_cut)}</td>
                    <td className="py-2 px-1.5 text-center font-mono text-gray-200 font-bold">{val(t.existing_tool_life)}</td>
                    {/* NEW TOOL */}
                    <td className="py-2 px-1.5 text-cyan-300 font-medium border-l border-dark-500">{val(t.new_insert_code)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.new_manufacturer)}</td>
                    <td className="py-2 px-1.5 text-gray-400">{val(t.new_manufacturer)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.new_cutting_edges)}</td>
                    <td className="py-2 px-1.5 text-center text-cyan-300">{val(t.new_cutting_speed)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.spindle_speed)}</td>
                    <td className="py-2 px-1.5 text-center text-cyan-300">{val(t.new_feed)}</td>
                    <td className="py-2 px-1.5 text-center text-gray-300">{val(t.depth_of_cut)}</td>
                    <td className="py-2 px-1.5 text-center font-mono text-green-400 font-bold">{val(t.new_tool_life)}</td>
                    {/* PERFORMANCE */}
                    <td className="py-2 px-1.5 text-center text-gray-400 border-l border-dark-500">{t.existing_cost_per_component ? `₹${t.existing_cost_per_component}` : '—'}</td>
                    <td className="py-2 px-1.5 text-center text-cyan-300 font-medium">{t.new_cost_per_component ? `₹${t.new_cost_per_component}` : '—'}</td>
                    <td className="py-2 px-1.5 text-center text-green-400 font-bold font-mono">{t.savings_per_component ? `₹${t.savings_per_component}` : '—'}</td>
                    <td className="py-2 px-1.5 text-center text-green-400 font-mono">{t.monthly_savings ? `₹${Number(t.monthly_savings).toLocaleString()}` : '—'}</td>
                    {/* REMARKS */}
                    <td className="py-2 px-1.5 text-gray-500 max-w-[200px] truncate border-l border-dark-500" title={t.remarks || ''}>{val(t.remarks)}</td>
                  </tr>
                ))}
                {trials.length === 0 && <tr><td colSpan={30} className="py-8 text-center text-gray-600">No trials found</td></tr>}
              </tbody>
            </table>
            {/* Pagination row */}
            <div className="flex items-center justify-between px-2 pt-3 border-t border-dark-500 mt-2">
              <span className="text-[10px] text-gray-500">Page {page}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-0.5 text-[10px] rounded bg-dark-600 text-gray-400 hover:text-white disabled:opacity-30">Previous</button>
                {Array.from({ length: Math.min(5, Math.ceil(total / 50) || 1) }, (_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)} className={`w-6 h-6 rounded text-[10px] font-bold ${page === i + 1 ? 'bg-green-500 text-white' : 'bg-dark-600 text-gray-400 hover:text-white'}`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => p + 1)} className="px-2 py-0.5 text-[10px] rounded bg-dark-600 text-gray-400 hover:text-white">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination for short view */}
        {viewMode === 'short' && total > 50 && (
          <div className="flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline text-xs py-1 disabled:opacity-30">Prev</button>
            <span className="text-xs text-gray-500 py-1 px-2">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="btn-outline text-xs py-1">Next</button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-700 rounded-xl border border-dark-500 w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-200 mb-3">Reject Trial #{rejectModal}</h3>
            <label className="block text-[10px] text-gray-500 uppercase mb-1">Rejection Reason (optional)</label>
            <textarea
              className="w-full bg-dark-600 border border-dark-500 rounded-lg p-2 text-xs text-gray-200 focus:border-red-400 outline-none"
              rows={3}
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="px-4 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 border border-dark-500">Cancel</button>
              <button onClick={handleReject} className="px-4 py-1.5 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700">Reject Trial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== Expanded Detail Panel (shown under short view rows) ====== */
function ExpandedDetail({ trial: t, val, num }) {
  return (
    <div className="bg-dark-800/80 border-t border-b border-dark-500 px-4 py-3">
      <div className="grid grid-cols-3 gap-4 text-[10px]">
        {/* BASIC INFO */}
        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-amber-400 border-b border-amber-400/20 pb-1">Basic Info</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <DetailRow label="Part Name" value={val(t.part_name)} />
            <DetailRow label="Material" value={val(t.part_material)} />
            <DetailRow label="Operation" value={val(t.operation)} />
            <DetailRow label="Customer" value={val(t.customer)} />
            <DetailRow label="Conducted By" value={val(t.conducted_by)} />
            <DetailRow label="Target Qty" value={val(t.target_quantity)} />
          </div>
        </div>
        {/* EXISTING TOOL */}
        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-green-400 border-b border-green-400/20 pb-1">Existing Tool Data</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <DetailRow label="Insert Code" value={val(t.existing_insert_code)} />
            <DetailRow label="Manufacturer" value={val(t.existing_manufacturer)} />
            <DetailRow label="Cutting Edges" value={val(t.existing_cutting_edges)} />
            <DetailRow label="Vc (m/min)" value={val(t.existing_cutting_speed)} />
            <DetailRow label="Feed (mm/rev)" value={val(t.existing_feed)} />
            <DetailRow label="Coolant" value={val(t.existing_coolant)} />
            <DetailRow label="Tool Life" value={val(t.existing_tool_life)} highlight />
            <DetailRow label="CPC" value={t.existing_cost_per_component ? `₹${t.existing_cost_per_component}` : '—'} />
          </div>
        </div>
        {/* NEW TOOL */}
        <div className="space-y-2">
          <h4 className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 border-b border-cyan-400/20 pb-1">New Tool Data</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <DetailRow label="Insert Code" value={val(t.new_insert_code)} accent />
            <DetailRow label="Manufacturer" value={val(t.new_manufacturer)} />
            <DetailRow label="Cutting Edges" value={val(t.new_cutting_edges)} />
            <DetailRow label="Vc (m/min)" value={val(t.new_cutting_speed)} accent />
            <DetailRow label="Feed (mm/rev)" value={val(t.new_feed)} accent />
            <DetailRow label="Coolant" value={val(t.new_coolant)} />
            <DetailRow label="Tool Life" value={val(t.new_tool_life)} highlight accent />
            <DetailRow label="CPC" value={t.new_cost_per_component ? `₹${t.new_cost_per_component}` : '—'} accent />
          </div>
        </div>
      </div>
      {/* Bottom row: Savings and Remarks */}
      <div className="flex items-center gap-6 mt-3 pt-2 border-t border-dark-600">
        <div className="flex gap-4">
          <span className="text-[9px] text-gray-500">Savings/Component: <span className="text-green-400 font-bold">{t.savings_per_component ? `₹${t.savings_per_component}` : '—'}</span></span>
          <span className="text-[9px] text-gray-500">Monthly Savings: <span className="text-green-400 font-bold">{t.monthly_savings ? `₹${Number(t.monthly_savings).toLocaleString()}` : '—'}</span></span>
          <span className="text-[9px] text-gray-500">Surface Finish: <span className="text-gray-200 font-bold">{t.surface_finish_ra ? `${t.surface_finish_ra} Ra` : '—'}</span></span>
          <span className="text-[9px] text-gray-500">Result: <span className={`font-bold ${t.trial_result === 'PASS' ? 'text-green-400' : t.trial_result === 'FAIL' ? 'text-red-400' : 'text-yellow-400'}`}>{val(t.trial_result)}</span></span>
        </div>
        {t.remarks && <span className="text-[9px] text-gray-500 italic ml-auto max-w-[300px] truncate" title={t.remarks}>"{t.remarks}"</span>}
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight, accent }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'font-bold' : ''} ${accent ? 'text-cyan-300' : 'text-gray-200'}`}>{value}</span>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colorMap = {
    cyan: 'text-accent-cyan',
    green: 'text-accent-green',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div className="card-dark">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || 'text-white'} mt-1 font-mono`}>{value}</p>
    </div>
  );
}
