import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShieldAlert, TowerControl, Sigma, Activity } from 'lucide-react';

const topologies = {
  npc: {
    label: '3L-NPC',
    voltage: 3.3,
    note: 'Neutral point clamped topology with balanced semiconductor stress.',
    switchingHz: 1050,
    baseThd: [4.8, 3.9, 3.2, 2.8, 2.5, 2.1],
    capexIndex: 1.0,
    reliability: 0.94,
  },
  chb: {
    label: 'CHB',
    voltage: 6.6,
    note: 'Cascaded H-bridge with excellent waveform and modular cell architecture.',
    switchingHz: 720,
    baseThd: [3.2, 2.7, 2.2, 1.8, 1.6, 1.4],
    capexIndex: 1.15,
    reliability: 0.965,
  },
  lci: {
    label: 'LCI',
    voltage: 11,
    note: 'Load-commutated inverter for very high power synchronous drives.',
    switchingHz: 300,
    baseThd: [8.1, 7.4, 6.8, 5.9, 5.1, 4.7],
    capexIndex: 0.9,
    reliability: 0.9,
  },
};

const checklist = [
  'Transformer differential relay coordination validated.',
  'Cell bypass and crowbar health verified on all power cells.',
  'dV/dt filter thermal scan and leakage current benchmark complete.',
  'Bearing current mitigation ring continuity and grounding confirmed.',
  'Arc-flash labeling and maintenance boundary review closed.',
  'Redundant control PSU failover tested under 100% load.',
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || min));

function harmonicSpectrum(baseThd, loadPct, pulse) {
  const loadFactor = 0.9 + loadPct / 250;
  const pulseFactor = pulse === 24 ? 0.8 : pulse === 18 ? 0.88 : 1;
  return [5, 7, 11, 13, 17, 19].map((order, index) => ({
    order: `${order}th`,
    thd: Number((baseThd[index] * loadFactor * pulseFactor).toFixed(2)),
  }));
}

function thermalData(loadPct) {
  return [30, 45, 60, 75, 90, 100].map((l) => ({
    load: l,
    junction: Number((55 + l * 0.36 + (loadPct - 70) * 0.05).toFixed(1)),
    coolant: Number((26 + l * 0.11).toFixed(1)),
  }));
}

function lifecycleCurve(capexIndex, reliability) {
  return [1, 2, 3, 4, 5].map((year) => {
    const failureCost = (1 - reliability) * year * 180;
    const maintenance = 110 * year;
    const energyPenalty = capexIndex < 1 ? 130 * year : 95 * year;
    return {
      year,
      opex: Number((maintenance + energyPenalty + failureCost).toFixed(1)),
      cumulative: Number((capexIndex * 700 + year * (maintenance + energyPenalty + failureCost)).toFixed(1)),
    };
  });
}

