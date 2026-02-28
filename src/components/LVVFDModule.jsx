import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  Bar,
} from 'recharts';
import { SlidersHorizontal, TriangleAlert, Gauge, ShieldCheck } from 'lucide-react';

const motorPresets = {
  fan: { nameplateKw: 75, baseHz: 50, poles: 4, efficiency: 0.945, powerFactor: 0.89, baseVoltage: 400 },
  pump: { nameplateKw: 90, baseHz: 50, poles: 4, efficiency: 0.938, powerFactor: 0.88, baseVoltage: 400 },
  conveyor: { nameplateKw: 55, baseHz: 50, poles: 6, efficiency: 0.915, powerFactor: 0.84, baseVoltage: 400 },
  compressor: { nameplateKw: 132, baseHz: 50, poles: 2, efficiency: 0.952, powerFactor: 0.91, baseVoltage: 690 },
};

const controlModes = {
  vf: { label: 'V/f Scalar', transientFactor: 0.88, harmonicFactor: 1.1, lowSpeedTorque: 0.84 },
  vector: { label: 'Sensorless Vector', transientFactor: 0.95, harmonicFactor: 0.95, lowSpeedTorque: 1.0 },
  dtc: { label: 'DTC', transientFactor: 1.0, harmonicFactor: 0.9, lowSpeedTorque: 1.08 },
};

const faultPlaybook = [
  {
    code: 'OC',
    title: 'Overcurrent',
    trigger: 'Accel ramp too steep / shorted turns / motor jam',
    mitigation: 'Raise accel time, validate torque limits, perform insulation + winding resistance tests.',
  },
  {
    code: 'OH',
    title: 'Drive Overtemperature',
    trigger: 'Panel cooling loss / high carrier frequency / clogged heat sink',
    mitigation: 'Reduce switching kHz, clean filters, verify fan speed and enclosure thermal budget.',
  },
  {
    code: 'GF',
    title: 'Ground Fault',
    trigger: 'Cable insulation failure / moisture ingress',
    mitigation: 'Megger motor+cable, inspect glands, verify PE continuity and EMC shield grounding.',
  },
  {
    code: 'UV',
    title: 'DC Bus Undervoltage',
    trigger: 'Supply sag / precharge circuit issue',
    mitigation: 'Trend mains events, inspect precharge contactor and inrush resistor timing.',
  },
  {
    code: 'STO',
    title: 'Safe Torque Off Trip',
    trigger: 'Safety channel mismatch or wiring fault',
    mitigation: 'Validate dual-channel STO logic, proof-test safety relay and reset chain.',
  },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || min));

function buildTorqueCurve(baseHz, boostPct, controlMode) {
  const mode = controlModes[controlMode];
  return [5, 10, 20, 30, 40, 50, 60].map((hz) => {
    const ratio = hz / baseHz;
    const torqueBase = ratio <= 1 ? 100 + boostPct - ratio * 10 : Math.max(58, 100 - (ratio - 1) * 50);
    const torque = torqueBase * mode.lowSpeedTorque;
    return { hz, torque: Number(torque.toFixed(1)) };
  });
}

function buildEfficiencyData(preset, controlMode) {
  const mode = controlModes[controlMode];
  return [25, 40, 60, 80, 100].map((load) => {
    const driveEff = Math.max(0.9, 0.992 - ((100 - load) / 100) * 0.04 - (mode.harmonicFactor - 1) * 0.01);
    const systemEff = driveEff * preset.efficiency;
    return {
      load,
      driveEff: Number((driveEff * 100).toFixed(2)),
      systemEff: Number((systemEff * 100).toFixed(2)),
    };
  });
}

function buildCurrentSpectrum(controlMode) {
  const base = { vf: [34, 28, 19, 16, 11], vector: [27, 22, 16, 12, 9], dtc: [24, 19, 13, 10, 8] }[controlMode];
  return [5, 7, 11, 13, 17].map((order, index) => ({ order: `${order}th`, amplitude: base[index] }));
}

