import { useMemo, useState } from 'react';

const initialChecklist = [
  { label: 'Battery Health: Measure string voltage and internal resistance', frequency: 'Monthly' },
  { label: 'Battery Health: Verify ambient temperature trend', frequency: 'Weekly' },
  { label: 'Capacitor Replacement: Inspect DC bus capacitors for bulging', frequency: 'Quarterly' },
  { label: 'Capacitor Replacement: Validate ESR against maintenance baseline', frequency: 'Quarterly' },
  { label: 'Bypass Path Test: Confirm static switch transfer functionality', frequency: 'Monthly' },
];

export default function MaintenanceModule() {
  const [items, setItems] = useState(initialChecklist.map((item) => ({ ...item, done: false })));

  const toggleItem = (index) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item)));
  };

  const progress = useMemo(() => {
    const doneCount = items.filter((item) => item.done).length;
    return Math.round((doneCount / items.length) * 100);
  }, [items]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-power">Maintenance Checklist</h2>
        <button
          type="button"
          onClick={() => setItems(initialChecklist.map((item) => ({ ...item, done: false })))}
          className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-power"
        >
          Reset
        </button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Checklist completion</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded bg-slate-800">
            <div className="h-2 rounded bg-cyan-400" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <label key={item.label} className="flex items-start gap-3 rounded border border-slate-800 bg-slate-900 p-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(index)}
                className="mt-1 h-4 w-4 accent-cyan-400"
              />
              <span className="flex-1">
                <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-200'}>{item.label}</span>
                <span className="ml-2 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                  {item.frequency}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
