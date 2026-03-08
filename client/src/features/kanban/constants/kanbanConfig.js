export const STORE_TYPES = {
  KANBAN: 'KANBAN',
  SATELLITE: 'SATELLITE',
  CENTRAL: 'CENTRAL',
};

export const KANBAN_STATUS = {
  HEALTHY: 'HEALTHY',
  LOW: 'LOW',
  CRITICAL: 'CRITICAL',
  EMPTY: 'EMPTY',
  PENDING_REFILL: 'PENDING_REFILL',
};

export const KANBAN_THRESHOLDS = {
  designedDaysCover: 3,
  lowDaysCover: 1.8,
  criticalDaysCover: 0.75,
};

export const RECEIVE_SOURCE_TYPES = [
  { value: 'SATELLITE_STORE', label: 'Satellite Store' },
  { value: 'BLACK_STORE', label: 'Black Store' },
  { value: 'CENTRAL_STORE', label: 'Central Store' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'INITIAL_LOAD', label: 'Initial Load' },
];

export const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'Stock History' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'mapping', label: 'Future Refill Mapping' },
];

export const STATUS_META = {
  HEALTHY: {
    label: 'Healthy',
    chipClass: 'bg-green-500/15 text-green-300 border border-green-500/30',
    toneClass: 'text-green-300',
  },
  LOW: {
    label: 'Low',
    chipClass: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    toneClass: 'text-yellow-300',
  },
  CRITICAL: {
    label: 'Critical',
    chipClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
    toneClass: 'text-red-300',
  },
  EMPTY: {
    label: 'Empty',
    chipClass: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
    toneClass: 'text-slate-200',
  },
  PENDING_REFILL: {
    label: 'Pending Refill',
    chipClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    toneClass: 'text-cyan-300',
  },
};

export const INITIAL_KANBAN_FILTERS = {
  plant: '',
  shop: '',
  lineId: '',
  machineGroup: '',
  storeId: '',
  categoryId: '',
  search: '',
};
