import React, { useState, useEffect, useCallback } from 'react';
import { masterAPI, bomAPI, subassemblyAPI } from '../services/api';
import toast from 'react-hot-toast';

const BOM_TYPES = [
  { value: 'PULLSTUD', label: 'Pullstud' },
  { value: 'ADAPTOR', label: 'Adaptor' },
  { value: 'TOOL', label: 'Tool' },
  { value: 'INSERT', label: 'Insert' },
  { value: 'CARTRIDGE', label: 'Cartridge' },
  { value: 'MBU', label: 'MBU' },
  { value: 'BORING_HEAD', label: 'Boring Head / Boring Bar' },
  { value: 'COLLET', label: 'Collet' },
  { value: 'INSERT_SCREW', label: 'Insert Screw' },
  { value: 'SCREW', label: 'Screw' },
  { value: 'MIDDLE_EXTENSION', label: 'Middle Extension' },
];

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
  MILLING_CUTTER: { TOOL: 'Cutting Tool' },
  DRILL: { TOOL: 'Cutting Tool' },
  ENDMILL: { TOOL: 'Cutting Tool' },
  TAP: { TOOL: 'Cutting Tool' },
  THREADMILL: { TOOL: 'Cutting Tool' },
  REAMERS: { TOOL: 'Cutting Tool' },
  SPECIAL_DRILL: { TOOL: 'Cutting Tool' },
  SPECIAL_TOOL: { TOOL: 'Cutting Tool' },
  BORING_BAR: { BORING_HEAD: 'Boring Head' },
};

