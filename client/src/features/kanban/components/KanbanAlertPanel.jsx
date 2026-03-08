import React from 'react';
import { ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import KanbanStatusBadge from './KanbanStatusBadge';

export default function KanbanAlertPanel({ alerts, onOpenItem, onReceive }) {
  return (
    <section id="kanban-alert-panel" className="card-dark h-full min-h-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400">Alert Rail</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Required soon</h3>
        </div>
        <div className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-semibold text-rose-300">
          {alerts.length} active alerts
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-6 text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-white">No active alerts in the filtered Kanban view</p>
            <p className="mt-2 text-xs text-slate-400">Adjust filters or receive material to simulate alert movement.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => onOpenItem(alert.itemId)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <KanbanStatusBadge status={alert.status} compact />
                    <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{alert.alertType.replace(/_/g, ' ')}</span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-white">{alert.skuCode}</h4>
                  <p className="text-xs text-slate-400">{alert.itemName}</p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-slate-500" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Store / Bin</p>
                  <p className="mt-1 text-slate-200">{alert.storeName}</p>
                  <p className="text-slate-400">{alert.binId}</p>
                </div>
                <div>
                  <p className="text-slate-500">Current / Min</p>
                  <p className="mt-1 text-slate-200">{alert.currentQty} / {alert.minQty}</p>
                </div>
                <div>
                  <p className="text-slate-500">Days Cover</p>
                  <p className="mt-1 text-slate-200">{alert.daysCover}</p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">{alert.note}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onReceive(alert.itemId);
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  {alert.actionLabel}
                </button>
                <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-400">Open details</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
