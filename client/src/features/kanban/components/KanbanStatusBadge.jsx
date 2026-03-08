import React from 'react';
import { STATUS_META } from '../constants/kanbanConfig';

export default function KanbanStatusBadge({ status, compact = false }) {
  const meta = STATUS_META[status] || STATUS_META.HEALTHY;

  return (
    <span className={`${meta.chipClass} inline-flex items-center rounded-full font-semibold ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {meta.label}
    </span>
  );
}
