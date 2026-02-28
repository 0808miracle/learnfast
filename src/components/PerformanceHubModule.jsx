import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useSimulation } from '../context';

const adoptionData = [
  { segment: 'Utilities', score: 88 },
  { segment: 'Oil & Gas', score: 82 },
  { segment: 'Data Centers', score: 93 },
  { segment: 'Manufacturing', score: 86 },
];

const COLORS = ['#22d3ee', '#34d399', '#fbbf24'];

export default function PerformanceHubModule({ modules }) {
  const { completedModules, learner } = useSimulation();

  const completionStats = useMemo(() => {
    const total = modules.length;
    const done = modules.filter((module) => completedModules[module]).length;
    return {
      total,
      done,
      percent: Math.round((done / total) * 100),
      pie: [
        { name: 'Completed', value: done },
        { name: 'Pending', value: total - done },
      ],
    };
  }, [modules, completedModules]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Performance Hub</h2>
        <p className="text-sm text-slate-400">Training analytics, adoption forecasting, and engagement metrics.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Learner</p>
          <p className="mt-2 text-xl font-semibold text-cyan-300">{learner.name}</p>
          <p className="text-sm text-slate-400">Track: {learner.track}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Completion</p>
          <p className="mt-2 text-xl font-semibold text-emerald-300">{completionStats.percent}%</p>
          <p className="text-sm text-slate-400">{completionStats.done}/{completionStats.total} modules completed</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Learning Streak</p>
          <p className="mt-2 text-xl font-semibold text-warning">{learner.streakDays} days</p>
          <p className="text-sm text-slate-400">Consistency benchmark: Top 15%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Industry Adoption Forecast</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={adoptionData}>
              <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
              <XAxis dataKey="segment" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" unit="%" />
              <Tooltip />
              <Bar dataKey="score" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Program Progress</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={completionStats.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {completionStats.pie.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
