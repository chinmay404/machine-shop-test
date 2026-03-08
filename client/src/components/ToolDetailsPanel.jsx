import React from 'react';

const BOM_TYPE_LABELS = {
  PULLSTUD: 'Pull Stud', ADAPTOR: 'Adaptor', TOOL: 'Tool (Cutting Tool)',
  INSERT: 'Insert', CARTRIDGE: 'Cartridge', MBU: 'MBU', BORING_HEAD: 'Boring Head',
};
const BOM_TYPE_COLORS = {
  PULLSTUD: 'text-accent-red', ADAPTOR: 'text-accent-blue', TOOL: 'text-accent-green',
  INSERT: 'text-accent-orange', CARTRIDGE: 'text-accent-cyan', MBU: 'text-purple-400', BORING_HEAD: 'text-yellow-500',
};

export default function ToolDetailsPanel({ toolData, selectedBOM, onClearBOM, onRefresh }) {
  if (!selectedBOM) return null;

  const bomDetail = selectedBOM.detail || selectedBOM.bom_detail || {};
  const bomLabel = BOM_TYPE_LABELS[selectedBOM.bom_type] || selectedBOM.bom_type;
  const bomColor = BOM_TYPE_COLORS[selectedBOM.bom_type] || 'text-accent-cyan';

  // Render a section of key-value data
  const renderSection = (title, data, color = 'text-gray-400') => {
    if (!data || !Object.keys(data).length) return null;
    return (
      <div className="card mb-3">
        <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${color}`}>{title}</h4>
        <div className="space-y-2">
          {Object.entries(data).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <label className="text-[9px] text-gray-500 uppercase w-32 flex-shrink-0">{k.replace(/_/g, ' ')}</label>
              <div className="input-dark text-xs py-1 flex-1 text-right font-mono bg-dark-600 cursor-default">
                {v !== null && v !== undefined && v !== '' ? String(v) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Life metrics card (shown if life_data exists)
  const renderLifeMetrics = () => {
    const ld = bomDetail.life_data;
    if (!ld) return null;
    const lifePerEdge = Number(ld.life_per_edge) || 0;
    const overallLife = Number(ld.overall_life) || 0;
    return (
      <div className="card mb-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Life Metrics</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-600 rounded-xl p-3 text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Life Per Edge</p>
            <p className="text-xl font-bold text-accent-green font-mono">{lifePerEdge || '—'}</p>
          </div>
          <div className="bg-dark-600 rounded-xl p-3 text-center">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Overall Life</p>
            <p className="text-xl font-bold text-gray-200 font-mono">{overallLife || '—'}</p>
          </div>
        </div>
      </div>
    );
  };

  // Parameters card
  const renderParams = () => {
    const pd = bomDetail.parameter_data;
    if (!pd || !Object.keys(pd).length) return null;
    return (
      <div className="card mb-3">
        <h4 className="text-[10px] font-bold text-accent-blue uppercase tracking-wider mb-3">Cutting Parameters</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {Object.entries(pd).map(([k, v]) => {
            const isAuto = ['rpm', 'feed', 'overall_life'].includes(k);
            return (
              <div key={k}>
                <label className="text-[9px] text-gray-500 uppercase block mb-0.5">{k.replace(/_/g, ' ')}</label>
                <div className={`input-dark text-xs py-1.5 w-full font-mono bg-dark-600 cursor-default ${isAuto ? 'text-accent-green' : 'text-gray-200'}`}>
                  {v !== null && v !== undefined && v !== '' ? String(v) : '—'}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[8px] text-gray-600">RPM = (1000 × Vc) / (π × D) &bull; Feed = RPM × Fz × Z</p>
      </div>
    );
  };

  return (
    <>
      {/* Header card */}
      <div className="card mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${bomColor}`}>
            {bomLabel} {selectedBOM.sku ? <span className="text-gray-500 font-mono text-[10px] ml-2">({selectedBOM.sku})</span> : ''}
          </h3>
          <div className="flex items-center gap-2">
            {bomDetail.is_locked && (
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-red-900/30 text-red-400 border border-red-800/50">LOCKED</span>
            )}
            <button onClick={onClearBOM} className="px-2 py-0.5 rounded text-[8px] font-bold bg-dark-500 text-gray-400 hover:text-gray-200 transition-colors">✕ CLOSE</button>
          </div>
        </div>
        {selectedBOM.master_item_name && (
          <p className="text-[10px] text-gray-400">Master: <span className="text-gray-200 font-medium">{selectedBOM.master_item_code} — {selectedBOM.master_item_name}</span></p>
        )}
        {selectedBOM.description && (
          <p className="text-[10px] text-gray-500 mt-0.5">{selectedBOM.description}</p>
        )}
      </div>

      {/* Shape Data */}
      {renderSection(`Shape — ${bomLabel}`, bomDetail.shape_data)}

      {/* Life Metrics */}
      {renderLifeMetrics()}

      {/* Parameters */}
      {renderParams()}

      {/* Other Specs */}
      {renderSection('Other Specifications', bomDetail.other_data, 'text-gray-400')}

      {/* Empty state */}
      {!bomDetail.shape_data && !bomDetail.life_data && !bomDetail.parameter_data && !bomDetail.other_data && (
        <div className="card text-center py-6">
          <p className="text-[10px] text-gray-600 italic">No detail data recorded for this subassembly yet.</p>
          <p className="text-[9px] text-gray-600 mt-1">Add data through the Add Subassembly form.</p>
        </div>
      )}
    </>
  );
}
