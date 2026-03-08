import React from 'react';

export default function KanbanHealthAnalysis({ healthItems }) {
  return (
    <section className="card-dark">
      <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Category Health Analysis</p>
      <h3 className="mt-1 text-sm font-semibold text-white">Healthy stock ratio by tooling category</h3>

      <div className="mt-6 space-y-4">
        {healthItems.map((category) => (
          <div key={category.id}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-100">{category.name}</p>
                <p className="text-xs text-slate-500">{category.healthyCount} healthy out of {category.total || 0} monitored items</p>
              </div>
              <span className="text-sm font-semibold text-white">{category.percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-900">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${category.percentage}%`, backgroundColor: category.accent }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
