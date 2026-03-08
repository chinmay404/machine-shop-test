import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DETAIL_TABS } from '../constants/kanbanConfig';
import KanbanStatusBadge from './KanbanStatusBadge';

function DetailMetric({ label, value, accent = false }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${accent ? 'text-cyan-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function KanbanItemDetailDrawer({ item, alerts, receipts, transactions, onClose, onReceive }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <button className="flex-1" aria-label="Close item drawer" onClick={onClose} />
      <aside className="h-full w-full max-w-3xl overflow-y-auto border-l border-slate-800 bg-[#07111f] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Kanban Item Detail</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{item.itemName}</h3>
            <p className="mt-2 text-sm text-slate-400">{item.skuCode} · {item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <KanbanStatusBadge status={item.status} />
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.store?.name}</span>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{item.line?.lineName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onReceive(item.id)} className="btn-primary px-4 py-2 text-xs">Receive Material</button>
            <button onClick={onClose} className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:text-white">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailMetric label="Current Stock" value={`${item.currentStock} ${item.uom}`} accent />
              <DetailMetric label="Reserved Stock" value={`${item.reservedStock} ${item.uom}`} />
              <DetailMetric label="Available Stock" value={`${item.availableStock} ${item.uom}`} />
              <DetailMetric label="Days Cover" value={`${item.daysCover} days`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Store Mapping</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailMetric label="Kanban Store" value={item.store?.name || item.storeId} />
                  <DetailMetric label="Bin / Rack" value={`${item.binId} · ${item.rackLocation}`} />
                  <DetailMetric label="Linked Line" value={item.line?.lineName || item.lineId} />
                  <DetailMetric label="Machine Group" value={item.line?.machineGroup || '-'} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Stock Policy</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailMetric label="Min Stock" value={`${item.minStock} ${item.uom}`} />
                  <DetailMetric label="Max Stock" value={`${item.maxStock} ${item.uom}`} />
                  <DetailMetric label="3-Day Target" value={`${item.targetStock} ${item.uom}`} />
                  <DetailMetric label="Reorder Point" value={`${item.reorderPoint} ${item.uom}`} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Movement Snapshot</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DetailMetric label="Last Received" value={`${item.lastReceivedQty || 0} ${item.uom} · ${item.lastReceivedAt ? item.lastReceivedAt.slice(0, 10) : '-'}`} />
                  <DetailMetric label="Last Issued" value={`${item.lastIssuedQty || 0} ${item.uom} · ${item.lastIssuedAt ? item.lastIssuedAt.slice(0, 10) : '-'}`} />
                  <DetailMetric label="Avg Daily Consumption" value={`${item.avgDailyConsumption} ${item.uom} / day`} />
                  <DetailMetric label="Pending Receipt" value={`${item.pendingReceiptQty || 0} ${item.uom}`} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Future Refill Source</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p><span className="text-slate-500">Primary:</span> {item.futureRefillSource.replace(/_/g, ' ')}</p>
                  <p><span className="text-slate-500">Backup:</span> {item.backupRefillSource.replace(/_/g, ' ')}</p>
                  <p><span className="text-slate-500">Escalation:</span> {item.centralRefillSource.replace(/_/g, ' ')}</p>
                  <p><span className="text-slate-500">Remarks:</span> {item.remarks || 'No additional remarks.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date / Time</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-900 text-xs text-slate-300">
                    <td className="px-4 py-3">{transaction.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{transaction.occurredAt.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3 text-right">{transaction.qty} {transaction.uom}</td>
                    <td className="px-4 py-3">{transaction.sourceType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{transaction.referenceNumber || '-'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No transactions for this item yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <DetailMetric label="Critical Threshold" value={`${item.criticalThreshold} ${item.uom}`} />
              <DetailMetric label="Reorder Point" value={`${item.reorderPoint} ${item.uom}`} />
              <DetailMetric label="Current Status" value={item.status.replace(/_/g, ' ')} accent />
            </div>

            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-12 text-center text-sm text-slate-500">No item-specific alerts in the current view.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{alert.alertType.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-xs text-slate-400">{alert.note}</p>
                    </div>
                    <KanbanStatusBadge status={alert.status} compact />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 text-left">Receipt ID</th>
                  <th className="px-4 py-3 text-left">Received At</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Received By</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-slate-900 text-xs text-slate-300">
                    <td className="px-4 py-3 font-mono text-cyan-300">{receipt.id}</td>
                    <td className="px-4 py-3">{receipt.receivedAt.replace('T', ' ').slice(0, 16)}</td>
                    <td className="px-4 py-3 text-right">{receipt.receivedQty} {receipt.uom}</td>
                    <td className="px-4 py-3">{receipt.sourceType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{receipt.receivedBy}</td>
                  </tr>
                ))}
                {receipts.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No receipt records for this item yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
            <p className="text-sm leading-6 text-slate-300">This frontend-only phase keeps the data model ready for future Kanban to Satellite, Black Store, and Central Store replenishment workflows.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <DetailMetric label="Primary Refill Source" value={item.futureRefillSource.replace(/_/g, ' ')} accent />
              <DetailMetric label="Backup Source" value={item.backupRefillSource.replace(/_/g, ' ')} />
              <DetailMetric label="Central Escalation" value={item.centralRefillSource.replace(/_/g, ' ')} />
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs leading-6 text-cyan-100">
              Future phases can plug in transfer requests, approval flows, inter-store visibility, and movement history without changing this drawer structure.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
