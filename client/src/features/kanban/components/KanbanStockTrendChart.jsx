import React from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function KanbanStockTrendChart({ trendData }) {
  const data = {
    labels: trendData.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Issues',
        data: trendData.issues,
        backgroundColor: 'rgba(239, 68, 68, 0.24)',
        borderRadius: 6,
        barThickness: 12,
        order: 2,
      },
      {
        type: 'bar',
        label: 'Receipts',
        data: trendData.receipts,
        backgroundColor: 'rgba(34, 197, 94, 0.22)',
        borderRadius: 6,
        barThickness: 12,
        order: 2,
      },
      {
        type: 'line',
        label: 'Daily Consumption',
        data: trendData.consumption,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        yAxisID: 'y',
        order: 1,
      },
      {
        type: 'line',
        label: 'Projected Stock Trend',
        data: trendData.projectedStock,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        fill: true,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 3,
        yAxisID: 'y1',
        order: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#07111f',
        borderColor: '#1f3048',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(51, 65, 85, 0.35)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
    },
  };

  return (
    <section className="card-dark h-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Trend Snapshot</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Kanban stock trend, daily consumption, and issue vs receive profile</h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[10px] font-medium text-slate-400">Dummy weekly trend</span>
      </div>
      <div className="mt-6 h-[320px]">
        <Line data={data} options={options} />
      </div>
    </section>
  );
}
