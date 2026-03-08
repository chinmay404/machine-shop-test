import React from 'react';
import KanbanStatusBadge from './KanbanStatusBadge';

export default function KanbanSummaryTable({ items, onOpenItem, onReceive, onCreateRefill }) {
  return (
    <section className="card-dark overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Operational Summary</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Line-wise and bin-wise Kanban stock summary</h3>
        </div>
        <p className="text-xs text-slate-400">Click any row to open full Kanban detail, alerts, receipts, and future refill mapping.</p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1220px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <th className="px-3 py-3 text-left">Kanban Store / Bin</th>
              <th className="px-3 py-3 text-left">Line / Group</th>
              <th className="px-3 py-3 text-left">SKU Code</th>
              <th className="px-3 py-3 text-left">Item Name</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-right">Current Stock</th>
              <th className="px-3 py-3 text-right">Min Stock</th>
              <th className="px-3 py-3 text-right">Max Stock</th>
              <th className="px-3 py-3 text-right">3-Day Target</th>
              <th className="px-3 py-3 text-right">Days Cover</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Next Action</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-16 text-center text-sm text-slate-500">No Kanban items match the selected filters.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onOpenItem(item.id)}
                  className="cursor-pointer border-b border-slate-900/80 text-xs text-slate-300 transition hover:bg-slate-900/50"
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold text-white">{item.store?.code}</p>
                    <p className="text-slate-500">{item.binId}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{item.line?.lineName}</p>
                    <p className="text-slate-500">{item.line?.machineGroup}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-cyan-300">{item.skuCode}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-100">{item.itemName}</p>
                    <p className="text-slate-500">{item.rackLocation}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-400">{item.category?.name || item.categoryId}</td>
                  <td className="px-3 py-3 text-right font-semibold text-white">{item.currentStock}</td>
                  <td className="px-3 py-3 text-right text-slate-400">{item.minStock}</td>
                  <td className="px-3 py-3 text-right text-slate-400">{item.maxStock}</td>
                  <td className="px-3 py-3 text-right text-slate-400">{item.targetStock}</td>
                  <td className="px-3 py-3 text-right font-medium text-slate-200">{item.daysCover}</td>
                  <td className="px-3 py-3"><KanbanStatusBadge status={item.status} compact /></td>
                  <td className="px-3 py-3 text-slate-300">{item.nextAction}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onReceive(item.id);
                        }}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700"
                      >
                        Receive
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onCreateRefill(item.id);
                        }}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                      >
                        {item.status === 'HEALTHY' ? 'Monitor' : 'Refill'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
