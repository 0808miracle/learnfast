import { useMemo, useState } from 'react';
import { BellRing, ShieldCheck, Trophy } from 'lucide-react';
import Sidebar from './components/Sidebar';
import IntroductionModule from './components/IntroductionModule';
import ComponentsModule from './components/ComponentsModule';
import OperationModesModule from './components/OperationModesModule';
import SizingModule from './components/SizingModule';
import MaintenanceModule from './components/MaintenanceModule';
import LVVFDModule from './components/LVVFDModule';
import MVVFDModule from './components/MVVFDModule';
import PerformanceHubModule from './components/PerformanceHubModule';
import CertificationModule from './components/CertificationModule';
import ProtectionRelaysModule from './components/ProtectionRelaysModule';
import SwitchgearsModule from './components/SwitchgearsModule';
import TransformersModule from './components/TransformersModule';
import { useSimulation } from './context';

const moduleSections = [
  {
    section: 'Power Electronics',
    modules: [
      { name: 'Introduction', description: 'Course kickoff and concept baseline.' },
      { name: 'Components', description: 'Interactive UPS hardware glossary.' },
      { name: 'Operation Modes', description: 'SLD with real-time power flow.' },
      { name: 'Sizing & Selection', description: 'Engineering battery sizing toolkit.' },
      { name: 'Maintenance', description: 'Preventive maintenance tracker.' },
      { name: 'Industrial LV VFDs', description: 'Low-voltage drive optimization and diagnostics.' },
      { name: 'Industrial MV VFDs', description: 'Medium-voltage topology, harmonics, and protection.' },
      { name: 'Performance Hub', description: 'Training analytics and market adoption dashboard.' },
      { name: 'Certification & ROI', description: 'Assessment + deployment value validation.' },
    ],
  },
  {
    section: 'Power Systems',
    modules: [
      { name: 'Protection & Relays', description: 'TCC coordination, disturbance analytics, and grading logic.' },
      { name: 'Switchgears', description: 'Switchgear selection, breaker duty and arc-risk profiling.' },
      { name: 'Transformers', description: 'Sizing, thermal behavior, losses and fault-level analysis.' },
    ],
  },
];

const flatModules = moduleSections.flatMap((group) => group.modules);

export default function App() {
  const [activeModule, setActiveModule] = useState('Introduction');
  const { simulationMode, isSidebarOpen, setIsSidebarOpen, completedModules, markModuleComplete } = useSimulation();

  const moduleNames = flatModules.map((module) => module.name);
  const completion = Math.round((moduleNames.filter((name) => completedModules[name]).length / moduleNames.length) * 100);

  const activePanel = useMemo(() => {
    switch (activeModule) {
      case 'Introduction':
        return <IntroductionModule />;
      case 'Components':
        return <ComponentsModule />;
      case 'Operation Modes':
        return <OperationModesModule />;
      case 'Sizing & Selection':
        return <SizingModule />;
      case 'Maintenance':
        return <MaintenanceModule />;
      case 'Industrial LV VFDs':
        return <LVVFDModule />;
      case 'Industrial MV VFDs':
        return <MVVFDModule />;
      case 'Performance Hub':
        return <PerformanceHubModule modules={moduleNames} />;
      case 'Certification & ROI':
        return <CertificationModule />;
      case 'Protection & Relays':
        return <ProtectionRelaysModule />;
      case 'Switchgears':
        return <SwitchgearsModule />;
      case 'Transformers':
        return <TransformersModule />;
      default:
        return null;
    }
  }, [activeModule, moduleNames]);

  const activeMeta = flatModules.find((module) => module.name === activeModule);

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar
        moduleSections={moduleSections}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Modern SCADA Learning Console</p>
            <h1 className="text-lg font-semibold text-power">{activeMeta?.name}</h1>
            <p className="text-xs text-slate-400">{activeMeta?.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-cyan-500/50 bg-cyan-500/10 px-2 py-1 uppercase">Mode: {simulationMode}</span>
            <span className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-1">
              <ShieldCheck size={14} className="mr-1 inline" />Lab Safe
            </span>
            <span className="rounded-md border border-violet-500/50 bg-violet-500/10 px-2 py-1 text-violet-300">
              <Trophy size={14} className="mr-1 inline" />Progress: {completion}%
            </span>
            <span className="rounded-md border border-warning/50 bg-warning/10 px-2 py-1 text-warning">
              <BellRing size={14} className="mr-1 inline" />2 alerts
            </span>
            {!completedModules[activeModule] && (
              <button
                type="button"
                onClick={() => markModuleComplete(activeModule)}
                className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-emerald-300"
              >
                Mark Complete
              </button>
            )}
          </div>
        </header>
        {activePanel}
      </main>
    </div>
  );
}
