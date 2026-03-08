import React, { useState, useEffect, useCallback } from 'react';
import { machineAPI, toolSlotAPI, bomAPI } from '../services/api';
import ToolSlotList from '../components/ToolSlotList';
import SubassemblyPanel from '../components/SubassemblyPanel';
import TrialStatusPanel from '../components/TrialStatusPanel';
import ToolDetailsPanel from '../components/ToolDetailsPanel';
import AddToolModal from '../components/AddToolModal';
import AddBOMModal from '../components/AddBOMModal';
import toast from 'react-hot-toast';

const STATUS_ACTIONS = {
  DRAFT: { label: 'Activate', next: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
  ACTIVE: { label: 'Deactivate', next: 'INACTIVE', color: 'bg-red-600 hover:bg-red-700' },
  INACTIVE: { label: 'Activate', next: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
  TRIAL: { label: 'Activate', next: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
  TRIAL_PENDING: { label: 'Activate', next: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
  WORN_OUT: { label: 'Reactivate', next: 'ACTIVE', color: 'bg-green-600 hover:bg-green-700' },
};

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [components, setComponents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotDetail, setSlotDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTool, setShowAddTool] = useState(false);
  const [showAddBOM, setShowAddBOM] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    machineAPI.list().then(r => {
      const data = r.data.results || r.data;
      setMachines(data);
      if (data.length > 0) setSelectedMachine(data[0].id);
    }).catch(() => toast.error('Failed to load machines'));
  }, []);

  useEffect(() => {
    if (!selectedMachine) return;
    machineAPI.getComponents(selectedMachine).then(r => {
      const data = r.data.results || r.data;
      setComponents(data);
      if (data.length > 0) setSelectedComponent(data[0].id);
      else setSelectedComponent('');
    }).catch(() => setComponents([]));
  }, [selectedMachine]);

  const loadSlots = useCallback(() => {
    if (!selectedMachine) return;
    setLoading(true);
    const params = { machine: selectedMachine };
    if (selectedComponent) params.component = selectedComponent;
    toolSlotAPI.list(params).then(r => {
      const data = r.data.results || r.data;
      setSlots(data);
      setLastSync(new Date());
    }).catch(() => setSlots([]))
    .finally(() => setLoading(false));
  }, [selectedMachine, selectedComponent]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleSelectSlot = async (slot) => {
    setSelectedSlot(slot);
    setSelectedBOM(null);
    try {
      const res = await toolSlotAPI.get(slot.id);
      setSlotDetail(res.data);
    } catch {
      toast.error('Failed to load slot details');
    }
  };

  const handleToolAdded = () => {
    setShowAddTool(false);
    loadSlots();
    toast.success('Tool added successfully');
  };

  const handleBOMAdded = async () => {
    setShowAddBOM(false);
    if (selectedSlot) {
      const res = await toolSlotAPI.get(selectedSlot.id);
      setSlotDetail(res.data);
    }
    toast.success('Subassembly added');
  };

  const handleViewBOM = async (bomItem) => {
    setSelectedBOM(bomItem);
    try {
      const res = await bomAPI.get(bomItem.id);
      setSelectedBOM(res.data);
    } catch {
      setSelectedBOM(bomItem);
    }
  };

  const handleDeleteTool = async (slot) => {
    if (!window.confirm(`Delete tool ${slot.tool_number} (${slot.tool_name})? This will also delete all subassemblies. This cannot be undone.`)) return;
    try {
      await toolSlotAPI.delete(slot.id);
      toast.success(`Tool ${slot.tool_number} deleted`);
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot(null);
        setSlotDetail(null);
        setSelectedBOM(null);
      }
      loadSlots();
    } catch {
      toast.error('Failed to delete tool');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedSlot) return;
    try {
      await toolSlotAPI.update(selectedSlot.id, { status: newStatus });
      toast.success(`Tool status changed to ${newStatus}`);
      loadSlots();
      const res = await toolSlotAPI.get(selectedSlot.id);
      setSlotDetail(res.data);
      setSelectedSlot(prev => ({ ...prev, status: newStatus }));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const currentMachine = machines.find(m => m.id === Number(selectedMachine));
  const currentComponent = components.find(c => c.id === Number(selectedComponent));

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Filter Bar */}
      <div className="px-4 py-2.5 bg-dark-800 border-b border-dark-500 flex items-center gap-4">
        <div>
          <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-0.5">Machine Selection</label>
          <select className="select-dark text-xs py-1.5 min-w-[130px]" value={selectedMachine} onChange={e => { setSelectedMachine(e.target.value); setSelectedSlot(null); setSlotDetail(null); }}>
            {machines.map(m => <option key={m.id} value={m.id}>{m.machine_id}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-0.5">Component Name</label>
          <select className="select-dark text-xs py-1.5 min-w-[160px]" value={selectedComponent} onChange={e => { setSelectedComponent(e.target.value); setSelectedSlot(null); setSlotDetail(null); }}>
            <option value="">All Components</option>
            {components.map(c => <option key={c.id} value={c.id}>{c.component_name} {c.operation ? `- ${c.operation}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-0.5">Category</label>
          <select className="select-dark text-xs py-1.5 min-w-[110px]" defaultValue="Tooling">
            <option value="Tooling">Tooling</option>
            <option value="Gauges">Gauges</option>
            <option value="Fixture">Fixture</option>
          </select>
        </div>
        <div className="ml-auto">
          <button onClick={loadSlots} className="bg-accent-green hover:bg-green-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Machine
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Tool Slot List */}
        <div className="w-[220px] border-r border-dark-500 bg-dark-800 flex-shrink-0 overflow-hidden flex flex-col">
          <ToolSlotList
            slots={slots}
            selectedSlot={selectedSlot}
            onSelect={handleSelectSlot}
            onDelete={handleDeleteTool}
            loading={loading}
            machineId={currentMachine?.machine_id || ''}
            onAddTool={() => setShowAddTool(true)}
          />
        </div>

        {/* Center - Sub-assembly + Shape/Life + Other */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <SubassemblyPanel
            bomItems={slotDetail?.bom_items || []}
            componentName={currentComponent?.component_name || slotDetail?.component_name || ''}
            toolId={selectedSlot?.id}
            toolCategory={selectedSlot?.category || slotDetail?.category}
            onAddBOM={() => setShowAddBOM(true)}
            onViewBOM={handleViewBOM}
            onRefresh={() => selectedSlot && handleSelectSlot(selectedSlot)}
          />

          {/* Status Control Bar */}
          {selectedSlot && slotDetail && (() => {
            const currentStatus = slotDetail.status || selectedSlot.status;
            const action = STATUS_ACTIONS[currentStatus];
            return (
              <div className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Status:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                    currentStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                    currentStatus === 'INACTIVE' ? 'bg-gray-500/20 text-gray-400' :
                    currentStatus === 'TRIAL' || currentStatus === 'TRIAL_PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                    currentStatus === 'WORN_OUT' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{currentStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  {action && (
                    <button
                      onClick={() => handleStatusChange(action.next)}
                      className={`px-3 py-1 rounded text-[10px] font-bold text-white transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  )}
                  {currentStatus !== 'INACTIVE' && currentStatus !== 'WORN_OUT' && (
                    <button
                      onClick={() => handleStatusChange('INACTIVE')}
                      className="px-3 py-1 rounded text-[10px] font-bold bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
          {selectedBOM ? (
            <ToolDetailsPanel
              toolData={slotDetail}
              selectedBOM={selectedBOM}
              onClearBOM={() => setSelectedBOM(null)}
              onRefresh={() => selectedSlot && handleSelectSlot(selectedSlot)}
            />
          ) : (
            selectedSlot && !selectedBOM && (
              <div className="card text-center py-8">
                <p className="text-[10px] text-gray-500">Click <span className="text-accent-green font-bold">VIEW</span> on a subassembly to see details</p>
              </div>
            )
          )}
        </div>

        {/* Right - Trial Status */}
        <div className="w-[220px] border-l border-dark-500 bg-dark-800 flex-shrink-0 overflow-hidden flex flex-col">
          <TrialStatusPanel
            trialHistory={slotDetail?.trial_history || []}
            currentStatus={slotDetail?.status}
            toolId={selectedSlot?.id}
          />
        </div>
      </div>

      {/* Status Bar */}
      <footer className="px-4 py-1 bg-dark-800 border-t border-dark-500 flex items-center text-[9px] font-mono">
        <span className="flex items-center gap-1.5 text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />PLC COMMS: OK
        </span>
        <span className="mx-3 text-dark-400">●</span>
        <span className="text-green-400">SERVER: LATENCY 12ms</span>
        <span className="mx-3 text-dark-400">●</span>
        <span className="text-gray-500">LAST SYNC: {lastSync ? lastSync.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</span>
        <span className="ml-auto text-gray-500">AUTO-REFRESH: ON</span>
        <span className="ml-4 text-gray-600">v 2.4.1</span>
      </footer>

      {/* Add Tool Modal */}
      {showAddTool && (
        <AddToolModal
          machineId={selectedMachine}
          machineName={currentMachine?.machine_id || ''}
          componentId={selectedComponent}
          componentName={currentComponent?.component_name || ''}
          onClose={() => setShowAddTool(false)}
          onSaved={handleToolAdded}
        />
      )}

      {/* Add BOM Modal */}
      {showAddBOM && selectedSlot && (
        <AddBOMModal
          toolId={selectedSlot.id}
          toolNumber={selectedSlot.tool_name || selectedSlot.tool_number || ''}
          toolCategory={selectedSlot?.category || slotDetail?.category}
          existingTypes={(slotDetail?.bom_items || []).map(b => b.bom_type)}
          onClose={() => setShowAddBOM(false)}
          onSaved={handleBOMAdded}
        />
      )}
    </div>
  );
}
