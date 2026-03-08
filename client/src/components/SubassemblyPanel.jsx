import React from 'react';
import { useNavigate } from '../router/nextRouterCompat';
import { bomAPI } from '../services/api';
import toast from 'react-hot-toast';

const BOM_TYPES = ['PULLSTUD', 'ADAPTOR', 'TOOL', 'INSERT', 'CARTRIDGE', 'MBU', 'BORING_HEAD', 'COLLET', 'INSERT_SCREW', 'SCREW', 'MIDDLE_EXTENSION'];
const BOM_LABELS = { PULLSTUD: 'PULL STUD', ADAPTOR: 'ADAPTOR', TOOL: 'TOOL', INSERT: 'INSERT', CARTRIDGE: 'CARTRIDGE', MBU: 'MBU', BORING_HEAD: 'BORING HEAD', COLLET: 'COLLET', INSERT_SCREW: 'INSERT SCREW', SCREW: 'SCREW', MIDDLE_EXTENSION: 'MIDDLE EXTENSION' };
const BOM_COLORS = { PULLSTUD: 'accent-red', ADAPTOR: 'accent-blue', TOOL: 'accent-green', INSERT: 'accent-orange', CARTRIDGE: 'accent-cyan', MBU: 'accent-purple', BORING_HEAD: 'yellow-500', COLLET: 'sky-400', INSERT_SCREW: 'amber-400', SCREW: 'lime-400', MIDDLE_EXTENSION: 'violet-400' };

// Dynamic subassembly categories per tool type
const CATEGORY_BOM_MAP = {
  MILLING_CUTTER: ['PULLSTUD', 'ADAPTOR', 'TOOL', 'INSERT', 'INSERT_SCREW', 'SCREW'],
  DRILL: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL'],
  ENDMILL: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL'],
  TAP: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL'],
  THREADMILL: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL'],
  BORING_BAR: ['PULLSTUD', 'ADAPTOR', 'MIDDLE_EXTENSION', 'BORING_HEAD', 'CARTRIDGE', 'INSERT', 'MBU'],
  REAMERS: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL'],
  SPECIAL_DRILL: ['PULLSTUD', 'ADAPTOR', 'COLLET', 'TOOL', 'INSERT'],
  SPECIAL_TOOL: ['PULLSTUD', 'ADAPTOR', 'TOOL', 'INSERT', 'CARTRIDGE', 'MBU', 'BORING_HEAD'],
  OTHER: ['PULLSTUD', 'ADAPTOR', 'TOOL', 'INSERT', 'CARTRIDGE', 'MBU', 'BORING_HEAD'],
};

// Dynamic labels per tool category
const CATEGORY_LABEL_OVERRIDES = {
  MILLING_CUTTER: { TOOL: 'CUTTING TOOL' },
  DRILL: { TOOL: 'CUTTING TOOL' },
  ENDMILL: { TOOL: 'CUTTING TOOL' },
  TAP: { TOOL: 'CUTTING TOOL' },
  THREADMILL: { TOOL: 'CUTTING TOOL' },
  REAMERS: { TOOL: 'CUTTING TOOL' },
  SPECIAL_DRILL: { TOOL: 'CUTTING TOOL' },
  SPECIAL_TOOL: { TOOL: 'CUTTING TOOL' },
  BORING_BAR: { BORING_HEAD: 'BORING HEAD' },
};

