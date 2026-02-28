import {
  BookOpenText,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  Gauge,
  Settings2,
  Wrench,
  Zap,
  RadioTower,
  BarChart3,
  GraduationCap,
  Shield,
  CircuitBoard,
  Factory,
} from 'lucide-react';

const icons = {
  Introduction: BookOpenText,
  Components: Cpu,
  'Operation Modes': Settings2,
  'Sizing & Selection': Gauge,
  Maintenance: Wrench,
  'Industrial LV VFDs': Zap,
  'Industrial MV VFDs': RadioTower,
  'Performance Hub': BarChart3,
  'Certification & ROI': GraduationCap,
  'Protection & Relays': Shield,
  Switchgears: CircuitBoard,
  Transformers: Factory,
};

export default function Sidebar({ moduleSections, activeModule, setActiveModule, isOpen, toggle }) {
  return (
    <aside
      className={`border-r border-slate-800 bg-slate-950/90 transition-all duration-300 ${isOpen ? 'w-80' : 'w-20'}`}
      aria-label="Course navigation"
    >
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        {isOpen && (
          <div>
            <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-power">Industrial Engineering Academy</h1>
            <p className="text-xs text-slate-400">Industrial Power Electronics & Systems</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="rounded-lg border border-slate-700 p-2 text-slate-200 hover:border-power hover:text-power"
        >
          {isOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>

      <nav className="space-y-4 p-3">
        {moduleSections.map((group) => (
          <div key={group.section} className="space-y-2">
            {isOpen && <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">{group.section}</p>}
            {group.modules.map((module) => {
              const Icon = icons[module.name];
              const isActive = module.name === activeModule;
              return (
                <button
                  key={module.name}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveModule(module.name)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-power bg-cyan-400/10 text-power'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon size={18} />
                  {isOpen && <span className="text-sm font-medium">{module.name}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