// Category-specific shape fields for TOOL (Cutting Tool)
const TOOL_SHAPE_BY_CATEGORY = {
  MILLING_CUTTER: [
    { key: 'tool_diameter', label: 'Cutter Diameter', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Teeth', type: 'number', int: true },
    { key: 'cutting_length', label: 'Cutting Length', type: 'number' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'holder_type', label: 'Holder Type', type: 'text' },
  ],
  DRILL: [
    { key: 'tool_diameter', label: 'Drill Diameter', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
    { key: 'flute_length', label: 'Flute Length', type: 'number' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'point_angle', label: 'Point Angle (°)', type: 'number' },
    { key: 'shank_diameter', label: 'Shank Diameter', type: 'number' },
  ],
  ENDMILL: [
    { key: 'tool_diameter', label: 'Endmill Diameter', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
    { key: 'cutting_length', label: 'Cutting Length', type: 'number' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'helix_angle', label: 'Helix Angle (°)', type: 'number' },
    { key: 'shank_diameter', label: 'Shank Diameter', type: 'number' },
  ],
  TAP: [
    { key: 'tool_diameter', label: 'Tap Diameter', type: 'number' },
    { key: 'pitch', label: 'Pitch', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
    { key: 'thread_type', label: 'Thread Type', type: 'text' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'shank_diameter', label: 'Shank Diameter', type: 'number' },
  ],
  THREADMILL: [
    { key: 'tool_diameter', label: 'Tool Diameter', type: 'number' },
    { key: 'pitch', label: 'Pitch', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
    { key: 'cutting_length', label: 'Cutting Length', type: 'number' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'shank_diameter', label: 'Shank Diameter', type: 'number' },
  ],
  REAMERS: [
    { key: 'tool_diameter', label: 'Reamer Diameter', type: 'number' },
    { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
    { key: 'cutting_length', label: 'Cutting Length', type: 'number' },
    { key: 'overall_length', label: 'Overall Length', type: 'number' },
    { key: 'shank_diameter', label: 'Shank Diameter', type: 'number' },
  ],
};

// Default TOOL shape fields (fallback)
const DEFAULT_TOOL_SHAPE = [
  { key: 'tool_diameter', label: 'Tool Diameter', type: 'number' },
  { key: 'number_of_flutes', label: 'Number of Flutes', type: 'number', int: true },
  { key: 'cutting_length', label: 'Cutting Length', type: 'number' },
  { key: 'overall_length', label: 'Overall Length', type: 'number' },
  { key: 'holder_type', label: 'Holder Type', type: 'text' },
];

const TOOL_PARAMS = [
  { key: 'vc', label: 'Vc (m/min)', type: 'number' },
  { key: 'rpm', label: 'RPM', type: 'number' },
  { key: 'feed', label: 'Feed (mm/min)', type: 'number' },
  { key: 'feed_per_tooth', label: 'Feed Per Tooth', type: 'number' },
];

const TOOL_OTHER = [
  { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
  { key: 'rate', label: 'Tool Rate (₹)', type: 'number' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
];

// Trial / Operating Data fields — stored in other_data.trial_data
const TRIAL_DATA_FIELDS = [
  { key: 'grade', label: 'Grade', type: 'text' },
  { key: 'feed_per_rev', label: 'Feed, fr (mm/rev)', type: 'number' },
  { key: 'depth_of_cut', label: 'Depth of Cut, ap (mm)', type: 'number' },
  { key: 'no_of_passes', label: 'No. of Passes', type: 'number', int: true },
  { key: 'coolant', label: 'Coolant', type: 'select' },
  { key: 'cutting_length', label: 'Cutting Length (mm)', type: 'number' },
  { key: 'total_cutting_length', label: 'Total Cutting Length (mm)', type: 'number' },
  { key: 'cutting_time_min', label: 'Cutting Time (min)', type: 'number' },
  { key: 'cutting_time_sec', label: 'Cutting Time (sec)', type: 'number' },
  { key: 'tool_life_components', label: 'Tool Life (Components)', type: 'number', int: true },
  { key: 'tool_life_m', label: 'Tool Life (m)', type: 'number' },
  { key: 'surface_finish', label: 'Surface Finish', type: 'text' },
  { key: 'wear', label: 'Wear', type: 'text' },
  { key: 'chip_control', label: 'Chip Control', type: 'text' },
  { key: 'test_result', label: 'Test Result', type: 'text' },
  { key: 'total_insert_cost', label: 'Total Insert Cost (₹)', type: 'number' },
  { key: 'avg_life_per_corner', label: 'Avg Life Per Corner', type: 'number' },
  { key: 'cost_per_component', label: 'Cost/Component (Insert) ₹', type: 'number' },
  { key: 'tool_cost_per_component', label: 'Cost/Component (Tool) ₹', type: 'number' },
  { key: 'overall_cost_per_component', label: 'Cost/Component (Overall) ₹', type: 'number' },
];

// Dynamic form field definitions per category
const FIELD_DEFS = {
  PULLSTUD: {
    shape: [
      { key: 'thread_size', label: 'Thread Size', type: 'text' },
      { key: 'standard', label: 'Standard', type: 'text' },
      { key: 'compatible_machine', label: 'Compatible Machine', type: 'text' },
    ],
  },
  ADAPTOR: {
    shape: [
      { key: 'taper', label: 'Taper', type: 'text' },
      { key: 'adaptor_diameter', label: 'Adaptor Diameter', type: 'number' },
      { key: 'gauge_length_gpl', label: 'Gauge Length (GPL)', type: 'number' },
      { key: 'minor_diameter', label: 'Minor Diameter', type: 'number' },
      { key: 'major_diameter', label: 'Major Diameter', type: 'number' },
      { key: 'make', label: 'Make', type: 'text' },
    ],
  },
  // TOOL is built dynamically — see getToolFieldDefs()
  TOOL: null,
  INSERT: {
    shape: [
      { key: 'insert_shape', label: 'Insert Shape', type: 'text' },
      { key: 'size_diameter', label: 'Size / Diameter', type: 'number' },
      { key: 'number_of_cutting_edges', label: 'Number of Cutting Edges', type: 'number', int: true },
      { key: 'corner_radius', label: 'Corner Radius', type: 'number' },
      { key: 'grade', label: 'Grade', type: 'text' },
    ],
    life: [
      { key: 'life_per_edge', label: 'Life Per Edge', type: 'number', int: true },
      { key: 'overall_life', label: 'Overall Life (auto)', type: 'number', auto: true },
    ],
    params: [
      { key: 'vc', label: 'Vc (m/min)', type: 'number' },
      { key: 'rpm', label: 'RPM', type: 'number' },
      { key: 'feed', label: 'Feed (mm/min)', type: 'number' },
      { key: 'feed_per_tooth', label: 'Feed Per Tooth', type: 'number' },
    ],
    insert: [
      { key: 'insert_name', label: 'Insert Name / Code', type: 'text', masterType: 'INSERT' },
      { key: 'insert_qty', label: 'No. of Inserts', type: 'number', int: true },
      { key: 'insert_rate', label: 'Insert Rate (₹)', type: 'number' },
      { key: 'insert_life', label: 'Insert Life (pcs)', type: 'number', int: true },
      { key: 'components_per_life', label: 'Components Per Life', type: 'number', int: true },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'cpc', label: 'CPC (Cost per Component)', type: 'number', auto: true },
      { key: 'overall_cpc', label: 'Overall CPC', type: 'number', auto: true },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  CARTRIDGE: {
    shape: [
      { key: 'cartridge_type', label: 'Cartridge Type', type: 'text' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'material', label: 'Material', type: 'text' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  MBU: {
    shape: [
      { key: 'mbu_type', label: 'MBU Type', type: 'text' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'range', label: 'Range', type: 'text' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  BORING_HEAD: {
    shape: [
      { key: 'boring_range_min', label: 'Boring Range Min', type: 'number' },
      { key: 'boring_range_max', label: 'Boring Range Max', type: 'number' },
      { key: 'shank_type', label: 'Shank Type', type: 'text' },
      { key: 'connection_type', label: 'Connection Type', type: 'text' },
    ],
    params: [
      { key: 'vc', label: 'Vc (m/min)', type: 'number' },
      { key: 'rpm', label: 'RPM', type: 'number' },
      { key: 'feed', label: 'Feed (mm/min)', type: 'number' },
      { key: 'feed_per_tooth', label: 'Feed Per Tooth', type: 'number' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Tool Rate (₹)', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  COLLET: {
    shape: [
      { key: 'collet_type', label: 'Collet Type', type: 'text' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'clamping_range', label: 'Clamping Range', type: 'text' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  INSERT_SCREW: {
    shape: [
      { key: 'screw_size', label: 'Screw Size', type: 'text' },
      { key: 'thread_type', label: 'Thread Type', type: 'text' },
      { key: 'length', label: 'Length', type: 'number' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  SCREW: {
    shape: [
      { key: 'screw_size', label: 'Screw Size', type: 'text' },
      { key: 'thread_type', label: 'Thread Type', type: 'text' },
      { key: 'length', label: 'Length', type: 'number' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
  MIDDLE_EXTENSION: {
    shape: [
      { key: 'extension_type', label: 'Extension Type', type: 'text' },
      { key: 'length', label: 'Length', type: 'number' },
      { key: 'diameter', label: 'Diameter', type: 'number' },
      { key: 'connection_type', label: 'Connection Type', type: 'text' },
    ],
    other: [
      { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
    ],
  },
};

export default function AddBOMModal({ toolId, toolNumber, toolCategory, existingTypes = [], onClose, onSaved }) {
  const [step, setStep] = useState(1); // 1=category, 2=dynamic fields
  const [bomType, setBomType] = useState('');
  const [subType, setSubType] = useState('');
  const [masterItem, setMasterItem] = useState('');
  const [masters, setMasters] = useState([]);
  const [drawing, setDrawing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [shapeData, setShapeData] = useState({});
  const [lifeData, setLifeData] = useState({});
  const [paramData, setParamData] = useState({});
  const [otherData, setOtherData] = useState({});
  const [insertFieldData, setInsertFieldData] = useState({});
  const [wiperInsertData, setWiperInsertData] = useState({});
  const [trialData, setTrialData] = useState({});
  const [showTrialData, setShowTrialData] = useState(false);
  const [saving, setSaving] = useState(false);

  // Milling cutter TOOL gets Insert + Wiper Insert sections
  const isMillingCutterTool = toolCategory === 'MILLING_CUTTER' && bomType === 'TOOL';

  const allowedBomValues = (toolCategory && CATEGORY_BOM_MAP[toolCategory]) || BOM_TYPES.map(t => t.value);
  const labelOverrides = (toolCategory && CATEGORY_LABEL_OVERRIDES[toolCategory]) || {};
  const availableTypes = BOM_TYPES
    .filter(t => allowedBomValues.includes(t.value))
    .filter(t => !existingTypes.includes(t.value))
    .map(t => ({ ...t, label: labelOverrides[t.value] || t.label }));

  useEffect(() => {
    masterAPI.list({ page_size: 300 }).then(r => setMasters(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (availableTypes.length && !bomType) setBomType(availableTypes[0].value);
  }, [availableTypes.length]);

  // Filter masters by selected BOM type
  const filteredMasters = masters.filter(m => {
    const typeMap = { PULLSTUD: 'PULLSTUD', ADAPTOR: 'ADAPTOR', TOOL: 'CUTTING_TOOL', INSERT: 'INSERT', CARTRIDGE: 'CUTTING_TOOL', MBU: 'CUTTING_TOOL', BORING_HEAD: 'CUTTING_TOOL' };
    return m.master_type === typeMap[bomType] || m.master_type === bomType;
  });

  // Auto-calculate RPM, Feed, Overall Life
  const autoCalc = useCallback(async () => {
    const calcData = { ...shapeData, ...paramData, ...lifeData };
    const vc = parseFloat(calcData.vc) || 0;
    const toolDia = parseFloat(calcData.tool_diameter || calcData.size_diameter) || 0;
    const fz = parseFloat(calcData.feed_per_tooth) || 0;
    const z = parseInt(calcData.number_of_flutes) || 0;

    // Client-side RPM and Feed calculation
    if (vc > 0 && toolDia > 0) {
      const rpm = Math.round((1000 * vc) / (Math.PI * toolDia));
      const feed = (rpm && fz > 0 && z > 0) ? Math.round(rpm * fz * z * 10000) / 10000 : paramData.feed;
      setParamData(p => ({ ...p, rpm: rpm, feed: feed || p.feed }));
    }

    // Client-side overall_life calc for Insert
    if (bomType === 'INSERT' && lifeData.life_per_edge && shapeData.number_of_cutting_edges) {
      setLifeData(p => ({ ...p, overall_life: Number(p.life_per_edge) * Number(shapeData.number_of_cutting_edges) }));
    }

    // CPC calculation for INSERT category
    if (bomType === 'INSERT' && insertFieldData) {
      const insertRate = parseFloat(insertFieldData.insert_rate) || 0;
      const insertQty = parseInt(insertFieldData.insert_qty) || 0;
      const insertLife = parseInt(insertFieldData.insert_life) || 0;
      const compsPerLife = parseInt(insertFieldData.components_per_life) || 0;
      const toolRate = parseFloat(otherData.rate) || 0;
      if (compsPerLife > 0) {
        const insertCPC = insertQty > 0 && insertLife > 0 ? (insertRate * insertQty) / (insertLife * compsPerLife) : 0;
        const toolCPC = toolRate > 0 ? toolRate / compsPerLife : 0;
        const overallCPC = toolCPC + insertCPC;
        setOtherData(p => ({
          ...p,
          cpc: Math.round(insertCPC * 100) / 100,
          overall_cpc: Math.round(overallCPC * 100) / 100,
        }));
      }
    }

    // Combined CPC for Milling Cutter TOOL (insert + wiper insert)
    if (isMillingCutterTool) {
      const compsPerLife = parseInt(insertFieldData.components_per_life || wiperInsertData.components_per_life) || 0;
      // Insert CPC
      const iRate = parseFloat(insertFieldData.insert_rate) || 0;
      const iQty = parseInt(insertFieldData.insert_qty) || 0;
      const iLife = parseInt(insertFieldData.insert_life) || 0;
      const insertCPC = (iQty > 0 && iLife > 0 && compsPerLife > 0) ? (iRate * iQty) / (iLife * compsPerLife) : 0;
      // Wiper Insert CPC
      const wRate = parseFloat(wiperInsertData.wiper_insert_rate) || 0;
      const wQty = parseInt(wiperInsertData.wiper_insert_qty) || 0;
      const wLife = parseInt(wiperInsertData.wiper_insert_life) || 0;
      const wiperCPC = (wQty > 0 && wLife > 0 && compsPerLife > 0) ? (wRate * wQty) / (wLife * compsPerLife) : 0;
      // For milling cutter: Overall CPC = Insert CPC + Wiper CPC
      const overallCPC = insertCPC + wiperCPC;
      setOtherData(p => ({
        ...p,
        insert_cpc: Math.round(insertCPC * 100) / 100,
        wiper_cpc: Math.round(wiperCPC * 100) / 100,
        overall_cpc: Math.round(overallCPC * 100) / 100,
      }));
    }

    // Also try server-side for additional calculations
    if (vc > 0 && toolDia > 0) {
      try {
        const res = await subassemblyAPI.calculateParams(calcData);
        if (res.data.rpm) setParamData(p => ({ ...p, rpm: res.data.rpm, feed: res.data.feed || p.feed }));
        if (res.data.overall_life) setLifeData(p => ({ ...p, overall_life: res.data.overall_life }));
      } catch {}
    }
  }, [shapeData, paramData, lifeData.life_per_edge, lifeData.vc, bomType, insertFieldData, wiperInsertData, otherData.rate, isMillingCutterTool]);

  const handleCalc = () => autoCalc();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!bomType) { toast.error('Select a category'); return; }
    setSaving(true);
    try {
      // Step 1: Create BOM item
      const bomPayload = {
        tool: toolId,
        bom_type: bomType,
        master_item: masterItem || null,
        quantity: quantity,
        description: `${bomType} for ${toolNumber || 'tool'}`,
      };
      const res = await bomAPI.create(bomPayload);
      const bomId = res.data.id;

      // Step 2: Save dynamic form data
      const detailPayload = {};
      if (Object.keys(shapeData).length) detailPayload.shape_data = shapeData;
      if (Object.keys(lifeData).length) detailPayload.life_data = lifeData;
      if (Object.keys(paramData).length) detailPayload.parameter_data = paramData;
      const combinedOther = { ...otherData };
      if (Object.keys(insertFieldData).length) {
        Object.assign(combinedOther, insertFieldData);
      }
      if (Object.keys(wiperInsertData).length) {
        Object.assign(combinedOther, wiperInsertData);
      }
      if (Object.keys(trialData).length) {
        combinedOther.trial_data = trialData;
      }
      if (Object.keys(combinedOther).length) detailPayload.other_data = combinedOther;
      if (subType) detailPayload.cutting_tool_type = subType;

      if (Object.keys(detailPayload).length) {
        await bomAPI.saveDetail(bomId, detailPayload);
      }

      // Step 3: Upload drawing if provided
      if (drawing) {
        const fd = new FormData();
        fd.append('drawing', drawing);
        // Use the tool-level BOM upload if available
      }

      toast.success(`${bomType} subassembly added (SKU auto-generated)`);
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to add subassembly');
    } finally {
      setSaving(false);
    }
  };

  // Build dynamic TOOL field defs based on tool category
  const getToolFieldDefs = () => ({
    shape: TOOL_SHAPE_BY_CATEGORY[toolCategory] || DEFAULT_TOOL_SHAPE,
    params: TOOL_PARAMS,
    other: TOOL_OTHER,
  });

  const fieldDefs = bomType === 'TOOL' ? getToolFieldDefs() : (FIELD_DEFS[bomType] || {});

  const insertMasters = masters.filter(m => m.master_type === 'INSERT');

  const renderFields = (fields, data, setData) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-[9px] text-gray-500 uppercase block mb-0.5">{f.label}</label>
          {f.masterType === 'INSERT' ? (
            <select className="input-dark text-xs py-1 w-full" value={data[f.key] || ''} onChange={e => setData(p => ({ ...p, [f.key]: e.target.value }))}>
              <option value="">— Select Insert —</option>
              {insertMasters.map(m => <option key={m.id} value={m.name || m.code}>{m.code} — {m.name}</option>)}
            </select>
          ) : f.type === 'select' ? (
            <select className="input-dark text-xs py-1 w-full" value={data[f.key] || ''} onChange={e => setData(p => ({ ...p, [f.key]: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="DRY">Dry</option><option value="FLOOD">Flood</option><option value="MIST">Mist</option><option value="MQL">MQL</option><option value="THROUGH_TOOL">Through Tool</option>
            </select>
          ) : (
            <input
              type={f.type === 'select' ? 'text' : f.type}
              step={f.type === 'number' ? (f.int ? '1' : '0.01') : undefined}
              className={`input-dark text-xs py-1 w-full ${f.auto ? 'bg-dark-600 text-accent-green font-mono' : ''}`}
              readOnly={f.auto}
              value={data[f.key] || ''}
              onChange={e => setData(p => ({ ...p, [f.key]: e.target.value }))}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSave} className="bg-dark-700 rounded-xl border border-dark-500 w-full max-w-lg p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-200">Add Subassembly</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
        </div>

        {availableTypes.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">All subassembly types assigned.</p>
        ) : (
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">Category <span className="text-accent-red">*</span></label>
              <select className="select-dark text-xs py-1.5 w-full" value={bomType} onChange={e => { setBomType(e.target.value); setShapeData({}); setLifeData({}); setParamData({}); setOtherData({}); setInsertFieldData({}); setWiperInsertData({}); setTrialData({}); setShowTrialData(false); setSubType(''); }}>
                {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Subcategory indicator for Cutting Tool */}
            {bomType === 'TOOL' && toolCategory && (
              <div>
                <label className="text-[9px] text-gray-500 uppercase block mb-1">Tool Subcategory</label>
                <div className="input-dark text-xs py-1.5 w-full bg-dark-600 text-accent-cyan font-bold">
                  {toolCategory.replace(/_/g, ' ')}
                </div>
              </div>
            )}

            {/* System Name from Master Data */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">System Name (Master Data)</label>
              <select className="select-dark text-xs py-1.5 w-full" value={masterItem} onChange={e => setMasterItem(e.target.value)}>
                <option value="">— Select from master —</option>
                {filteredMasters.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
              </select>
            </div>

            {/* SKU Preview */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">SKU (Auto Generated)</label>
              <div className="input-dark text-xs py-1.5 w-full bg-dark-600 text-accent-green font-mono">
                Will be generated on save
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">Quantity</label>
              <input type="number" min="1" step="1" className="input-dark text-xs py-1.5 w-full" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>

            {/* Drawing Upload */}
            <div>
              <label className="text-[9px] text-gray-500 uppercase block mb-1">Drawing Upload (Optional)</label>
              <input type="file" accept="image/*,.pdf,.dwg" className="text-xs text-gray-400" onChange={e => setDrawing(e.target.files?.[0] || null)} />
            </div>

            {/* Dynamic Shape Fields */}
            {fieldDefs.shape && fieldDefs.shape.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-dark-500 pb-1">
                  {bomType === 'TOOL' && toolCategory ? `${toolCategory.replace(/_/g, ' ')} — Shape Data` : 'Shape Data'}
                </h4>
                {renderFields(fieldDefs.shape, shapeData, setShapeData)}
              </div>
            )}

            {/* Dynamic Life Fields (Insert) */}
            {fieldDefs.life && fieldDefs.life.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-dark-500 pb-1">Life Data</h4>
                {renderFields(fieldDefs.life, lifeData, setLifeData)}
              </div>
            )}

            {/* Parameter Fields */}
            {fieldDefs.params && fieldDefs.params.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-dark-500 pb-1">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parameters</h4>
                  <button type="button" onClick={handleCalc} className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-colors">
                    CALC
                  </button>
                </div>
                {renderFields(fieldDefs.params, paramData, setParamData)}
                <p className="text-[8px] text-gray-600 mt-1">RPM = (1000 × Vc) / (π × Diameter) • Feed = RPM × Feed/tooth × Flutes</p>
              </div>
            )}

            {/* Insert Data Fields (for INSERT category) */}
            {fieldDefs.insert && fieldDefs.insert.length > 0 && !isMillingCutterTool && (
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-dark-500 pb-1">
                  <h4 className="text-[10px] font-bold text-accent-orange uppercase tracking-wider">Insert Data</h4>
                  <button type="button" onClick={handleCalc} className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-orange/20 text-accent-orange hover:bg-accent-orange/30 transition-colors">
                    CALC CPC
                  </button>
                </div>
                {renderFields(fieldDefs.insert, insertFieldData, setInsertFieldData)}
                <p className="text-[8px] text-gray-600 mt-1">CPC = (Insert Rate × Insert Qty) / (Insert Life × Components/Life) • Overall CPC = Tool CPC + Insert CPC</p>
              </div>
            )}

            {/* Milling Cutter: Insert + Wiper Insert sections */}
            {isMillingCutterTool && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-accent-orange/30 pb-1">
                    <h4 className="text-[10px] font-bold text-accent-orange uppercase tracking-wider">Insert Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { key: 'insert_name', label: 'Insert Name / Code', type: 'text', masterType: 'INSERT' },
                      { key: 'insert_qty', label: 'No. of Inserts', type: 'number', int: true },
                      { key: 'insert_rate', label: 'Insert Rate (₹)', type: 'number' },
                      { key: 'insert_life', label: 'Insert Life (pcs)', type: 'number', int: true },
                      { key: 'insert_edges', label: 'No. of Cutting Edges', type: 'number', int: true },
                      { key: 'components_per_life', label: 'Components Per Life', type: 'number', int: true },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] text-gray-500 uppercase block mb-0.5">{f.label}</label>
                        {f.masterType === 'INSERT' ? (
                          <select className="input-dark text-xs py-1 w-full" value={insertFieldData[f.key] || ''} onChange={e => setInsertFieldData(p => ({ ...p, [f.key]: e.target.value }))}>
                            <option value="">— Select Insert —</option>
                            {insertMasters.map(m => <option key={m.id} value={m.name || m.code}>{m.code} — {m.name}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} step={f.type === 'number' ? (f.int ? '1' : '0.01') : undefined}
                            className="input-dark text-xs py-1 w-full"
                            value={insertFieldData[f.key] || ''}
                            onChange={e => setInsertFieldData(p => ({ ...p, [f.key]: e.target.value }))} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-yellow-500/30 pb-1">
                    <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Wiper Insert Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { key: 'wiper_insert_name', label: 'Wiper Insert Name / Code', type: 'text', masterType: 'INSERT' },
                      { key: 'wiper_insert_qty', label: 'No. of Wiper Inserts', type: 'number', int: true },
                      { key: 'wiper_insert_rate', label: 'Wiper Insert Rate (₹)', type: 'number' },
                      { key: 'wiper_insert_life', label: 'Wiper Insert Life (pcs)', type: 'number', int: true },
                      { key: 'wiper_insert_edges', label: 'No. of Cutting Edges', type: 'number', int: true },
                      { key: 'wiper_components_per_life', label: 'Components Per Life', type: 'number', int: true },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] text-gray-500 uppercase block mb-0.5">{f.label}</label>
                        {f.masterType === 'INSERT' ? (
                          <select className="input-dark text-xs py-1 w-full" value={wiperInsertData[f.key] || ''} onChange={e => setWiperInsertData(p => ({ ...p, [f.key]: e.target.value }))}>
                            <option value="">— Select Insert —</option>
                            {insertMasters.map(m => <option key={m.id} value={m.name || m.code}>{m.code} — {m.name}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} step={f.type === 'number' ? (f.int ? '1' : '0.01') : undefined}
                            className="input-dark text-xs py-1 w-full"
                            value={wiperInsertData[f.key] || ''}
                            onChange={e => setWiperInsertData(p => ({ ...p, [f.key]: e.target.value }))} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-dark-500 pb-1">
                    <h4 className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider">Combined CPC</h4>
                    <button type="button" onClick={handleCalc} className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors">
                      CALC CPC
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-0.5">Insert CPC (₹)</label>
                      <input type="number" readOnly className="input-dark text-xs py-1 w-full bg-dark-600 text-accent-green font-mono" value={otherData.insert_cpc || ''} />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-0.5">Wiper CPC (₹)</label>
                      <input type="number" readOnly className="input-dark text-xs py-1 w-full bg-dark-600 text-accent-green font-mono" value={otherData.wiper_cpc || ''} />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase block mb-0.5">Overall CPC (Insert + Wiper) (₹)</label>
                      <input type="number" readOnly className="input-dark text-xs py-1 w-full bg-dark-600 text-accent-green font-mono" value={otherData.overall_cpc || ''} />
                    </div>
                  </div>
                  <p className="text-[8px] text-gray-600 mt-1">Insert CPC = (Rate × Qty) / (Life × Comps/Life) • Overall CPC = Insert CPC + Wiper CPC</p>
                </div>
              </>
            )}

            {/* Other Specifications */}
            {fieldDefs.other && fieldDefs.other.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-dark-500 pb-1">Other Specifications</h4>
                {renderFields(fieldDefs.other, otherData, setOtherData)}
              </div>
            )}

            {/* Trial / Operating Data — stored in other_data.trial_data */}
            {['TOOL', 'INSERT', 'BORING_HEAD'].includes(bomType) && (
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-purple-500/30 pb-1 cursor-pointer" onClick={() => setShowTrialData(v => !v)}>
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Trial / Operating Data (Optional)</h4>
                  <span className="text-purple-400 text-xs">{showTrialData ? '▾' : '▸'}</span>
                </div>
                {showTrialData && renderFields(TRIAL_DATA_FIELDS, trialData, setTrialData)}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-dark-500">
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 border border-dark-500 hover:border-dark-400 transition-colors">
            Cancel
          </button>
          {availableTypes.length > 0 && (
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded text-xs font-bold bg-accent-green text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save Subassembly'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
