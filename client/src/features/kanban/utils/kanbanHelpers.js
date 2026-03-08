import {
  INITIAL_KANBAN_FILTERS,
  KANBAN_STATUS,
  KANBAN_THRESHOLDS,
} from '../constants/kanbanConfig';

const statusPriority = {
  EMPTY: 5,
  CRITICAL: 4,
  PENDING_REFILL: 3,
  LOW: 2,
  HEALTHY: 1,
};

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calculateAvailableStock(item) {
  return Math.max(0, Number(item.currentStock || 0) - Number(item.reservedStock || 0));
}

export function calculateDaysCover(item) {
  const availableStock = calculateAvailableStock(item);
  const dailyUse = Number(item.avgDailyConsumption || 0);
  if (dailyUse <= 0) return KANBAN_THRESHOLDS.designedDaysCover;
  return round(availableStock / dailyUse, 2);
}

export function resolveKanbanStatus(item) {
  const availableStock = calculateAvailableStock(item);
  const daysCover = calculateDaysCover(item);

  if (availableStock <= 0) return KANBAN_STATUS.EMPTY;
  if (availableStock <= Number(item.criticalThreshold || 0) || daysCover <= KANBAN_THRESHOLDS.criticalDaysCover) {
    return KANBAN_STATUS.CRITICAL;
  }
  if (Number(item.pendingReceiptQty || 0) > 0) {
    return KANBAN_STATUS.PENDING_REFILL;
  }
  if (
    availableStock <= Number(item.minStock || 0) ||
    availableStock <= Number(item.reorderPoint || 0) ||
    availableStock < Number(item.targetStock || 0) ||
    daysCover <= KANBAN_THRESHOLDS.lowDaysCover
  ) {
    return KANBAN_STATUS.LOW;
  }
  return KANBAN_STATUS.HEALTHY;
}

export function resolveNextAction(item, status) {
  if (status === KANBAN_STATUS.EMPTY) return 'Urgent Refill';
  if (status === KANBAN_STATUS.CRITICAL) return 'Refill Today';
  if (status === KANBAN_STATUS.PENDING_REFILL) return 'Receive Pending';
  if (status === KANBAN_STATUS.LOW) return 'Monitor';
  if (calculateDaysCover(item) <= 1.2) return 'Review Shift';
  return 'Monitor';
}

export function enrichKanbanItems(stockItems, stores, lineMappings, categories = []) {
  const storeById = Object.fromEntries(stores.map((store) => [store.id, store]));
  const lineById = Object.fromEntries(lineMappings.map((line) => [line.id, line]));
  const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));

  return stockItems.map((item) => {
    const store = storeById[item.storeId] || null;
    const line = lineById[item.lineId] || null;
    const category = categoryById[item.categoryId] || null;
    const availableStock = calculateAvailableStock(item);
    const daysCover = calculateDaysCover(item);
    const status = resolveKanbanStatus(item);

    return {
      ...item,
      store,
      line,
      category,
      availableStock,
      daysCover,
      status,
      nextAction: resolveNextAction(item, status),
      refillRequiredToday: daysCover <= 1 || status === KANBAN_STATUS.CRITICAL || status === KANBAN_STATUS.EMPTY,
      belowReorderThreshold: availableStock <= Number(item.reorderPoint || 0),
    };
  });
}

