import { useMemo, useState } from 'react';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ProFeatureModal({ onClose, reportData }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const eligible = useMemo(() => isValidEmail(email), [email]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-lg rounded-xl border border-warning bg-slate-900 p-6">
        <h3 className="text-xl font-semibold text-warning">Pro Feature</h3>
        <p className="mt-3 text-sm text-slate-300">
          PDF report exports are available on the Academy Pro plan. Enter your email to activate your subscription.
        </p>
        <div className="mt-3 rounded border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300">
          <p>Preview · {reportData.simulationMode.toUpperCase()} mode</p>
          <p>
            {reportData.loadKva} kVA · PF {reportData.powerFactor} · {reportData.backupTime} min · {reportData.dcVoltage} VDC
          </p>
          <p>Required AH: {reportData.ah.toFixed(1)} Ah</p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="engineer@plant.com"
          className="mt-4 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
        />
        {!eligible && email.length > 0 && <p className="mt-1 text-xs text-fault">Please enter a valid email address.</p>}
        {submitted && <p className="mt-1 text-xs text-emerald-300">Activation request submitted successfully.</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded border border-slate-600 px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={!eligible}
            className="rounded border border-power px-3 py-2 text-sm text-power disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
