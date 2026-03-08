import React from 'react';

export default function ToolSlotList({ slots, selectedSlot, onSelect, onDelete, loading, machineId, onAddTool }) {
  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-dark-600 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Red Header */}
      <div className="bg-accent-red px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white text-[10px] font-bold tracking-wide">◀ TOOL LIST - {machineId || 'MACHINE'}</span>
        </div>
        <button
          onClick={onAddTool}
          className="w-5 h-5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          title="Add new tool"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Column Headers */}
      <div className="px-3 py-1.5 flex items-center text-[9px] text-gray-500 uppercase tracking-wider border-b border-dark-500 flex-shrink-0">
        <span className="w-8">No</span>
        <span className="flex-1">Tool Name</span>
        <span className="w-12 text-right">Type</span>
      </div>

      {/* Tool Items */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-1.5 py-1 space-y-0.5">
          {slots.map((slot) => {
            const isActive = selectedSlot?.id === slot.id;
            const statusDot = slot.status === 'ACTIVE' ? 'bg-green-400'
              : slot.status === 'TRIAL' || slot.status === 'TRIAL_PENDING' ? 'bg-yellow-400'
              : slot.status === 'WORN_OUT' ? 'bg-red-400'
              : 'bg-gray-500';

            return (
              <div
                key={slot.id}
                className={`relative group w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-start gap-2 ${
                  isActive ? 'bg-dark-600 border border-accent-red/40' : 'hover:bg-dark-700 border border-transparent'
                }`}
              >
                <button
                  onClick={() => onSelect(slot)}
                  className="flex items-start gap-2 flex-1 min-w-0 text-left"
                >
                  <span className="text-xs font-mono font-bold text-accent-red w-8 flex-shrink-0 pt-0.5">{slot.tool_number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-medium truncate">{slot.tool_name}</p>
                    <p className="text-[9px] text-gray-500 capitalize">{slot.category?.replace('_', ' ')}</p>
                  </div>
                </button>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${statusDot}`} />
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(slot); }}
                  className="absolute right-1 top-1 w-4 h-4 rounded bg-red-900/50 hover:bg-red-700/70 items-center justify-center transition-colors hidden group-hover:flex"
                  title={`Delete ${slot.tool_number}`}
                >
                  <svg className="w-2.5 h-2.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
          {slots.length === 0 && (
            <p className="text-center text-[10px] text-gray-600 py-8">No tool slots found</p>
          )}
        </div>
        {slots.length > 0 && (
          <p className="text-center text-[9px] text-gray-600 italic py-2">Scroll for more tools (T09-T60)</p>
        )}
      </div>
    </div>
  );
}
