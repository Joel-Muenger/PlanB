import { Monitor, Smartphone } from 'lucide-react';
import type { ViewMode } from '../lib/viewMode';

const options: { id: ViewMode; label: string; Icon: typeof Monitor }[] = [
  { id: 'web', label: 'Web', Icon: Monitor },
  { id: 'mobile', label: 'Handy', Icon: Smartphone },
];

export default function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Ansicht wählen"
      className="ml-auto hidden rounded-full bg-white p-1 shadow-sm sm:flex"
    >
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
            mode === id ? 'bg-wine text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
    </div>
  );
}
