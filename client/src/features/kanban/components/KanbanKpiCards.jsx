import React from 'react';
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
  ShieldExclamationIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const iconMap = {
  active: Squares2X2Icon,
  healthy: CheckCircleIcon,
  low: ExclamationTriangleIcon,
  critical: ShieldExclamationIcon,
  pending: InboxArrowDownIcon,
  refill: ArrowTrendingUpIcon,
};

const accentMap = {
  cyan: 'from-cyan-400/30 to-cyan-500/10 text-cyan-300 border-cyan-400/20',
  green: 'from-emerald-400/30 to-emerald-500/10 text-emerald-300 border-emerald-400/20',
  amber: 'from-amber-400/30 to-amber-500/10 text-amber-300 border-amber-400/20',
  red: 'from-rose-400/30 to-rose-500/10 text-rose-300 border-rose-400/20',
  violet: 'from-violet-400/30 to-violet-500/10 text-violet-300 border-violet-400/20',
  orange: 'from-orange-400/30 to-orange-500/10 text-orange-300 border-orange-400/20',
};

export default function KanbanKpiCards({ cards }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = iconMap[card.id] || Squares2X2Icon;
        const accentClass = accentMap[card.accent] || accentMap.cyan;

        return (
          <div key={card.id} className={`card-dark overflow-hidden border ${accentClass}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
              </div>
              <div className="rounded-xl bg-slate-950/50 p-2 text-slate-200">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-400">{card.meta}</p>
              <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${accentClass.split(' ').slice(0, 2).join(' ')}`} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
