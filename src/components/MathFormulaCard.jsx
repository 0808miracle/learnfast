export default function MathFormulaCard({ title, formula, note }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <p className="mt-1 font-mono text-xs text-cyan-300">{formula}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}