export default function SubassemblyPanel({ bomItems = [], componentName, toolId, toolCategory, onAddBOM, onViewBOM, onRefresh }) {
  const navigate = useNavigate();
  const bomMap = {};
  bomItems.forEach(b => { bomMap[b.bom_type] = b; });

  // Get BOM types for this tool category
  const activeBomTypes = (toolCategory && CATEGORY_BOM_MAP[toolCategory]) || BOM_TYPES;
  const labelOverrides = (toolCategory && CATEGORY_LABEL_OVERRIDES[toolCategory]) || {};

  const handleDelete = async (item, type) => {
    if (!window.confirm(`Delete ${labelOverrides[type] || BOM_LABELS[type] || type} subassembly? This cannot be undone.`)) return;
    try {
      await bomAPI.delete(item.id);
      toast.success('Subassembly deleted');
      onRefresh?.();
    } catch {
      toast.error('Failed to delete subassembly');
    }
  };

  if (!toolId) {
    return (
      <div className="card">
        <p className="text-center text-xs text-gray-600 py-6">Select a tool slot to view subassembly</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">⊞</span>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Subassembly Structure - <span className="text-accent-cyan">{componentName || 'Component'}</span>
          </h3>
        </div>
        <button
          onClick={onAddBOM}
          className="w-6 h-6 rounded bg-accent-green/20 hover:bg-accent-green/30 flex items-center justify-center transition-colors"
          title="Add subassembly item"
        >
          <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 items-center px-2 py-1.5 text-[9px] text-gray-500 uppercase tracking-wider border-b border-dark-500 mb-1">
        <span className="col-span-4">1. Component Details</span>
        <span className="col-span-1 text-center">Qty</span>
        <span className="col-span-2 text-center">2. Drawing</span>
        <span className="col-span-5 text-center">3. Actions</span>
      </div>

      {/* BOM Items */}
      <div className="space-y-1">
        {activeBomTypes.map((type) => {
          const item = bomMap[type];
          const color = BOM_COLORS[type];
          const label = labelOverrides[type] || BOM_LABELS[type] || type;
          return (
            <div key={type} className="grid grid-cols-12 items-center px-2 py-2.5 rounded-lg hover:bg-dark-600/30 transition-colors">
              {/* Component Details */}
              <div className="col-span-4 min-w-0 overflow-hidden">
                <p className={`text-[10px] font-bold text-${color} uppercase tracking-wider mb-0.5`}>
                  {label}
                  {type === 'TOOL' && toolCategory && (
                    <span className="text-accent-cyan font-normal ml-1">({toolCategory.replace(/_/g, ' ')})</span>
                  )}
                </p>
                {item ? (
                  <>
                    <p className="text-xs font-bold text-gray-200 truncate">{item.master_item_code || item.master_item_name || '—'}</p>
                    {item.sku && <p className="text-[9px] text-accent-cyan font-mono truncate">{item.sku}</p>}
                    <p className="text-[10px] text-gray-500 truncate">{item.description || item.master_item_name || ''}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-600 italic">Not assigned</p>
                )}
              </div>

              {/* Quantity */}
              <div className="col-span-1 text-center">
                {item ? (
                  <span className="text-xs font-bold text-gray-200 font-mono">{item.quantity || 1}</span>
                ) : (
                  <span className="text-[10px] text-gray-600">—</span>
                )}
              </div>

              {/* Drawing */}
              <div className="col-span-2 flex justify-center">
                {item?.drawing_file ? (
                  <a href={item.drawing_file} target="_blank" rel="noopener noreferrer" title="Open drawing"
                    className="w-8 h-8 rounded bg-dark-600 flex items-center justify-center hover:bg-dark-500 transition-colors cursor-pointer">
                    <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                ) : (
                  <div className="w-8 h-8 rounded bg-dark-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-5 flex justify-center gap-1.5">
                <button
                  onClick={() => item && onViewBOM?.(item)}
                  disabled={!item}
                  className="px-2 py-1 rounded text-[9px] font-bold bg-accent-green/20 text-accent-green hover:bg-accent-green/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  VIEW
                </button>
                <button
                  onClick={() => item && navigate('/trials/new', { state: { toolId, bomId: item.id, bomType: type, sku: item.sku } })}
                  disabled={!item}
                  className="px-2 py-1 rounded text-[9px] font-bold bg-accent-red/20 text-accent-red hover:bg-accent-red/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  REPLACE
                </button>
                <button
                  onClick={() => item && handleDelete(item, type)}
                  disabled={!item}
                  className="px-2 py-1 rounded text-[9px] font-bold bg-red-900/20 text-red-400 hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  DELETE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
