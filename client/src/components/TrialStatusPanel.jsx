import React, { useState, useEffect } from 'react';
import { useNavigate } from '../router/nextRouterCompat';
import { trialAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function TrialStatusPanel({ trialHistory = [], currentStatus, toolId }) {
  const navigate = useNavigate();
  const [activeTrial, setActiveTrial] = useState(null);

  // Find the active/running trial (DRAFT, SUBMITTED, or PENDING)
  useEffect(() => {
    const active = trialHistory.find(t => ['DRAFT', 'SUBMITTED', 'PENDING'].includes(t.status));
    setActiveTrial(active || null);
  }, [trialHistory]);

  const latestTrial = trialHistory[0];

  const handleReplaceBOM = async (trialId, replaceAll = false) => {
    const msg = replaceAll
      ? 'This will replace ALL subassembly parameters with this trial\'s data. Proceed?'
      : 'This will replace existing subassembly parameters with trial data. Do you want to proceed?';
    if (!window.confirm(msg)) return;
    try {
      await trialAPI.replaceSubassembly(trialId, { replace_all: replaceAll });
      toast.success('Subassembly data replaced successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to replace data');
    }
  };

  const statusConfig = {
    APPROVED: { bg: 'bg-accent-green/20', ring: 'ring-accent-green', icon: '✓', iconColor: 'text-accent-green', label: 'Trial Approved', desc: 'Tool trial approved. Cleared for production.' },
    REJECTED: { bg: 'bg-red-500/20', ring: 'ring-red-500', icon: '✗', iconColor: 'text-red-500', label: 'Trial Rejected', desc: 'Tool did not pass trial. Review required.' },
    PENDING: { bg: 'bg-yellow-500/20', ring: 'ring-yellow-500', icon: '⏳', iconColor: 'text-yellow-500', label: 'Pending Approval', desc: 'Trial submitted and awaiting approval.' },
    SUBMITTED: { bg: 'bg-accent-blue/20', ring: 'ring-accent-blue', icon: '📋', iconColor: 'text-accent-blue', label: 'Trial Submitted', desc: 'Trial submitted for review.' },
    DRAFT: { bg: 'bg-orange-500/20', ring: 'ring-orange-500', icon: '▶', iconColor: 'text-orange-400', label: 'Trial Running', desc: 'Trial is in progress (draft).' },
  };

  const cfg = statusConfig[latestTrial?.status || currentStatus] || {
    bg: 'bg-gray-500/20', ring: 'ring-gray-500', icon: '—', iconColor: 'text-gray-400', label: 'No Trial', desc: 'No trial data available.'
  };

  return (
    <div className="h-full flex flex-col">
      {/* Status Icon + Label */}
      <div className="flex flex-col items-center py-4">
        <div className={`w-14 h-14 rounded-full ${cfg.bg} ring-2 ${cfg.ring} flex items-center justify-center mb-2`}>
          <span className={`text-2xl ${cfg.iconColor}`}>{cfg.icon}</span>
        </div>
        <p className={`text-xs font-bold ${cfg.iconColor} mb-0.5`}>{cfg.label}</p>
        <p className="text-[9px] text-gray-500 text-center px-2 leading-relaxed">{cfg.desc}</p>
      </div>

      {/* Active Trial Detail Card */}
      {activeTrial && (
        <div className="mx-2 mb-3 p-2.5 rounded-lg bg-dark-700 border border-dark-500">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Active Trial</span>
            <span className="text-[9px] font-mono text-gray-500">#{activeTrial.id}</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between"><span className="text-gray-500">Tool:</span><span className="text-gray-300">{activeTrial.tool_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="text-gray-300">{activeTrial.trial_date || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">By:</span><span className="text-gray-300">{activeTrial.conducted_by || '—'}</span></div>
            {activeTrial.new_manufacturer && (
              <div className="flex justify-between"><span className="text-gray-500">New Mfg:</span><span className="text-gray-300">{activeTrial.new_manufacturer}</span></div>
            )}
            {activeTrial.savings_per_component && parseFloat(activeTrial.savings_per_component) !== 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Savings:</span><span className="text-accent-green font-mono">₹{activeTrial.savings_per_component}/comp</span></div>
            )}
          </div>
          <button
            onClick={() => navigate(`/trials/${activeTrial.id}/edit`)}
            className="w-full mt-2 px-2 py-1 rounded text-[9px] font-bold bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/40 transition-colors"
          >
            VIEW / EDIT TRIAL
          </button>
        </div>
      )}

      {/* Actions Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trials History</span>
        <div className="flex gap-1">
          <button
            onClick={() => navigate('/trials/running')}
            className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-dark-600 text-gray-400 hover:text-white transition-colors"
          >
            ALL
          </button>
          <button
            onClick={() => navigate('/trials/new' + (toolId ? `?tool=${toolId}` : ''))}
            className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-red text-white hover:bg-red-600 transition-colors"
          >
            + NEW
          </button>
        </div>
      </div>

      {/* History table */}
      <div className="flex-1 overflow-y-auto px-1">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-500 border-b border-dark-500">
              <th className="pb-1 text-left font-medium">DATE</th>
              <th className="pb-1 text-left font-medium">STATUS</th>
              <th className="pb-1 text-left font-medium">BY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {trialHistory.map((trial) => {
              const sc = statusConfig[trial.status] || { bg: 'bg-gray-500/20', iconColor: 'text-gray-400' };
              return (
                <tr key={trial.id} className="hover:bg-dark-600/50">
                  <td className="py-1.5 text-gray-400 font-mono cursor-pointer" onClick={() => navigate(`/trials/${trial.id}/edit`)}>{trial.trial_date || trial.created_at?.slice(0, 10)}</td>
                  <td className="py-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${sc.bg} ${sc.iconColor}`}>
                      {trial.status}
                    </span>
                    {trial.status === 'APPROVED' && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReplaceBOM(trial.id, false)}
                          className="text-[7px] px-1 py-0.5 rounded bg-accent-green/20 text-accent-green hover:bg-accent-green/40 font-bold"
                        >
                          Replace Data
                        </button>
                        <button
                          onClick={() => handleReplaceBOM(trial.id, true)}
                          className="text-[7px] px-1 py-0.5 rounded bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/40 font-bold"
                        >
                          Replace All
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 text-gray-400">{trial.conducted_by || '—'}</td>
                </tr>
              );
            })}
            {trialHistory.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-gray-600 text-[9px]">No trial history</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-center text-[8px] text-gray-600 py-1 border-t border-dark-600 mt-1">END OF HISTORY</div>
    </div>
  );
}