export function filterKanbanItems(items, filters = INITIAL_KANBAN_FILTERS) {
  const query = String(filters.search || '').trim().toLowerCase();

  return items.filter((item) => {
    if (filters.plant && item.store?.plant !== filters.plant) return false;
    if (filters.shop && item.store?.shop !== filters.shop) return false;
    if (filters.lineId && item.lineId !== filters.lineId) return false;
    if (filters.machineGroup && item.line?.machineGroup !== filters.machineGroup) return false;
    if (filters.storeId && item.storeId !== filters.storeId) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (query) {
      const haystack = [
        item.skuCode,
        item.itemName,
        item.description,
        item.binId,
        item.store?.name,
        item.line?.lineName,
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function buildFilterOptions(stores, lineMappings, items, categories) {
  const plants = [...new Set(stores.map((store) => store.plant))];
  const shops = [...new Set(stores.map((store) => store.shop))];
  const machineGroups = [...new Set(lineMappings.map((line) => line.machineGroup))];
  const lineOptions = lineMappings.map((line) => ({ value: line.id, label: line.lineName }));
  const storeOptions = stores.map((store) => ({ value: store.id, label: `${store.name} / ${store.zone}` }));
  const skuOptions = items.map((item) => ({ value: item.skuCode, label: `${item.skuCode} - ${item.itemName}` }));

  return {
    plants,
    shops,
    machineGroups,
    lineOptions,
    storeOptions,
    skuOptions,
    categories,
  };
}

export function buildKanbanKpis(items) {
  const statusCounts = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const refillRequiredToday = items.filter((item) => item.refillRequiredToday).length;
  const pendingReceipts = items.filter((item) => Number(item.pendingReceiptQty || 0) > 0).length;
  const healthyShare = items.length ? Math.round(((statusCounts.HEALTHY || 0) / items.length) * 100) : 0;
  const criticalBucket = (statusCounts.CRITICAL || 0) + (statusCounts.EMPTY || 0);

  return [
    { id: 'active', label: 'Total Active Kanban SKUs', value: items.length, accent: 'cyan', meta: `${new Set(items.map((item) => item.storeId)).size} stores monitored` },
    { id: 'healthy', label: 'Healthy Stock Items', value: statusCounts.HEALTHY || 0, accent: 'green', meta: `${healthyShare}% of filtered SKUs stable` },
    { id: 'low', label: 'Low Stock Items', value: statusCounts.LOW || 0, accent: 'amber', meta: `${items.filter((item) => item.belowReorderThreshold).length} below reorder threshold` },
    { id: 'critical', label: 'Critical / Stockout Risk', value: criticalBucket, accent: 'red', meta: `${statusCounts.EMPTY || 0} empty bins included` },
    { id: 'pending', label: 'Pending Receipts', value: pendingReceipts, accent: 'violet', meta: `${items.reduce((sum, item) => sum + Number(item.pendingReceiptQty || 0), 0)} qty in transit` },
    { id: 'refill', label: 'Refill Required Today', value: refillRequiredToday, accent: 'orange', meta: 'Prioritized by 1 day cover logic' },
  ];
}

export function buildKanbanAlerts(items, alertSeeds = []) {
  const seedBySku = Object.fromEntries(alertSeeds.map((seed) => [seed.skuCode, seed]));

  return items
    .filter((item) => item.status !== KANBAN_STATUS.HEALTHY || item.refillRequiredToday || item.belowReorderThreshold)
    .map((item) => {
      const seed = seedBySku[item.skuCode];
      let alertType = 'LOW_STOCK';
      if (item.status === KANBAN_STATUS.EMPTY) alertType = 'EMPTY';
      else if (item.status === KANBAN_STATUS.CRITICAL) alertType = 'CRITICAL';
      else if (item.status === KANBAN_STATUS.PENDING_REFILL) alertType = 'PENDING_REFILL';
      else if (item.refillRequiredToday) alertType = 'TODAY_REFILL';
      else if (item.belowReorderThreshold) alertType = 'REORDER_THRESHOLD';

      return {
        id: `ALERT-${item.id}`,
        itemId: item.id,
        skuCode: item.skuCode,
        itemName: item.itemName,
        storeName: item.store?.name || item.storeId,
        binId: item.binId,
        currentQty: item.currentStock,
        minQty: item.minStock,
        daysCover: item.daysCover,
        status: item.status,
        alertType,
        actionLabel: item.status === KANBAN_STATUS.PENDING_REFILL ? 'Receive' : 'Review',
        note: seed?.note || item.remarks || 'Kanban threshold triggered from frontend alert engine.',
      };
    })
    .sort((left, right) => {
      const priorityDiff = statusPriority[right.status] - statusPriority[left.status];
      if (priorityDiff !== 0) return priorityDiff;
      return left.daysCover - right.daysCover;
    })
    .slice(0, 8);
}

export function buildReplenishmentInsight(items) {
  const atRiskItems = items
    .filter((item) => item.daysCover <= 3 || item.status !== KANBAN_STATUS.HEALTHY)
    .sort((left, right) => left.daysCover - right.daysCover)
    .slice(0, 4);

  const projectedShortages = atRiskItems.filter((item) => item.daysCover <= 1.5 || item.status === KANBAN_STATUS.EMPTY).length;

  return {
    projectedShortages,
    atRiskItems,
    headline: projectedShortages
      ? `Based on current daily draw, ${projectedShortages} SKU${projectedShortages > 1 ? 's may' : ' may'} slip below 1-day cover before next shift close.`
      : 'Filtered Kanban stock is stable for the next 3-day coverage window.',
    recommendation: projectedShortages
      ? 'Create refill requests now to keep line-side coverage stable while future Satellite Store workflows are still manual.'
      : 'Continue monitoring current usage and keep pending receipts closed before tomorrow shift handover.',
  };
}

export function buildHealthAnalysis(items, categories) {
  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.categoryId === category.id);
    const healthyCount = categoryItems.filter((item) => item.status === KANBAN_STATUS.HEALTHY).length;
    const percentage = categoryItems.length ? Math.round((healthyCount / categoryItems.length) * 100) : 0;

    return {
      ...category,
      total: categoryItems.length,
      healthyCount,
      percentage,
    };
  });
}

export function buildReceiptId(receipts, at = new Date()) {
  const stamp = at.toISOString().slice(0, 10).replace(/-/g, '');
  const next = String(receipts.length + 1).padStart(3, '0');
  return `RCV-${stamp}-${next}`;
}

export function createReceiptDraft(receipts, stores, item = null) {
  const timestamp = new Date().toISOString().slice(0, 16);
  const primaryStore = item?.storeId || stores[0]?.id || '';

  return {
    receiptId: buildReceiptId(receipts),
    receivedAt: timestamp,
    storeId: primaryStore,
    binId: item?.binId || '',
    sourceType: item?.pendingReceiptQty ? item.futureRefillSource : 'SATELLITE_STORE',
    sourceReferenceNumber: '',
    skuCode: item?.skuCode || '',
    itemName: item?.itemName || '',
    receivedQty: item?.pendingReceiptQty || '',
    uom: item?.uom || 'pcs',
    batchLot: '',
    remarks: '',
    receivedBy: 'Kanban Operator',
  };
}

export function receiveMaterialLocally({ items, receipts, transactions, formValues }) {
  const quantity = Number(formValues.receivedQty || 0);
  const matchedItem = items.find(
    (item) =>
      item.skuCode === formValues.skuCode &&
      item.storeId === formValues.storeId &&
      item.binId === formValues.binId
  ) || items.find((item) => item.skuCode === formValues.skuCode && item.storeId === formValues.storeId);

  if (!matchedItem || quantity <= 0) {
    return { items, receipts, transactions, touchedItemId: null };
  }

  const updatedItems = items.map((item) => {
    if (item.id !== matchedItem.id) return item;

    return {
      ...item,
      currentStock: Number(item.currentStock || 0) + quantity,
      pendingReceiptQty: Math.max(0, Number(item.pendingReceiptQty || 0) - quantity),
      lastReceivedQty: quantity,
      lastReceivedAt: formValues.receivedAt,
      remarks: formValues.remarks || item.remarks,
    };
  });

  const newReceipt = {
    id: formValues.receiptId,
    receivedAt: formValues.receivedAt,
    storeId: formValues.storeId,
    binId: formValues.binId,
    sourceType: formValues.sourceType,
    sourceReferenceNumber: formValues.sourceReferenceNumber,
    skuCode: formValues.skuCode,
    itemName: formValues.itemName,
    receivedQty: quantity,
    uom: formValues.uom,
    batchLot: formValues.batchLot,
    remarks: formValues.remarks,
    receivedBy: formValues.receivedBy,
  };

  const newTransaction = {
    id: `TXN-${String(transactions.length + 1).padStart(3, '0')}`,
    stockItemId: matchedItem.id,
    skuCode: matchedItem.skuCode,
    type: 'RECEIVE',
    qty: quantity,
    uom: formValues.uom,
    occurredAt: formValues.receivedAt,
    storeId: formValues.storeId,
    binId: formValues.binId,
    sourceType: formValues.sourceType,
    referenceNumber: formValues.sourceReferenceNumber,
    remarks: formValues.remarks || 'Material received through Kanban frontend flow.',
  };

  return {
    items: updatedItems,
    receipts: [newReceipt, ...receipts],
    transactions: [newTransaction, ...transactions],
    touchedItemId: matchedItem.id,
  };
}

export function getItemTransactions(transactions, item) {
  return transactions
    .filter((transaction) => transaction.stockItemId === item?.id || transaction.skuCode === item?.skuCode)
    .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt));
}

export function getItemReceipts(receipts, item) {
  return receipts
    .filter((receipt) => receipt.skuCode === item?.skuCode)
    .sort((left, right) => new Date(right.receivedAt) - new Date(left.receivedAt));
}
