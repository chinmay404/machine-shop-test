import React, { useState, useEffect, useMemo } from 'react';
import { toolSlotAPI } from '../services/api';
import toast from 'react-hot-toast';

const TOOL_CATEGORIES = [
  { value: 'MILLING_CUTTER', label: 'Milling Cutter' },
  { value: 'DRILL', label: 'Drill' },
  { value: 'ENDMILL', label: 'Endmill' },
  { value: 'TAP', label: 'Tap' },
  { value: 'THREADMILL', label: 'Threadmill' },
  { value: 'BORING_BAR', label: 'Boring Bar' },
  { value: 'REAMERS', label: 'Reamers' },
  { value: 'SPECIAL_DRILL', label: 'Special Drill' },
  { value: 'SPECIAL_TOOL', label: 'Special Tool' },
  { value: 'OTHER', label: 'Other' },
];

const THREAD_STANDARDS = ['Metric', 'UNC', 'UNF', 'BSP'];

function buildToolName(category, diameter, threadStandard, threadSize, threadPitch) {
  const catLabel = TOOL_CATEGORIES.find(c => c.value === category)?.label || 'Tool';
  if (category === 'TAP') {
    if (threadStandard === 'Metric' && threadSize) {
      return `M${threadSize}${threadPitch ? ` x ${threadPitch}` : ''} Tap`;
    }
    if (['UNC', 'UNF', 'BSP'].includes(threadStandard) && threadSize) {
      return `${threadSize} - ${threadPitch || ''} ${threadStandard} Tap`.replace(/\s+/g, ' ').trim();
    }
    return 'Tap';
  }
  if (diameter) return `⌀${diameter} ${catLabel}`;
  return catLabel;
}

export default function AddToolModal({ machineId, machineName, componentId, componentName, onClose, onSaved }) {
  const [form, setForm] = useState({
    pocket_number: '',
    category: 'MILLING_CUTTER',
    tool_number: '',
    diameter: '',
    thread_standard: 'Metric',
    thread_size: '',
    thread_pitch: '',
  });
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [toolCount, setToolCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const autoToolName = useMemo(
    () => buildToolName(form.category, form.diameter, form.thread_standard, form.thread_size, form.thread_pitch),
    [form.category, form.diameter, form.thread_standard, form.thread_size, form.thread_pitch]
  );

  useEffect(() => {
    if (machineId) {
      const params = { machine: machineId };
      if (componentId) params.component = componentId;
      toolSlotAPI.nextToolNumber(params).then(r => {
        const next = r.data.next_tool_number || '';
        const count = r.data.tools_count || 0;
        const used = r.data.used_numbers || [];
        setToolCount(count);

        // Build list of available T01..T60
        const all = [];
        for (let i = 1; i <= 60; i++) {
          const num = `T${String(i).padStart(2, '0')}`;
          if (!used.includes(num)) all.push(num);
        }
        setAvailableNumbers(all);
        setForm(p => ({ ...p, tool_number: next || (all.length ? all[0] : '') }));
      }).catch(() => {});
    }
  }, [machineId, componentId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tool_number) {
      toast.error('No available tool numbers (max 60)');
      return;
    }
    if (form.category !== 'TAP' && !form.diameter) {
      toast.error('Diameter is required');
      return;
    }
    if (form.category === 'TAP' && !form.thread_size) {
      toast.error('Thread size is required for Tap tools');
      return;
    }
    setSaving(true);
    try {
      await toolSlotAPI.create({
        machine: machineId,
        component: componentId || null,
        tool_number: form.tool_number,
        pocket_number: form.pocket_number,
        tool_name: autoToolName,
        category: form.category,
        diameter: form.category !== 'TAP' ? parseFloat(form.diameter) || null : null,
      });
      toast.success(`Tool ${form.tool_number} added`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add tool');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSave} className="bg-dark-700 rounded-xl border border-dark-500 w-full max-w-md p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-200">Add New Tool</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
        </div>

        <div className="space-y-3">
          <Field label="Machine Name">
            <input className="input-dark text-xs py-1.5 w-full bg-dark-600 cursor-not-allowed" readOnly value={machineName || `Machine #${machineId}`} />
          </Field>
          <Field label="Component Name">
            <input className="input-dark text-xs py-1.5 w-full bg-dark-600 cursor-not-allowed" readOnly value={componentName || 'All Components'} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tool Number" required>
              <select className="select-dark text-xs py-1.5 w-full font-mono font-bold text-accent-green" value={form.tool_number} onChange={e => set('tool_number', e.target.value)}>
                {availableNumbers.length === 0 ? (
                  <option value="">MAX REACHED</option>
                ) : (
                  availableNumbers.map(n => <option key={n} value={n}>{n}</option>)
                )}
              </select>
              <p className="text-[8px] text-gray-600 mt-0.5">{toolCount}/60 tools used</p>
            </Field>
            <Field label="Pocket Number">
              <input className="input-dark text-xs py-1.5 w-full" placeholder="e.g. P01" value={form.pocket_number} onChange={e => set('pocket_number', e.target.value)} />
            </Field>
          </div>
          <Field label="Tool Category" required>
            <select className="select-dark text-xs py-1.5 w-full" value={form.category} onChange={e => set('category', e.target.value)}>
              {TOOL_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          {/* Diameter — required for all categories except TAP */}
          {form.category !== 'TAP' && (
            <Field label="Diameter (mm)" required>
              <input className="input-dark text-xs py-1.5 w-full" type="number" step="0.01" min="0" placeholder="e.g. 80" value={form.diameter} onChange={e => set('diameter', e.target.value)} />
            </Field>
          )}

          {/* Tap-specific fields */}
          {form.category === 'TAP' && (
            <>
              <Field label="Thread Standard" required>
                <select className="select-dark text-xs py-1.5 w-full" value={form.thread_standard} onChange={e => set('thread_standard', e.target.value)}>
                  {THREAD_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={form.thread_standard === 'Metric' ? 'Thread Size (e.g. 12)' : 'Thread Size (e.g. 5/8)'} required>
                  <input className="input-dark text-xs py-1.5 w-full" placeholder={form.thread_standard === 'Metric' ? '12' : '5/8'} value={form.thread_size} onChange={e => set('thread_size', e.target.value)} />
                </Field>
                <Field label={form.thread_standard === 'Metric' ? 'Pitch (e.g. 1.5)' : 'TPI (e.g. 11)'}>
                  <input className="input-dark text-xs py-1.5 w-full" placeholder={form.thread_standard === 'Metric' ? '1.5' : '11'} value={form.thread_pitch} onChange={e => set('thread_pitch', e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* Auto-generated Tool Name Preview */}
          <Field label="Generated Tool Name">
            <div className="input-dark text-xs py-1.5 w-full bg-dark-600 text-accent-green font-bold">{autoToolName}</div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 border border-dark-500 hover:border-dark-400 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.tool_number} className="px-4 py-1.5 rounded text-xs font-bold bg-accent-green text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
            {saving ? 'Adding...' : `Add ${form.tool_number || 'Tool'}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[9px] text-gray-500 uppercase block mb-1">
        {label}{required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
