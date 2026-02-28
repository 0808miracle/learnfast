import { motion } from 'framer-motion';

const nodes = [
  { id: 'mains', label: 'Mains', x: '8%', y: '50%' },
  { id: 'rectifier', label: 'Rectifier', x: '24%', y: '50%' },
  { id: 'dclink', label: 'DC Link', x: '40%', y: '50%' },
  { id: 'battery', label: 'Battery Bank', x: '40%', y: '80%' },
  { id: 'inverter', label: 'Inverter', x: '58%', y: '50%' },
  { id: 'static', label: 'Static Bypass', x: '58%', y: '20%' },
  { id: 'load', label: 'Critical Load', x: '82%', y: '50%' },
];

const flowByMode = {
  normal: {
    color: '#34d399',
    speed: 1.2,
    paths: ['M 10 54 L 24 54', 'M 24 54 L 40 54', 'M 40 54 L 58 54', 'M 58 54 L 82 54'],
  },
  battery: {
    color: '#ef4444',
    speed: 0.6,
    paths: ['M 40 84 L 40 54', 'M 40 54 L 58 54', 'M 58 54 L 82 54'],
  },
  bypass: {
    color: '#fbbf24',
    speed: 0.9,
    paths: ['M 10 54 L 10 24', 'M 10 24 L 58 24', 'M 58 24 L 58 54', 'M 58 54 L 82 54'],
  },
};

function Node({ label, x, y, inactive }) {
  return (
    <motion.div
      style={{ left: x, top: y }}
      initial={{ scale: 0.96, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-2 text-[11px] md:px-3 md:text-sm ${
        inactive ? 'border-slate-700 text-slate-600' : 'border-slate-500 bg-slate-900 text-slate-100'
      }`}
    >
      {label}
    </motion.div>
  );
}

export default function Diagram({ simulationMode }) {
  const activeFlow = flowByMode[simulationMode];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 md:p-5">
      <div className="mb-2 flex flex-wrap gap-3 text-xs">
        <span className="rounded border border-slate-700 px-2 py-1 text-slate-300">Flow Color</span>
        <span className="rounded border border-emerald-400/40 px-2 py-1 text-emerald-300">Normal: Green</span>
        <span className="rounded border border-fault/40 px-2 py-1 text-fault">Battery: Red</span>
        <span className="rounded border border-warning/40 px-2 py-1 text-warning">Bypass: Amber</span>
      </div>
      <div className="relative h-[30rem] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 md:h-[24rem]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Object.values(flowByMode)
            .flatMap((f) => f.paths)
            .map((path, index) => (
              <path key={index} d={path} stroke="#334155" strokeWidth="1.1" fill="none" />
            ))}

          {activeFlow.paths.map((path) => (
            <motion.path
              key={path}
              d={path}
              stroke={activeFlow.color}
              strokeWidth="2.2"
              fill="none"
              strokeDasharray="5 3"
              style={{ filter: `drop-shadow(0 0 4px ${activeFlow.color})` }}
              animate={{ strokeDashoffset: [16, 0] }}
              transition={{ repeat: Infinity, duration: activeFlow.speed, ease: 'linear' }}
            />
          ))}
        </svg>

        {nodes.map((node) => (
          <Node
            key={node.id}
            label={node.label}
            x={node.x}
            y={node.y}
            inactive={
              (simulationMode === 'battery' && ['mains', 'rectifier', 'static'].includes(node.id)) ||
              (simulationMode === 'bypass' && ['rectifier', 'battery', 'dclink', 'inverter'].includes(node.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
