import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const glossary = [
  {
    term: 'Rectifier',
    category: 'Power Conversion',
    specs: ['Input: 3Φ 415V AC', 'THDi: < 3%', 'Converts AC to regulated DC bus'],
  },
  {
    term: 'Inverter',
    category: 'Power Conversion',
    specs: ['Output: 400V AC ±1%', 'IGBT PWM topology', 'Low THDv for critical loads'],
  },
  {
    term: 'Static Switch',
    category: 'Bypass',
    specs: ['Transfer time: < 4 ms', 'SCR-based bypass selector', 'Handles overload during faults'],
  },
  {
    term: 'Battery Bank',
    category: 'Energy Storage',
    specs: ['Nominal: 360 VDC', 'VRLA or Li-ion strings', 'Sizing per backup autonomy'],
  },
  {
    term: 'DC Link',
    category: 'Energy Buffer',
    specs: ['Ripple-controlled bus', 'Supports dynamic transients', 'Coordinates rectifier + battery'],
  },
  {
    term: 'Input Filters',
    category: 'Power Quality',
    specs: ['EMI suppression', 'Harmonic mitigation', 'Protects upstream network'],
  },
];

export default function ComponentsModule() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => glossary.filter((item) => item.term.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <section className="relative min-h-[32rem] overflow-hidden">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-power">Components Glossary</h2>
        <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
          <Search size={14} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search component"
            className="bg-transparent outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <button
            key={item.term}
            type="button"
            onClick={() => setSelected(item)}
            className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-left transition hover:border-power"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{item.category}</p>
            <h3 className="text-lg font-semibold">{item.term}</h3>
            <p className="mt-2 text-sm text-slate-400">Tap for technical specs and visual notes.</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-cyan-500/10"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-4 rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-power"
            >
              Close (Esc)
            </button>
            <h3 className="text-xl font-semibold text-power">{selected.term}</h3>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{selected.category}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {selected.specs.map((line) => (
                <li key={line} className="rounded bg-slate-800/60 p-2">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-600 text-xs text-slate-500">
              Image placeholder: annotated technical drawing
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </section>
  );
}
