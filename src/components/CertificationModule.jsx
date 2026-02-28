import { useMemo, useState } from 'react';
import { useSimulation } from '../context';

const questions = [
  {
    q: 'In double-conversion UPS, which block continuously feeds the critical load in normal mode?',
    options: ['Static Bypass', 'Inverter', 'Battery String', 'Rectifier only'],
    answer: 'Inverter',
  },
  {
    q: 'For fan/pump loads, power approximately varies with speed to which exponent?',
    options: ['1', '2', '3', '0.5'],
    answer: '3',
  },
  {
    q: 'A primary objective of MV VFD harmonic design is:',
    options: ['Maximize slip', 'Meet IEEE-519 limits', 'Increase rotor losses', 'Reduce insulation class'],
    answer: 'Meet IEEE-519 limits',
  },
  {
    q: 'Which value directly impacts battery Ah requirement?',
    options: ['Paint color', 'Backup time', 'Panel height', 'Cable gland type'],
    answer: 'Backup time',
  },
];

export default function CertificationModule() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { markModuleComplete } = useSimulation();

  const score = useMemo(() => {
    return questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
  }, [answers]);

  const pass = score >= 3;

  const submit = () => {
    setSubmitted(true);
    if (pass) {
      markModuleComplete('Certification & ROI');
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-power">Certification & ROI</h2>
        <p className="text-sm text-slate-400">Engineer readiness check with instant scoring.</p>
      </header>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <article key={question.q} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p className="mb-3 text-sm font-medium text-slate-100">Q{index + 1}. {question.q}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [index]: option }))}
                  className={`rounded border px-3 py-2 text-left text-sm ${
                    answers[index] === option
                      ? 'border-power bg-cyan-400/10 text-power'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          className="rounded-lg border border-emerald-400 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-400/10"
        >
          Submit Assessment
        </button>
        {submitted && (
          <p className={`text-sm ${pass ? 'text-emerald-300' : 'text-warning'}`}>
            Score: {score}/{questions.length} · {pass ? 'Pass ✅' : 'Needs Review ⚠️'}
          </p>
        )}
      </div>
    </section>
  );
}
