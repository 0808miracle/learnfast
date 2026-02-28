import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, ToggleLeft, Shield, GaugeCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Line,
  LineChart,
  ReferenceLine,
} from 'recharts';
import MathFormulaCard from './MathFormulaCard';

const gearFamilies = {
  ais: { label: 'AIS', interruptingKA: 31.5, mtbfYears: 18, arcRating: 25, capex: 1.0, maintenance: 1.1 },
  gis: { label: 'GIS', interruptingKA: 40, mtbfYears: 25, arcRating: 40, capex: 1.35, maintenance: 0.8 },
  mcc: { label: 'MCCB/ACB', interruptingKA: 65, mtbfYears: 15, arcRating: 50, capex: 0.9, maintenance: 1.2 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

function riskData(family, remoteRacking) {
  const safetyBoost = remoteRacking ? 8 : 0;
  return [
    { metric: 'Arc Safety', value: Math.min(100, family.arcRating + safetyBoost) },
    { metric: 'Reliability', value: Math.min(100, family.mtbfYears * 4) },
    { metric: 'Serviceability', value: family.label === 'GIS' ? 70 : 88 },
    { metric: 'Footprint', value: family.label === 'GIS' ? 92 : 72 },
    { metric: 'Lifecycle Cost', value: Math.max(40, 100 - family.capex * 24) },
  ];
}

function breakerDuty(interruptingKA, operationsPerYear) {
  return [1, 2, 3, 4, 5, 6].map((year) => ({
    year: `Y${year}`,
    wear: Number(((operationsPerYear * year) * (100 / interruptingKA) * 0.08).toFixed(1)),
  }));
}

function incidentEnergyTrend(faultCurrent, clearingMs) {
  return [100, 200, 300, 400, 500, 600].map((distance) => ({
    distance,
    energy: Number((((faultCurrent * clearingMs) / (distance ** 0.95)) * 0.27).toFixed(2)),
  }));
}

export default function SwitchgearsModule() {
  const [selectedKey, setSelectedKey] = useState('ais');
  const [faultCurrent, setFaultCurrent] = useState(22);
  const [clearingMs, setClearingMs] = useState(120);
  const [operationsPerYear, setOperationsPerYear] = useState(140);
  const [remoteRacking, setRemoteRacking] = useState(true);

  const selected = gearFamilies[selectedKey];
  const safeFaultCurrent = clamp(faultCurrent, 5, 80);
  const safeClearingMs = clamp(clearingMs, 20, 500);
  const safeOps = clamp(operationsPerYear, 10, 1500);

  const radar = useMemo(() => riskData(selected, remoteRacking), [selected, remoteRacking]);
  const duty = useMemo(() => breakerDuty(selected.interruptingKA, safeOps), [selected.interruptingKA, safeOps]);
  const incidentEnergy = useMemo(() => incidentEnergyTrend(safeFaultCurrent, safeClearingMs), [safeFaultCurrent, safeClearingMs]);

  const calc = useMemo(() => {
    const fit = safeFaultCurrent <= selected.interruptingKA;
    const utilization = (safeFaultCurrent / selected.interruptingKA) * 100;
    const maxWear = Math.max(...duty.map((d) => d.wear));
    const energyAt455 = incidentEnergy.find((row) => row.distance === 400)?.energy || 0;
    const ppeCategory = energyAt455 < 1.2 ? 'Category 1' : energyAt455 < 8 ? 'Category 2' : 'Category 3+';
    const health = Math.max(35, 100 - maxWear - (utilization > 90 ? 12 : 0));
    return { fit, utilization, maxWear, energyAt455, ppeCategory, health };
  }, [safeFaultCurrent, selected, duty, incidentEnergy]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Switchgears</h2>
        <p className="text-sm text-slate-400">Commercial-grade switchgear engineering module with interrupting checks, arc-energy analytics, and lifecycle wear tracking.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(gearFamilies).map(([key, item]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedKey(key)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedKey === key ? 'border-power bg-cyan-400/10 text-power' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <p className="font-semibold">{item.label}</p>
            <p className="text-xs text-slate-400">{item.interruptingKA} kA interrupting · MTBF {item.mtbfYears}y</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <h3 className="mb-3 font-semibold text-cyan-300"><ToggleLeft size={15} className="mr-1 inline" />Selection + Safety Console</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm text-slate-300">Fault Current (kA)
              <input type="number" min="5" max="80" value={safeFaultCurrent} onChange={(e) => setFaultCurrent(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Clearing Time (ms)
              <input type="number" min="20" max="500" value={safeClearingMs} onChange={(e) => setClearingMs(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Ops / Year
              <input type="number" min="10" max="1500" value={safeOps} onChange={(e) => setOperationsPerYear(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
              <input type="checkbox" checked={remoteRacking} onChange={(e) => setRemoteRacking(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Remote racking enabled
            </label>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm sm:grid-cols-2">
            <p>Interrupting Rating: <span className="text-cyan-300">{selected.interruptingKA} kA</span></p>
            <p>Utilization: <span className={calc.utilization > 90 ? 'text-warning' : 'text-emerald-300'}>{calc.utilization.toFixed(1)}%</span></p>
            <p>Suitability: <span className={calc.fit ? 'text-emerald-300' : 'text-fault'}>{calc.fit ? 'PASS' : 'FAIL - upgrade required'}</span></p>
            <p>Health Score: <span className="text-warning">{calc.health.toFixed(0)}/100</span></p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <MathFormulaCard title="Duty Utilization" formula="U% = I_fault / I_interrupting × 100" note="Keep U% below 90 for resilience margin." />
            <MathFormulaCard title="Incident Energy" formula="E ∝ I_fault × t_clear / D^x" note="D = working distance, x ~ 0.95 approximation." />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Switchgear Profile Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400"><Shield size={12} className="mr-1 inline text-emerald-300" />Remote racking safety uplift is included in Arc Safety metric.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><GaugeCircle size={14} className="mr-1 inline" />Breaker Duty Wear (6-year view)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={duty}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label="Refurbish band" />
                <Bar dataKey="wear" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><Flame size={14} className="mr-1 inline text-fault" />Arc Energy vs Working Distance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentEnergy}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="distance" stroke="#94a3b8" unit="mm" />
                <YAxis stroke="#94a3b8" unit="cal/cm²" />
                <Tooltip />
                <Line type="monotone" dataKey="energy" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-slate-400">Estimated PPE recommendation at 400mm: <span className="text-warning">{calc.ppeCategory}</span>.</motion.p>
        </div>
      </div>
    </section>
  );
}
