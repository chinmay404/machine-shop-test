import React, { useState, useEffect } from 'react';
import { planningAPI, machineAPI } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function PlanningDashboard() {
  const [summary, setSummary] = useState({});
  const [planningData, setPlanningData] = useState([]);
  const [machines, setMachines] = useState([]);
  const [filterMachine, setFilterMachine] = useState('');

  useEffect(() => {
    planningAPI.getSummary().then(r => setSummary(r.data)).catch(() => {});
    planningAPI.list().then(r => setPlanningData(r.data.results || r.data)).catch(() => {});
    machineAPI.list().then(r => setMachines(r.data.results || r.data)).catch(() => {});
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Tool Consumption',
      data: [12, 19, 14, 22, 18, 25],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#2a2a3a' }, ticks: { color: '#6b7280', font: { size: 10 } } },
      y: { grid: { color: '#2a2a3a' }, ticks: { color: '#6b7280', font: { size: 10 } } },
    },
  };

  const filtered = filterMachine ? planningData.filter(p => String(p.machine) === filterMachine) : planningData;

  return (
    <div className="flex flex-col h-full bg-dark-900">
      <header className="px-6 py-4 border-b border-dark-500 bg-dark-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Consumable Planning</h1>
        <select className="select-dark text-sm" value={filterMachine} onChange={e => setFilterMachine(e.target.value)}>
          <option value="">All Machines</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.machine_id}</option>)}
        </select>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Active Tools" value={summary.active_tools || 0} color="cyan" />
          <StatCard label="Required Soon" value={summary.required_soon || 0} color="orange" />
          <StatCard label="Avg Tool Life" value={summary.avg_tool_life || 0} color="green" />
          <StatCard label="Predicted Stock Out" value="—" color="red" />
        </div>

        {/* Chart */}
        <div className="card" style={{ height: 250 }}>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Tool Consumption Trends</h3>
          <div style={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Planning Table */}
        <div className="card">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Planning Data</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase border-b border-dark-500">
                <th className="py-2 px-2 text-left">Machine</th>
                <th className="py-2 px-2 text-left">Component</th>
                <th className="py-2 px-2 text-left">Tool</th>
                <th className="py-2 px-2 text-left">Production Qty</th>
                <th className="py-2 px-2 text-left">Tools Required</th>
                <th className="py-2 px-2 text-left">Inserts Required</th>
                <th className="py-2 px-2 text-left">Est. Cost</th>
                <th className="py-2 px-2 text-left">Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-dark-600/30">
                  <td className="py-2 px-2 text-gray-300">{p.machine_name}</td>
                  <td className="py-2 px-2 text-gray-400">{p.component_name}</td>
                  <td className="py-2 px-2 text-accent-cyan">{p.tool_number} {p.tool_name}</td>
                  <td className="py-2 px-2 text-gray-300 font-mono">{p.production_qty}</td>
                  <td className="py-2 px-2 text-gray-300 font-mono">{p.tools_required}</td>
                  <td className="py-2 px-2 text-gray-300 font-mono">{p.inserts_required}</td>
                  <td className="py-2 px-2 text-accent-green font-mono">{p.estimated_cost ? `₹${Number(p.estimated_cost).toLocaleString()}` : '—'}</td>
                  <td className="py-2 px-2 text-gray-500">{p.month}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-600">No planning data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card-dark">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold text-accent-${color} mt-1 font-mono`}>{value}</p>
    </div>
  );
}
