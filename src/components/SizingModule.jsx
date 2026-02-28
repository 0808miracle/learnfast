import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ProFeatureModal from './modals/ProFeatureModal';
import { useSimulation } from '../context';

const modeFactors = {
  normal: 1,
  battery: 1.12,
  bypass: 0.95,
};

const sanitize = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

const buildCurve = (ah) => [
  { time: '0m', capacity: 100 },
  { time: '15m', capacity: Math.max(85, 100 - ah * 0.025) },
  { time: '30m', capacity: Math.max(70, 100 - ah * 0.05) },
  { time: '45m', capacity: Math.max(55, 100 - ah * 0.085) },
  { time: '60m', capacity: Math.max(40, 100 - ah * 0.12) },
];

export default function SizingModule() {
  const { simulationMode } = useSimulation();
  const [loadKva, setLoadKva] = useState(120);
  const [powerFactor, setPowerFactor] = useState(0.8);
  const [backupTime, setBackupTime] = useState(30);
  const [dcVoltage, setDcVoltage] = useState(360);
  const [proModal, setProModal] = useState(false);

  const normalized = {
    loadKva: sanitize(loadKva, 1, 5000),
    powerFactor: sanitize(powerFactor, 0.5, 1),
    backupTime: sanitize(backupTime, 1, 480),
    dcVoltage: sanitize(dcVoltage, 96, 800),
  };

  const metrics = useMemo(() => {
    const kw = normalized.loadKva * normalized.powerFactor;
    const dcAmps = (kw * 1000) / (normalized.dcVoltage * 0.94);
    const modeAdjusted = dcAmps * modeFactors[simulationMode];
    const agingFactor = 1.15;
    const tempFactor = 1.05;
    const ah = modeAdjusted * (normalized.backupTime / 60) * agingFactor * tempFactor;
    return { kw, dcAmps: modeAdjusted, ah };
  }, [normalized.backupTime, normalized.dcVoltage, normalized.loadKva, normalized.powerFactor, simulationMode]);

  const chartData = useMemo(() => buildCurve(metrics.ah), [metrics.ah]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Sizing & Selection</h2>
        <p className="text-sm text-slate-400">Precision sizing tool synced to operation mode.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 rounded-xl border border-slate-700 bg-slate-950 p-5 sm:grid-cols-2">
          <label className="text-sm">
            Load (kVA)
            <input
              type="number"
              min="1"
              max="5000"
              value={loadKva}
              onChange={(e) => setLoadKva(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Power Factor
            <input
              type="number"
              min="0.5"
              max="1"
              step="0.01"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Backup Time (min)
            <input
              type="number"
              min="1"
              max="480"
              value={backupTime}
              onChange={(e) => setBackupTime(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            DC Voltage (V)
            <input
              type="number"
              min="96"
              max="800"
              value={dcVoltage}
              onChange={(e) => setDcVoltage(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <p className="col-span-full text-xs text-slate-400">
            Includes derating margin: 15% battery aging + 5% temperature correction.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-700/60 bg-slate-950 p-5 shadow-lg shadow-cyan-500/10">
          <h3 className="font-semibold text-cyan-300">Digital Meter</h3>
          <div className="mt-3 space-y-2 font-mono text-sm">
            <p>
              Mode: <span className="uppercase text-cyan-300">{simulationMode}</span>
            </p>
            <p>
              kW Demand: <span className="text-emerald-300">{metrics.kw.toFixed(2)} kW</span>
            </p>
            <p>
              Total DC Amps (94% eff): <span className="text-amber-300">{metrics.dcAmps.toFixed(1)} A</span>
            </p>
            <p>
              Required AH: <span className="text-fault">{metrics.ah.toFixed(1)} Ah</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProModal(true)}
            className="mt-4 rounded-lg border border-warning px-3 py-2 text-sm text-warning hover:bg-warning/10"
          >
            Download Sizing Report (PDF)
          </button>
        </div>
      </div>

      <div className="h-72 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <h4 className="mb-2 text-sm text-slate-300">Battery Discharge Curve</h4>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="capacity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" unit="%" />
            <Tooltip />
            <Area type="monotone" dataKey="capacity" stroke="#22d3ee" fill="url(#capacity)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {proModal && (
        <ProFeatureModal
          onClose={() => setProModal(false)}
          reportData={{
            simulationMode,
            loadKva: normalized.loadKva,
            powerFactor: normalized.powerFactor,
            backupTime: normalized.backupTime,
            dcVoltage: normalized.dcVoltage,
            ...metrics,
          }}
        />
      )}
    </section>
  );
}