function buildKpiRadar(calc) {
  return [
    { metric: 'Dynamic Resp.', value: calc.dynamicScore },
    { metric: 'Eff.', value: calc.effScore },
    { metric: 'THD Perf.', value: calc.thdScore },
    { metric: 'Thermal', value: calc.thermalScore },
    { metric: 'Safety', value: calc.safetyScore },
  ];
}

export default function LVVFDModule() {
  const [selectedPreset, setSelectedPreset] = useState('fan');
  const [controlMode, setControlMode] = useState('vector');
  const [frequency, setFrequency] = useState(42);
  const [boost, setBoost] = useState(8);
  const [ambient, setAmbient] = useState(38);
  const [cableLength, setCableLength] = useState(80);

  const preset = motorPresets[selectedPreset];
  const safeFrequency = clamp(frequency, 1, 80);
  const safeBoost = clamp(boost, 0, 30);
  const safeAmbient = clamp(ambient, 5, 60);
  const safeCableLength = clamp(cableLength, 5, 300);
  const mode = controlModes[controlMode];

  const calc = useMemo(() => {
    const synchronousRpm = (120 * safeFrequency) / preset.poles;
    const slipPct = Math.min(7.5, 1.5 + (safeFrequency / preset.baseHz) * 2.6);
    const shaftRpm = synchronousRpm * (1 - slipPct / 100);

    const cubicLoadDemand = preset.nameplateKw * (safeFrequency / preset.baseHz) ** 3;
    const kwDemand = Math.max(0.12 * preset.nameplateKw, cubicLoadDemand * mode.transientFactor);
    const current = (kwDemand * 1000) / (1.732 * preset.baseVoltage * preset.efficiency * preset.powerFactor);

    const dvdtRisk = safeCableLength > 120 ? 'High' : safeCableLength > 60 ? 'Medium' : 'Low';
    const thermalRise = 18 + (safeAmbient - 25) * 0.7 + (current / 100) * 9;
    const estSinkTemp = safeAmbient + thermalRise;

    const ieee519CurrentThd = 8 * mode.harmonicFactor + (safeCableLength / 300) * 1.3;
    const ieeePass = ieee519CurrentThd <= 8;

    const dynamicScore = Math.round(76 + mode.transientFactor * 18);
    const effScore = Math.round(preset.efficiency * 100);
    const thdScore = Math.round(Math.max(55, 100 - ieee519CurrentThd * 4));
    const thermalScore = Math.round(Math.max(40, 100 - Math.max(0, estSinkTemp - 75) * 2.1));
    const safetyScore = dvdtRisk === 'Low' ? 92 : dvdtRisk === 'Medium' ? 78 : 64;

    return {
      synchronousRpm,
      shaftRpm,
      slipPct,
      kwDemand,
      current,
      estSinkTemp,
      dvdtRisk,
      ieee519CurrentThd,
      ieeePass,
      dynamicScore,
      effScore,
      thdScore,
      thermalScore,
      safetyScore,
    };
  }, [safeFrequency, preset, mode, safeCableLength, safeAmbient]);

  const torqueData = useMemo(() => buildTorqueCurve(preset.baseHz, safeBoost, controlMode), [preset.baseHz, safeBoost, controlMode]);
  const efficiencyData = useMemo(() => buildEfficiencyData(preset, controlMode), [preset, controlMode]);
  const harmonicData = useMemo(() => buildCurrentSpectrum(controlMode), [controlMode]);
  const radarData = useMemo(() => buildKpiRadar(calc), [calc]);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Industrial LV VFDs</h2>
        <p className="text-sm text-slate-400">World-class LV drive studio: control mode optimization, IEEE checks, thermal risk, and fault response.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'kW Demand', value: `${calc.kwDemand.toFixed(1)} kW`, tone: 'text-cyan-300' },
          { label: 'Output Current', value: `${calc.current.toFixed(1)} A`, tone: 'text-fault' },
          { label: 'Sink Temp Est.', value: `${calc.estSinkTemp.toFixed(1)} °C`, tone: 'text-warning' },
          { label: 'IEEE-519 Check', value: calc.ieeePass ? 'PASS' : 'REVIEW', tone: calc.ieeePass ? 'text-emerald-300' : 'text-warning' },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-xl border border-slate-700 bg-slate-950 p-4"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{card.label}</p>
            <p className={`mt-2 text-xl font-semibold ${card.tone}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-cyan-300">Commissioning Parameter Studio</h3>
            <SlidersHorizontal size={16} className="text-cyan-300" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(motorPresets).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPreset(key)}
                className={`rounded border px-3 py-2 text-left text-sm ${
                  selectedPreset === key ? 'border-power bg-cyan-400/10 text-power' : 'border-slate-700 text-slate-300'
                }`}
              >
                <p className="font-medium">{value.nameplateKw}kW {key}</p>
                <p className="text-xs">{value.baseVoltage}V, {value.poles}-pole</p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(controlModes).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setControlMode(key)}
                className={`rounded border px-3 py-2 text-sm ${
                  controlMode === key ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 text-slate-300'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm text-slate-300">Frequency (Hz)
              <input type="number" min="1" max="80" value={safeFrequency} onChange={(e) => setFrequency(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Torque Boost (%)
              <input type="number" min="0" max="30" value={safeBoost} onChange={(e) => setBoost(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Ambient (°C)
              <input type="number" min="5" max="60" value={safeAmbient} onChange={(e) => setAmbient(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
            <label className="text-sm text-slate-300">Cable Length (m)
              <input type="number" min="5" max="300" value={safeCableLength} onChange={(e) => setCableLength(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" />
            </label>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm sm:grid-cols-2">
            <p>Synchronous speed: <span className="text-emerald-300">{calc.synchronousRpm.toFixed(0)} rpm</span></p>
            <p>Estimated shaft speed: <span className="text-emerald-300">{calc.shaftRpm.toFixed(0)} rpm</span></p>
            <p>Slip estimate: <span className="text-warning">{calc.slipPct.toFixed(2)}%</span></p>
            <p>dV/dt cable risk: <span className={calc.dvdtRisk === 'High' ? 'text-fault' : calc.dvdtRisk === 'Medium' ? 'text-warning' : 'text-emerald-300'}>{calc.dvdtRisk}</span></p>
            <p className="sm:col-span-2">Formula: <span className="font-mono text-cyan-300">I ≈ P/(√3·V·η·PF)</span></p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200"><Gauge size={14} className="mr-1 inline" />Control Quality Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 xl:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Torque Envelope + Harmonic Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={torqueData}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="hz" stroke="#94a3b8" unit="Hz" />
                <YAxis yAxisId="left" stroke="#94a3b8" unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" unit="A" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="torque" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.18} name="Torque %" />
                <Bar yAxisId="right" dataKey={() => Number((calc.current * 0.2).toFixed(1))} fill="#fbbf24" name="Scaled Current" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Efficiency vs Load</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="load" stroke="#94a3b8" unit="%" />
                <YAxis stroke="#94a3b8" unit="%" domain={[88, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="driveEff" stroke="#22d3ee" strokeWidth={2} dot={false} name="Drive η" />
                <Line type="monotone" dataKey="systemEff" stroke="#34d399" strokeWidth={2} dot={false} name="System η" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 xl:col-span-1">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Current Harmonic Spectrum</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={harmonicData}>
                <CartesianGrid stroke="#334155" strokeDasharray="4 4" />
                <XAxis dataKey="order" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="amplitude" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">IEEE-519 indicative current THD estimate: {calc.ieee519CurrentThd.toFixed(2)}%</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 p-5 xl:col-span-2">
          <h3 className="mb-3 font-semibold text-warning"><ShieldCheck size={15} className="mr-1 inline" />Fault Playbook</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {faultPlaybook.map((fault) => (
              <article key={fault.code} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="font-mono text-sm text-fault"><TriangleAlert size={14} className="mr-1 inline" />{fault.code} · {fault.title}</p>
                <p className="mt-1 text-xs text-slate-400">Trigger: {fault.trigger}</p>
                <p className="mt-1 text-sm text-slate-300">{fault.mitigation}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
