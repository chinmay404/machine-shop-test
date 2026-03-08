import React from 'react';

export default function KanbanInsightCard({ insight, onCreateRefill, onReceiveMaterial, onViewAlerts }) {
  return (
    <section className="card-dark relative overflow-hidden">
      <div className="absolute bottom-0 right-0 translate-x-6 translate-y-6 text-[160px] font-black leading-none text-slate-900/60">/</div>
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400">Predictive Replenishment Insight</p>
        <h3 className="mt-1 text-sm font-semibold text-white">1 to 3 day shortage forecast</h3>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{insight.headline}</p>
        <p className="mt-3 text-xs leading-5 text-slate-400">{insight.recommendation}</p>

        <div className="mt-5 space-y-3">
          {insight.atRiskItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{item.itemName}</p>
                <p className="text-xs text-slate-400">{item.skuCode} · {item.store?.code} · {item.line?.lineName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-300">{item.daysCover} day cover</p>
                <p className="text-xs text-slate-400">Next action: {item.nextAction}</p>
              </div>
            </div>
          ))}
          {insight.atRiskItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500">
              No shortage risk in the currently filtered Kanban dataset.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={onCreateRefill} className="btn-danger px-4 py-2 text-xs">Create Refill Request</button>
          <button onClick={onReceiveMaterial} className="btn-outline px-4 py-2 text-xs">Receive Material</button>
          <button onClick={onViewAlerts} className="btn-outline px-4 py-2 text-xs">View Alerts</button>
        </div>
      </div>
    </section>
  );
}
