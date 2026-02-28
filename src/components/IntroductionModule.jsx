import { CheckCircle2 } from 'lucide-react';

const outcomes = [
  'Differentiate industrial double-conversion UPS from consumer standby UPS.',
  'Interpret UPS power path behavior during mains loss and static bypass transfer.',
  'Run first-pass battery autonomy sizing and identify safety margins.',
];

export default function IntroductionModule() {
  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-power">Introduction</h2>
        <p className="text-sm text-slate-400">Course player and foundational comparison.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-cyan-500/5">
          <div className="aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4">
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 text-center text-slate-400">
              <p>Video Placeholder (16:9) — Basic Industrial UPS Overview</p>
              <p className="mt-1 text-xs">Topic 01 · Topology, reliability, and resilience</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-5">
          <div>
            <h3 className="mb-3 text-lg font-semibold">Industrial vs. Home UPS</h3>
            <ul className="list-disc space-y-2 pl-6 text-sm text-slate-300 marker:text-power">
              <li>Industrial UPS uses double-conversion topologies for strict voltage/frequency regulation.</li>
              <li>Higher MTBF design with hot-swappable power modules and parallel redundancy.</li>
              <li>Integrated SCADA/BMS telemetry for alarms, trend curves, and predictive maintenance.</li>
              <li>Supports heavy inrush and non-linear loads from drives, PLC racks, and controls.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">Learning Outcomes</p>
            {outcomes.map((outcome) => (
              <p key={outcome} className="mb-2 text-sm text-slate-200">
                <CheckCircle2 size={14} className="mr-1 inline text-emerald-400" />
                {outcome}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
