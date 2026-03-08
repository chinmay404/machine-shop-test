import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from '../router/nextRouterCompat';
import { trialAPI, machineAPI, toolSlotAPI, bomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Category-specific existing + new comparison fields
const CATEGORY_FIELDS = {
  INSERT: {
    label: 'Insert',
    sections: {
      cutting_tool_details: [
        { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
        { label: 'Insert Code', eKey: 'existing_insert_code', nKey: 'new_insert_code' },
        { label: 'Grade', eKey: 'existing_grade', nKey: 'new_grade' },
        { label: 'No. of Cutting Edges', eKey: 'existing_cutting_edges', nKey: 'new_cutting_edges', type: 'number' },
        { label: 'No. of Inserts', eKey: 'existing_no_of_inserts', nKey: 'new_no_of_inserts', type: 'number' },
        { label: 'Tool/Job Diameter', eKey: 'existing_tool_diameter', nKey: 'new_tool_diameter', type: 'number' },
      ],
      cutting_details: [
        { label: 'Cutting Speed Vc (m/min)', eKey: 'existing_cutting_speed', nKey: 'new_cutting_speed', type: 'number' },
        { label: 'Spindle Revolution n (rpm)', eKey: 'existing_rpm', nKey: 'new_rpm', type: 'number' },
        { label: 'Feed, fz (mm/tooth)', eKey: 'existing_feed_per_tooth', nKey: 'new_feed_per_tooth', type: 'number' },
        { label: 'Feed, fr (mm/rev)', eKey: 'existing_feed_per_rev', nKey: 'new_feed_per_rev', type: 'number' },
        { label: 'Feed, Vf (mm/min)', eKey: 'existing_feed', nKey: 'new_feed', type: 'number' },
        { label: 'Depth of Cut, ap (mm)', eKey: 'existing_depth_of_cut', nKey: 'new_depth_of_cut', type: 'number' },
        { label: 'No of Passes', eKey: 'existing_no_of_passes', nKey: 'new_no_of_passes', type: 'number' },
        { label: 'Coolant', eKey: 'existing_coolant', nKey: 'new_coolant', select: true },
      ],
      results: [
        { label: 'Cutting Length (mm)', eKey: 'existing_cutting_length', nKey: 'new_cutting_length', type: 'number' },
        { label: 'Total Cutting Length (mm)', eKey: 'existing_total_cutting_length', nKey: 'new_total_cutting_length', type: 'number' },
        { label: 'Cutting Time (min)', eKey: 'existing_cutting_time_min', nKey: 'new_cutting_time_min', type: 'number' },
        { label: 'Cutting Time (sec)', eKey: 'existing_cutting_time_sec', nKey: 'new_cutting_time_sec', type: 'number' },
        { label: 'Tool Life (No. of Components)', eKey: 'existing_tool_life', nKey: 'new_tool_life', type: 'number' },
        { label: 'Tool Life (m)', eKey: 'existing_tool_life_m', nKey: 'new_tool_life_m', type: 'number' },
        { label: 'Surface Finish', eKey: 'existing_surface_finish', nKey: 'new_surface_finish' },
        { label: 'Wear', eKey: 'existing_wear', nKey: 'new_wear' },
        { label: 'Chip Control', eKey: 'existing_chip_control', nKey: 'new_chip_control' },
        { label: 'Test Result', eKey: 'existing_test_result', nKey: 'new_test_result' },
      ],
      cost: [
        { label: 'Insert Cost (₹)', eKey: 'existing_insert_cost', nKey: 'new_insert_cost', type: 'number' },
        { label: 'Total Insert Cost (₹)', eKey: 'existing_total_insert_cost', nKey: 'new_total_insert_cost', type: 'number' },
        { label: 'Average Life Per Corner', eKey: 'existing_avg_life_per_corner', nKey: 'new_avg_life_per_corner', type: 'number' },
        { label: 'Cost/Component (Insert) ₹', eKey: 'existing_cost_per_component', nKey: 'new_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Tool) ₹', eKey: 'existing_tool_cost_per_component', nKey: 'new_tool_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Overall) ₹', eKey: 'existing_overall_cost_per_component', nKey: 'new_overall_cost_per_component', type: 'number' },
      ],
    },
  },
  TOOL: {
    label: 'Tool (Cutting Tool)',
    sections: {
      cutting_tool_details: [
        { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
        { label: 'Insert Code', eKey: 'existing_insert_code', nKey: 'new_insert_code' },
        { label: 'Grade', eKey: 'existing_grade', nKey: 'new_grade' },
        { label: 'No. of Cutting Edges', eKey: 'existing_cutting_edges', nKey: 'new_cutting_edges', type: 'number' },
        { label: 'No. of Inserts', eKey: 'existing_no_of_inserts', nKey: 'new_no_of_inserts', type: 'number' },
        { label: 'Tool/Job Diameter', eKey: 'existing_tool_diameter', nKey: 'new_tool_diameter', type: 'number' },
      ],
      cutting_details: [
        { label: 'Cutting Speed Vc (m/min)', eKey: 'existing_cutting_speed', nKey: 'new_cutting_speed', type: 'number' },
        { label: 'Spindle Revolution n (rpm)', eKey: 'existing_rpm', nKey: 'new_rpm', type: 'number' },
        { label: 'Feed, fz (mm/tooth)', eKey: 'existing_feed_per_tooth', nKey: 'new_feed_per_tooth', type: 'number' },
        { label: 'Feed, fr (mm/rev)', eKey: 'existing_feed_per_rev', nKey: 'new_feed_per_rev', type: 'number' },
        { label: 'Feed, Vf (mm/min)', eKey: 'existing_feed', nKey: 'new_feed', type: 'number' },
        { label: 'Depth of Cut, ap (mm)', eKey: 'existing_depth_of_cut', nKey: 'new_depth_of_cut', type: 'number' },
        { label: 'No of Passes', eKey: 'existing_no_of_passes', nKey: 'new_no_of_passes', type: 'number' },
        { label: 'Coolant', eKey: 'existing_coolant', nKey: 'new_coolant', select: true },
      ],
      results: [
        { label: 'Cutting Length (mm)', eKey: 'existing_cutting_length', nKey: 'new_cutting_length', type: 'number' },
        { label: 'Total Cutting Length (mm)', eKey: 'existing_total_cutting_length', nKey: 'new_total_cutting_length', type: 'number' },
        { label: 'Cutting Time (min)', eKey: 'existing_cutting_time_min', nKey: 'new_cutting_time_min', type: 'number' },
        { label: 'Cutting Time (sec)', eKey: 'existing_cutting_time_sec', nKey: 'new_cutting_time_sec', type: 'number' },
        { label: 'Tool Life (No. of Components)', eKey: 'existing_tool_life', nKey: 'new_tool_life', type: 'number' },
        { label: 'Tool Life (m)', eKey: 'existing_tool_life_m', nKey: 'new_tool_life_m', type: 'number' },
        { label: 'Surface Finish', eKey: 'existing_surface_finish', nKey: 'new_surface_finish' },
        { label: 'Wear', eKey: 'existing_wear', nKey: 'new_wear' },
        { label: 'Chip Control', eKey: 'existing_chip_control', nKey: 'new_chip_control' },
        { label: 'Test Result', eKey: 'existing_test_result', nKey: 'new_test_result' },
      ],
      cost: [
        { label: 'Insert Cost (₹)', eKey: 'existing_insert_cost', nKey: 'new_insert_cost', type: 'number' },
        { label: 'Total Insert Cost (₹)', eKey: 'existing_total_insert_cost', nKey: 'new_total_insert_cost', type: 'number' },
        { label: 'Average Life Per Corner', eKey: 'existing_avg_life_per_corner', nKey: 'new_avg_life_per_corner', type: 'number' },
        { label: 'Cost/Component (Insert) ₹', eKey: 'existing_cost_per_component', nKey: 'new_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Tool) ₹', eKey: 'existing_tool_cost_per_component', nKey: 'new_tool_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Overall) ₹', eKey: 'existing_overall_cost_per_component', nKey: 'new_overall_cost_per_component', type: 'number' },
      ],
    },
  },
  ADAPTOR: {
    label: 'Adaptor',
    sections: {
      cutting_tool_details: [
        { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
        { label: 'Taper', eKey: 'existing_taper', nKey: 'new_taper' },
        { label: 'Adaptor Diameter', eKey: 'existing_adaptor_dia', nKey: 'new_adaptor_dia', type: 'number' },
        { label: 'GPL', eKey: 'existing_gpl', nKey: 'new_gpl', type: 'number' },
        { label: 'Coolant', eKey: 'existing_coolant', nKey: 'new_coolant', select: true },
      ],
    },
  },
  PULLSTUD: {
    label: 'Pull Stud',
    sections: {
      cutting_tool_details: [
        { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
        { label: 'Thread Size', eKey: 'existing_thread_size', nKey: 'new_thread_size' },
        { label: 'Standard', eKey: 'existing_standard', nKey: 'new_standard' },
      ],
    },
  },
  BORING_HEAD: {
    label: 'Boring Head',
    sections: {
      cutting_tool_details: [
        { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
        { label: 'Boring Range Min', eKey: 'existing_boring_min', nKey: 'new_boring_min', type: 'number' },
        { label: 'Boring Range Max', eKey: 'existing_boring_max', nKey: 'new_boring_max', type: 'number' },
      ],
      cutting_details: [
        { label: 'Cutting Speed Vc (m/min)', eKey: 'existing_cutting_speed', nKey: 'new_cutting_speed', type: 'number' },
        { label: 'Spindle Revolution n (rpm)', eKey: 'existing_rpm', nKey: 'new_rpm', type: 'number' },
        { label: 'Feed, fz (mm/tooth)', eKey: 'existing_feed_per_tooth', nKey: 'new_feed_per_tooth', type: 'number' },
        { label: 'Feed, fr (mm/rev)', eKey: 'existing_feed_per_rev', nKey: 'new_feed_per_rev', type: 'number' },
        { label: 'Feed, Vf (mm/min)', eKey: 'existing_feed', nKey: 'new_feed', type: 'number' },
        { label: 'Depth of Cut, ap (mm)', eKey: 'existing_depth_of_cut', nKey: 'new_depth_of_cut', type: 'number' },
        { label: 'No of Passes', eKey: 'existing_no_of_passes', nKey: 'new_no_of_passes', type: 'number' },
        { label: 'Coolant', eKey: 'existing_coolant', nKey: 'new_coolant', select: true },
      ],
      results: [
        { label: 'Cutting Length (mm)', eKey: 'existing_cutting_length', nKey: 'new_cutting_length', type: 'number' },
        { label: 'Total Cutting Length (mm)', eKey: 'existing_total_cutting_length', nKey: 'new_total_cutting_length', type: 'number' },
        { label: 'Cutting Time (min)', eKey: 'existing_cutting_time_min', nKey: 'new_cutting_time_min', type: 'number' },
        { label: 'Cutting Time (sec)', eKey: 'existing_cutting_time_sec', nKey: 'new_cutting_time_sec', type: 'number' },
        { label: 'Tool Life (No. of Components)', eKey: 'existing_tool_life', nKey: 'new_tool_life', type: 'number' },
        { label: 'Tool Life (m)', eKey: 'existing_tool_life_m', nKey: 'new_tool_life_m', type: 'number' },
        { label: 'Surface Finish', eKey: 'existing_surface_finish', nKey: 'new_surface_finish' },
        { label: 'Wear', eKey: 'existing_wear', nKey: 'new_wear' },
        { label: 'Chip Control', eKey: 'existing_chip_control', nKey: 'new_chip_control' },
        { label: 'Test Result', eKey: 'existing_test_result', nKey: 'new_test_result' },
      ],
      cost: [
        { label: 'Insert Cost (₹)', eKey: 'existing_insert_cost', nKey: 'new_insert_cost', type: 'number' },
        { label: 'Total Insert Cost (₹)', eKey: 'existing_total_insert_cost', nKey: 'new_total_insert_cost', type: 'number' },
        { label: 'Average Life Per Corner', eKey: 'existing_avg_life_per_corner', nKey: 'new_avg_life_per_corner', type: 'number' },
        { label: 'Cost/Component (Insert) ₹', eKey: 'existing_cost_per_component', nKey: 'new_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Tool) ₹', eKey: 'existing_tool_cost_per_component', nKey: 'new_tool_cost_per_component', type: 'number' },
        { label: 'Cost/Component (Overall) ₹', eKey: 'existing_overall_cost_per_component', nKey: 'new_overall_cost_per_component', type: 'number' },
      ],
    },
  },
};

const DEFAULT_SECTIONS = {
  cutting_tool_details: [
    { label: 'Manufacturer', eKey: 'existing_manufacturer', nKey: 'new_manufacturer' },
    { label: 'Insert Code', eKey: 'existing_insert_code', nKey: 'new_insert_code' },
    { label: 'Grade', eKey: 'existing_grade', nKey: 'new_grade' },
    { label: 'No. of Cutting Edges', eKey: 'existing_cutting_edges', nKey: 'new_cutting_edges', type: 'number' },
    { label: 'No. of Inserts', eKey: 'existing_no_of_inserts', nKey: 'new_no_of_inserts', type: 'number' },
    { label: 'Tool/Job Diameter', eKey: 'existing_tool_diameter', nKey: 'new_tool_diameter', type: 'number' },
  ],
  cutting_details: [
    { label: 'Cutting Speed Vc (m/min)', eKey: 'existing_cutting_speed', nKey: 'new_cutting_speed', type: 'number' },
    { label: 'Spindle Revolution n (rpm)', eKey: 'existing_rpm', nKey: 'new_rpm', type: 'number' },
    { label: 'Feed, fz (mm/tooth)', eKey: 'existing_feed_per_tooth', nKey: 'new_feed_per_tooth', type: 'number' },
    { label: 'Feed, fr (mm/rev)', eKey: 'existing_feed_per_rev', nKey: 'new_feed_per_rev', type: 'number' },
    { label: 'Feed, Vf (mm/min)', eKey: 'existing_feed', nKey: 'new_feed', type: 'number' },
    { label: 'Depth of Cut, ap (mm)', eKey: 'existing_depth_of_cut', nKey: 'new_depth_of_cut', type: 'number' },
    { label: 'No of Passes', eKey: 'existing_no_of_passes', nKey: 'new_no_of_passes', type: 'number' },
    { label: 'Coolant', eKey: 'existing_coolant', nKey: 'new_coolant', select: true },
  ],
  results: [
    { label: 'Cutting Length (mm)', eKey: 'existing_cutting_length', nKey: 'new_cutting_length', type: 'number' },
    { label: 'Total Cutting Length (mm)', eKey: 'existing_total_cutting_length', nKey: 'new_total_cutting_length', type: 'number' },
    { label: 'Cutting Time (min)', eKey: 'existing_cutting_time_min', nKey: 'new_cutting_time_min', type: 'number' },
    { label: 'Cutting Time (sec)', eKey: 'existing_cutting_time_sec', nKey: 'new_cutting_time_sec', type: 'number' },
    { label: 'Tool Life (No. of Components)', eKey: 'existing_tool_life', nKey: 'new_tool_life', type: 'number' },
    { label: 'Tool Life (m)', eKey: 'existing_tool_life_m', nKey: 'new_tool_life_m', type: 'number' },
    { label: 'Surface Finish', eKey: 'existing_surface_finish', nKey: 'new_surface_finish' },
    { label: 'Wear', eKey: 'existing_wear', nKey: 'new_wear' },
    { label: 'Chip Control', eKey: 'existing_chip_control', nKey: 'new_chip_control' },
    { label: 'Test Result', eKey: 'existing_test_result', nKey: 'new_test_result' },
  ],
  cost: [
    { label: 'Insert Cost (₹)', eKey: 'existing_insert_cost', nKey: 'new_insert_cost', type: 'number' },
    { label: 'Total Insert Cost (₹)', eKey: 'existing_total_insert_cost', nKey: 'new_total_insert_cost', type: 'number' },
    { label: 'Average Life Per Corner', eKey: 'existing_avg_life_per_corner', nKey: 'new_avg_life_per_corner', type: 'number' },
    { label: 'Cost/Component (Insert) ₹', eKey: 'existing_cost_per_component', nKey: 'new_cost_per_component', type: 'number' },
    { label: 'Cost/Component (Tool) ₹', eKey: 'existing_tool_cost_per_component', nKey: 'new_tool_cost_per_component', type: 'number' },
    { label: 'Cost/Component (Overall) ₹', eKey: 'existing_overall_cost_per_component', nKey: 'new_overall_cost_per_component', type: 'number' },
  ],
};

const SECTION_LABELS = {
  cutting_tool_details: 'Cutting Tool Details',
  cutting_details: 'Cutting Details',
  results: 'Results',
  cost: 'Cost Analysis',
};

// Populate existing fields from BOM detail data
function populateExistingFromBOM(bom) {
  const detail = bom.detail || {};
  const sd = detail.shape_data || {};
  const pd = detail.parameter_data || {};
  const od = detail.other_data || {};
  const ld = detail.life_data || {};
  const td = od.trial_data || {};
  return {
    existing_manufacturer: od.manufacturer || sd.make || td.manufacturer || '',
    existing_insert_code: od.insert_name || sd.insert_shape || td.insert_code || '',
    existing_grade: sd.grade || td.grade || '',
    existing_cutting_edges: sd.number_of_cutting_edges || td.cutting_edges || '',
    existing_no_of_inserts: od.insert_qty || td.no_of_inserts || '',
    existing_cutting_speed: pd.vc || td.cutting_speed || '',
    existing_feed: pd.feed || td.feed || '',
    existing_feed_per_tooth: pd.feed_per_tooth || td.feed_per_tooth || '',
    existing_feed_per_rev: pd.feed_per_rev || td.feed_per_rev || '',
    existing_rpm: pd.rpm || td.rpm || '',
    existing_depth_of_cut: pd.depth_of_cut || td.depth_of_cut || '',
    existing_no_of_passes: pd.no_of_passes || td.no_of_passes || '',
    existing_coolant: pd.coolant || td.coolant || '',
    existing_tool_life: ld.overall_life || ld.life_per_edge || od.components_per_life || td.tool_life_components || '',
    existing_tool_life_m: ld.tool_life_m || td.tool_life_m || '',
    existing_cutting_length: pd.cutting_length || sd.cutting_length || td.cutting_length || '',
    existing_total_cutting_length: pd.total_cutting_length || td.total_cutting_length || '',
    existing_cutting_time_min: pd.cutting_time_min || pd.cutting_time || td.cutting_time_min || '',
    existing_cutting_time_sec: pd.cutting_time_sec || td.cutting_time_sec || '',
    existing_surface_finish: pd.surface_finish || td.surface_finish || '',
    existing_tool_diameter: sd.tool_diameter || sd.size_diameter || td.tool_diameter || '',
    existing_flutes: sd.number_of_flutes || '',
    existing_taper: sd.taper || '',
    existing_adaptor_dia: sd.adaptor_diameter || '',
    existing_gpl: sd.gauge_length_gpl || '',
    existing_thread_size: sd.thread_size || '',
    existing_standard: sd.standard || '',
    existing_boring_min: sd.boring_range_min || '',
    existing_boring_max: sd.boring_range_max || '',
    existing_wear: td.wear || '',
    existing_chip_control: td.chip_control || '',
    existing_test_result: td.test_result || '',
    existing_insert_cost: od.insert_rate || td.insert_cost || '',
    existing_total_insert_cost: od.total_insert_cost || td.total_insert_cost || '',
    existing_avg_life_per_corner: od.avg_life_per_corner || ld.life_per_edge || td.avg_life_per_corner || '',
    existing_cost_per_component: od.cpc || td.cost_per_component || '',
    existing_tool_cost_per_component: od.tool_cpc || td.tool_cost_per_component || '',
    existing_overall_cost_per_component: od.overall_cpc || td.overall_cost_per_component || '',
  };
}

export default function ToolTrialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  // Received from SubassemblyPanel REPLACE button
  const routerState = location.state || {};

  // Cascading dropdown states
  const [machines, setMachines] = useState([]);
  const [components, setComponents] = useState([]);
  const [toolSlots, setToolSlots] = useState([]);
  const [bomItems, setBomItems] = useState([]);

  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedBOM, setSelectedBOM] = useState('');

  const [existingBOM, setExistingBOM] = useState(null);
  const [bomCategory, setBomCategory] = useState(routerState.bomType || '');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tool: routerState.toolId || '', machine_name: '', component_name: '', tool_number: '', tool_name: '',
    operation: '', customer: '', part_name: '', part_material: '',
    target_quantity: '', spindle_speed: '',
    // Cutting tool details
    existing_manufacturer: '', existing_insert_code: '', existing_grade: '',
    existing_cutting_edges: '', existing_no_of_inserts: '', existing_tool_diameter: '',
    new_manufacturer: '', new_insert_code: '', new_grade: '',
    new_cutting_edges: '', new_no_of_inserts: '', new_tool_diameter: '',
    // Cutting details
    existing_cutting_speed: '', existing_rpm: '', existing_feed_per_tooth: '',
    existing_feed_per_rev: '', existing_feed: '', existing_depth_of_cut: '',
    existing_no_of_passes: '', existing_coolant: '',
    new_cutting_speed: '', new_rpm: '', new_feed_per_tooth: '',
    new_feed_per_rev: '', new_feed: '', new_depth_of_cut: '',
    new_no_of_passes: '', new_coolant: '',
    // Results
    existing_cutting_length: '', existing_total_cutting_length: '',
    existing_cutting_time_min: '', existing_cutting_time_sec: '',
    existing_tool_life: '', existing_tool_life_m: '',
    existing_surface_finish: '', existing_wear: '',
    existing_chip_control: '', existing_test_result: '',
    new_cutting_length: '', new_total_cutting_length: '',
    new_cutting_time_min: '', new_cutting_time_sec: '',
    new_tool_life: '', new_tool_life_m: '',
    new_surface_finish: '', new_wear: '',
    new_chip_control: '', new_test_result: '',
    // Cost
    existing_insert_cost: '', existing_total_insert_cost: '',
    existing_avg_life_per_corner: '',
    existing_cost_per_component: '', existing_tool_cost_per_component: '',
    existing_overall_cost_per_component: '',
    new_insert_cost: '', new_total_insert_cost: '',
    new_avg_life_per_corner: '',
    new_cost_per_component: '', new_tool_cost_per_component: '',
    new_overall_cost_per_component: '',
    // Legacy fields
    existing_flutes: '', new_flutes: '',
    existing_taper: '', new_taper: '',
    existing_adaptor_dia: '', new_adaptor_dia: '',
    existing_gpl: '', new_gpl: '',
    existing_thread_size: '', new_thread_size: '',
    existing_standard: '', new_standard: '',
    existing_boring_min: '', existing_boring_max: '',
    new_boring_min: '', new_boring_max: '',
    remarks: '', trial_date: new Date().toISOString().slice(0, 10),
  });

  // 1. Load machines on mount
  useEffect(() => {
    machineAPI.list().then(r => setMachines(r.data.results || r.data)).catch(() => {});
    if (isEdit) {
      trialAPI.get(id).then(r => setForm(prev => ({ ...prev, ...r.data }))).catch(() => toast.error('Failed to load trial'));
    }
  }, [id, isEdit]);

  // 2. When machine changes → load components
  useEffect(() => {
    if (!selectedMachine) { setComponents([]); return; }
    machineAPI.getComponents(selectedMachine).then(r => {
      const data = r.data.results || r.data;
      setComponents(data);
    }).catch(() => setComponents([]));
  }, [selectedMachine]);

  // 3. When component changes → load tool slots
  useEffect(() => {
    if (!selectedMachine) { setToolSlots([]); return; }
    const params = { machine: selectedMachine };
    if (selectedComponent) params.component = selectedComponent;
    toolSlotAPI.list(params).then(r => {
      const data = r.data.results || r.data;
      setToolSlots(data);
    }).catch(() => setToolSlots([]));
  }, [selectedMachine, selectedComponent]);

  // 4. When tool slot changes → load BOM items & set form fields
  const loadSlotBOM = useCallback(async (slotId) => {
    if (!slotId) { setBomItems([]); return; }
    setLoading(true);
    try {
      const slotRes = await toolSlotAPI.get(slotId);
      const slot = slotRes.data;
      const items = slot.bom_items || [];
      setBomItems(items);
      setForm(p => ({
        ...p,
        tool: slotId,
        machine_name: slot.machine_id_code || slot.machine_name || '',
        component_name: slot.component_name || '',
        tool_number: slot.tool_number || '',
        tool_name: slot.tool_name || '',
      }));
    } catch {
      setBomItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSlotBOM(selectedSlot); }, [selectedSlot, loadSlotBOM]);

  // 5. When BOM item selected → load detail & populate existing fields
  useEffect(() => {
    if (!selectedBOM) { setExistingBOM(null); setBomCategory(''); return; }
    const loadBOMDetail = async () => {
      try {
        const res = await bomAPI.get(selectedBOM);
        const bom = res.data;
        setExistingBOM(bom);
        setBomCategory(bom.bom_type || '');
        setForm(p => ({ ...p, ...populateExistingFromBOM(bom) }));
      } catch {}
    };
    loadBOMDetail();
  }, [selectedBOM]);

  // Handle REPLACE button routing — pre-fill all dropdowns
  useEffect(() => {
    if (!routerState.toolId || isEdit) return;
    const prefill = async () => {
      setLoading(true);
      try {
        const slotRes = await toolSlotAPI.get(routerState.toolId);
        const slot = slotRes.data;
        // Set cascading selections
        const machId = slot.machine_id || slot.machine;
        const compId = slot.component_id || slot.component;
        setSelectedMachine(String(machId));
        // Load components for this machine, then set the component
        const compRes = await machineAPI.getComponents(machId);
        setComponents(compRes.data.results || compRes.data);
        setSelectedComponent(String(compId));
        // Load slots
        const slotsRes = await toolSlotAPI.list({ machine: machId, component: compId });
        setToolSlots(slotsRes.data.results || slotsRes.data);
        setSelectedSlot(String(routerState.toolId));
        // Load BOM items
        const detailRes = await toolSlotAPI.get(routerState.toolId);
        setBomItems(detailRes.data.bom_items || []);
        setForm(p => ({
          ...p,
          tool: routerState.toolId,
          machine_name: slot.machine_id_code || slot.machine_name || '',
          component_name: slot.component_name || '',
          tool_number: slot.tool_number || '',
          tool_name: slot.tool_name || '',
        }));
        // Pre-select BOM
        if (routerState.bomId) {
          setSelectedBOM(String(routerState.bomId));
        }
      } catch {}
      setLoading(false);
    };
    prefill();
  }, [routerState.toolId, routerState.bomId, isEdit]);

  // Dropdown handlers
  const handleMachineChange = (val) => {
    setSelectedMachine(val);
    setSelectedComponent('');
    setSelectedSlot('');
    setSelectedBOM('');
    setBomItems([]);
    setExistingBOM(null);
    setBomCategory('');
    setForm(p => ({ ...p, tool: '', machine_name: '', component_name: '', tool_number: '', tool_name: '' }));
  };

  const handleComponentChange = (val) => {
    setSelectedComponent(val);
    setSelectedSlot('');
    setSelectedBOM('');
    setBomItems([]);
    setExistingBOM(null);
    setBomCategory('');
    setForm(p => ({ ...p, tool: '', machine_name: '', component_name: '', tool_number: '', tool_name: '' }));
  };

  const handleSlotChange = (val) => {
    setSelectedSlot(val);
    setSelectedBOM('');
    setExistingBOM(null);
    setBomCategory('');
  };

  const handleBOMChange = (val) => {
    setSelectedBOM(val);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ========== AUTO-CALCULATIONS (Tasks 2, 4, 5) ==========
  // RPM = (1000 * Vc) / (π * Diameter)
  // Feed (Vf) = RPM * fz * Number_of_inserts (or teeth)
  // Feed per rev (fr) = fz * Number_of_inserts
  // Total Tool Life = Cutting_Edges * Life_per_Corner
  useEffect(() => {
    const calc = {};
    // --- NEW side calculations ---
    const nVc = parseFloat(form.new_cutting_speed) || 0;
    const nDia = parseFloat(form.new_tool_diameter) || parseFloat(form.existing_tool_diameter) || 0;
    const nFz = parseFloat(form.new_feed_per_tooth) || 0;
    const nInserts = parseInt(form.new_no_of_inserts) || parseInt(form.new_cutting_edges) || 0;

    if (nVc > 0 && nDia > 0) {
      calc.new_rpm = String(Math.round((1000 * nVc) / (Math.PI * nDia)));
    }
    const nRPM = parseFloat(calc.new_rpm) || parseFloat(form.new_rpm) || 0;
    if (nFz > 0 && nInserts > 0) {
      calc.new_feed_per_rev = String((nFz * nInserts).toFixed(4));
    }
    if (nRPM > 0 && nFz > 0 && nInserts > 0) {
      calc.new_feed = String(Math.round(nRPM * nFz * nInserts));
    }

    // --- EXISTING side calculations ---
    const eVc = parseFloat(form.existing_cutting_speed) || 0;
    const eDia = parseFloat(form.existing_tool_diameter) || 0;
    const eFz = parseFloat(form.existing_feed_per_tooth) || 0;
    const eInserts = parseInt(form.existing_no_of_inserts) || parseInt(form.existing_cutting_edges) || 0;

    if (eVc > 0 && eDia > 0 && !form.existing_rpm) {
      calc.existing_rpm = String(Math.round((1000 * eVc) / (Math.PI * eDia)));
    }
    const eRPM = parseFloat(calc.existing_rpm) || parseFloat(form.existing_rpm) || 0;
    if (eFz > 0 && eInserts > 0 && !form.existing_feed_per_rev) {
      calc.existing_feed_per_rev = String((eFz * eInserts).toFixed(4));
    }
    if (eRPM > 0 && eFz > 0 && eInserts > 0 && !form.existing_feed) {
      calc.existing_feed = String(Math.round(eRPM * eFz * eInserts));
    }

    // --- Insert Life Calculation (Task 5) ---
    const nEdges = parseInt(form.new_cutting_edges) || 0;
    const nLifePerCorner = parseInt(form.new_avg_life_per_corner) || 0;
    if (nEdges > 0 && nLifePerCorner > 0) {
      calc.new_tool_life = String(nEdges * nLifePerCorner);
    }
    const eEdges = parseInt(form.existing_cutting_edges) || 0;
    const eLifePerCorner = parseInt(form.existing_avg_life_per_corner) || 0;
    if (eEdges > 0 && eLifePerCorner > 0 && !form.existing_tool_life) {
      calc.existing_tool_life = String(eEdges * eLifePerCorner);
    }

    // --- Cutting Time calculation ---
    // Cutting time (min) = Cutting Length / Feed rate (Vf)
    const nCutLen = parseFloat(form.new_cutting_length) || parseFloat(form.new_total_cutting_length) || 0;
    const nVf = parseFloat(calc.new_feed) || parseFloat(form.new_feed) || 0;
    if (nCutLen > 0 && nVf > 0) {
      const ctMin = nCutLen / nVf;
      calc.new_cutting_time_min = String(ctMin.toFixed(2));
      calc.new_cutting_time_sec = String(Math.round(ctMin * 60));
    }

    if (Object.keys(calc).length > 0) {
      setForm(prev => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(calc)) {
          // Only auto-fill new_ fields always; existing_ fields only if empty
          if (k.startsWith('new_') || !prev[k]) {
            next[k] = v;
          }
        }
        return next;
      });
    }
  }, [
    form.new_cutting_speed, form.new_tool_diameter, form.existing_tool_diameter,
    form.new_feed_per_tooth, form.new_no_of_inserts, form.new_cutting_edges,
    form.new_avg_life_per_corner, form.new_cutting_length, form.new_total_cutting_length,
    form.existing_cutting_speed, form.existing_tool_diameter, form.existing_feed_per_tooth,
    form.existing_no_of_inserts, form.existing_cutting_edges, form.existing_avg_life_per_corner,
    form.existing_rpm, form.existing_feed_per_rev, form.existing_feed, form.existing_tool_life,
  ]);

  const savings = () => {
    const ec = parseFloat(form.existing_overall_cost_per_component) || parseFloat(form.existing_cost_per_component) || 0;
    const nc = parseFloat(form.new_overall_cost_per_component) || parseFloat(form.new_cost_per_component) || 0;
    const qty = parseInt(form.target_quantity) || 0;
    const perComp = ec - nc;
    const monthly = perComp * qty;
    const reduction = ec > 0 ? ((perComp / ec) * 100).toFixed(1) : 0;
    return { perComp: perComp.toFixed(2), monthly: monthly.toFixed(2), reduction };
  };

  const handleSubmit = async () => {
    if (!form.tool) { toast.error('Please select a tool slot'); return; }
    if (!selectedBOM && !bomCategory) { toast.error('Please select a subassembly'); return; }

    // Clean payload: convert empty strings to null for numeric fields
    const payload = {};
    for (const [key, value] of Object.entries(form)) {
      if (value === '' || value === undefined) {
        payload[key] = null;
      } else {
        payload[key] = value;
      }
    }
    // CharField fields accept '' (blank) but NOT null
    const charFields = ['machine_name', 'component_name', 'tool_number', 'tool_name',
      'operation', 'customer', 'part_name', 'part_material',
      'existing_manufacturer', 'existing_insert_code', 'existing_coolant',
      'new_manufacturer', 'new_insert_code', 'new_coolant',
      'trial_result', 'conducted_by', 'approved_by', 'status', 'remarks', 'rejection_reason'];
    charFields.forEach(f => { if (payload[f] === null) payload[f] = ''; });

    const s = savings();
    payload.savings_per_component = parseFloat(s.perComp) || null;
    payload.monthly_savings = parseFloat(s.monthly) || null;
    payload.conducted_by = user?.username || 'operator';
    payload.status = 'DRAFT';

    try {
      if (isEdit) {
        await trialAPI.update(id, payload);
        toast.success('Trial updated');
      } else {
        await trialAPI.create(payload);
        toast.success('Trial created successfully');
      }
      navigate('/trials/running');
    } catch (err) {
      const errData = err.response?.data;
      let msg = 'Failed to save trial';
      if (errData) {
        if (errData.detail) msg = errData.detail;
        else if (typeof errData === 'object') {
          const firstErr = Object.entries(errData).find(([, v]) => v);
          if (firstErr) msg = `${firstErr[0]}: ${Array.isArray(firstErr[1]) ? firstErr[1][0] : firstErr[1]}`;
        }
      }
      toast.error(msg);
    }
  };

  const s = savings();
  const catConfig = CATEGORY_FIELDS[bomCategory];
  const sections = catConfig?.sections || (bomCategory ? DEFAULT_SECTIONS : {});
  const catLabel = catConfig?.label || bomCategory || 'Select Subassembly';

  // Find display names for selected items
  const selectedMachineObj = machines.find(m => String(m.id) === String(selectedMachine));
  const selectedComponentObj = components.find(c => String(c.id) === String(selectedComponent));

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800 mb-1">{isEdit ? 'Edit' : 'New'} Tool Trial Form</h1>
            <p className="text-sm text-slate-500">
              {bomCategory && <>Category: <span className="font-bold text-blue-600">{catLabel}</span></>}
              {existingBOM?.sku && <span className="ml-3 text-slate-400">SKU: {existingBOM.sku}</span>}
            </p>
          </div>
          {loading && <span className="text-xs text-blue-500 animate-pulse">Loading...</span>}
        </div>

        {/* Cascading Selection — Machine → Component → Tool → Subassembly */}
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            Select Tool &amp; Subassembly
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {/* Machine Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Machine Name *</label>
              <select value={selectedMachine} onChange={e => handleMachineChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none bg-white">
                <option value="">-- Select Machine --</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.machine_id} - {m.machine_name}</option>)}
              </select>
            </div>

            {/* Component Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Component Name *</label>
              <select value={selectedComponent} onChange={e => handleComponentChange(e.target.value)} disabled={!selectedMachine}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                <option value="">-- Select Component --</option>
                {components.map(c => <option key={c.id} value={c.id}>{c.component_name}{c.operation ? ` - ${c.operation}` : ''}</option>)}
              </select>
            </div>

            {/* Tool Number Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Tool No *</label>
              <select value={selectedSlot} onChange={e => handleSlotChange(e.target.value)} disabled={!selectedMachine}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                <option value="">-- Select Tool --</option>
                {toolSlots.map(t => <option key={t.id} value={t.id}>{t.tool_number} - {t.tool_name || t.category}</option>)}
              </select>
            </div>

            {/* Subassembly Dropdown */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">Subassembly *</label>
              <select value={selectedBOM} onChange={e => handleBOMChange(e.target.value)} disabled={bomItems.length === 0}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
                <option value="">-- Select Subassembly --</option>
                {bomItems.map(b => <option key={b.id} value={b.id}>{b.bom_type} {b.master_item_name ? `- ${b.master_item_name}` : ''} {b.sku ? `(${b.sku})` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Selection summary */}
          {form.tool && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-4 text-[10px]">
              <span className="text-blue-600 font-bold">SELECTED:</span>
              <span className="text-slate-600">Machine: <strong>{form.machine_name}</strong></span>
              <span className="text-slate-600">Component: <strong>{form.component_name}</strong></span>
              <span className="text-slate-600">Tool: <strong>{form.tool_number}</strong> — {form.tool_name}</span>
              {existingBOM && <span className="text-slate-600">BOM: <strong>{existingBOM.bom_type}</strong> {existingBOM.sku && `(${existingBOM.sku})`}</span>}
            </div>
          )}
        </div>

        {/* General Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Trial Information</h2>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Customer" value={form.customer} onChange={v => update('customer', v)} />
            <Field label="Trial Date" value={form.trial_date} onChange={v => update('trial_date', v)} type="date" />
            <Field label="Part Name" value={form.part_name} onChange={v => update('part_name', v)} />
            <Field label="Part Material" value={form.part_material} onChange={v => update('part_material', v)} />
            <Field label="Operation" value={form.operation} onChange={v => update('operation', v)} />
            <Field label="Target Qty/Month" value={form.target_quantity} onChange={v => update('target_quantity', v)} type="number" />
            <Field label="Spindle Speed" value={form.spindle_speed} onChange={v => update('spindle_speed', v)} type="number" />
          </div>
        </div>

        {/* Comparison Sections — only shows when a subassembly is selected */}
        {bomCategory && Object.keys(sections).length > 0 && (
          <>
            {Object.entries(sections).map(([sectionKey, rows]) => (
              rows && rows.length > 0 && (
                <div key={sectionKey} className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
                  <h2 className="text-sm font-bold text-slate-700 mb-1">
                    {SECTION_LABELS[sectionKey] || sectionKey}
                    <span className="ml-2 text-xs font-normal text-slate-400">— {catLabel}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 mb-3">Existing data is auto-populated from saved BOM detail (read-only). Enter new trial data on the right.</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-2 text-left text-slate-500 w-1/3">Parameter</th>
                        <th className="py-2 px-2 text-left text-blue-600 w-1/3">Existing (Saved Data)</th>
                        <th className="py-2 px-2 text-left text-green-600 w-1/3">New Trial Tool</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map(row => (
                        <CompRow
                          key={row.label}
                          label={row.label}
                          existing={form[row.eKey] || ''}
                          newVal={form[row.nKey] || ''}
                          onExisting={v => update(row.eKey, v)}
                          onNew={v => update(row.nKey, v)}
                          type={row.type}
                          select={row.select}
                          existingReadOnly
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))}

            {/* Savings Summary - computed from cost section */}
            {sections.cost && (
            <div className="bg-white rounded-xl border border-green-200 p-5 mb-4">
              <h2 className="text-sm font-bold text-green-700 mb-3">Savings / Component</h2>
              <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase">Savings/Component</p>
                  <p className={`text-lg font-bold ${parseFloat(s.perComp) > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{s.perComp}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase">Monthly Savings</p>
                  <p className={`text-lg font-bold ${parseFloat(s.monthly) > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{s.monthly}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase">CPC Reduction</p>
                  <p className={`text-lg font-bold ${parseFloat(s.reduction) > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.reduction}%</p>
                </div>
              </div>
            </div>
            )}

            {/* Insert Life Calculation Summary (Task 5) */}
            {(form.new_cutting_edges || form.existing_cutting_edges) && (
              <div className="bg-white rounded-xl border border-purple-200 p-5 mb-4">
                <h2 className="text-sm font-bold text-purple-700 mb-3">Insert Life Calculation</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase mb-2">Existing</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-slate-400">Edges:</span> <strong>{form.existing_cutting_edges || '—'}</strong></div>
                      <div><span className="text-slate-400">Life/Corner:</span> <strong>{form.existing_avg_life_per_corner || '—'}</strong></div>
                      <div><span className="text-slate-400">Total Life:</span> <strong className="text-blue-600">{form.existing_tool_life || '—'}</strong> comp</div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase mb-2">New Trial</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-slate-400">Edges:</span> <strong>{form.new_cutting_edges || '—'}</strong></div>
                      <div><span className="text-slate-400">Life/Corner:</span> <strong>{form.new_avg_life_per_corner || '—'}</strong></div>
                      <div><span className="text-slate-400">Total Life:</span> <strong className="text-green-600">{form.new_tool_life || '—'}</strong> comp</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* No subassembly selected message */}
        {!bomCategory && form.tool && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5 mb-4 text-center">
            <p className="text-sm text-yellow-700">Select a <strong>Subassembly</strong> above to see the comparison parameters</p>
          </div>
        )}

        {/* Savings Calculator - shown when no sections with cost, or as fallback */}
        {bomCategory && !sections.cost && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Savings Calculator</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Existing Cost/Component (₹)" value={form.existing_cost_per_component} readOnly />
            <Field label="New Cost/Component (₹)" value={form.new_cost_per_component} onChange={v => update('new_cost_per_component', v)} type="number" />
          </div>
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Savings/Component</p>
              <p className={`text-lg font-bold ${parseFloat(s.perComp) > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{s.perComp}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">Monthly Savings</p>
              <p className={`text-lg font-bold ${parseFloat(s.monthly) > 0 ? 'text-green-600' : 'text-red-600'}`}>₹{s.monthly}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase">CPC Reduction</p>
              <p className={`text-lg font-bold ${parseFloat(s.reduction) > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.reduction}%</p>
            </div>
          </div>
        </div>
        )}

        {/* Remarks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label className="block text-xs text-slate-500 mb-1">Remarks</label>
          <textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" rows={3} value={form.remarks} onChange={e => update('remarks', e.target.value)} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/trials/running')} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100">Discard</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            {isEdit ? 'Update Trial' : 'Submit Trial'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', readOnly }) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 mb-0.5">{label}</label>
      <input type={type} placeholder={placeholder} value={value || ''} readOnly={readOnly}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        className={`w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none ${readOnly ? 'bg-slate-100 text-slate-500 cursor-default' : ''}`} />
    </div>
  );
}

function CompRow({ label, existing, newVal, onExisting, onNew, type = 'text', select, existingReadOnly }) {
  const existingInput = (() => {
    if (select && existingReadOnly) {
      return <div className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-500">{existing || '—'}</div>;
    }
    if (existingReadOnly) {
      return <input type={type} value={existing || ''} readOnly className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-500 cursor-default" />;
    }
    if (select) {
      return (
        <select value={existing || ''} onChange={e => onExisting(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:border-blue-400 outline-none">
          <option value="">Select</option><option value="DRY">Dry</option><option value="FLOOD">Flood</option><option value="MIST">Mist</option><option value="MQL">MQL</option><option value="THROUGH_TOOL">Through Tool</option>
        </select>
      );
    }
    return <input type={type} value={existing || ''} onChange={e => onExisting(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:border-blue-400 outline-none" />;
  })();

  const newInput = select ? (
    <select value={newVal || ''} onChange={e => onNew(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:border-blue-400 outline-none">
      <option value="">Select</option><option value="DRY">Dry</option><option value="FLOOD">Flood</option><option value="MIST">Mist</option><option value="MQL">MQL</option><option value="THROUGH_TOOL">Through Tool</option>
    </select>
  ) : (
    <input type={type} value={newVal || ''} onChange={e => onNew(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:border-blue-400 outline-none" />
  );

  return (
    <tr>
      <td className="py-1.5 px-2 text-slate-600 font-medium">{label}</td>
      <td className="py-1.5 px-2">{existingInput}</td>
      <td className="py-1.5 px-2">{newInput}</td>
    </tr>
  );
}
