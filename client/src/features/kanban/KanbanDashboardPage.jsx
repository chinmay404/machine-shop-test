import React, { useState } from 'react';
import { ArrowPathIcon, BellAlertIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { INITIAL_KANBAN_FILTERS } from './constants/kanbanConfig';
import { mockAlertSeeds } from './data/mockAlerts';
import { kanbanTrendData } from './data/mockCharts';
import { mockCategories } from './data/mockCategories';
import { mockLineMappings } from './data/mockLineMappings';
import { mockReceipts } from './data/mockReceipts';
import { mockStockItems } from './data/mockStock';
import { mockStores } from './data/mockStores';
import { mockTransactions } from './data/mockTransactions';
import {
  buildFilterOptions,
  buildHealthAnalysis,
  buildKanbanAlerts,
  buildKanbanKpis,
  buildReplenishmentInsight,
  createReceiptDraft,
  enrichKanbanItems,
  filterKanbanItems,
  getItemReceipts,
  getItemTransactions,
  receiveMaterialLocally,
} from './utils/kanbanHelpers';
import KanbanAlertPanel from './components/KanbanAlertPanel';
import KanbanFilters from './components/KanbanFilters';
import KanbanHealthAnalysis from './components/KanbanHealthAnalysis';
import KanbanInsightCard from './components/KanbanInsightCard';
import KanbanItemDetailDrawer from './components/KanbanItemDetailDrawer';
import KanbanKpiCards from './components/KanbanKpiCards';
import ReceiveMaterialModal from './components/ReceiveMaterialModal';
import KanbanStockTrendChart from './components/KanbanStockTrendChart';
import KanbanSummaryTable from './components/KanbanSummaryTable';

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

function cloneRecords(records) {
  return records.map((record) => ({ ...record }));
}

export default function KanbanDashboardPage() {
  const [draftFilters, setDraftFilters] = useState(INITIAL_KANBAN_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_KANBAN_FILTERS);
  const [stockItems, setStockItems] = useState(() => cloneItems(mockStockItems));
  const [receipts, setReceipts] = useState(() => cloneRecords(mockReceipts));
  const [transactions, setTransactions] = useState(() => cloneRecords(mockTransactions));
  const [activeItemId, setActiveItemId] = useState(null);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState(() => createReceiptDraft(mockReceipts, mockStores));

  const enrichedItems = enrichKanbanItems(stockItems, mockStores, mockLineMappings, mockCategories);
  const filteredItems = filterKanbanItems(enrichedItems, appliedFilters);
  const filterOptions = buildFilterOptions(mockStores, mockLineMappings, enrichedItems, mockCategories);
  const kpiCards = buildKanbanKpis(filteredItems);
  const alerts = buildKanbanAlerts(filteredItems, mockAlertSeeds);
  const insight = buildReplenishmentInsight(filteredItems);
  const healthItems = buildHealthAnalysis(filteredItems, mockCategories);
  const activeItem = enrichedItems.find((item) => item.id === activeItemId) || null;
  const activeItemTransactions = activeItem ? getItemTransactions(transactions, activeItem) : [];
  const activeItemReceipts = activeItem ? getItemReceipts(receipts, activeItem) : [];
  const activeItemAlerts = activeItem ? alerts.filter((alert) => alert.itemId === activeItem.id) : [];

  const openReceiveModal = (itemId = null) => {
    const item = itemId ? enrichedItems.find((entry) => entry.id === itemId) : null;
    setReceiptDraft(createReceiptDraft(receipts, mockStores, item));
    setIsReceiveOpen(true);
  };

  const handleReceiveSubmit = (formValues) => {
    if (!formValues.skuCode || !formValues.storeId || !formValues.binId || Number(formValues.receivedQty || 0) <= 0) {
      toast.error('Select a valid item and enter a positive received quantity.');
      return;
    }

    const result = receiveMaterialLocally({
      items: stockItems,
      receipts,
      transactions,
      formValues,
    });

    if (!result.touchedItemId) {
      toast.error('Unable to map the receipt to a Kanban item.');
      return;
    }

    setStockItems(result.items);
    setReceipts(result.receipts);
    setTransactions(result.transactions);
    setActiveItemId(result.touchedItemId);
    setIsReceiveOpen(false);
    toast.success(`Receipt ${formValues.receiptId} posted locally.`);
  };

  const handleCreateRefill = (itemId = null) => {
    const item = itemId ? enrichedItems.find((entry) => entry.id === itemId) : null;
    toast(item
      ? `Phase 2 workflow: refill request for ${item.skuCode} will route to Satellite / Black Store.`
      : 'Phase 2 workflow: refill request routing will be connected to upstream stores.');
  };

  const handleViewAlerts = () => {
    const panel = document.getElementById('kanban-alert-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleResetSnapshot = () => {
    setDraftFilters(INITIAL_KANBAN_FILTERS);
    setAppliedFilters(INITIAL_KANBAN_FILTERS);
    setStockItems(cloneItems(mockStockItems));
    setReceipts(cloneRecords(mockReceipts));
    setTransactions(cloneRecords(mockTransactions));
    setActiveItemId(null);
    setIsReceiveOpen(false);
    toast.success('Kanban module reset to dummy snapshot.');
  };

  return (
    <div className="flex h-full flex-col bg-dark-900">
      <header className="border-b border-dark-500 bg-dark-800 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-400">Inventory Phase 1</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Kanban Store Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Line-side inventory monitoring, alerts, and replenishment readiness</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Dummy data only · API ready structure
            </span>
            <button onClick={handleViewAlerts} className="btn-outline flex items-center gap-2 px-4 py-2 text-xs">
              <BellAlertIcon className="h-4 w-4" />
              View Alerts
            </button>
            <button onClick={() => openReceiveModal()} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
              <InboxArrowDownIcon className="h-4 w-4" />
              Receive Material
            </button>
            <button onClick={handleResetSnapshot} className="btn-outline flex items-center gap-2 px-4 py-2 text-xs">
              <ArrowPathIcon className="h-4 w-4" />
              Reset Snapshot
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="space-y-6">
          <KanbanFilters
            draftFilters={draftFilters}
            options={filterOptions}
            onChange={(name, value) => setDraftFilters((current) => ({ ...current, [name]: value }))}
            onApply={() => setAppliedFilters(draftFilters)}
            onReset={() => {
              setDraftFilters(INITIAL_KANBAN_FILTERS);
              setAppliedFilters(INITIAL_KANBAN_FILTERS);
            }}
          />

          <KanbanKpiCards cards={kpiCards} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_380px]">
            <KanbanStockTrendChart trendData={kanbanTrendData} />
            <KanbanAlertPanel
              alerts={alerts}
              onOpenItem={setActiveItemId}
              onReceive={openReceiveModal}
            />
          </div>

          <KanbanSummaryTable
            items={filteredItems}
            onOpenItem={setActiveItemId}
            onReceive={openReceiveModal}
            onCreateRefill={handleCreateRefill}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
            <KanbanInsightCard
              insight={insight}
              onCreateRefill={handleCreateRefill}
              onReceiveMaterial={() => openReceiveModal()}
              onViewAlerts={handleViewAlerts}
            />
            <KanbanHealthAnalysis healthItems={healthItems} />
          </div>
        </div>
      </div>

      <KanbanItemDetailDrawer
        item={activeItem}
        alerts={activeItemAlerts}
        receipts={activeItemReceipts}
        transactions={activeItemTransactions}
        onClose={() => setActiveItemId(null)}
        onReceive={openReceiveModal}
      />

      <ReceiveMaterialModal
        isOpen={isReceiveOpen}
        initialValues={receiptDraft}
        stockItems={enrichedItems}
        stores={mockStores}
        onClose={() => setIsReceiveOpen(false)}
        onSubmit={handleReceiveSubmit}
      />
    </div>
  );
}