export default function MVVFDModule() {
  const [topologyKey, setTopologyKey] = useState('npc');
  const [loadPct, setLoadPct] = useState(72);
  const [gridShortCircuitMVA, setGridShortCircuitMVA] = useState(500);
  const [pulse, setPulse] = useState(18);
  const [ambient, setAmbient] = useState(35);

  const selected = topologies[topologyKey];
  const safeLoad = clamp(loadPct, 20, 110);
  const safeScMva = clamp(gridShortCircuitMVA, 100, 5000);
  const safePulse = clamp(pulse, 12, 24);
  const safeAmbient = clamp(ambient, 10, 55);

  const harmonicData = useMemo(() => harmonicSpectrum(selected.baseThd, safeLoad, safePulse), [selected.baseThd, safeLoad, safePulse]);
  const thermalTrend = useMemo(() => thermalData(safeLoad), [safeLoad]);
  const lifecycleData = useMemo(() => lifecycleCurve(selected.capexIndex, selected.reliability), [selected.capexIndex, selected.reliability]);

  const calc = useMemo(() => {
    const inputMVA = (selected.voltage * safeLoad) / 100;
    const iscToIl = (safeScMva / Math.max(inputMVA, 0.1)) * 100;
    const weightedThd = harmonicData.reduce((sum, h) => sum + h.thd, 0) / harmonicData.length;
    const ieee519Limit = iscToIl < 20 ? 5 : iscToIl < 50 ? 8 : 12;

    const pass = weightedThd <= ieee519Limit;
    const junction = 56 + safeLoad * 0.34 + (safeAmbient - 25) * 0.5;
    const margin = Math.max(6, 95 - junction);
    const reliabilityIndex = Math.round(selected.reliability * 100 - Math.max(0, 80 - safeLoad) * 0.08);
    const viralScore = Math.round((pass ? 30 : 10) + reliabilityIndex * 0.4 + (24 - safePulse) * -0.6 + (margin > 15 ? 25 : 10));

    return { iscToIl, weightedThd, ieee519Limit, pass, junction, margin, reliabilityIndex, viralScore };
  }, [selected, safeLoad, safeScMva, harmonicData, safeAmbient, safePulse]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Industrial MV VFDs</h2>
        <p className="text-sm text-slate-400">Global-class MV drive lab: topology intelligence, IEEE-519 compliance, lifecycle economics, and protection readiness.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'IEEE-519', value: calc.pass ? 'PASS' : 'REVIEW', tone: calc.pass ? 'text-emerald-300' : 'text-warning' },
          { label: 'Weighted THD', value: `${calc.weightedThd.toFixed(2)}%`, tone: 'text-fault' },
          { label: 'Thermal Margin', value: `${calc.margin.toFixed(1)}°C`, tone: 'text-warning' },
          { label: 'Reliability Index', value: `${calc.reliabilityIndex}/100`, tone: 'text-cyan-300' },
        ].map((card) => (
          <motion.div key={card.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
            <p className={`mt-2 text-xl font-semibold ${card.tone}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cyan-300">Topology & Grid Study Console</h3>
            <TowerControl size={16} className="text-cyan-300" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(topologies).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTopologyKey(key)}
                className={`rounded border p-3 text-left ${
                  topologyKey === key ? 'border-power bg-cyan-400/10 text-power' : 'border-slate-700 text-slate-300'
                }`}
              >
                <p className="font-semibold">{t.label}</p>
                <p className="text-xs">{t.voltage}kV</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Selected Topology</p>
            <p className="mt-1 text-cyan-300">{selected.label} · {selected.voltage}kV</p>
            <p className="mt-2 text-slate-300">{selected.note}</p>
            <p className="mt-2">Switching reference: <span className="text-warning">{selected.switchingHz} Hz</span></p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm text-slate-300">Load (%)
              <input type="number" min="20" max="110" value={safeLoad} onChange={(e) => setLoadPct(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Ssc (MVA)
              <input type="number" min="100" max="5000" value={safeScMva} onChange={(e) => setGridShortCircuitMVA(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Pulse
              <select value={safePulse} onChange={(e) => setPulse(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5">
                <option value={12}>12-pulse</option>
                <option value={18}>18-pulse</option>
                <option value={24}>24-pulse</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">Ambient (°C)
              <input type="number" min="10" max="55" value={safeAmbient} onChange={(e) => setAmbient(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm sm:grid-cols-2">
            <p>Short-circuit ratio (Isc/IL): <span className="text-cyan-300">{calc.iscToIl.toFixed(1)}</span></p>
            <p>IEEE limit used: <span className="text-warning">{calc.ieee519Limit.toFixed(1)}%</span></p>
            <p>Weighted THD: <span className="text-fault">{calc.weightedThd.toFixed(2)}%</span></p>
            <p>Estimated junction: <span className="text-warning">{calc.junction.toFixed(1)}°C</span></p>
            <p className="sm:col-span-2">Formula: <span className="font-mono text-cyan-300">THD_w = Σ(hᵢ)/n; IEEE limit based on Isc/IL</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><Sigma size={14} className="mr-1 inline" />Harmonic Spectrum</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={harmonicData}>
                <defs>
                  <linearGradient id="mvHarmonic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="order" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip />
                <Area type="monotone" dataKey="thd" stroke="#ef4444" fill="url(#mvHarmonic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><Activity size={14} className="mr-1 inline" />Thermal Trend by Load</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={thermalTrend}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="load" stroke="#94a3b8" unit="%" />
                <YAxis stroke="#94a3b8" unit="°C" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="junction" stroke="#ef4444" strokeWidth={2} dot={false} name="Junction" />
                <Bar dataKey="coolant" fill="#22d3ee" name="Coolant" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">5-Year Lifecycle Economics</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleData}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="k$" />
                <Tooltip />
                <Legend />
                <Bar dataKey="opex" fill="#fbbf24" name="Yearly OPEX (k$)" />
                <Line type="monotone" dataKey="cumulative" stroke="#22d3ee" strokeWidth={2} name="Cumulative TCO (k$)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">Viral engineering score: <span className="text-power">{calc.viralScore}/100</span> based on compliance, reliability and thermal headroom.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
        <h3 className="mb-3 font-semibold text-warning"><ShieldAlert size={16} className="mr-1 inline" />Protection & Commissioning Readiness</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {checklist.map((event) => (
            <li key={event} className="rounded border border-slate-800 bg-slate-900 p-3">{event}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
