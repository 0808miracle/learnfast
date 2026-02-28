import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivitySquare, ShieldCheck, AlertTriangle, TimerReset } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Legend,
} from 'recharts';
import MathFormulaCard from './MathFormulaCard';

const relayTypes = {
  oc: { name: '50/51 Overcurrent', pickup: 1.2, tms: 0.2, alpha: 0.02, k: 0.14, desc: 'Feeder and transformer backup protection.' },
  diff: { name: '87 Differential', pickup: 0.35, tms: 0.08, alpha: 0.01, k: 0.12, desc: 'Fast internal fault detection with restraint.' },
  dist: { name: '21 Distance', pickup: 1.0, tms: 0.12, alpha: 0.03, k: 0.18, desc: 'Zone-based protection for line faults.' },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

function inverseTimeCurve(pickup, tms, alpha, k) {
  return [1.1, 1.3, 1.5, 2, 3, 5, 8, 12, 16].map((multiple) => ({
    multiple,
    tripTime: Number((((k * tms) / (multiple ** alpha - 1)) + pickup * 0.03).toFixed(3)),
  }));
}

function disturbanceData(ctRatio, burden) {
  const base = [410, 420, 440, 490, 590, 730, 680, 500, 430, 390];
  return base.map((ia, index) => ({
    ts: `00:${String(index).padStart(2, '0')}`,
    ia: Number((ia * (ctRatio / 400)).toFixed(0)),
    secondary: Number(((ia * (ctRatio / 400)) / ctRatio).toFixed(2)),
    burden: Number((burden + index * 0.02).toFixed(2)),
  }));
}

function coordinationMarginData(primary, backup) {
  return primary.map((row, index) => ({
    multiple: row.multiple,
    margin: Number((backup[index].tripTime - row.tripTime).toFixed(3)),
  }));
}

export default function ProtectionRelaysModule() {
  const [relay, setRelay] = useState('oc');
  const [pickup, setPickup] = useState(relayTypes.oc.pickup);
  const [tms, setTms] = useState(relayTypes.oc.tms);
  const [ctRatio, setCtRatio] = useState(400);
  const [burden, setBurden] = useState(1.6);

  const selected = relayTypes[relay];
  const safePickup = clamp(pickup, 0.2, 3);
  const safeTms = clamp(tms, 0.05, 1);
  const safeCtRatio = clamp(ctRatio, 100, 2000);
  const safeBurden = clamp(burden, 0.5, 5);

  const primaryCurve = useMemo(
    () => inverseTimeCurve(safePickup, safeTms, selected.alpha, selected.k),
    [safePickup, safeTms, selected],
  );
  const backupCurve = useMemo(
    () => inverseTimeCurve(safePickup * 1.2, safeTms * 1.3, selected.alpha, selected.k),
    [safePickup, safeTms, selected],
  );
  const events = useMemo(() => disturbanceData(safeCtRatio, safeBurden), [safeCtRatio, safeBurden]);
  const marginData = useMemo(() => coordinationMarginData(primaryCurve, backupCurve), [primaryCurve, backupCurve]);

  const compliance = useMemo(() => {
    const avgTrip = primaryCurve.reduce((sum, row) => sum + row.tripTime, 0) / primaryCurve.length;
    const minMargin = Math.min(...marginData.map((m) => m.margin));
    const burdenOk = safeBurden <= 3;
    const grading = minMargin >= 0.3 ? 'Excellent' : minMargin >= 0.2 ? 'Good' : 'Review';
    return {
      avgTrip,
      minMargin,
      burdenOk,
      grading,
      secure: safePickup >= 0.3 && safePickup <= 2.5,
    };
  }, [primaryCurve, marginData, safeBurden, safePickup]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Protection & Relays</h2>
        <p className="text-sm text-slate-400">Commercial-grade relay coordination lab with inverse-time modeling, CT burden checks, and disturbance analytics.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(relayTypes).map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setRelay(key);
              setPickup(value.pickup);
              setTms(value.tms);
            }}
            className={`rounded-xl border p-4 text-left transition ${
              relay === key ? 'border-power bg-cyan-400/10 text-power' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <p className="font-semibold">{value.name}</p>
            <p className="mt-1 text-xs text-slate-400">{value.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cyan-300">TCC Studio (Primary vs Backup)</h3>
            <ActivitySquare size={16} className="text-cyan-300" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm text-slate-300">Pickup (pu)
              <input type="number" min="0.2" max="3" step="0.05" value={safePickup} onChange={(e) => setPickup(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">TMS
              <input type="number" min="0.05" max="1" step="0.01" value={safeTms} onChange={(e) => setTms(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">CT Ratio (A)
              <input type="number" min="100" max="2000" step="50" value={safeCtRatio} onChange={(e) => setCtRatio(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Burden (VA)
              <input type="number" min="0.5" max="5" step="0.1" value={safeBurden} onChange={(e) => setBurden(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={primaryCurve}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="multiple" stroke="#94a3b8" unit="xIn" />
                <YAxis stroke="#94a3b8" unit="s" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tripTime" stroke="#22d3ee" strokeWidth={2} dot={false} name="Primary" />
                <Line type="monotone" data={backupCurve} dataKey="tripTime" stroke="#fbbf24" strokeWidth={2} dot={false} name="Backup" />
                <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="4 4" label="Min margin" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <MathFormulaCard title="IEC Inverse Time" formula="t = (k·TMS)/(M^α - 1)" note="M = I/Ipickup, α and k based on selected curve family." />
            <MathFormulaCard title="Coordination Margin" formula="Δt = t_backup - t_primary" note="Target >= 0.3 s for robust selectivity." />
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Grading', value: compliance.grading, tone: compliance.grading === 'Review' ? 'text-warning' : 'text-emerald-300' },
            { label: 'Avg Trip', value: `${compliance.avgTrip.toFixed(2)} s`, tone: 'text-cyan-300' },
            { label: 'Min Margin', value: `${compliance.minMargin.toFixed(3)} s`, tone: compliance.minMargin < 0.2 ? 'text-fault' : 'text-emerald-300' },
            { label: 'CT Burden', value: compliance.burdenOk ? 'OK' : 'High', tone: compliance.burdenOk ? 'text-emerald-300' : 'text-warning' },
          ].map((card) => (
            <motion.div key={card.label} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
              <p className={`mt-2 text-xl font-semibold ${card.tone}`}>{card.value}</p>
            </motion.div>
          ))}
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Security Flag</p>
            <p className={`mt-2 text-lg font-semibold ${compliance.secure ? 'text-emerald-300' : 'text-fault'}`}>{compliance.secure ? 'Within pickup band' : 'Pickup out of secure range'}</p>
            <p className="text-xs text-slate-400"><ShieldCheck size={14} className="mr-1 inline" />Validation and anti-nuisance checks enabled</p>
          </motion.div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Disturbance Recorder: Primary & Secondary Current</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={events}>
                <defs>
                  <linearGradient id="relayI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="ts" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="A" />
                <Tooltip />
                <Area type="monotone" dataKey="ia" stroke="#fbbf24" fill="url(#relayI)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><TimerReset size={14} className="mr-1 inline" />Coordination Margin Map</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis type="number" dataKey="multiple" name="Multiple" stroke="#94a3b8" />
                <YAxis type="number" dataKey="margin" name="Margin" stroke="#94a3b8" unit="s" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="4 4" />
                <Scatter data={marginData} fill="#22d3ee" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400"><AlertTriangle size={12} className="mr-1 inline text-warning" />Points below 0.3s indicate possible loss of selectivity.</p>
        </div>
      </div>
    </section>
  );
}
