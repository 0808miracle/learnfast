import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sigma, ThermometerSun, Zap, ArrowUpCircle } from 'lucide-react';
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
  Bar,
  BarChart,
  Legend,
  ReferenceLine,
} from 'recharts';
import MathFormulaCard from './MathFormulaCard';

const types = {
  oil: { label: 'Oil-Immersed', eff: 0.989, zpu: 0.08, thermalCap: 120, noLoadLossKw: 1.9 },
  dry: { label: 'Dry Type', eff: 0.981, zpu: 0.06, thermalCap: 105, noLoadLossKw: 2.6 },
  amorphous: { label: 'Amorphous Core', eff: 0.992, zpu: 0.07, thermalCap: 115, noLoadLossKw: 1.2 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

function lossCurve(eff, noLoadLossKw) {
  return [25, 40, 60, 80, 100, 120].map((load) => ({
    load,
    copperLoss: Number((((1 - eff) * 1000) * (load / 100) ** 2).toFixed(2)),
    noLoadLoss: noLoadLossKw,
    totalLoss: Number((((1 - eff) * 1000) * (load / 100) ** 2 + noLoadLossKw).toFixed(2)),
  }));
}

function thermalTrend(baseTopOil, ambient) {
  return [0, 2, 4, 6, 8, 10, 12].map((hour) => ({
    hour: `${hour}h`,
    topOil: Number((baseTopOil + hour * 1.8 + (ambient - 30) * 0.35).toFixed(1)),
    hotSpot: Number((baseTopOil + 8 + hour * 2.2 + (ambient - 30) * 0.5).toFixed(1)),
  }));
}

function tapVoltageProfile(nominalKv, tapPercent) {
  return [-5, -2.5, 0, 2.5, 5].map((tap) => ({
    tap: `${tap}%`,
    kv: Number((nominalKv * (1 + (tap + tapPercent) / 100)).toFixed(3)),
  }));
}

export default function TransformersModule() {
  const [typeKey, setTypeKey] = useState('oil');
  const [kva, setKva] = useState(2000);
  const [loadPct, setLoadPct] = useState(78);
  const [pf, setPf] = useState(0.92);
  const [ambient, setAmbient] = useState(35);
  const [tapPercent, setTapPercent] = useState(0);

  const selected = types[typeKey];
  const safeKva = clamp(kva, 100, 10000);
  const safeLoadPct = clamp(loadPct, 20, 130);
  const safePf = clamp(pf, 0.7, 1);
  const safeAmbient = clamp(ambient, 5, 55);
  const safeTap = clamp(tapPercent, -5, 5);

  const losses = useMemo(() => lossCurve(selected.eff, selected.noLoadLossKw), [selected]);
  const tempData = useMemo(() => thermalTrend(62, safeAmbient), [safeAmbient]);
  const tapData = useMemo(() => tapVoltageProfile(11, safeTap), [safeTap]);

  const calc = useMemo(() => {
    const kvaDemand = safeKva * (safeLoadPct / 100);
    const kwOut = kvaDemand * safePf;
    const kwIn = kwOut / selected.eff;
    const totalLoss = kwIn - kwOut + selected.noLoadLossKw;
    const faultLevelMVA = (safeKva / 1000) / selected.zpu;
    const fullLoadCurrent = (safeKva * 1000) / (1.732 * 11000);
    const operatingCurrent = fullLoadCurrent * (safeLoadPct / 100);
    const topOilEst = 58 + (safeLoadPct / 100) ** 1.6 * 32 + (safeAmbient - 30) * 0.4;
    const thermalMargin = selected.thermalCap - topOilEst;
    const efficiencyAtLoad = (kwOut / (kwOut + totalLoss)) * 100;

    return {
      kvaDemand,
      kwOut,
      kwIn,
      totalLoss,
      faultLevelMVA,
      fullLoadCurrent,
      operatingCurrent,
      topOilEst,
      thermalMargin,
      efficiencyAtLoad,
    };
  }, [safeKva, safeLoadPct, safePf, safeAmbient, selected]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Transformers</h2>
        <p className="text-sm text-slate-400">Commercial-grade transformer module with loading, efficiency, thermal envelope, tap control, and short-circuit insight.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(types).map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTypeKey(key)}
            className={`rounded-xl border p-4 text-left transition ${
              typeKey === key ? 'border-power bg-cyan-400/10 text-power' : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            <p className="font-semibold">{value.label}</p>
            <p className="text-xs text-slate-400">η {(value.eff * 100).toFixed(1)}% · Z {value.zpu} pu</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <h3 className="mb-2 font-semibold text-cyan-300"><Sigma size={15} className="mr-1 inline" />Sizing + Fault Study Console</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-sm text-slate-300">Rating (kVA)
              <input type="number" min="100" max="10000" value={safeKva} onChange={(e) => setKva(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Loading (%)
              <input type="number" min="20" max="130" value={safeLoadPct} onChange={(e) => setLoadPct(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Power Factor
              <input type="number" min="0.7" max="1" step="0.01" value={safePf} onChange={(e) => setPf(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Ambient (°C)
              <input type="number" min="5" max="55" value={safeAmbient} onChange={(e) => setAmbient(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Tap (%)
              <input type="number" min="-5" max="5" step="0.5" value={safeTap} onChange={(e) => setTapPercent(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm sm:grid-cols-2">
            <p>kVA Demand: <span className="text-cyan-300">{calc.kvaDemand.toFixed(1)} kVA</span></p>
            <p>Output Power: <span className="text-emerald-300">{calc.kwOut.toFixed(1)} kW</span></p>
            <p>Total Loss: <span className="text-warning">{calc.totalLoss.toFixed(2)} kW</span></p>
            <p>Efficiency @load: <span className="text-emerald-300">{calc.efficiencyAtLoad.toFixed(2)}%</span></p>
            <p>Fault Level: <span className="text-fault">{calc.faultLevelMVA.toFixed(1)} MVA</span></p>
            <p>Operating Current: <span className="text-cyan-300">{calc.operatingCurrent.toFixed(1)} A</span></p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <MathFormulaCard title="Transformer Current" formula="I = S / (√3 · V_LL)" note="S in VA, V in volts." />
            <MathFormulaCard title="Fault Level" formula="MVA_sc = MVA_base / Z_pu" note="Use nameplate base MVA and per-unit impedance." />
          </div>
        </div>

        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200"><ThermometerSun size={14} className="mr-1 inline" />Thermal Margin</h3>
            <p className={`text-2xl font-semibold ${calc.thermalMargin < 10 ? 'text-fault' : 'text-warning'}`}>{calc.thermalMargin.toFixed(1)}°C</p>
            <p className="mt-1 text-sm text-slate-400">Top oil estimate: {calc.topOilEst.toFixed(1)}°C</p>
            <p className="mt-2 text-xs text-slate-400">Margin &lt; 10°C suggests cooling upgrade or load redistribution.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-200"><Zap size={14} className="mr-1 inline" />Tap Voltage Profile</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tapData}>
                  <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                  <XAxis dataKey="tap" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" unit="kV" />
                  <Tooltip />
                  <Line type="monotone" dataKey="kv" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Copper + Core Loss vs Load</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={losses}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="load" stroke="#94a3b8" unit="%" />
                <YAxis stroke="#94a3b8" unit="kW" />
                <Tooltip />
                <Legend />
                <Bar dataKey="copperLoss" fill="#22d3ee" name="Copper" />
                <Bar dataKey="noLoadLoss" fill="#fbbf24" name="No-load" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><ArrowUpCircle size={14} className="mr-1 inline" />Top Oil & Hot-Spot Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempData}>
                <defs>
                  <linearGradient id="topOil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="°C" />
                <Tooltip />
                <Legend />
                <ReferenceLine y={selected.thermalCap} stroke="#fbbf24" strokeDasharray="4 4" label="Thermal cap" />
                <Area type="monotone" dataKey="topOil" stroke="#ef4444" fill="url(#topOil)" name="Top Oil" />
                <Line type="monotone" dataKey="hotSpot" stroke="#22d3ee" strokeWidth={2} dot={false} name="Hot Spot" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
