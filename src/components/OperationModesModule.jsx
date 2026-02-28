import Diagram from './Diagram';
import { useSimulation } from '../context';

const modeButtons = [
  { key: 'normal', label: 'Normal Mode', color: 'border-emerald-400 text-emerald-300', desc: 'Double conversion path active.' },
  { key: 'battery', label: 'Battery Mode', color: 'border-fault text-fault', desc: 'Mains unavailable, battery discharge.' },
  { key: 'bypass', label: 'Bypass Mode', color: 'border-warning text-warning', desc: 'Static switch feeds critical load.' },
];

export default function OperationModesModule() {
  const { simulationMode, setSimulationMode } = useSimulation();

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-power">Operation Modes Simulator</h2>
        <p className="text-sm text-slate-400">Interactive single-line diagram with live current flow animation.</p>
      </header>

      <Diagram simulationMode={simulationMode} />

      <div className="grid gap-3 md:grid-cols-3">
        {modeButtons.map((button) => (
          <button
            key={button.key}
            type="button"
            onClick={() => setSimulationMode(button.key)}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              simulationMode === button.key ? `${button.color} bg-slate-800` : 'border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <p>{button.label}</p>
            <p className="mt-1 text-xs text-slate-400">{button.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
